/**
 * Admin Role Management System
 * ระบบจัดการสิทธิ์ Admin สำหรับการปรับราคาและโปรโมชั่น
 */

class AdminRoleManager {
    constructor() {
        this.roles = {
            SUPER_ADMIN: {
                name: 'ผู้ดูแลระบบสูงสุด',
                permissions: ['discount', 'surcharge', 'fee_adjustment', 'promotion', 'user_management'],
                max_discount_percentage: 50,
                max_discount_amount: 50000,
                can_override_system: true
            },
            PROMOTION_MANAGER: {
                name: 'ผู้จัดการโปรโมชั่น',
                permissions: ['discount', 'promotion'],
                max_discount_percentage: 25,
                max_discount_amount: 10000,
                can_override_system: false
            },
            FINANCE_MANAGER: {
                name: 'ผู้จัดการการเงิน',
                permissions: ['surcharge', 'fee_adjustment'],
                max_discount_percentage: 15,
                max_discount_amount: 5000,
                can_override_system: false
            },
            REVIEWER: {
                name: 'ผู้ตรวจสอบเอกสาร',
                permissions: [],
                max_discount_percentage: 0,
                max_discount_amount: 0,
                can_override_system: false
            },
            AUDITOR: {
                name: 'ผู้ตรวจประเมินภาคสนาม',
                permissions: [],
                max_discount_percentage: 0,
                max_discount_amount: 0,
                can_override_system: false
            }
        };

        this.promotionCodes = {
            'NEWYEAR2025': {
                name: 'โปรโมชั่นปีใหม่ 2025',
                discount_percentage: 15,
                valid_from: '2025-01-01',
                valid_until: '2025-01-31',
                max_usage: 1000,
                current_usage: 0,
                active: true
            },
            'FARMER2025': {
                name: 'ส่วนลดเกษตรกร 2025',
                discount_percentage: 10,
                valid_from: '2025-01-01',
                valid_until: '2025-12-31',
                max_usage: 5000,
                current_usage: 0,
                active: true
            },
            'ORGANIC2025': {
                name: 'ส่วนลดอินทรีย์ 2025',
                discount_percentage: 12,
                valid_from: '2025-01-01',
                valid_until: '2025-12-31',
                max_usage: 2000,
                current_usage: 0,
                active: true
            },
            'BULK2025': {
                name: 'ส่วนลดสมัครหลายแปลง',
                discount_percentage: 20,
                valid_from: '2025-01-01',
                valid_until: '2025-12-31',
                max_usage: 500,
                current_usage: 0,
                active: true
            },
            'STUDENT2025': {
                name: 'ส่วนลดนักศึกษา',
                discount_percentage: 25,
                valid_from: '2025-01-01',
                valid_until: '2025-12-31',
                max_usage: 100,
                current_usage: 0,
                active: true,
                special_requirements: ['student_id', 'university_verification']
            }
        };
    }

    /**
     * ตรวจสอบสิทธิ์ของ Admin
     */
    hasPermission(adminRole, permission) {
        const role = this.roles[adminRole];
        if (!role) {
            throw new Error(`ไม่พบบทบาท "${adminRole}"`);
        }
        return role.permissions.includes(permission);
    }

    /**
     * ตรวจสอบการปรับราคาที่ขอมา
     */
    validateAdjustment(adminRole, adjustmentType, amount, percentage) {
        const role = this.roles[adminRole];
        if (!role) {
            throw new Error(`ไม่พบบทบาท "${adminRole}"`);
        }

        if (!this.hasPermission(adminRole, adjustmentType)) {
            throw new Error(`บทบาท "${adminRole}" ไม่มีสิทธิ์ในการ "${adjustmentType}"`);
        }

        // ตรวจสอบขีดจำกัดการลดราคา
        if (percentage && percentage > role.max_discount_percentage) {
            throw new Error(`ส่วนลดเกินขีดจำกัด: สูงสุด ${role.max_discount_percentage}%`);
        }

        if (amount && amount > role.max_discount_amount) {
            throw new Error(`จำนวนเงินเกินขีดจำกัด: สูงสุด ${role.max_discount_amount} บาท`);
        }

        return true;
    }

