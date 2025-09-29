// services/finance-service/gacp-fee-calculator.js
/**
 * GACP Fee Calculator - คำนวณค่าธรรมเนียมตาม Business Process แบบ Fixed Fee
 * ค่าธรรมเนียม 2 ครั้ง: 5,000 บาท และ 25,000 บาท
 * รองรับสมุนไพรไทย 6 ชนิดหลัก และ Role การปรับราคา
 */

const ThaiHerbalDatabase = require('../../models/thai-herbal-database');

class GACPFeeCalculator {
  constructor() {
    // Fixed Fee Structure - ค่าธรรมเนียมแบบ Fix
    this.feeStructure = {
      INITIAL_REVIEW_FEE: 5000,     // ค่าตรวจสอบเอกสารเบื้องต้น (Fix)
      FIELD_AUDIT_FEE: 25000,      // ค่าตรวจสอบภาคสนาม (Fix)
      RE_SUBMISSION_FEE: 5000,     // ค่าส่งเอกสารใหม่ (หลัง reject 2 ครั้ง) (Fix)
      RE_AUDIT_FEE: 25000          // ค่าตรวจสอบใหม่ (หลัง audit fail)
    };
    
    // ส่วนลดแบบเดิม (สำหรับ Role ที่มีสิทธิ์ปรับได้)
    this.discountRules = {
      SMALL_FARMER: 0.0,           // เอาส่วนลดออก (ราคา Fix)
      ORGANIC_CERTIFIED: 0.0,     // เอาส่วนลดออก (ราคา Fix)
      BULK_APPLICATION: 0.0        // เอาส่วนลดออก (ราคา Fix)
    };

    // เพิ่ม Role การปรับราคา
    this.adminRoles = {
      SUPER_ADMIN: ['discount', 'surcharge', 'fee_adjustment'],
      PROMOTION_MANAGER: ['discount', 'promotion'],
      FINANCE_MANAGER: ['surcharge', 'fee_adjustment']
    };

    // โหลดฐานข้อมูลสมุนไพรไทย
    this.herbalDatabase = new ThaiHerbalDatabase();
  }

  /**
   * คำนวณค่าธรรมเนียมเบื้องต้น (Fixed Fee = 5,000 บาท)
   */
  calculateInitialFee(applicationData, adminAdjustment = null) {
    const baseFee = this.feeStructure.INITIAL_REVIEW_FEE;
    
    // ตรวจสอบชนิดสมุนไพรและคำนวณ multiplier
    let herbMultiplier = 1.0;
    if (applicationData.herbs && applicationData.herbs.length > 0) {
      const herbInfo = this.herbalDatabase.calculateHerbFeeMultiplier(applicationData.herbs);
      herbMultiplier = herbInfo.fee_multiplier;
    }
    
    // คำนวณค่าธรรมเนียมฐาน
    let finalAmount = baseFee * herbMultiplier;
    
    // ส่วนลดสำหรับ Admin เท่านั้น
    let discountAmount = 0;
    let discountDetails = [];
    
    if (adminAdjustment && this.isValidAdminAdjustment(adminAdjustment)) {
      discountAmount = this.applyAdminDiscount(finalAmount, adminAdjustment);
      discountDetails.push({
        type: 'ADMIN_ADJUSTMENT',
        amount: discountAmount,
        reason: adminAdjustment.reason,
        admin_user: adminAdjustment.admin_user
      });
    }
    
    return {
      base_amount: baseFee,
      herb_multiplier: herbMultiplier,
      herb_surcharge: finalAmount - baseFee,
      discount_amount: discountAmount,
      final_amount: finalAmount - discountAmount,
      fee_type: 'INITIAL_REVIEW_FEE',
      description: 'ค่าธรรมเนียมการตรวจสอบเอกสารเบื้องต้น (Fixed Fee)',
      payment_deadline: this.calculatePaymentDeadline(7), // 7 วัน
      discount_details: discountDetails,
      herb_details: applicationData.herbs ? this.getHerbDetails(applicationData.herbs) : []
    };
  }

