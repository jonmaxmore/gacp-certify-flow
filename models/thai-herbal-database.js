/**
 * Thai Herbal Database - ฐานข้อมูลสมุนไพรไทย
 * 6 ชนิดหลัก: กัญชา ขมิ้นชัน ขิง กระชายดำ ไพล และกระท่อม
 */

class ThaiHerbalDatabase {
    constructor() {
        this.herbs = this.initializeHerbDatabase();
    }

    initializeHerbDatabase() {
        return {
            'กัญชา': {
                id: 'cannabis',
                scientific_name: 'Cannabis sativa',
                english_name: 'Cannabis',
                category: 'สมุนไพรควบคุมพิเศษ',
                special_license_required: true,
                gacp_requirements: {
                    security_level: 'สูง',
                    storage_conditions: 'ห้องเก็บล็อค อุณหภูมิควบคุม',
                    quality_control: 'ตรวจสอบ THC/CBD',
                    documentation: 'บันทึกรายละเอียดทุกขั้นตอน'
                },
                cultivation: {
                    growing_period: '3-4 เดือน',
                    harvest_season: 'ตลอดปี (ภายใต้การควบคุม)',
                    soil_requirement: 'ดินร่วนปนทราย pH 6.0-7.5',
                    water_requirement: 'ปานกลาง'
                },
                regulation_status: 'ควบคุมตาม พ.ร.บ.ยาเสพติด',
                fee_multiplier: 2.0 // ค่าธรรมเนียมสูงกว่าปกติ 2 เท่า
            },
            'ขมิ้นชัน': {
                id: 'turmeric',
                scientific_name: 'Curcuma longa',
                english_name: 'Turmeric',
                category: 'สมุนไพรอาหาร',
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'แห้ง ไม่ชื้น อุณหภูมิห้อง',
                    quality_control: 'ตรวจสอบสาร Curcumin',
                    documentation: 'บันทึกการเก็บเกี่ยว การแปรรูป'
                },
                cultivation: {
                    growing_period: '8-10 เดือน',
                    harvest_season: 'ธันวาคม - กุมภาพันธ์',
                    soil_requirement: 'ดินร่วนเหนียว pH 5.5-7.0',
                    water_requirement: 'สูง'
                },
                regulation_status: 'ปกติ',
                fee_multiplier: 1.0
            },
            'ขิง': {
                id: 'ginger',
                scientific_name: 'Zingiber officinale',
                english_name: 'Ginger',
                category: 'สมุนไพรอาหาร',
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'แห้ง เย็น หลีกเลี่ยงแสงแดด',
                    quality_control: 'ตรวจสอบสาร Gingerol',
                    documentation: 'บันทึกการเก็บเกี่ยว การล้างทำความสะอาด'
                },
                cultivation: {
                    growing_period: '8-12 เดือน',
                    harvest_season: 'พฤศจิกายน - มกราคม',
                    soil_requirement: 'ดินร่วนปนทราย pH 6.0-6.8',
                    water_requirement: 'ปานกลาง'
                },
                regulation_status: 'ปกติ',
                fee_multiplier: 1.0
            },
            'กระชายดำ': {
                id: 'black_galingale',
                scientific_name: 'Kaempferia parviflora',
                english_name: 'Black Galingale / Thai Black Ginger',
                category: 'สมุนไพรเวชภัณฑ์',
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปานกลาง',
                    storage_conditions: 'แห้ง เย็น ป้องกันแมลง',
                    quality_control: 'ตรวจสอบสารสกัด Methoxyflavones',
                    documentation: 'บันทึกรายละเอียดการเก็บรักษา'
                },
                cultivation: {
                    growing_period: '12-18 เดือน',
                    harvest_season: 'กุมภาพันธ์ - เมษายน',
                    soil_requirement: 'ดินร่วนเหนียว pH 5.5-6.5',
                    water_requirement: 'ปานกลาง'
                },
                regulation_status: 'ปกติ',
                fee_multiplier: 1.2 // ค่าธรรมเนียมสูงขึ้น 20%
            },
            'ไพล': {
                id: 'plai',
                scientific_name: 'Zingiber cassumunar',
                english_name: 'Plai / Cassumunar Ginger',
                category: 'สมุนไพรเวชภัณฑ์',
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'แห้ง เย็น ระบายอากาศดี',
                    quality_control: 'ตรวจสอบน้ำมันหอมระเหย',
                    documentation: 'บันทึกกรรมวิธีการแปรรูป'
                },
                cultivation: {
                    growing_period: '10-12 เดือน',
                    harvest_season: 'ธันวาคม - กุมภาพันธ์',
                    soil_requirement: 'ดินร่วน pH 6.0-7.0',
                    water_requirement: 'ปานกลาง'
                },
                regulation_status: 'ปกติ',
                fee_multiplier: 1.0
            },
            'กระท่อม': {
                id: 'kratom',
                scientific_name: 'Mitragyna speciosa',
                english_name: 'Kratom',
                category: 'สมุนไพรควบคุม',
                special_license_required: true,
                gacp_requirements: {
                    security_level: 'สูง',
                    storage_conditions: 'ห้องล็อค ควบคุมการเข้าถึง',
                    quality_control: 'ตรวจสอบสาร Mitragynine',
                    documentation: 'บันทึกทุกขั้นตอน รายงานหน่วยงานราชการ'
                },
                cultivation: {
                    growing_period: '2-3 ปี (ต้นโต)',
                    harvest_season: 'ตลอดปี (เก็บใบ)',
                    soil_requirement: 'ดินร่วนเหนียว pH 5.5-6.5',
                    water_requirement: 'สูง'
                },
                regulation_status: 'ควบคุมตาม พ.ร.บ.ยาเสพติด (ยกเลิกการควบคุม 2564)',
                fee_multiplier: 1.5 // ค่าธรรมเนียมสูงขึ้น 50%
            }
        };
    }

    /**
     * ค้นหาข้อมูลสมุนไพร
     */
    getHerbInfo(herbName) {
        const herb = this.herbs[herbName];
        if (!herb) {
            throw new Error(`ไม่พบข้อมูลสมุนไพร "${herbName}" ในฐานข้อมูล`);
        }
        return herb;
    }

    /**
     * ตรวจสอบว่าต้องใบอนุญาตพิเศษหรือไม่
     */
    requiresSpecialLicense(herbName) {
        const herb = this.getHerbInfo(herbName);
        return herb.special_license_required;
    }

    /**
     * คำนวณค่าธรรมเนียมตามชนิดสมุนไพร
     */
    calculateHerbFeeMultiplier(herbNames) {
        let maxMultiplier = 1.0;
        let specialLicenseRequired = false;

        herbNames.forEach(herbName => {
            const herb = this.getHerbInfo(herbName);
            maxMultiplier = Math.max(maxMultiplier, herb.fee_multiplier);
            if (herb.special_license_required) {
                specialLicenseRequired = true;
            }
        });

        return {
            fee_multiplier: maxMultiplier,
            special_license_required: specialLicenseRequired,
            total_herbs: herbNames.length
        };
    }

    /**
     * รับรายการสมุนไพรทั้งหมด
     */
    getAllHerbs() {
        return Object.keys(this.herbs);
    }

    /**
     * ตรวจสอบความถูกต้องของชื่อสมุนไพร
     */
    validateHerbs(herbNames) {
        const invalid = herbNames.filter(name => !this.herbs[name]);
        if (invalid.length > 0) {
            throw new Error(`สมุนไพรที่ไม่รองรับ: ${invalid.join(', ')}`);
        }
        return true;
    }

    /**
     * ข้อมูล GACP Requirements สำหรับสมุนไพรที่เลือก
     */
    getGACPRequirements(herbNames) {
        this.validateHerbs(herbNames);
        
        const requirements = {
            security_level: 'ปกติ',
            special_documentation: [],
            storage_requirements: [],
            quality_controls: []
        };

        herbNames.forEach(herbName => {
            const herb = this.herbs[herbName];
            
            // ระดับความปลอดภัยสูงสุด
            if (herb.gacp_requirements.security_level === 'สูง') {
                requirements.security_level = 'สูง';
            } else if (herb.gacp_requirements.security_level === 'ปานกลาง' && 
                      requirements.security_level === 'ปกติ') {
                requirements.security_level = 'ปานกลาง';
            }

            requirements.storage_requirements.push(`${herbName}: ${herb.gacp_requirements.storage_conditions}`);
            requirements.quality_controls.push(`${herbName}: ${herb.gacp_requirements.quality_control}`);
            
            if (herb.special_license_required) {
                requirements.special_documentation.push(`${herbName}: ต้องใบอนุญาตพิเศษ`);
            }
        });

        return requirements;
    }
}

module.exports = ThaiHerbalDatabase;