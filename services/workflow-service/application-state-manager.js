// services/workflow-service/application-state-manager.js
/**
 * GACP Application State Manager
 * จัดการ State Transitions ตาม Business Process ที่ซับซ้อน
 */

const GACPFeeCalculator = require('../finance-service/gacp-fee-calculator');

class ApplicationStateManager {
  constructor() {
    this.feeCalculator = new GACPFeeCalculator();
    
    // Define all possible states
    this.states = {
      // Initial States
      SUBMITTED: 'submitted',
      INITIAL_PAYMENT_PENDING: 'initial_payment_pending',
      INITIAL_PAYMENT_CONFIRMED: 'initial_payment_confirmed',
      
      // Review States  
      UNDER_REVIEW: 'under_review',
      REVIEW_REJECTED_1: 'review_rejected_1',
      REVIEW_REJECTED_2: 'review_rejected_2', 
      REVIEW_REJECTED_3: 'review_rejected_3',
      REVIEW_PASSED: 'review_passed',
      
      // Re-submission States
      RESUBMISSION_PAYMENT_PENDING: 'resubmission_payment_pending',
      RESUBMISSION_PAYMENT_CONFIRMED: 'resubmission_payment_confirmed',
      
      // Audit States
      AUDIT_PAYMENT_PENDING: 'audit_payment_pending',
      AUDIT_PAYMENT_CONFIRMED: 'audit_payment_confirmed',
      UNDER_AUDIT: 'under_audit',
      AUDIT_PASSED: 'audit_passed',
      AUDIT_SUSPICIOUS: 'audit_suspicious',
      AUDIT_FAILED: 'audit_failed',
      
      // Field Audit States
      FIELD_AUDIT_SCHEDULED: 'field_audit_scheduled',
      FIELD_AUDIT_PASSED: 'field_audit_passed',
      FIELD_AUDIT_FAILED: 'field_audit_failed',
      
      // Re-audit States
      REAUDIT_PAYMENT_PENDING: 'reaudit_payment_pending',
      REAUDIT_PAYMENT_CONFIRMED: 'reaudit_payment_confirmed',
      UNDER_REAUDIT: 'under_reaudit',
      
      // Final States
      CERTIFICATE_ISSUED: 'certificate_issued',
      PUBLISHED: 'published'
    };

    // Valid state transitions
    this.transitions = {
      [this.states.SUBMITTED]: [this.states.INITIAL_PAYMENT_PENDING],
      [this.states.INITIAL_PAYMENT_PENDING]: [this.states.INITIAL_PAYMENT_CONFIRMED],
      [this.states.INITIAL_PAYMENT_CONFIRMED]: [this.states.UNDER_REVIEW],
      
      [this.states.UNDER_REVIEW]: [
        this.states.REVIEW_REJECTED_1,
        this.states.REVIEW_PASSED
      ],
      
      [this.states.REVIEW_REJECTED_1]: [
        this.states.UNDER_REVIEW,
        this.states.REVIEW_REJECTED_2
      ],
      
      [this.states.REVIEW_REJECTED_2]: [
        this.states.UNDER_REVIEW,
        this.states.REVIEW_REJECTED_3
      ],
      
      [this.states.REVIEW_REJECTED_3]: [
        this.states.RESUBMISSION_PAYMENT_PENDING
      ],
      
      [this.states.RESUBMISSION_PAYMENT_PENDING]: [
        this.states.RESUBMISSION_PAYMENT_CONFIRMED
      ],
      
      [this.states.RESUBMISSION_PAYMENT_CONFIRMED]: [
        this.states.UNDER_REVIEW
      ],
      
      [this.states.REVIEW_PASSED]: [this.states.AUDIT_PAYMENT_PENDING],
      [this.states.AUDIT_PAYMENT_PENDING]: [this.states.AUDIT_PAYMENT_CONFIRMED],
      [this.states.AUDIT_PAYMENT_CONFIRMED]: [this.states.UNDER_AUDIT],
      
      [this.states.UNDER_AUDIT]: [
        this.states.AUDIT_PASSED,
        this.states.AUDIT_SUSPICIOUS,
        this.states.AUDIT_FAILED
      ],
      
      [this.states.AUDIT_PASSED]: [this.states.CERTIFICATE_ISSUED],
      [this.states.AUDIT_SUSPICIOUS]: [this.states.FIELD_AUDIT_SCHEDULED],
      [this.states.AUDIT_FAILED]: [this.states.REAUDIT_PAYMENT_PENDING],
      
      [this.states.FIELD_AUDIT_SCHEDULED]: [
        this.states.FIELD_AUDIT_PASSED,
        this.states.FIELD_AUDIT_FAILED
      ],
      
      [this.states.FIELD_AUDIT_PASSED]: [this.states.CERTIFICATE_ISSUED],
      [this.states.FIELD_AUDIT_FAILED]: [this.states.UNDER_REAUDIT],
      
      [this.states.REAUDIT_PAYMENT_PENDING]: [this.states.REAUDIT_PAYMENT_CONFIRMED],
      [this.states.REAUDIT_PAYMENT_CONFIRMED]: [this.states.UNDER_REAUDIT],
      [this.states.UNDER_REAUDIT]: [this.states.CERTIFICATE_ISSUED],
      
      [this.states.CERTIFICATE_ISSUED]: [this.states.PUBLISHED]
    };
  }