  /**
   * คำนวณค่าธรรมเนียมตรวจสอบภาคสนาม (Fixed Fee = 25,000 บาท)
   */
  calculateFieldAuditFee(applicationData, adminAdjustment = null) {
    const baseFee = this.feeStructure.FIELD_AUDIT_FEE;
    
    // ตรวจสอบชนิดสมุนไพรและคำนวณ multiplier
    let herbMultiplier = 1.0;
    if (applicationData.herbs && applicationData.herbs.length > 0) {
      const herbInfo = this.herbalDatabase.calculateHerbFeeMultiplier(applicationData.herbs);
      herbMultiplier = herbInfo.fee_multiplier;
    }
    
    // คำนวณค่าธรรมเนียมฐาน
    let finalAmount = baseFee * herbMultiplier;
    
    // ส่วนลดสำหรับ Admin เท่านั้น
    let discountAmount = 0;
    let discountDetails = [];
    
    if (adminAdjustment && this.isValidAdminAdjustment(adminAdjustment)) {
      discountAmount = this.applyAdminDiscount(finalAmount, adminAdjustment);
      discountDetails.push({
        type: 'ADMIN_ADJUSTMENT',
        amount: discountAmount,
        reason: adminAdjustment.reason,
        admin_user: adminAdjustment.admin_user
      });
    }
    
    return {
      base_amount: baseFee,
      herb_multiplier: herbMultiplier,
      herb_surcharge: finalAmount - baseFee,
      discount_amount: discountAmount,
      final_amount: finalAmount - discountAmount,
      fee_type: 'FIELD_AUDIT_FEE',
      description: 'ค่าธรรมเนียมการตรวจสอบภาคสนาม (Fixed Fee)',
      payment_deadline: this.calculatePaymentDeadline(14), // 14 วัน
      estimated_audit_date: this.calculateAuditDate(),
      herb_details: applicationData.herbs ? this.getHerbDetails(applicationData.herbs) : [],
      gacp_requirements: applicationData.herbs ? this.herbalDatabase.getGACPRequirements(applicationData.herbs) : null,
      location_details: this.getLocationDetails(applicationData.location)
    };
  }

  /**
   * คำนวณค่าธรรมเนียมส่งเอกสารใหม่ (หลังจากปฏิเสธ 2 ครั้ง)
   * ครั้งที่ 3 ต้องจ่ายเงิน 5,000 บาท
   */
  calculateResubmissionFee(applicationData, rejectionCount, adminAdjustment = null) {
    if (rejectionCount < 2) {
      return {
        fee_required: false,
        message: `การปฏิเสธครั้งที่ ${rejectionCount} - ยังไม่ต้องชำระค่าธรรมเนียมเพิ่ม`
      };
    }

    const baseFee = this.feeStructure.RE_SUBMISSION_FEE;
    
    // ตรวจสอบชนิดสมุนไพรและคำนวณ multiplier
    let herbMultiplier = 1.0;
    if (applicationData.herbs && applicationData.herbs.length > 0) {
      const herbInfo = this.herbalDatabase.calculateHerbFeeMultiplier(applicationData.herbs);
      herbMultiplier = herbInfo.fee_multiplier;
    }
    
    // คำนวณค่าธรรมเนียมฐาน
    let finalAmount = baseFee * herbMultiplier;
    
    // ส่วนลดสำหรับ Admin เท่านั้น
    let discountAmount = 0;
    let discountDetails = [];
    
    if (adminAdjustment && this.isValidAdminAdjustment(adminAdjustment)) {
      discountAmount = this.applyAdminDiscount(finalAmount, adminAdjustment);
      discountDetails.push({
        type: 'ADMIN_ADJUSTMENT',
        amount: discountAmount,
        reason: adminAdjustment.reason,
        admin_user: adminAdjustment.admin_user
      });
    }
    
    return {
      fee_required: true,
      base_amount: baseFee,
      final_amount: baseFee, // ไม่มีส่วนลดสำหรับ re-submission
      fee_type: 'RE_SUBMISSION_FEE',
      description: `ค่าธรรมเนียมส่งเอกสารใหม่ (ปฏิเสธครั้งที่ ${rejectionCount})`,
      payment_deadline: this.calculatePaymentDeadline(7),
      rejection_count: rejectionCount,
      warning_message: 'กรุณาตรวจสอบเอกสารให้ครบถ้วนก่อนส่งใหม่'
    };
  }

