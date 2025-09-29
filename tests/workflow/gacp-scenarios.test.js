// tests/workflow/gacp-scenarios.test.js
/**
 * GACP Workflow Scenarios Testing
 * ทดสอบ 20 scenarios ตาม business process จริง
 */

const ApplicationStateManager = require('../../services/workflow-service/application-state-manager');
const GACPFeeCalculator = require('../../services/finance-service/gacp-fee-calculator');

describe('GACP Business Process Scenarios', () => {
  let stateManager;
  let feeCalculator;

  beforeEach(() => {
    stateManager = new ApplicationStateManager();
    feeCalculator = new GACPFeeCalculator();
  });

  describe('Scenario 1: Happy Path - No Rejections', () => {
    test('should complete without any rejections or failures', async () => {
      const applicationId = 'APP-001';
      
      // 1. เริ่มต้น - ส่งเอกสารครบ
      let result = await stateManager.transitionTo(applicationId, 'initial_payment_pending');
      expect(result.payment_required).toBe(true);
      expect(result.fee_calculation.final_amount).toBe(5000);
      
      // 2. ชำระเงิน 5,000 บาท
      result = await stateManager.transitionTo(applicationId, 'initial_payment_confirmed', {
        payment_id: 'PAY-001',
        payment_reference: 'GACP1234567890'
      });
      expect(result.payment_confirmed).toBe(true);
      expect(result.reviewer_assigned).toBe(true);
      
      // 3. ตรวจสอบเอกสาร - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'review_passed');
      expect(result.review_passed).toBe(true);
      expect(result.next_payment_required).toBe(true);
      expect(result.audit_fee_calculation.final_amount).toBe(26000); // 25000 + location surcharge
      
      // 4. ชำระเงิน 25,000 บาท
      result = await stateManager.transitionTo(applicationId, 'audit_payment_pending');
      expect(result.payment_required).toBe(true);
      
      result = await stateManager.transitionTo(applicationId, 'audit_payment_confirmed');
      
      // 5. ตรวจสอบออนไลน์ - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'audit_passed');
      
      // 6. ออกใบรับรอง
      result = await stateManager.transitionTo(applicationId, 'certificate_issued');
      expect(result.certificate_issued).toBe(true);
      expect(result.certificate_details).toBeDefined();
      
      // 7. โพสต์ประกาศ
      result = await stateManager.transitionTo(applicationId, 'published');
      expect(result.success).toBe(true);
    });
  });

  describe('Scenario 5: Multiple Rejections + Re-payment', () => {
    test('should handle 3 rejections and require re-payment', async () => {
      const applicationId = 'APP-005';
      
      // เริ่มต้นและชำระเงิน 5,000
      await stateManager.transitionTo(applicationId, 'initial_payment_pending');
      await stateManager.transitionTo(applicationId, 'initial_payment_confirmed', {
        payment_id: 'PAY-005-1',
        payment_reference: 'GACP5001'
      });
      
      // Reject ครั้งที่ 1
      let result = await stateManager.transitionTo(applicationId, 'review_rejected_1', {
        rejection_reasons: ['เอกสารไม่ครบถ้วน'],
        reviewer_notes: 'ขาดใบรับรองแปลง'
      });
      expect(result.rejection_count).toBe(1);
      expect(result.can_resubmit).toBe(true);
      
      // Reject ครั้งที่ 2
      result = await stateManager.transitionTo(applicationId, 'review_rejected_2', {
        rejection_reasons: ['คุณภาพรูปภาพไม่ชัด'],
        reviewer_notes: 'รูปภาพไม่เห็นรายละเอียด'
      });
      expect(result.rejection_count).toBe(2);
      expect(result.can_resubmit).toBe(true);
      
      // Reject ครั้งที่ 3 - ต้องจ่ายใหม่
      result = await stateManager.transitionTo(applicationId, 'review_rejected_3', {
        rejection_reasons: ['ข้อมูลไม่ตรงกับเอกสาร'],
        reviewer_notes: 'ข้อมูลในแบบฟอร์มไม่ตรงกับหลักฐาน'
      });
      expect(result.rejection_count).toBe(3);
      expect(result.payment_required).toBe(true);
      expect(result.fee_amount).toBe(5000);
      
      // ขอชำระเงินใหม่
      result = await stateManager.transitionTo(applicationId, 'resubmission_payment_pending');
      expect(result.payment_required).toBe(true);
      expect(result.fee_calculation.final_amount).toBe(5000);
      
      // ชำระเงิน 5,000 บาท ใหม่
      result = await stateManager.transitionTo(applicationId, 'resubmission_payment_confirmed', {
        payment_id: 'PAY-005-2',
        payment_reference: 'GACP5002'
      });
      
      // ตรวจสอบใหม่ - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'review_passed');
      expect(result.review_passed).toBe(true);
      
      // ดำเนินการต่อตามปกติ...
      await stateManager.transitionTo(applicationId, 'audit_payment_pending');
      await stateManager.transitionTo(applicationId, 'audit_payment_confirmed');
      
      // ตรวจสอบออนไลน์ - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'audit_passed');
      
      // ออกใบรับรอง
      result = await stateManager.transitionTo(applicationId, 'certificate_issued');
      expect(result.certificate_issued).toBe(true);
    });
  });

  describe('Scenario 2: Suspicious Audit + Field Inspection', () => {
    test('should handle suspicious audit result and field inspection', async () => {
      const applicationId = 'APP-002';
      
      // ดำเนินการจนถึงขั้นตรวจสอบออนไลน์
      await stateManager.transitionTo(applicationId, 'initial_payment_pending');
      await stateManager.transitionTo(applicationId, 'initial_payment_confirmed', {
        payment_id: 'PAY-002-1'
      });
      
      // มี rejection 1 ครั้ง แล้วผ่าน
      await stateManager.transitionTo(applicationId, 'review_rejected_1', {
        rejection_reasons: ['ข้อมูลไม่ครบ']
      });
      await stateManager.transitionTo(applicationId, 'review_passed');
      
      await stateManager.transitionTo(applicationId, 'audit_payment_pending');
      await stateManager.transitionTo(applicationId, 'audit_payment_confirmed');
      
      // ตรวจสอบออนไลน์ - มีข้อสงสัย
      let result = await stateManager.transitionTo(applicationId, 'audit_suspicious', {
        audit_notes: 'พบความไม่สอดคล้องในข้อมูล',
        suspicious_areas: ['การใช้สารเคมี', 'การเก็บรักษา']
      });
      
      expect(result.audit_result).toBe('SUSPICIOUS');
      expect(result.field_audit_required).toBe(true);
      expect(result.field_audit_schedule).toBeDefined();
      
      // นัดตรวจภาคสนาม
      result = await stateManager.transitionTo(applicationId, 'field_audit_scheduled');
      
      // ตรวจภาคสนาม - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'field_audit_passed');
      
      // ออกใบรับรอง
      result = await stateManager.transitionTo(applicationId, 'certificate_issued');
      expect(result.certificate_issued).toBe(true);
    });
  });

  describe('Scenario 7: Audit Failure + Re-audit', () => {
    test('should handle audit failure and re-audit process', async () => {
      const applicationId = 'APP-007';
      
      // ดำเนินการจนถึงขั้นตรวจสอบออนไลน์
      await stateManager.transitionTo(applicationId, 'initial_payment_pending');
      await stateManager.transitionTo(applicationId, 'initial_payment_confirmed', {
        payment_id: 'PAY-007-1'
      });
      
      // มี rejection 1 ครั้ง แล้วผ่าน
      await stateManager.transitionTo(applicationId, 'review_rejected_1');
      await stateManager.transitionTo(applicationId, 'review_passed');
      
      await stateManager.transitionTo(applicationId, 'audit_payment_pending');
      await stateManager.transitionTo(applicationId, 'audit_payment_confirmed');
      
      // ตรวจสอบออนไลน์ - ไม่ผ่าน
      let result = await stateManager.transitionTo(applicationId, 'audit_failed', {
        audit_notes: 'ไม่ผ่านมาตรฐาน GACP',
        failure_reasons: ['กระบวนการผลิตไม่ถูกต้อง', 'เอกสารไม่ครบถ้วน']
      });
      
      expect(result.audit_result).toBe('FAILED');
      expect(result.reaudit_required).toBe(true);
      expect(result.reaudit_fee).toBe(25000);
      
      // ขอชำระเงินตรวจใหม่
      result = await stateManager.transitionTo(applicationId, 'reaudit_payment_pending');
      expect(result.payment_required).toBe(true);
      expect(result.fee_calculation.final_amount).toBe(25000);
      
      // ชำระเงิน 25,000 บาท ใหม่
      result = await stateManager.transitionTo(applicationId, 'reaudit_payment_confirmed', {
        payment_id: 'PAY-007-2',
        payment_reference: 'GACP7002'
      });
      
      // ตรวจสอบใหม่ - ผ่าน
      result = await stateManager.transitionTo(applicationId, 'under_reaudit');
      
      // ออกใบรับรอง
      result = await stateManager.transitionTo(applicationId, 'certificate_issued');
      expect(result.certificate_issued).toBe(true);
    });
  });

  describe('Fee Calculation Tests', () => {
    test('should calculate fees correctly with discounts', () => {
      const applicationData = {
        farm_size: 3,           // เกษตรกรรายย่อย (≤ 5 ไร่)
        organic_certified: true, // มีใบรับรองอินทรีย์
        plot_count: 1,
        location: {
          region: 'ภาคกลาง',
          province: 'กรุงเทพมหานคร',
          district: 'บางรัก'
        }
      };

      // ค่าธรรมเนียมเบื้องต้น
      const initialFee = feeCalculator.calculateInitialFee(applicationData);
      expect(initialFee.base_amount).toBe(5000);
      expect(initialFee.final_amount).toBe(4250); // 5000 * (1 - 0.15) = 4250 (10% + 5% discount)
      
      // ค่าธรรมเนียมตรวจสอบภาคสนาม
      const auditFee = feeCalculator.calculateFieldAuditFee(applicationData);
      expect(auditFee.base_amount).toBe(25000);
      expect(auditFee.location_surcharge).toBe(1000); // ภาคกลาง
      expect(auditFee.final_amount).toBe(22250); // (25000 * 0.85) + 1000 = 22250
      
      // ค่าส่งใหม่
      const resubmissionFee = feeCalculator.calculateResubmissionFee(applicationData, 3);
      expect(resubmissionFee.fee_required).toBe(true);
      expect(resubmissionFee.final_amount).toBe(5000);
      
      // ค่าตรวจใหม่
      const reauditFee = feeCalculator.calculateReauditFee(applicationData, 'FAILED');
      expect(reauditFee.final_amount).toBe(25000);
    });

    test('should calculate total project cost', () => {
      const applicationData = {
        farm_size: 10,           // ไม่ใช่เกษตรกรรายย่อย
        organic_certified: false,
        plot_count: 1,
        location: {
          region: 'ภาคเหนือ',
          province: 'เชียงใหม่'
        }
      };

      const totalCost = feeCalculator.calculateTotalProjectCost(applicationData);
      
      expect(totalCost.initial_fee).toBe(5000); // ไม่มีส่วนลด
      expect(totalCost.audit_fee).toBe(27000);  // 25000 + 2000 (ภาคเหนือ)
      expect(totalCost.estimated_total).toBe(32000);
      expect(totalCost.potential_additional_costs.resubmission_fee).toBe(5000);
      expect(totalCost.potential_additional_costs.reaudit_fee).toBe(25000);
    });
  });

  describe('State Transition Validation', () => {
    test('should validate valid transitions', () => {
      expect(stateManager.isValidTransition('submitted', 'initial_payment_pending')).toBe(true);
      expect(stateManager.isValidTransition('review_passed', 'audit_payment_pending')).toBe(true);
      expect(stateManager.isValidTransition('audit_suspicious', 'field_audit_scheduled')).toBe(true);
    });

    test('should reject invalid transitions', () => {
      expect(stateManager.isValidTransition('submitted', 'certificate_issued')).toBe(false);
      expect(stateManager.isValidTransition('under_review', 'audit_passed')).toBe(false);
      expect(stateManager.isValidTransition('published', 'under_review')).toBe(false);
    });

    test('should throw error for invalid transitions', async () => {
      await expect(
        stateManager.transitionTo('APP-TEST', 'certificate_issued')
      ).rejects.toThrow('Invalid transition');
    });
  });
  
  describe('Payment Integration Tests', () => {
    test('should create payment request with correct details', async () => {
      const applicationId = 'APP-PAY-001';
      
      const result = await stateManager.transitionTo(applicationId, 'initial_payment_pending');
      
      expect(result.payment_required).toBe(true);
      expect(result.payment_details).toBeDefined();
      expect(result.fee_calculation.fee_type).toBe('INITIAL_REVIEW_FEE');
      expect(result.fee_calculation.final_amount).toBeGreaterThan(0);
    });
  });
});

// Test Helper Functions
function createMockApplication(overrides = {}) {
  return {
    id: `APP-${Date.now()}`,
    farmer_id: 'F001',
    status: 'submitted',
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
      name: 'นายทดสอบ ระบบ'
    },
    farm_data: {
      location: 'กรุงเทพมหานคร'
    },
    ...overrides
  };
}

module.exports = {
  createMockApplication
};