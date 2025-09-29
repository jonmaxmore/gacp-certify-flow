// services/payment-service/mock-payment-gateway.js
/**
 * Mock Payment Gateway for GACP Platform
 * Thai Herbal Certification System - Test Payment Flow
 * Supports PromptPay QR Code and Credit Card simulation
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

class MockPaymentGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.transactions = new Map(); // In-memory store for demo
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public')); // For QR code images
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'mock-payment-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Get payment methods available in Thailand
    this.app.get('/api/v1/payment-methods', (req, res) => {
      res.json({
        success: true,
        data: {
          promptpay: {
            name: 'PromptPay',
            name_th: 'พร้อมเพย์',
            type: 'qr_code',
            fee: 0,
            available: true,
            description: 'สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร'
          },
          credit_card: {
            name: 'Credit Card',
            name_th: 'บัตรเครดิต',
            type: 'card',
            fee: 2.95, // 2.95% fee
            available: true,
            supported_cards: ['visa', 'mastercard', 'jcb', 'amex'],
            description: 'ชำระด้วยบัตรเครดิต Visa, MasterCard, JCB, American Express'
          },
          bank_transfer: {
            name: 'Bank Transfer',
            name_th: 'โอนเงินธนาคาร',
            type: 'bank_transfer',
            fee: 0,
            available: true,
            description: 'โอนเงินผ่านแอปธนาคารหรือ ATM'
          }
        },
        timestamp: new Date().toISOString()
      });
    });

    // Create payment session
    this.app.post('/api/v1/payments/create', (req, res) => {
      try {
        const {
          amount,
          currency = 'THB',
          payment_method,
          application_id,
          description,
          customer_info
        } = req.body;

        // Validate required fields
        if (!amount || !payment_method || !application_id) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_REQUIRED_FIELDS',
            message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
            required_fields: ['amount', 'payment_method', 'application_id']
          });
        }

        // Validate amount (GACP certification fees)
        const validAmounts = [500, 1000, 1500, 2000]; // Thai Baht
        if (!validAmounts.includes(amount)) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_AMOUNT',
            message: 'จำนวนเงินไม่ถูกต้อง',
            valid_amounts: validAmounts
          });
        }

        const transactionId = uuidv4();
        const referenceId = `GACP${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const transaction = {
          id: transactionId,
          reference_id: referenceId,
          amount,
          currency,
          payment_method,
          application_id,
          description: description || `ค่าธรรมเนียมการรับรอง GACP สำหรับใบสมัคร ${application_id}`,
          customer_info,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          metadata: {
            service: 'gacp-certification',
            fee_type: 'certification_fee'
          }
        };

        // Generate payment method specific data
        if (payment_method === 'promptpay') {
          transaction.promptpay = this.generatePromptPayData(amount, referenceId);
        } else if (payment_method === 'credit_card') {
          transaction.credit_card = this.generateCreditCardForm(transactionId);
        } else if (payment_method === 'bank_transfer') {
          transaction.bank_transfer = this.generateBankTransferData(amount, referenceId);
        }

        this.transactions.set(transactionId, transaction);

        res.status(201).json({
          success: true,
          data: transaction,
          next_action: this.getNextAction(payment_method, transactionId),
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'เกิดข้อผิดพลาดภายในระบบ'
        });
      }
    });

    // Check payment status
    this.app.get('/api/v1/payments/:transactionId/status', (req, res) => {
      const { transactionId } = req.params;
      const transaction = this.transactions.get(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'ไม่พบรายการชำระเงิน'
        });
      }

      // Check if expired
      if (new Date() > new Date(transaction.expires_at) && transaction.status === 'pending') {
        transaction.status = 'expired';
        transaction.expired_at = new Date().toISOString();
      }

      res.json({
        success: true,
        data: {
          id: transaction.id,
          reference_id: transaction.reference_id,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          payment_method: transaction.payment_method,
          created_at: transaction.created_at,
          expires_at: transaction.expires_at,
          paid_at: transaction.paid_at,
          failure_reason: transaction.failure_reason
        },
        timestamp: new Date().toISOString()
      });
    });

    // Mock payment confirmation (for testing)
    this.app.post('/api/v1/payments/:transactionId/confirm', (req, res) => {
      const { transactionId } = req.params;
      const { action = 'success' } = req.body; // 'success' or 'fail'
      
      const transaction = this.transactions.get(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'ไม่พบรายการชำระเงิน'
        });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'สถานะรายการไม่สามารถดำเนินการได้'
        });
      }

      if (action === 'success') {
        transaction.status = 'success';
        transaction.paid_at = new Date().toISOString();
        transaction.receipt_number = `RCP${Date.now()}`;
      } else {
        transaction.status = 'failed';
        transaction.failed_at = new Date().toISOString();
        transaction.failure_reason = 'Payment declined by user or system';
      }

      res.json({
        success: true,
        data: transaction,
        message: action === 'success' ? 'ชำระเงินสำเร็จ' : 'การชำระเงินล้มเหลว',
        timestamp: new Date().toISOString()
      });
    });

    // Get payment receipt
    this.app.get('/api/v1/payments/:transactionId/receipt', (req, res) => {
      const { transactionId } = req.params;
      const transaction = this.transactions.get(transactionId);

      if (!transaction || transaction.status !== 'success') {
        return res.status(404).json({
          success: false,
          error: 'RECEIPT_NOT_AVAILABLE',
          message: 'ใบเสร็จไม่พร้อมใช้งาน'
        });
      }

      res.json({
        success: true,
        data: {
          receipt_number: transaction.receipt_number,
          transaction_id: transaction.id,
          reference_id: transaction.reference_id,
          amount: transaction.amount,
          currency: transaction.currency,
          payment_method: transaction.payment_method,
          paid_at: transaction.paid_at,
          description: transaction.description,
          receipt_url: `/receipts/${transaction.id}.pdf`,
          receipt_data: this.generateReceiptData(transaction)
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  generatePromptPayData(amount, referenceId) {
    return {
      qr_code: `https://api.gacp.dtam.go.th/qr-codes/${referenceId}.png`,
      qr_code_data: `00020101021229370016A000000677010111011300658934000695${amount.toString().padStart(6, '0')}5303764540${amount}6304`,
      recipient: {
        name: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก',
        name_en: 'Department of Thai Traditional and Alternative Medicine',
        account: 'กรมแพทย์แผนไทย',
        promptpay_id: '0658934000695'
      },
      instructions: [
        '1. เปิดแอปธนาคารหรือแอปพลิเคชันที่รองรับ PromptPay',
        '2. เลือกเมนู "สแกน QR Code" หรือ "PromptPay"',
        '3. สแกน QR Code ที่แสดงบนหน้าจอ',
        '4. ตรวจสอบจำนวนเงินและกดยืนยันการชำระเงิน',
        '5. ระบบจะอัปเดตสถานะการชำระเงินอัตโนมัติ'
      ]
    };
  }

  generateCreditCardForm(transactionId) {
    return {
      form_url: `/payments/${transactionId}/card-form`,
      accepted_cards: ['visa', 'mastercard', 'jcb', 'amex'],
      test_cards: {
        visa: {
          number: '4242424242424242',
          cvc: '123',
          expiry: '12/25',
          description: 'ทดสอบการชำระเงินสำเร็จ'
        },
        mastercard: {
          number: '5555555555554444',
          cvc: '456',
          expiry: '12/25',
          description: 'ทดสอบการชำระเงินสำเร็จ'
        },
        declined: {
          number: '4000000000000002',
          cvc: '123',
          expiry: '12/25',
          description: 'ทดสอบการชำระเงินถูกปฏิเสธ'
        }
      },
      security_notice: 'นี่เป็นระบบทดสอบ ไม่มีการเรียกเก็บเงินจริง'
    };
  }

  generateBankTransferData(amount, referenceId) {
    return {
      recipient: {
        bank_name: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
        account_name: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก',
        account_number: '123-4-56789-0',
        branch: 'สำนักงานใหญ่'
      },
      transfer_details: {
        amount: amount,
        reference: referenceId,
        purpose: 'ค่าธรรมเนียมการรับรอง GACP'
      },
      instructions: [
        '1. โอนเงินไปยังบัญชีที่ระบุด้านบน',
        '2. ระบุเลขอ้างอิง: ' + referenceId,
        '3. เก็บหลักฐานการโอนเงิน',
        '4. อัปโหลดสลิปการโอนเงินในระบบ',
        '5. รอการตรวจสอบและยืนยันการชำระเงิน (1-2 วันทำการ)'
      ],
      verification_required: true
    };
  }

  getNextAction(paymentMethod, transactionId) {
    const baseActions = {
      promptpay: {
        type: 'qr_scan',
        message: 'สแกน QR Code เพื่อชำระเงิน',
        timeout: 900 // 15 minutes
      },
      credit_card: {
        type: 'form_submit',
        message: 'กรอกข้อมูลบัตรเครดิต',
        form_url: `/payments/${transactionId}/card-form`
      },
      bank_transfer: {
        type: 'manual_transfer',
        message: 'โอนเงินตามรายละเอียดที่ระบุ',
        verification_required: true
      }
    };

    return {
      ...baseActions[paymentMethod],
      confirm_url: `/api/v1/payments/${transactionId}/confirm`,
      status_url: `/api/v1/payments/${transactionId}/status`
    };
  }

  generateReceiptData(transaction) {
    return {
      header: {
        title: 'ใบเสร็จรับเงิน',
        title_en: 'Official Receipt',
        department: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก',
        department_en: 'Department of Thai Traditional and Alternative Medicine',
        address: '88/27 ถ.ติวานนท์ ต.ตลาดขวัญ อ.เมือง จ.นนทบุรี 11000'
      },
      details: {
        receipt_no: transaction.receipt_number,
        date: new Date(transaction.paid_at).toLocaleDateString('th-TH'),
        payer: transaction.customer_info?.name || 'ไม่ระบุ',
        description: transaction.description,
        amount: transaction.amount,
        amount_text: this.numberToThaiText(transaction.amount),
        payment_method: this.getPaymentMethodText(transaction.payment_method)
      },
      footer: {
        note: 'ใบเสร็จนี้ออกโดยระบบอัตโนมัติ',
        validity: 'ใบเสร็จนี้ใช้สำหรับการบัญชีและการเรียกร้องค่าใช้จ่าย'
      }
    };
  }

  getPaymentMethodText(method) {
    const methods = {
      promptpay: 'พร้อมเพย์ (PromptPay)',
      credit_card: 'บัตรเครดิต',
      bank_transfer: 'โอนเงินธนาคาร'
    };
    return methods[method] || method;
  }

  numberToThaiText(number) {
    // Simplified Thai number to text conversion
    const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const tens = ['', '', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
    
    if (number === 0) return 'ศูนย์บาทถ้วน';
    if (number < 10) return ones[number] + 'บาทถ้วน';
    if (number < 100) {
      const ten = Math.floor(number / 10);
      const one = number % 10;
      return (ten === 1 ? 'สิบ' : tens[ten]) + ones[one] + 'บาทถ้วน';
    }
    
    // For larger numbers, simplified version
    return number.toString() + ' บาทถ้วน';
  }

  start(port = 3005) {
    this.app.listen(port, () => {
      console.log('🏦 Mock Payment Gateway running on port', port);
      console.log('💳 Credit Card Test: http://localhost:' + port + '/api/v1/payment-methods');
      console.log('📱 PromptPay QR: Available for testing');
      console.log('🏛️ Bank Transfer: Manual verification mode');
      console.log('⚠️ WARNING: This is a TEST environment - No real money transactions!');
    });
  }
}

export default MockPaymentGateway;

// Start server if run directly
const gateway = new MockPaymentGateway();
gateway.start();