  /**
   * คำนวณค่าธรรมเนียมตรวจสอบใหม่
   */
  calculateReauditFee(applicationData, previousAuditResult) {
    const baseFee = this.feeStructure.RE_AUDIT_FEE;
    
    return {
      base_amount: baseFee,
      final_amount: baseFee,
      fee_type: 'RE_AUDIT_FEE',
      description: 'ค่าธรรมเนียมการตรวจสอบใหม่',
      payment_deadline: this.calculatePaymentDeadline(7),
      previous_result: previousAuditResult,
      improvement_required: this.getImprovementRequirements(previousAuditResult),
      warning_message: 'กรุณาแก้ไขปัญหาที่พบจากการตรวจสอบครั้งก่อน'
    };
  }

  /**
   * คำนวณส่วนลดตามเงื่อนไข
   */
  calculateDiscount(applicationData, feeType) {
    let totalDiscount = 0;

    // เกษตรกรรายย่อย
    if (applicationData.farm_size && applicationData.farm_size <= 5) {
      totalDiscount += this.discountRules.SMALL_FARMER;
    }

    // มีใบรับรองอินทรีย์
    if (applicationData.organic_certified) {
      totalDiscount += this.discountRules.ORGANIC_CERTIFIED;
    }

    // สมัครหลายแปลงพร้อมกัน
    if (applicationData.plot_count && applicationData.plot_count >= 3) {
      totalDiscount += this.discountRules.BULK_APPLICATION;
    }

    // จำกัดส่วนลดสูงสุด 20%
    return Math.min(totalDiscount, 0.20);
  }

  /**
   * คำนวณค่าใช้จ่ายเพิ่มตามพื้นที่
   */
  calculateLocationSurcharge(location) {
    const surchargeRates = {
      'ภาคเหนือ': 2000,      // พื้นที่ห่างไกล
      'ภาคใต้': 3000,        // เดินทางยาก
      'ภาคตะวันออกเฉียงเหนือ': 1500,
      'ภาคกลาง': 1000,      // ใกล้สำนักงานใหญ่
      'ภาคตะวันออก': 2500
    };

    return surchargeRates[location.region] || 1000;
  }