  /**
   * เปลี่ยนสถานะของ application
   */
  async transitionTo(applicationId, newState, transitionData = {}) {
    const application = await this.getApplication(applicationId);
    let currentState = application.status;
    
    // Handle automatic state progression for workflows
    if (newState === 'initial_payment_pending' && currentState === 'submitted') {
      currentState = 'submitted';
    } else if (newState === 'initial_payment_confirmed' && currentState === 'submitted') {
      // Auto-transition through payment_pending if needed
      await this.updateApplicationStatus(applicationId, 'initial_payment_pending', {});
      currentState = 'initial_payment_pending';
    } else if (newState.startsWith('review_') && currentState === 'initial_payment_confirmed') {
      // Auto-transition to under_review first
      await this.updateApplicationStatus(applicationId, 'under_review', {});
      currentState = 'under_review';
    } else if (newState === 'review_passed' && currentState === 'initial_payment_confirmed') {
      // Auto-transition to under_review first
      await this.updateApplicationStatus(applicationId, 'under_review', {});
      currentState = 'under_review';
    }

    // Validate transition
    if (!this.isValidTransition(currentState, newState)) {
      throw new Error(`Invalid transition from ${currentState} to ${newState}`);
    }

    // Execute transition logic
    const result = await this.executeTransition(application, newState, transitionData);

    // Update application status
    await this.updateApplicationStatus(applicationId, newState, result);

    return result;
  }

  /**
   * ตรวจสอบว่า transition ถูกต้องหรือไม่
   */
  isValidTransition(currentState, newState) {
    const validNextStates = this.transitions[currentState] || [];
    return validNextStates.includes(newState);
  }

  /**
   * ดำเนินการ transition logic
   */
  async executeTransition(application, newState, transitionData) {
    switch (newState) {
      case this.states.INITIAL_PAYMENT_PENDING:
        return await this.handleInitialPaymentRequest(application);
        
      case this.states.INITIAL_PAYMENT_CONFIRMED:
        return await this.handleInitialPaymentConfirmed(application, transitionData);
        
      case this.states.REVIEW_REJECTED_1:
      case this.states.REVIEW_REJECTED_2:
        return await this.handleReviewRejection(application, newState, transitionData);
        
      case this.states.REVIEW_REJECTED_3:
        return await this.handleReviewRejection3(application, transitionData);
        
      case this.states.RESUBMISSION_PAYMENT_PENDING:
        return await this.handleResubmissionPaymentRequest(application);
        
      case this.states.REVIEW_PASSED:
        return await this.handleReviewPassed(application);
        
      case this.states.AUDIT_PAYMENT_PENDING:
        return await this.handleAuditPaymentRequest(application);
        
      case this.states.AUDIT_SUSPICIOUS:
        return await this.handleAuditSuspicious(application, transitionData);
        
      case this.states.AUDIT_FAILED:
        return await this.handleAuditFailed(application, transitionData);
        
      case this.states.REAUDIT_PAYMENT_PENDING:
        return await this.handleReauditPaymentRequest(application, transitionData);
        
      case this.states.CERTIFICATE_ISSUED:
        return await this.handleCertificateIssued(application);
        
      default:
        return { success: true, message: `Transitioned to ${newState}` };
    }
  }

