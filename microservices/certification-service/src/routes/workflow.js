const express = require('express');
const router = express.Router();
const EnhancedApplication = require('../models/EnhancedApplication');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body, validationResult, param, query } = require('express-validator');
const logger = require('../services/logger');

// Middleware for role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.organizationType;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: userRole
      });
    }
    next();
  };
};

// Get applications based on user role and permissions
router.get('/', 
  authenticateToken,
  [
    query('status').optional().isIn([
      'draft', 'submitted', 'payment_pending_1', 'reviewing', 'rejected',
      'payment_pending_2', 'auditing', 'audit_failed', 'audit_doubt',
      'payment_pending_3', 're_auditing', 'field_auditing', 'approval_pending',
      'approved', 'certificate_issued', 'rejected_final', 'cancelled'
    ]),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

      const { status, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role || req.user.organizationType;

      // Build filter based on user role
      let filter = { isActive: true };
      
      switch (userRole) {
        case 'farmer':
          filter.farmerId = userId;
          break;
          
        case 'reviewer':
          filter['assignedReviewer.userId'] = userId;
          // Reviewers see applications in review stages
          if (!status) {
            filter.currentStatus = { 
              $in: ['reviewing', 'rejected', 'payment_pending_2'] 
            };
          }
          break;
          
        case 'auditor':
          filter['assignedAuditor.userId'] = userId;
          // Auditors see applications in audit stages
          if (!status) {
            filter.currentStatus = { 
              $in: ['auditing', 'audit_failed', 'audit_doubt', 're_auditing', 'field_auditing', 'payment_pending_3'] 
            };
          }
          break;
          
        case 'approver':
          filter['assignedApprover.userId'] = userId;
          // Approvers see applications ready for approval
          if (!status) {
            filter.currentStatus = 'approval_pending';
          }
          break;
          
        case 'finance':
          // Finance can see all applications with payment info
          break;
          
        default:
          return res.status(403).json({
            success: false,
            message: 'Invalid user role'
          });
      }

      // Add status filter if specified
      if (status) {
        filter.currentStatus = status;
      }

      // Pagination
      const skip = (page - 1) * limit;
      
      // Execute query with population
      const applications = await EnhancedApplication
        .find(filter)
        .select(userRole === 'finance' ? 
          'applicationNumber farmerId currentStatus paymentHistory totalPayments timeline' :
          '-workflowHistory' // Exclude workflow history for performance
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await EnhancedApplication.countDocuments(filter);

      // Add computed fields
      const enrichedApplications = applications.map(app => ({
        ...app,
        paymentRequired: getPaymentRequired(app),
        processingTime: getProcessingTime(app),
        canProceed: canProceedToNextStage(app)
      }));

      res.json({
        success: true,
        data: {
          applications: enrichedApplications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          filters: {
            status,
            userRole
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get single application with full details
router.get('/:id',
  authenticateToken,
  [param('id').isMongoId()],
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

      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || req.user.organizationType;

      const application = await EnhancedApplication.findById(id);
      
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
          hasAccess = application.farmerId === userId;
          break;
        case 'reviewer':
          hasAccess = application.assignedReviewer?.userId === userId;
          break;
        case 'auditor':
          hasAccess = application.assignedAuditor?.userId === userId;
          break;
        case 'approver':
          hasAccess = application.assignedApprover?.userId === userId;
          break;
        case 'finance':
          hasAccess = true; // Finance can view all applications
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this application'
        });
      }

      // Filter sensitive data based on role
      let responseData = application.toObject();
      
      if (userRole === 'finance') {
        // Finance only sees payment-related data
        responseData = {
          applicationNumber: application.applicationNumber,
          farmerId: application.farmerId,
          currentStatus: application.currentStatus,
          paymentHistory: application.paymentHistory,
          totalPayments: application.totalPayments,
          timeline: application.timeline,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt
        };
      }

      res.json({
        success: true,
        data: {
          application: responseData,
          paymentRequired: application.paymentRequired,
          nextStage: application.getNextStageInfo(),
          canProceed: application.canProceedToNextStage()
        }
      });

    } catch (error) {
      logger.error('Error fetching application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Create new application (Farmers only)
router.post('/',
  authenticateToken,
  requireRole(['farmer']),
  [
    body('applicantInfo.organizationName').notEmpty().trim(),
    body('applicantInfo.ownerName').notEmpty().trim(),
    body('applicantInfo.organizationType').isIn(['individual', 'company', 'cooperative', 'group']),
    body('farmInfo.farmName').notEmpty().trim(),
    body('farmInfo.farmArea').isFloat({ min: 0.1 }),
    body('farmInfo.farmType').isIn(['organic', 'conventional', 'mixed']),
    body('cropInfo.crops').isArray({ min: 1 }),
    body('cropInfo.crops.*.scientificName').notEmpty().trim(),
    body('cropInfo.crops.*.commonName').notEmpty().trim(),
    body('cropInfo.crops.*.cropCategory').isIn(['herb', 'spice', 'medicinal', 'aromatic', 'food']),
    body('cropInfo.crops.*.usedFor').isIn(['medicine', 'food', 'cosmetic', 'industrial', 'export'])
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

      const applicationData = {
        farmerId: req.user.id,
        ...req.body,
        currentStatus: 'draft',
        currentStage: 'document_submission'
      };

      const application = new EnhancedApplication(applicationData);
      await application.save();

      // Add to workflow history
      application.workflowHistory.push({
        toStatus: 'draft',
        toStage: 'document_submission',
        actorId: req.user.id,
        actorRole: 'farmer',
        action: 'create',
        comments: 'Application created',
        timestamp: new Date()
      });

      await application.save();

      logger.info(`New application created: ${application.applicationNumber}`, {
        applicationId: application._id,
        farmerId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        data: {
          application: {
            id: application._id,
            applicationNumber: application.applicationNumber,
            currentStatus: application.currentStatus,
            currentStage: application.currentStage,
            createdAt: application.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Error creating application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Submit application for review (Farmers only)
router.post('/:id/submit',
  authenticateToken,
  requireRole(['farmer']),
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const { id } = req.params;
      const application = await EnhancedApplication.findById(id);

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

      // Check if application can be submitted
      if (application.currentStatus !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Application cannot be submitted in current status',
          currentStatus: application.currentStatus
        });
      }

      // Check document requirements
      const requiredDocuments = ['sop', 'coa', 'land_rights'];
      const uploadedDocTypes = application.documents
        .filter(doc => doc.isActive)
        .map(doc => doc.documentType);
      
      const missingDocs = requiredDocuments.filter(type => !uploadedDocTypes.includes(type));
      
      if (missingDocs.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required documents',
          missingDocuments: missingDocs
        });
      }

      // Update status to submitted
      await EnhancedApplication.updateStatusWithHistory(
        id,
        'submitted',
        'payment_processing',
        {
          actorId: req.user.id,
          actorRole: 'farmer',
          action: 'submit',
          comments: 'Application submitted for review'
        }
      );

      logger.info(`Application submitted: ${application.applicationNumber}`, {
        applicationId: id,
        farmerId: req.user.id
      });

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationNumber: application.applicationNumber,
          nextStep: 'Payment of 5,000 THB required',
          paymentRequired: {
            amount: 5000,
            type: 'document_review',
            reason: 'initial'
          }
        }
      });

    } catch (error) {
      logger.error('Error submitting application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Review application (Reviewers only)
router.post('/:id/review',
  authenticateToken,
  requireRole(['reviewer']),
  [
    param('id').isMongoId(),
    body('decision').isIn(['approved', 'rejected']),
    body('checklist.documentCompleteness').isFloat({ min: 0, max: 100 }),
    body('checklist.sopCompliance').isFloat({ min: 0, max: 100 }),
    body('checklist.coaValidity').isFloat({ min: 0, max: 100 }),
    body('checklist.landRightsValid').isFloat({ min: 0, max: 100 }),
    body('comments').optional().isString(),
    body('feedback').optional().isArray()
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

      const { id } = req.params;
      const { decision, checklist, comments, feedback } = req.body;
      
      const application = await EnhancedApplication.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check if user is assigned reviewer
      if (application.assignedReviewer?.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to review this application'
        });
      }

      // Check if application is in reviewable status
      if (!['reviewing', 'rejected'].includes(application.currentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Application is not in reviewable status',
          currentStatus: application.currentStatus
        });
      }

      // Calculate overall score
      const scores = Object.values(checklist);
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Add review to history
      const reviewData = {
        reviewerId: req.user.id,
        reviewRound: application.reviews.length + 1,
        status: decision,
        checklist: {
          ...checklist,
          overallScore
        },
        comments,
        feedback: feedback || [],
        reviewedAt: new Date()
      };

      await application.addReview(reviewData);

      // Update application status based on decision
      let newStatus, newStage, actionComments;

      if (decision === 'approved') {
        newStatus = 'auditing';
        newStage = 'audit_scheduling';
        actionComments = `Review approved with score: ${overallScore.toFixed(1)}%`;
      } else {
        // Handle rejection based on rejection count
        if (application.rejectionCount >= 2) {
          // 3rd rejection requires payment
          newStatus = 'payment_pending_2';
          newStage = 'payment_processing';
          actionComments = `Review rejected (${application.rejectionCount + 1}/3). Payment required for next review.`;
        } else {
          newStatus = 'rejected';
          newStage = 'document_review';
          actionComments = `Review rejected (${application.rejectionCount + 1}/3). Farmer can resubmit.`;
        }
      }

      await EnhancedApplication.updateStatusWithHistory(
        id,
        newStatus,
        newStage,
        {
          actorId: req.user.id,
          actorRole: 'reviewer',
          action: 'review',
          comments: actionComments
        }
      );

      logger.info(`Application reviewed: ${application.applicationNumber}`, {
        applicationId: id,
        reviewerId: req.user.id,
        decision,
        overallScore,
        rejectionCount: application.rejectionCount
      });

      res.json({
        success: true,
        message: `Application ${decision} successfully`,
        data: {
          decision,
          overallScore: overallScore.toFixed(1),
          rejectionCount: application.rejectionCount,
          newStatus,
          nextStep: decision === 'approved' ? 
            'Application forwarded to auditor' : 
            application.rejectionCount >= 2 ? 
              'Payment of 5,000 THB required for next review' : 
              'Farmer can revise and resubmit'
        }
      });

    } catch (error) {
      logger.error('Error reviewing application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Schedule audit (Auditors only)
router.post('/:id/schedule-audit',
  authenticateToken,
  requireRole(['auditor']),
  [
    param('id').isMongoId(),
    body('auditType').isIn(['online', 'onsite', 'field']),
    body('scheduledDate').isISO8601(),
    body('scheduledLocation').optional().isString()
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

      const { id } = req.params;
      const { auditType, scheduledDate, scheduledLocation } = req.body;
      
      const application = await EnhancedApplication.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check if user is assigned auditor
      if (application.assignedAuditor?.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to audit this application'
        });
      }

      // Check if application is in auditable status
      if (!['auditing', 're_auditing', 'field_auditing'].includes(application.currentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Application is not in auditable status',
          currentStatus: application.currentStatus
        });
      }

      // Create audit record
      const auditData = {
        auditorId: req.user.id,
        auditType,
        auditRound: application.audits.length + 1,
        scheduledDate: new Date(scheduledDate),
        scheduledLocation,
        status: 'scheduled'
      };

      await application.addAudit(auditData);

      logger.info(`Audit scheduled: ${application.applicationNumber}`, {
        applicationId: id,
        auditorId: req.user.id,
        auditType,
        scheduledDate
      });

      res.json({
        success: true,
        message: 'Audit scheduled successfully',
        data: {
          auditType,
          scheduledDate,
          scheduledLocation,
          auditRound: auditData.auditRound
        }
      });

    } catch (error) {
      logger.error('Error scheduling audit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule audit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Submit audit results (Auditors only)
router.post('/:id/audit-result',
  authenticateToken,
  requireRole(['auditor']),
  [
    param('id').isMongoId(),
    body('result').isIn(['pass', 'fail', 'doubt']),
    body('auditChecklist.gmpCompliance').isFloat({ min: 0, max: 100 }),
    body('auditChecklist.facilityStandards').isFloat({ min: 0, max: 100 }),
    body('auditChecklist.documentationAccuracy').isFloat({ min: 0, max: 100 }),
    body('auditChecklist.staffCompetency').isFloat({ min: 0, max: 100 }),
    body('auditChecklist.qualityControl').isFloat({ min: 0, max: 100 }),
    body('findings').optional().isArray(),
    body('recommendations').optional().isString()
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

      const { id } = req.params;
      const { result, auditChecklist, findings, recommendations } = req.body;
      
      const application = await EnhancedApplication.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Find the current audit
      const currentAudit = application.audits.find(audit => 
        audit.auditorId === req.user.id && audit.status === 'scheduled'
      );

      if (!currentAudit) {
        return res.status(400).json({
          success: false,
          message: 'No scheduled audit found for this application'
        });
      }

      // Calculate overall score
      const scores = Object.values(auditChecklist);
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Update the audit record
      currentAudit.status = 'completed';
      currentAudit.result = result;
      currentAudit.auditChecklist = {
        ...auditChecklist,
        overallScore
      };
      currentAudit.findings = findings || [];
      currentAudit.recommendations = recommendations;
      currentAudit.conductedAt = new Date();

      await application.save();

      // Update application status based on audit result
      let newStatus, newStage, actionComments;

      switch (result) {
        case 'pass':
          newStatus = 'approval_pending';
          newStage = 'final_approval';
          actionComments = `Audit passed with score: ${overallScore.toFixed(1)}%`;
          break;
        case 'fail':
          newStatus = 'audit_failed';
          newStage = 'payment_processing';
          actionComments = `Audit failed. Re-audit payment required.`;
          break;
        case 'doubt':
          newStatus = 'audit_doubt';
          newStage = 'payment_processing';
          actionComments = `Audit result doubtful. Field audit required.`;
          break;
      }

      await EnhancedApplication.updateStatusWithHistory(
        id,
        newStatus,
        newStage,
        {
          actorId: req.user.id,
          actorRole: 'auditor',
          action: 'audit',
          comments: actionComments
        }
      );

      logger.info(`Audit completed: ${application.applicationNumber}`, {
        applicationId: id,
        auditorId: req.user.id,
        result,
        overallScore
      });

      res.json({
        success: true,
        message: 'Audit result submitted successfully',
        data: {
          result,
          overallScore: overallScore.toFixed(1),
          newStatus,
          nextStep: result === 'pass' ? 
            'Application forwarded for final approval' : 
            `Payment of 25,000 THB required for ${result === 'fail' ? 're-audit' : 'field audit'}`
        }
      });

    } catch (error) {
      logger.error('Error submitting audit result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit audit result',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Helper functions
function getPaymentRequired(application) {
  const result = {
    required: false,
    amount: 0,
    reason: '',
    type: ''
  };
  
  // Check for 3rd review payment (after 2 rejections)
  if (application.rejectionCount >= 2 && application.currentStatus === 'rejected') {
    result.required = true;
    result.amount = 5000;
    result.reason = '3rd_review';
    result.type = 'document_review';
  }
  
  // Check for audit payment
  if (['audit_failed', 'audit_doubt'].includes(application.currentStatus)) {
    result.required = true;
    result.amount = 25000;
    result.reason = application.currentStatus === 'audit_failed' ? 'audit_fail' : 'field_audit';
    result.type = 'audit_fee';
  }
  
  return result;
}

function getProcessingTime(application) {
  if (!application.timeline?.submittedAt) return 0;
  
  const endDate = application.timeline.certificateIssuedAt || new Date();
  const startDate = new Date(application.timeline.submittedAt);
  
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // days
}

function canProceedToNextStage(application) {
  const paymentReq = getPaymentRequired(application);
  
  // If payment is required and not completed, cannot proceed
  if (paymentReq.required) {
    const lastPayment = application.paymentHistory
      ?.filter(p => p.paymentReason === paymentReq.reason)
      ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    return lastPayment && lastPayment.status === 'completed';
  }
  
  return true;
}

module.exports = router;