  /**
   * กำหนดวันที่ชำระเงิน
   */
  calculatePaymentDeadline(days) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString();
  }

  /**
   * ประมาณการวันที่ตรวจสอบ
   */
  calculateAuditDate() {
    const auditDate = new Date();
    auditDate.setDate(auditDate.getDate() + 21); // 3 สัปดาห์หลังชำระเงิน
    return auditDate.toISOString();
  }

  /**
   * รายละเอียดส่วนลด
   */
  getDiscountDetails(applicationData) {
    const details = [];
    
    if (applicationData.farm_size && applicationData.farm_size <= 5) {
      details.push({
        type: 'SMALL_FARMER',
        description: 'เกษตรกรรายย่อย (≤ 5 ไร่)',
        discount: '10%'
      });
    }

    if (applicationData.organic_certified) {
      details.push({
        type: 'ORGANIC_CERTIFIED',
        description: 'มีใบรับรองอินทรีย์',
        discount: '5%'
      });
    }

    if (applicationData.plot_count && applicationData.plot_count >= 3) {
      details.push({
        type: 'BULK_APPLICATION',
        description: 'สมัครหลายแปลงพร้อมกัน',
        discount: '15%'
      });
    }

    return details;
  }

  /**
   * รายละเอียดการเดินทาง
   */
  getLocationDetails(location) {
    return {
      region: location.region,
      province: location.province,
      district: location.district,
      estimated_travel_time: this.calculateTravelTime(location),
      audit_team_size: this.calculateTeamSize(location),
      accommodation_required: this.requiresAccommodation(location)
    };
  }

  /**
   * ข้อกำหนดที่ต้องปรับปรุง
   */
  getImprovementRequirements(auditResult) {
    const requirements = {
      'DOCUMENTATION_ISSUES': [
        'ปรับปรุงระบบการบันทึกข้อมูล',
        'เพิ่มเอกสารประกอบการปฏิบัติ',
        'จัดระเบียบเอกสารให้เป็นระบบ'
      ],
      'FACILITY_STANDARDS': [
        'ปรับปรุงโรงเก็บวัตถุดิบ',
        'ติดตั้งระบบระบายอากาศ',
        'แยกพื้นที่เก็บสารเคมีและอินทรีย์วัตถุ'
      ],
      'PROCESS_COMPLIANCE': [
        'ปรับปรุงขั้นตอนการผลิต',
        'ฝึกอบรมบุคลากร',
        'จัดทำคู่มือการปฏิบัติงาน'
      ]
    };

    return requirements[auditResult.issue_category] || [];
  }

  /**
   * คำนวณเวลาเดินทาง
   */
  calculateTravelTime(location) {
    const travelTimes = {
      'ภาคเหนือ': '6-8 ชั่วโมง',
      'ภาคใต้': '8-12 ชั่วโมง', 
      'ภาคตะวันออกเฉียงเหนือ': '5-7 ชั่วโมง',
      'ภาคกลาง': '2-4 ชั่วโมง',
      'ภาคตะวันออก': '3-5 ชั่วโมง'
    };

    return travelTimes[location.region] || '4-6 ชั่วโมง';
  }

  /**
   * กำหนดขนาดทีมตรวจสอบ
   */
  calculateTeamSize(location) {
    // ทีมใหญ่ขึ้นสำหรับพื้นที่ห่างไกลหรือแปลงใหญ่
    const baseTeam = 2;
    const remoteBonus = ['ภาคเหนือ', 'ภาคใต้'].includes(location.region) ? 1 : 0;
    
    return baseTeam + remoteBonus;
  }

  /**
   * ตรวจสอบสิทธิ์ Admin ในการปรับราคา
   */
  isValidAdminAdjustment(adminAdjustment) {
    if (!adminAdjustment || !adminAdjustment.admin_role || !adminAdjustment.adjustment_type) {
      return false;
    }

    const allowedAdjustments = this.adminRoles[adminAdjustment.admin_role];
    return allowedAdjustments && allowedAdjustments.includes(adminAdjustment.adjustment_type);
  }

  /**
   * ใช้ส่วนลด/ปรับราคาโดย Admin
   */
  applyAdminDiscount(baseAmount, adminAdjustment) {
    if (!this.isValidAdminAdjustment(adminAdjustment)) {
      throw new Error('Admin ไม่มีสิทธิ์ในการปรับราคานี้');
    }

    let discountAmount = 0;

    switch (adminAdjustment.adjustment_type) {
      case 'discount':
        // ส่วนลดแบบเปอร์เซ็นต์ หรือจำนวนเงิน
        if (adminAdjustment.percentage) {
          discountAmount = baseAmount * (adminAdjustment.percentage / 100);
        } else if (adminAdjustment.amount) {
          discountAmount = adminAdjustment.amount;
        }
        break;

      case 'promotion':
        // โปรโมชั่นพิเศษ
        discountAmount = this.calculatePromotionDiscount(baseAmount, adminAdjustment.promotion_code);
        break;

      case 'surcharge':
        // ค่าใช้จ่ายเพิ่มเติม (ติดลบ = เพิ่มค่าใช้จ่าย)
        if (adminAdjustment.percentage) {
          discountAmount = -(baseAmount * (adminAdjustment.percentage / 100));
        } else if (adminAdjustment.amount) {
          discountAmount = -adminAdjustment.amount;
        }
        break;

      case 'fee_adjustment':
        // ปรับราคาตามดุลยพินิจ
        discountAmount = adminAdjustment.adjustment_amount || 0;
        break;
    }

    return Math.max(discountAmount, -baseAmount); // ไม่ให้ส่วนลดเกินราคาสินค้า
  }

  /**
   * คำนวณส่วนลดโปรโมชั่น
   */
  calculatePromotionDiscount(baseAmount, promotionCode) {
    const promotions = {
      'NEWYEAR2025': 0.15,      // ส่วนลด 15% ปีใหม่
      'FARMER2025': 0.10,       // ส่วนลด 10% เกษตรกร
      'ORGANIC2025': 0.12,      // ส่วนลด 12% อินทรีย์
      'BULK2025': 0.20,         // ส่วนลด 20% สมัครหลายแปลง
      'STUDENT2025': 0.25       // ส่วนลด 25% นักศึกษา
    };

    const discountRate = promotions[promotionCode] || 0;
    return baseAmount * discountRate;
  }

  /**
   * รับข้อมูลรายละเอียดสมุนไพร
   */
  getHerbDetails(herbNames) {
    return herbNames.map(herbName => {
      try {
        const herbInfo = this.herbalDatabase.getHerbInfo(herbName);
        return {
          name: herbName,
          scientific_name: herbInfo.scientific_name,
          category: herbInfo.category,
          fee_multiplier: herbInfo.fee_multiplier,
          special_license_required: herbInfo.special_license_required,
          gacp_security_level: herbInfo.gacp_requirements.security_level
        };
      } catch (error) {
        return {
          name: herbName,
          error: error.message,
          fee_multiplier: 1.0
        };
      }
    });
  }

  /**
   * ตรวจสอบว่าต้องใบอนุญาตพิเศษหรือไม่
   */
  requiresSpecialLicense(herbNames) {
    return herbNames.some(herbName => {
      try {
        return this.herbalDatabase.requiresSpecialLicense(herbName);
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * ต้องพักค้างคืน
   */
  requiresAccommodation(location) {
    return ['ภาคเหนือ', 'ภาคใต้'].includes(location.region);
  }

  /**
   * สรุปค่าใช้จ่ายทั้งหมด
   */
  calculateTotalProjectCost(applicationData, adminAdjustment = null) {
    const initialFee = this.calculateInitialFee(applicationData, adminAdjustment);
    const auditFee = this.calculateFieldAuditFee(applicationData, adminAdjustment);
    
    return {
      initial_fee: initialFee.final_amount,
      audit_fee: auditFee.final_amount,
      estimated_total: initialFee.final_amount + auditFee.final_amount,
      potential_additional_costs: {
        resubmission_fee: this.feeStructure.RE_SUBMISSION_FEE,
        reaudit_fee: this.feeStructure.RE_AUDIT_FEE
      },
      payment_schedule: [
        {
          stage: 'เริ่มต้น',
          amount: initialFee.final_amount,
          deadline: initialFee.payment_deadline
        },
        {
          stage: 'ก่อนตรวจสอบ',
          amount: auditFee.final_amount,
          deadline: auditFee.payment_deadline
        }
      ],
      herb_info: {
        total_herbs: applicationData.herbs ? applicationData.herbs.length : 0,
        special_license_required: applicationData.herbs ? this.requiresSpecialLicense(applicationData.herbs) : false,
        herb_details: applicationData.herbs ? this.getHerbDetails(applicationData.herbs) : []
      }
    };
  }
}

module.exports = GACPFeeCalculator;