  /**
   * ขอชำระเงินเบื้องต้น
   */
  async handleInitialPaymentRequest(application) {
    const feeCalculation = this.feeCalculator.calculateInitialFee(application.data);
    
    const paymentRequest = {
      application_id: application.id,
      farmer_id: application.farmer_id,
      payment_type: 'INITIAL_REVIEW_FEE',
      amount: feeCalculation.final_amount,
      fee_details: feeCalculation,
      due_date: feeCalculation.payment_deadline
    };

    // สร้าง payment request ใน payment gateway
    const payment = await this.createPaymentRequest(paymentRequest);
    
    return {
      success: true,
      payment_required: true,
      payment_details: payment,
      fee_calculation: feeCalculation,
      next_action: 'PAYMENT_REQUIRED',
      message: 'กรุณาชำระค่าธรรมเนียมการตรวจสอบเอกสาร 5,000 บาท'
    };
  }

  /**
   * ยืนยันการชำระเงินเบื้องต้น
   */
  async handleInitialPaymentConfirmed(application, transitionData) {
    const { payment_id, payment_reference } = transitionData;
    
    // บันทึกข้อมูลการชำระเงิน
    await this.recordPayment(application.id, {
      payment_id,
      payment_reference,
      payment_type: 'INITIAL_REVIEW_FEE',
      amount: 5000,
      status: 'confirmed'
    });

    // จัดสรรให้ reviewer
    await this.assignToReviewer(application.id);
    
    return {
      success: true,
      payment_confirmed: true,
      next_action: 'UNDER_REVIEW',
      reviewer_assigned: true,
      estimated_review_time: '7 วันทำการ',
      message: 'ชำระเงินเรียบร้อย กำลังดำเนินการตรวจสอบเอกสาร'
    };
  }

  /**
   * จัดการการปฏิเสธครั้งที่ 1-2
   */
  async handleReviewRejection(application, newState, transitionData) {
    const rejectionCount = parseInt(newState.split('_').pop());
    const { rejection_reasons, reviewer_notes } = transitionData;
    
    // บันทึกเหตุผลการปฏิเสธ
    await this.recordRejection(application.id, {
      rejection_count: rejectionCount,
      reasons: rejection_reasons,
      reviewer_notes,
      can_resubmit: true,
      resubmission_deadline: this.calculateResubmissionDeadline()
    });
    
    return {
      success: true,
      rejection_count: rejectionCount,
      can_resubmit: true,
      revision_required: true,
      rejection_reasons,
      next_action: 'REVISION_REQUIRED',
      resubmission_deadline: this.calculateResubmissionDeadline(),
      message: `เอกสารต้องแก้ไข (ครั้งที่ ${rejectionCount}) กรุณาแก้ไขและส่งใหม่`
    };
  }

  /**
   * จัดการการปฏิเสธครั้งที่ 3
   */
  async handleReviewRejection3(application, transitionData) {
    const { rejection_reasons, reviewer_notes } = transitionData;
    
    // บันทึกการปฏิเสธครั้งที่ 3
    await this.recordRejection(application.id, {
      rejection_count: 3,
      reasons: rejection_reasons,
      reviewer_notes,
      payment_required: true
    });
    
    return {
      success: true,
      rejection_count: 3,
      payment_required: true,
      next_action: 'RESUBMISSION_PAYMENT_REQUIRED',
      fee_amount: 5000,
      message: 'เอกสารถูกปฏิเสธครั้งที่ 3 ต้องชำระค่าธรรมเนียม 5,000 บาท เพื่อส่งใหม่'
    };
  }

  /**
   * ขอชำระเงินส่งใหม่
   */
  async handleResubmissionPaymentRequest(application) {
    const feeCalculation = this.feeCalculator.calculateResubmissionFee(
      application.data, 
      application.review_rejections || 3
    );
    
    const paymentRequest = {
      application_id: application.id,
      farmer_id: application.farmer_id,
      payment_type: 'RE_SUBMISSION_FEE',
      amount: feeCalculation.final_amount,
      fee_details: feeCalculation
    };

    const payment = await this.createPaymentRequest(paymentRequest);
    
    return {
      success: true,
      payment_required: true,
      payment_details: payment,
      fee_calculation: feeCalculation,
      next_action: 'PAYMENT_REQUIRED',
      message: 'กรุณาชำระค่าธรรมเนียมการส่งเอกสารใหม่ 5,000 บาท'
    };
  }

