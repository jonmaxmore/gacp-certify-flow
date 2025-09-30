const express = require('express');
const router = express.Router();
const EnhancedApplication = require('../models/EnhancedApplication');
const { authenticateToken, requireRole } = require('../middleware/roleAuth');
const { body, validationResult, param } = require('express-validator');
const logger = require('../services/logger');

// Mock Payment Gateway Service
// In production, integrate with real payment gateway (2C2P, Omise, SCB Easy, etc.)
class PaymentGateway {
  static async initializePayment(paymentData) {
    try {
      // Simulate payment gateway initialization
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock gateway response
      const gatewayResponse = {
        transactionId,
        paymentUrl: `https://mock-gateway.gacp.com/pay/${transactionId}`,
        qrCode: `data:image/png;base64,mock-qr-code-${transactionId}`,
        expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: 'pending'
      };

      logger.info('Payment initialized', {
        transactionId,
        amount: paymentData.amount,
        applicationId: paymentData.applicationId
      });

      return {
        success: true,
        data: gatewayResponse
      };
    } catch (error) {
      logger.error('Payment initialization failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async verifyPayment(transactionId) {
    try {
      // Simulate payment verification
      // In production, call real gateway API
      const mockStatus = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% success rate
      
      const verificationResponse = {
        transactionId,
        status: mockStatus,
        amount: mockStatus === 'completed' ? 5000 : 0, // Mock amount
        paidAt: mockStatus === 'completed' ? new Date() : null,
        gatewayReference: `REF-${transactionId}`,
        paymentMethod: 'credit_card'
      };

      logger.info('Payment verified', verificationResponse);

      return {
        success: true,
        data: verificationResponse
      };
    } catch (error) {
      logger.error('Payment verification failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async refundPayment(transactionId, amount, reason) {
    try {
      // Simulate refund process
      const refundId = `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const refundResponse = {
        refundId,
        originalTransactionId: transactionId,
        amount,
        reason,
        status: 'completed',
        refundedAt: new Date()
      };

      logger.info('Payment refunded', refundResponse);

      return {
        success: true,
        data: refundResponse
      };
    } catch (error) {
      logger.error('Payment refund failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Get payment requirements for application
router.get('/:applicationId/requirements',
  authenticateToken,
  requireRole(['farmer']),
  [param('applicationId').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid application ID',
          errors: errors.array()
        });
      }

      const { applicationId } = req.params;
      const application = await EnhancedApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check ownership
      if (application.farmerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const paymentRequired = application.paymentRequired;
      
      // Get payment history for this application
      const paymentHistory = application.paymentHistory || [];
      
      // Check if already paid for current requirement
      const existingPayment = paymentHistory
        .filter(p => p.paymentReason === paymentRequired.reason && p.status === 'completed')
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      res.json({
        success: true,
        data: {
          applicationNumber: application.applicationNumber,
          currentStatus: application.currentStatus,
          currentStage: application.currentStage,
          rejectionCount: application.rejectionCount,
          totalPayments: application.totalPayments,
          paymentRequired: {
            ...paymentRequired,
            alreadyPaid: !!existingPayment,
            lastPayment: existingPayment || null
          },
          paymentBreakdown: {
            documentReviewFees: paymentHistory
              .filter(p => p.paymentType === 'document_review' && p.status === 'completed')
              .reduce((sum, p) => sum + p.amount, 0),
            auditFees: paymentHistory
              .filter(p => p.paymentType === 'audit_fee' && p.status === 'completed')
              .reduce((sum, p) => sum + p.amount, 0)
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching payment requirements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment requirements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Initialize payment
router.post('/:applicationId/initialize',
  authenticateToken,
  requireRole(['farmer']),
  [
    param('applicationId').isMongoId(),
    body('paymentType').isIn(['document_review', 'audit_fee']),
    body('paymentReason').isIn(['initial', '3rd_review', 'audit_fail', 'field_audit']),
    body('amount').isFloat({ min: 100, max: 50000 }), // 100 THB to 50,000 THB
    body('returnUrl').optional().isURL(),
    body('cancelUrl').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { applicationId } = req.params;
      const { paymentType, paymentReason, amount, returnUrl, cancelUrl } = req.body;

      const application = await EnhancedApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check ownership
      if (application.farmerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate payment requirements
      const required = application.paymentRequired;
      
      if (!required.required) {
        return res.status(400).json({
          success: false,
          message: 'No payment required for this application',
          currentStatus: application.currentStatus
        });
      }

      if (paymentType !== required.type || paymentReason !== required.reason) {
        return res.status(400).json({
          success: false,
          message: 'Payment type/reason mismatch',
          expected: { type: required.type, reason: required.reason },
          provided: { type: paymentType, reason: paymentReason }
        });
      }

      if (amount !== required.amount) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount mismatch',
          expected: required.amount,
          provided: amount
        });
      }

      // Check if already paid
      const existingPayment = application.paymentHistory
        ?.filter(p => p.paymentReason === paymentReason && p.status === 'completed')
        ?.sort((a, b) => b.createdAt - a.createdAt)[0];

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment already completed',
          existingPayment: {
            amount: existingPayment.amount,
            paidAt: existingPayment.paidAt,
            transactionId: existingPayment.gatewayTransactionId
          }
        });
      }

      // Initialize payment with gateway
      const paymentData = {
        applicationId,
        amount,
        paymentType,
        paymentReason,
        currency: 'THB',
        description: `GACP ${paymentType} fee - ${application.applicationNumber}`,
        returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payments/success`,
        cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payments/cancel`,
        metadata: {
          applicationNumber: application.applicationNumber,
          farmerId: req.user.id,
          paymentReason
        }
      };

      const gatewayResult = await PaymentGateway.initializePayment(paymentData);

      if (!gatewayResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Payment gateway error',
          error: gatewayResult.error
        });
      }

      // Save payment record
      const paymentRecord = {
        amount,
        paymentType,
        paymentReason,
        status: 'pending',
        gatewayTransactionId: gatewayResult.data.transactionId,
        gatewayResponse: gatewayResult.data,
        createdAt: new Date()
      };

      await application.addPayment(paymentRecord);

      logger.info('Payment initialized successfully', {
        applicationId,
        applicationNumber: application.applicationNumber,
        farmerId: req.user.id,
        amount,
        transactionId: gatewayResult.data.transactionId
      });

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          transactionId: gatewayResult.data.transactionId,
          paymentUrl: gatewayResult.data.paymentUrl,
          qrCode: gatewayResult.data.qrCode,
          amount,
          currency: 'THB',
          expires: gatewayResult.data.expires,
          paymentInstructions: {
            th: `โปรดชำระเงินจำนวน ${amount.toLocaleString()} บาท สำหรับ${paymentType === 'document_review' ? 'ค่าตรวจสอบเอกสาร' : 'ค่าตรวจประเมิน'}`,
            en: `Please pay ${amount.toLocaleString()} THB for ${paymentType === 'document_review' ? 'document review' : 'audit'} fee`
          }
        }
      });

    } catch (error) {
      logger.error('Error initializing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Verify payment status
router.post('/:applicationId/verify',
  authenticateToken,
  requireRole(['farmer']),
  [
    param('applicationId').isMongoId(),
    body('transactionId').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { applicationId } = req.params;
      const { transactionId } = req.body;

      const application = await EnhancedApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check ownership
      if (application.farmerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Find payment record
      const paymentRecord = application.paymentHistory?.find(
        p => p.gatewayTransactionId === transactionId
      );

      if (!paymentRecord) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      if (paymentRecord.status === 'completed') {
        return res.json({
          success: true,
          message: 'Payment already verified',
          data: {
            status: 'completed',
            amount: paymentRecord.amount,
            paidAt: paymentRecord.paidAt,
            transactionId: paymentRecord.gatewayTransactionId
          }
        });
      }

      // Verify with payment gateway
      const verificationResult = await PaymentGateway.verifyPayment(transactionId);

      if (!verificationResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Payment verification failed',
          error: verificationResult.error
        });
      }

      const { status, amount, paidAt, gatewayReference } = verificationResult.data;

      // Update payment record
      paymentRecord.status = status;
      paymentRecord.paidAt = paidAt;
      paymentRecord.gatewayReference = gatewayReference;

      if (status === 'completed') {
        paymentRecord.gatewayResponse = {
          ...paymentRecord.gatewayResponse,
          ...verificationResult.data
        };

        // Update total payments
        application.totalPayments += amount;

        // Update application status based on payment type
        let newStatus, newStage;
        
        switch (paymentRecord.paymentReason) {
          case 'initial':
            newStatus = 'reviewing';
            newStage = 'document_review';
            break;
          case '3rd_review':
            newStatus = 'reviewing';
            newStage = 'document_review';
            break;
          case 'audit_fail':
          case 'field_audit':
            newStatus = paymentRecord.paymentReason === 'audit_fail' ? 're_auditing' : 'field_auditing';
            newStage = 'audit_execution';
            break;
        }

        if (newStatus) {
          await EnhancedApplication.updateStatusWithHistory(
            applicationId,
            newStatus,
            newStage,
            {
              actorId: req.user.id,
              actorRole: 'farmer',
              action: 'pay',
              comments: `Payment completed: ${amount} THB for ${paymentRecord.paymentReason}`
            }
          );
        }
      }

      await application.save();

      logger.info('Payment verified', {
        applicationId,
        transactionId,
        status,
        amount,
        farmerId: req.user.id
      });

      res.json({
        success: true,
        message: status === 'completed' ? 'Payment completed successfully' : 'Payment verification completed',
        data: {
          status,
          amount,
          paidAt,
          transactionId,
          gatewayReference,
          applicationStatus: status === 'completed' ? application.currentStatus : undefined,
          nextStep: status === 'completed' ? getNextStepMessage(paymentRecord.paymentReason) : undefined
        }
      });

    } catch (error) {
      logger.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get payment history for application
router.get('/:applicationId/history',
  authenticateToken,
  [param('applicationId').isMongoId()],
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const userRole = req.user.role;

      const application = await EnhancedApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check access permissions
      let hasAccess = false;
      switch (userRole) {
        case 'farmer':
          hasAccess = application.farmerId === req.user.id;
          break;
        case 'finance':
          hasAccess = true;
          break;
        case 'reviewer':
        case 'auditor':
        case 'approver':
          hasAccess = true; // Can view payment status for assigned applications
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const paymentHistory = application.paymentHistory || [];
      
      // Filter sensitive data for non-finance roles
      const filteredHistory = paymentHistory.map(payment => {
        const publicData = {
          amount: payment.amount,
          paymentType: payment.paymentType,
          paymentReason: payment.paymentReason,
          status: payment.status,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt
        };

        if (userRole === 'finance' || userRole === 'farmer') {
          return {
            ...publicData,
            gatewayTransactionId: payment.gatewayTransactionId,
            gatewayReference: payment.gatewayReference
          };
        }

        return publicData;
      });

      res.json({
        success: true,
        data: {
          applicationNumber: application.applicationNumber,
          totalPayments: application.totalPayments,
          paymentHistory: filteredHistory,
          summary: {
            totalPaid: application.totalPayments,
            documentReviewFees: paymentHistory
              .filter(p => p.paymentType === 'document_review' && p.status === 'completed')
              .reduce((sum, p) => sum + p.amount, 0),
            auditFees: paymentHistory
              .filter(p => p.paymentType === 'audit_fee' && p.status === 'completed')
              .reduce((sum, p) => sum + p.amount, 0),
            pendingPayments: paymentHistory.filter(p => p.status === 'pending').length,
            completedPayments: paymentHistory.filter(p => p.status === 'completed').length
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Process refund (Finance only)
router.post('/:applicationId/refund',
  authenticateToken,
  requireRole(['finance']),
  [
    param('applicationId').isMongoId(),
    body('transactionId').notEmpty().trim(),
    body('amount').isFloat({ min: 0 }),
    body('reason').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { applicationId } = req.params;
      const { transactionId, amount, reason } = req.body;

      const application = await EnhancedApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Find payment record
      const paymentRecord = application.paymentHistory?.find(
        p => p.gatewayTransactionId === transactionId && p.status === 'completed'
      );

      if (!paymentRecord) {
        return res.status(404).json({
          success: false,
          message: 'Completed payment record not found'
        });
      }

      if (amount > paymentRecord.amount) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed original payment',
          originalAmount: paymentRecord.amount,
          requestedRefund: amount
        });
      }

      // Process refund with gateway
      const refundResult = await PaymentGateway.refundPayment(transactionId, amount, reason);

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Refund processing failed',
          error: refundResult.error
        });
      }

      // Create refund record
      const refundRecord = {
        amount: -amount, // Negative amount for refund
        paymentType: 'refund',
        paymentReason: `refund_${paymentRecord.paymentReason}`,
        status: 'completed',
        gatewayTransactionId: refundResult.data.refundId,
        gatewayReference: refundResult.data.refundId,
        gatewayResponse: refundResult.data,
        paidAt: refundResult.data.refundedAt,
        createdAt: new Date()
      };

      await application.addPayment(refundRecord);

      // Update total payments
      application.totalPayments -= amount;
      await application.save();

      logger.info('Refund processed', {
        applicationId,
        originalTransactionId: transactionId,
        refundId: refundResult.data.refundId,
        amount,
        reason,
        processedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundId: refundResult.data.refundId,
          originalTransactionId: transactionId,
          amount,
          reason,
          refundedAt: refundResult.data.refundedAt
        }
      });

    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Helper function to get next step message
function getNextStepMessage(paymentReason) {
  const messages = {
    'initial': 'Your application is now under document review',
    '3rd_review': 'Your application will be reviewed again',
    'audit_fail': 'Your application will be re-audited',
    'field_audit': 'Field audit will be scheduled'
  };
  
  return messages[paymentReason] || 'Payment completed successfully';
}

module.exports = router;