    /**
     * สร้างโค้ดโปรโมชั่นใหม่
     */
    createPromotionCode(adminRole, promotionData) {
        if (!this.hasPermission(adminRole, 'promotion')) {
            throw new Error(`บทบาท "${adminRole}" ไม่มีสิทธิ์สร้างโปรโมชั่น`);
        }

        const code = promotionData.code.toUpperCase();
        
        if (this.promotionCodes[code]) {
            throw new Error(`โค้ดโปรโมชั่น "${code}" มีอยู่แล้ว`);
        }

        this.promotionCodes[code] = {
            name: promotionData.name,
            discount_percentage: promotionData.discount_percentage,
            valid_from: promotionData.valid_from,
            valid_until: promotionData.valid_until,
            max_usage: promotionData.max_usage || 1000,
            current_usage: 0,
            active: true,
            created_by: adminRole,
            created_at: new Date().toISOString()
        };

        return {
            success: true,
            code: code,
            message: `สร้างโค้ดโปรโมชั่น "${code}" สำเร็จ`
        };
    }

    /**
     * ตรวจสอบความถูกต้องของโค้ดโปรโมชั่น
     */
    validatePromotionCode(code) {
        const promotion = this.promotionCodes[code.toUpperCase()];
        
        if (!promotion) {
            return { valid: false, error: 'ไม่พบโค้ดโปรโมชั่น' };
        }

        if (!promotion.active) {
            return { valid: false, error: 'โค้ดโปรโมชั่นไม่ได้ใช้งาน' };
        }

        const now = new Date();
        const validFrom = new Date(promotion.valid_from);
        const validUntil = new Date(promotion.valid_until);

        if (now < validFrom) {
            return { valid: false, error: 'โค้ดโปรโมชั่นยังไม่เริ่มใช้งาน' };
        }

        if (now > validUntil) {
            return { valid: false, error: 'โค้ดโปรโมชั่นหมดอายุแล้ว' };
        }

        if (promotion.current_usage >= promotion.max_usage) {
            return { valid: false, error: 'โค้ดโปรโมชั่นใช้งานครบแล้ว' };
        }

        return { 
            valid: true, 
            promotion: promotion
        };
    }

    /**
     * ใช้โค้ดโปรโมชั่น
     */
    usePromotionCode(code) {
        const validation = this.validatePromotionCode(code);
        
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const promotion = this.promotionCodes[code.toUpperCase()];
        promotion.current_usage += 1;

        return {
            success: true,
            discount_percentage: promotion.discount_percentage,
            remaining_usage: promotion.max_usage - promotion.current_usage
        };
    }

    /**
     * รายการโปรโมชั่นที่ใช้งานได้
     */
    getActivePromotions() {
        const now = new Date();
        const activePromotions = {};

        Object.keys(this.promotionCodes).forEach(code => {
            const promotion = this.promotionCodes[code];
            const validFrom = new Date(promotion.valid_from);
            const validUntil = new Date(promotion.valid_until);

            if (promotion.active && 
                now >= validFrom && 
                now <= validUntil && 
                promotion.current_usage < promotion.max_usage) {
                activePromotions[code] = {
                    name: promotion.name,
                    discount_percentage: promotion.discount_percentage,
                    valid_until: promotion.valid_until,
                    remaining_usage: promotion.max_usage - promotion.current_usage
                };
            }
        });

        return activePromotions;
    }

    /**
     * สร้าง Admin Adjustment Object
     */
    createAdjustment(adminRole, adjustmentType, params) {
        this.validateAdjustment(adminRole, adjustmentType, params.amount, params.percentage);

        return {
            admin_role: adminRole,
            adjustment_type: adjustmentType,
            percentage: params.percentage,
            amount: params.amount,
            promotion_code: params.promotion_code,
            reason: params.reason,
            admin_user: params.admin_user,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * รายงานการใช้งานโปรโมชั่น
     */
    getPromotionReport() {
        const report = {
            total_promotions: Object.keys(this.promotionCodes).length,
            active_promotions: 0,
            expired_promotions: 0,
            total_usage: 0,
            details: []
        };

        const now = new Date();

        Object.keys(this.promotionCodes).forEach(code => {
            const promotion = this.promotionCodes[code];
            const validUntil = new Date(promotion.valid_until);
            
            if (now <= validUntil && promotion.active) {
                report.active_promotions += 1;
            } else {
                report.expired_promotions += 1;
            }

            report.total_usage += promotion.current_usage;

            report.details.push({
                code: code,
                name: promotion.name,
                usage: promotion.current_usage,
                max_usage: promotion.max_usage,
                usage_percentage: Math.round((promotion.current_usage / promotion.max_usage) * 100),
                status: now <= validUntil && promotion.active ? 'active' : 'expired'
            });
        });

        return report;
    }
}

module.exports = AdminRoleManager;