  /**
   * ผ่านการตรวจสอบเอกสาร
   */
  async handleReviewPassed(application) {
    // ขอชำระเงินค่าตรวจสอบภาคสนาม
    const feeCalculation = this.feeCalculator.calculateFieldAuditFee(application.data);
    
    return {
      success: true,
      review_passed: true,
      next_payment_required: true,
      audit_fee_calculation: feeCalculation,
      next_action: 'AUDIT_PAYMENT_REQUIRED',
      message: 'ผ่านการตรวจสอบเอกสาร กรุณาชำระค่าตรวจสอบภาคสนาม 25,000 บาท'
    };
  }

  /**
   * ขอชำระเงินตรวจสอบภาคสนาม
   */
  async handleAuditPaymentRequest(application) {
    const feeCalculation = this.feeCalculator.calculateFieldAuditFee(application.data);
    
    const paymentRequest = {
      application_id: application.id,
      farmer_id: application.farmer_id,
      payment_type: 'FIELD_AUDIT_FEE',
      amount: feeCalculation.final_amount,
      fee_details: feeCalculation
    };

    const payment = await this.createPaymentRequest(paymentRequest);
    
    return {
      success: true,
      payment_required: true,
      payment_details: payment,
      fee_calculation: feeCalculation,
      next_action: 'PAYMENT_REQUIRED',
      message: 'กรุณาชำระค่าธรรมเนียมการตรวจสอบภาคสนาม'
    };
  }

  /**
   * ผลตรวจสอบมีข้อสงสัย
   */
  async handleAuditSuspicious(application, transitionData) {
    const { audit_notes, suspicious_areas } = transitionData;
    
    // จัดการนัดตรวจภาคสนาม
    const fieldAuditSchedule = await this.scheduleFieldAudit(application.id, {
      suspicious_areas,
      audit_notes
    });
    
    return {
      success: true,
      audit_result: 'SUSPICIOUS',
      field_audit_required: true,
      field_audit_schedule: fieldAuditSchedule,
      suspicious_areas,
      next_action: 'FIELD_AUDIT_SCHEDULED',
      message: 'พบข้อสงสัยจากการตรวจสอบออนไลน์ ต้องนัดตรวจภาคสนาม'
    };
  }

  /**
   * ผลตรวจสอบไม่ผ่าน
   */
  async handleAuditFailed(application, transitionData) {
    const { audit_notes, failure_reasons } = transitionData;
    
    return {
      success: true,
      audit_result: 'FAILED',
      reaudit_required: true,
      failure_reasons,
      next_action: 'REAUDIT_PAYMENT_REQUIRED',
      reaudit_fee: 25000,
      message: 'การตรวจสอบไม่ผ่าน ต้องแก้ไขและชำระค่าตรวจสอบใหม่ 25,000 บาท'
    };
  }

  /**
   * ขอชำระเงินตรวจสอบใหม่
   */
  async handleReauditPaymentRequest(application, transitionData) {
    const feeCalculation = this.feeCalculator.calculateReauditFee(
      application.data, 
      transitionData.previous_audit_result
    );
    
    const paymentRequest = {
      application_id: application.id,
      farmer_id: application.farmer_id,
      payment_type: 'RE_AUDIT_FEE',
      amount: feeCalculation.final_amount,
      fee_details: feeCalculation
    };

    const payment = await this.createPaymentRequest(paymentRequest);
    
    return {
      success: true,
      payment_required: true,
      payment_details: payment,
      fee_calculation: feeCalculation,
      next_action: 'PAYMENT_REQUIRED',
      message: 'กรุณาชำระค่าธรรมเนียมการตรวจสอบใหม่ 25,000 บาท'
    };
  }

  /**
   * ออกใบรับรอง
   */
  async handleCertificateIssued(application) {
    const certificate = await this.generateCertificate(application);
    
    return {
      success: true,
      certificate_issued: true,
      certificate_details: certificate,
      next_action: 'PUBLISH_ANNOUNCEMENT',
      message: 'ออกใบรับรอง GACP เรียบร้อยแล้ว'
    };
  }

  /**
   * สร้าง payment request
   */
  async createPaymentRequest(paymentRequest) {
    // Integration กับ Payment Gateway
    const MockPaymentGateway = require('../payment-service/mock-payment-gateway');
    const gateway = new MockPaymentGateway();
    
    // Mock payment creation for testing
    return {
      id: `PAY-${Date.now()}`,
      reference_id: `GACP${Math.random().toString().substr(2, 10)}`,
      amount: paymentRequest.amount,
      payment_type: paymentRequest.payment_type,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      promptpay: {
        qr_code: `https://api.gacp.dtam.go.th/qr-codes/${paymentRequest.application_id}.png`,
        recipient: {
          name: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก'
        }
      }
    };
  }

  /**
   * คำนวณวันหมดเวลาส่งใหม่
   */
  calculateResubmissionDeadline() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30); // 30 วัน
    return deadline.toISOString();
  }

  /**
   * จัดสรรให้ reviewer
   */
  async assignToReviewer(applicationId) {
    // Logic การจัดสรรผู้ตรวจสอบ
    return { reviewer_id: 'REV001', assigned_at: new Date().toISOString() };
  }

  /**
   * บันทึกการชำระเงิน
   */
  async recordPayment(applicationId, paymentData) {
    // บันทึกลงฐานข้อมูล
    console.log(`Recording payment for ${applicationId}:`, paymentData);
  }

  /**
   * บันทึกการปฏิเสธ
   */
  async recordRejection(applicationId, rejectionData) {
    // บันทึกลงฐานข้อมูล
    console.log(`Recording rejection for ${applicationId}:`, rejectionData);
  }

  /**
   * นัดหมายตรวจภาคสนาม
   */
  async scheduleFieldAudit(applicationId, auditData) {
    const schedule = {
      audit_id: `FA${Date.now()}`,
      application_id: applicationId,
      scheduled_date: this.calculateFieldAuditDate(),
      team_assigned: true,
      preparation_required: auditData.suspicious_areas
    };
    
    return schedule;
  }

  /**
   * คำนวณวันที่ตรวจภาคสนาม
   */
  calculateFieldAuditDate() {
    const auditDate = new Date();
    auditDate.setDate(auditDate.getDate() + 14); // 2 สัปดาห์
    return auditDate.toISOString();
  }

  /**
   * สร้างใบรับรอง
   */
  async generateCertificate(application) {
    return {
      certificate_id: `GACP${Date.now()}`,
      application_id: application.id,
      farmer_name: application.farmer_data.name,
      farm_location: application.farm_data.location,
      issued_date: new Date().toISOString(),
      valid_until: this.calculateCertificateExpiry(),
      certificate_url: `/certificates/GACP${Date.now()}.pdf`
    };
  }

  /**
   * คำนวณวันหมดอายุใบรับรอง
   */
  calculateCertificateExpiry() {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 3); // 3 ปี
    return expiry.toISOString();
  }

  /**
   * อัพเดตสถานะ application
   */
  async updateApplicationStatus(applicationId, newStatus, transitionResult) {
    console.log(`Updating ${applicationId} to ${newStatus}:`, transitionResult);
    
    // Update the internal state tracking for testing
    if (!this.applicationStates) {
      this.applicationStates = {};
    }
    this.applicationStates[applicationId] = newStatus;
    
    // บันทึกลงฐานข้อมูล
  }

  /**
   * ดึงข้อมูล application
   */
  async getApplication(applicationId) {
    // Get current status from internal tracking
    const currentStatus = this.applicationStates?.[applicationId] || this.states.SUBMITTED;
    
    // Mock data for testing
    return {
      id: applicationId,
      farmer_id: 'F001',
      status: currentStatus,
      review_rejections: 0,
      data: {
        farm_size: 3,
        organic_certified: true,
        plot_count: 1,
        location: {
          region: 'ภาคกลาง',
          province: 'กรุงเทพมหานคร',
          district: 'บางรัก'
        }
      },
      farmer_data: {
        name: 'นายสมชาย ใจดี'
      },
      farm_data: {
        location: 'กรุงเทพมหานคร'
      }
    };
  }
}

module.exports = ApplicationStateManager;