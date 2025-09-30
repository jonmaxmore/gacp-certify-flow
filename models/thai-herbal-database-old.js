/**
 * Thai Herbal Database - ฐานข้อมูลสมุนไพรไทย
 * อัพเดทด้วยข้อมูลทางวิชาการจากมหาวิทยาลัยอุบลราชธานี
 * 6 ชนิดหลัก: กัญชา ขมิ้นชัน ขิง กระชายดำ ไพล และกระท่อม
 * 
 * Reference: 
 * - Pharmaceutical Garden, Ubon Ratchathani University
 * - Thai Crude Drug Database
 * - Thai Herbarium Database  
 * - Thai Traditional Remedy Database
 */

class ThaiHerbalDatabase {
    constructor() {
        this.herbs = this.initializeHerbDatabase();
    }

    initializeHerbDatabase() {
        return {
            'กัญชา': {
         /**
     * ค้นหาสมุนไพรตามสรรพคุณ
     */
    searchByTherapeuticUse(condition) {
        const results = [];
        Object.entries(this.herbs).forEach(([name, herb]) => {
            if (herb.therapeutic_uses) {
                const allUses = [
                    ...(herb.therapeutic_uses.traditional || []),
                    ...(herb.therapeutic_uses.modern || [])
                ];
                if (allUses.some(use => use.toLowerCase().includes(condition.toLowerCase()))) {
                    results.push({
                        name,
                        ...herb,
                        matching_uses: allUses.filter(use => 
                            use.toLowerCase().includes(condition.toLowerCase())
                        )
                    });
                }
            }
        });
        return results;
    }

    /**
     * ดึงข้อมูลสารสำคัญ
     */
    getActiveCompounds(herbName) {
        const herb = this.getHerbInfo(herbName);
        return {
            herb_name: herbName,
            scientific_name: herb.scientific_name,
            active_compounds: herb.active_compounds || [],
            active_compounds_detail: herb.active_compounds_detail || {}
        };
    },

    /**
     * คำนวณปริมาณที่แนะนำตามน้ำหนักตัว
     */
    calculateDosageByWeight(herbName, weightKg, form = 'dried') {
        const herb = this.getHerbInfo(herbName);
        if (!herb.dosage) {
            throw new Error(`ไม่มีข้อมูลปริมาณการใช้สำหรับ ${herbName}`);
        }

        const baseWeight = 60; // น้ำหนักมาตรฐาน 60 กก.
        const ratio = weightKg / baseWeight;
        
        // ปรับปริมาณตามน้ำหนักตัว (ไม่เกิน 1.5 เท่า)
        const adjustedRatio = Math.min(ratio, 1.5);
        
        const dosageInfo = herb.dosage[form];
        if (!dosageInfo) {
            throw new Error(`ไม่มีข้อมูลปริมาณสำหรับรูปแบบ ${form}`);
        }

        // แปลงข้อมูลปริมาณ (สมมติว่าเป็นรูปแบบ "1-4 กรัม/วัน")
        const dosageMatch = dosageInfo.match(/([\d.]+)(?:-([\d.]+))?\s*([ก-๙a-zA-Z]+)/);
        if (dosageMatch) {
            const minDose = parseFloat(dosageMatch[1]);
            const maxDose = dosageMatch[2] ? parseFloat(dosageMatch[2]) : minDose;
            const unit = dosageMatch[3];

            return {
                min_dose: (minDose * adjustedRatio).toFixed(2),
                max_dose: (maxDose * adjustedRatio).toFixed(2),
                unit: unit,
                weight_adjusted: true,
                original_dosage: dosageInfo
            };
        }

        return { original_dosage: dosageInfo };
    },

    /**
     * ตรวจสอบข้อห้ามใช้
     */
    checkContraindications(herbName, conditions = []) {
        const herb = this.getHerbInfo(herbName);
        const contraindications = herb.contraindications || [];
        
        const warnings = [];
        conditions.forEach(condition => {
            contraindications.forEach(contraindication => {
                if (contraindication.toLowerCase().includes(condition.toLowerCase())) {
                    warnings.push({
                        condition,
                        warning: contraindication,
                        severity: 'high'
                    });
                }
            });
        });

        return {
            safe: warnings.length === 0,
            warnings,
            all_contraindications: contraindications
        };
    },

    /**
     * เปรียบเทียบสมุนไพร
     */
    compareHerbs(herbNames) {
        if (herbNames.length < 2) {
            throw new Error('ต้องมีสมุนไพรอย่างน้อย 2 ชนิดในการเปรียบเทียบ');
        }

        const comparison = {
            herbs: {},
            similarities: [],
            differences: []
        };

        herbNames.forEach(name => {
            comparison.herbs[name] = this.getHerbInfo(name);
        });

        // หาความคล้ายคลึงในการใช้งาน
        const firstHerb = comparison.herbs[herbNames[0]];
        if (firstHerb.therapeutic_uses) {
            const firstUses = [
                ...(firstHerb.therapeutic_uses.traditional || []),
                ...(firstHerb.therapeutic_uses.modern || [])
            ];

            herbNames.slice(1).forEach(name => {
                const herb = comparison.herbs[name];
                if (herb.therapeutic_uses) {
                    const herbUses = [
                        ...(herb.therapeutic_uses.traditional || []),
                        ...(herb.therapeutic_uses.modern || [])
                    ];
                    
                    const commonUses = firstUses.filter(use => 
                        herbUses.some(herbUse => 
                            herbUse.toLowerCase().includes(use.toLowerCase()) ||
                            use.toLowerCase().includes(herbUse.toLowerCase())
                        )
                    );

                    if (commonUses.length > 0) {
                        comparison.similarities.push({
                            herbs: [herbNames[0], name],
                            common_uses: commonUses
                        });
                    }
                }
            });
        }

        return comparison;
    },

    /**
     * สร้างแผนการปลูกตามฤดูกาล
     */
    generateCultivationPlan(region = 'central') {
        const plan = {
            region,
            monthly_schedule: {},
            recommendations: []
        };

        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];

        months.forEach(month => {
            plan.monthly_schedule[month] = {
                planting: [],
                harvesting: [],
                maintenance: []
            };
        });

        Object.entries(this.herbs).forEach(([name, herb]) => {
            if (herb.cultivation && herb.cultivation.harvest_season) {
                const harvestInfo = herb.cultivation.harvest_season;
                
                // วิเคราะห์ฤดูเก็บเกี่ยว
                if (harvestInfo.includes('มกราคม')) {
                    plan.monthly_schedule['มกราคม'].harvesting.push(name);
                }
                if (harvestInfo.includes('พฤศจิกายน')) {
                    plan.monthly_schedule['พฤศจิกายน'].harvesting.push(name);
                }
                if (harvestInfo.includes('มีนาคม')) {
                    plan.monthly_schedule['มีนาคม'].harvesting.push(name);
                }

                // คำนวณเวลาปลูก (ย้อนหลังจากเวลาเก็บเกี่ยว)
                const growingPeriod = herb.cultivation.growing_period;
                if (growingPeriod && growingPeriod.includes('8-10 เดือน')) {
                    plan.monthly_schedule['เมษายน'].planting.push(name);
                }
            }
        });

        return plan;
    },

    /**
     * สร้าง GACP Requirements สำหรับสมุนไพรที่เลือก
     */
                scientific_name: 'Cannabis sativa L.',
                english_name: 'Cannabis, Marijuana, Hemp',
                family: 'Cannabaceae',
                category: 'สมุนไพรควบคุมพิเศษ',
                traditional_names: ['กัญชง', 'กัญชาใส', 'กัญชาดง'],
                parts_used: ['ใบ', 'ดอก', 'เมล็ด', 'เส้นใย'],
                active_compounds: ['THC (Tetrahydrocannabinol)', 'CBD (Cannabidiol)', 'CBG (Cannabigerol)', 'Terpenes'],
                therapeutic_uses: {
                    traditional: [
                        'แก้ปวดหัว',
                        'ช่วยให้นอนหลับ', 
                        'บรรเทาอาการคลื่นไส้',
                        'กระตุ้นการทำงานของระบบประสาท'
                    ],
                    modern: [
                        'ลดอาการปวดเรื้อรัง',
                        'รักษาโรคลมชัก',
                        'บรรเทาอาการซึมเศร้า',
                        'ต้านการอักเสบ',
                        'ต้านมะเร็ง (การศึกษาเบื้องต้น)'
                    ]
                },
                cultivation_zones: {
                    north: 'เหมาะสำหรับสายพันธุ์คุณภาพสูง ด้วยอากาศเย็น',
                    central: 'ศูนย์กลางการแปรรูปและผลิตภัณฑ์',
                    northeast: 'เหมาะสำหรับสายพันธุ์ทนแล้ง',
                    south: 'การปลูกในสภาพความชื้นสูง'
                },
                varieties: [
                    {
                        name: 'กัญชาทางการแพทย์',
                        thc_content: '< 1%',
                        cbd_content: '15-25%',
                        use: 'รักษาโรค'
                    },
                    {
                        name: 'กัญชาอุตสาหกรรม (Hemp)',
                        thc_content: '< 0.3%',
                        cbd_content: '3-7%',
                        use: 'เส้นใย, เมล็ด, น้ำมัน'
                    }
                ],
                contraindications: [
                    'ห้ามใช้ในหญิงตั้งครรภ์และให้นมบุตร',
                    'ผู้ที่มีประวัติโรคจิตเวช',
                    'เด็กและวัยรุ่นอายุต่ำกว่า 18 ปี',
                    'ผู้ที่แพ้สารกลุ่ม Cannabinoid'
                ],
                side_effects: ['ง่วงซึม', 'ปากแห้ง', 'ตาแดง', 'หิวมาก'],
                special_license_required: true,
                gacp_requirements: {
                    security_level: 'สูงสุด',
                    storage_conditions: 'ห้องล็อคพิเศษ อุณหภูมิ 15-21°C ความชื้น 55-65%',
                    quality_control: 'ตรวจสอบ THC/CBD ด้วย HPLC, ตรวจสารปนเปื้อน',
                    documentation: 'บันทึกรายละเอียดทุกขั้นตอน ตั้งแต่เพาะปลูกถึงจำหน่าย',
                    staff_training: 'อบรมเฉพาะทางด้านกัญชาทางการแพทย์'
                },
                cultivation: {
                    growing_period: '3-4 เดือน (Indoor), 6-7 เดือน (Outdoor)',
                    harvest_season: 'ตลอดปี (ภายใต้การควบคุม)',
                    soil_requirement: 'ดินร่วนปนทราย pH 6.0-7.5 ระบายน้ำดี',
                    water_requirement: 'ปานกลาง 2-3 ครั้ง/สัปดาห์',
                    light_requirement: '12/12 ชั่วโมง แสง/มืด สำหรับการออกดอก',
                    temperature: '20-28°C',
                    humidity: '40-70%'
                },
                processing: {
                    drying: 'อบแห้งที่ 40-50°C เป็นเวลา 3-5 วัน',
                    extraction: 'สกัดด้วย CO2, Ethanol หรือ Cold extraction',
                    quality_standards: 'มาตรฐาน WHO GACP สำหรับกัญชาทางการแพทย์'
                },
                market_value: {
                    fresh_price: '500-2000 บาท/กิโลกรัม',
                    dried_price: '2000-8000 บาท/กิโลกรัม', 
                    extract_price: '15000-50000 บาท/กิโลกรัม',
                    factors: ['ปริมาณ CBD/THC', 'คุณภาพ', 'การรับรอง', 'ตลาด']
                },
                regulation_status: 'ควบคุมตาม พ.ร.บ.ยาเสพติด พ.ศ. 2522 และกฎกระทรวงที่เกี่ยวข้อง',
                licenses_required: [
                    'ใบอนุญาตปลูกกัญชา',
                    'ใบอนุญาตครอบครองกัญชา', 
                    'ใบอนุญาตขนส่งกัญชา',
                    'ใบอนุญาตแปรรูปกัญชา'
                ],
                fee_multiplier: 2.0
            },
            'ขมิ้นชัน': {
                id: 'turmeric',
                scientific_name: 'Curcuma longa L.',
                english_name: 'Turmeric, Common turmeric',
                family: 'Zingiberaceae',
                category: 'สมุนไพรอาหาร-ยา',
                traditional_names: ['ขมิ้น', 'ขมิ้นเหลือง', 'ขมิ้นอ่อน', 'ขมิ้นแกง'],
                parts_used: ['เหง้า (สด)', 'เหง้า (แห้ง)', 'ผง'],
                active_compounds: ['Curcumin (3-5%)', 'Demethoxycurcumin', 'Bisdemethoxycurcumin', 'Essential oils'],
                therapeutic_uses: {
                    traditional: [
                        'แก้อักเสบ',
                        'รักษาแผลในกระเพาะ',
                        'บำรุงธาตุ',
                        'แก้ปวดท้อง',
                        'ขับเลือด'
                    ],
                    modern: [
                        'ต้านอักเสบ (Anti-inflammatory)',
                        'ต้านอนุมูลอิสระ (Antioxidant)',
                        'ป้องกันมะเร็ง',
                        'ลดคอเลสเตอรอล',
                        'บำรุงตับ',
                        'ต้านเชื้อแบคทีเรีย'
                    ]
                },
                cultivation_zones: {
                    north: 'ปลูกได้ดีในพื้นที่ที่มีน้ำเพียงพอ',
                    central: 'เหมาะสำหรับการผลิตเชิงพาณิชย์',
                    northeast: 'ต้องมีการให้น้ำเสริม',
                    south: 'ปลูกได้ตลอดปี เนื่องจากฝนตกสม่ำเสมอ'
                },
                nutritional_value: {
                    'โปรตีน': '7.83 g/100g',
                    'คาร์โบไฮเดรต': '64.93 g/100g',
                    'ไขมัน': '9.88 g/100g',
                    'เส้นใย': '21.1 g/100g',
                    'วิตามิน C': '25.9 mg/100g',
                    'เหล็ก': '41.42 mg/100g'
                },
                processing_methods: {
                    'สด': 'ใช้ทันทีหลังเก็บเกี่ยว',
                    'แห้ง': 'อบแห้งที่ 50-60°C เป็นเวลา 24-48 ชั่วโมง',
                    'ผง': 'บดเหง้าแห้งจนละเอียด ร่อนผ่านตะแกรง 80 mesh',
                    'สารสกัด': 'สกัดด้วย Ethanol 70% หรือน้ำ'
                },
                quality_indicators: {
                    'Curcumin_content': 'ไม่น้อยกว่า 3%',
                    'Moisture': 'ไม่เกิน 12%',
                    'Total_ash': 'ไม่เกิน 9%',
                    'Acid_insoluble_ash': 'ไม่เกิน 3%'
                },
                contraindications: [
                    'ผู้ที่มีนิ่วในถุงน้ำดี',
                    'ผู้ที่กำลังรับประทานยาต้านการแข็งตัวของเลือด',
                    'หญิงตั้งครรภ์ (ปริมาณมาก)',
                    'ผู้ที่มีแผลในกระเพาะรุนแรง'
                ],
                dosage: {
                    'เหง้าสด': '10-15 กรัม/วัน',
                    'ผงแห้ง': '1-3 กรัม/วัน',
                    'สารสกัด': 'ตามคำแนะนำของผู้เชี่ยวชาญ'
                },
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'เก็บในที่แห้ง เย็น หลีกเลี่ยงแสงแดดโดยตรง อุณหภูมิ 25-30°C',
                    quality_control: 'ตรวจสอบปริมาณ Curcumin, ความชื้น, เถ้า, สารปนเปื้อน',
                    documentation: 'บันทึกการเก็บเกี่ยว วันที่ประมวลผล เงื่อนไขการเก็บรักษา'
                },
                cultivation: {
                    growing_period: '8-10 เดือน',
                    harvest_season: 'มกราคม - มีนาคม (เหง้าแก่)',
                    soil_requirement: 'ดินร่วนปนทราย มีการระบายน้ำดี pH 6.0-7.0',
                    water_requirement: 'สูง ต้องการน้ำ 1000-1500 มม./ปี',
                    fertilizer: 'ปุ่ยคอก 2-3 ตัน/ไร่ ปุ่ยเคมี 15-15-15',
                    plant_spacing: '30x20 ซม.'
                },
                market_value: {
                    fresh_price: '80-120 บาท/กิโลกรัม',
                    dried_price: '200-350 บาท/กิโลกรัม',
                    powder_price: '300-500 บาท/กิโลกรัม',
                    extract_price: '2000-5000 บาท/กิโลกรัม'
                },
                regulation_status: 'ปกติ - ไม่ต้องใบอนุญาตพิเศษ',
                fee_multiplier: 1.0
            },
            'ขิง': {
                id: 'ginger',
                scientific_name: 'Zingiber officinale Roscoe',
                english_name: 'Ginger',
                family: 'Zingiberaceae',
                category: 'สมุนไพรอาหาร-ยา',
                traditional_names: ['ขิงแก่', 'ขิงอ่อน', 'ขิงฝอย', 'ขิงแห้ง'],
                parts_used: ['เหง้า (สด)', 'เหง้า (แห้ง)', 'น้ำมันหอมระเหย'],
                active_compounds: ['Gingerol (5-10%)', 'Shogaol', 'Zingiberene', 'Paradol', 'Zingerone'],
                therapeutic_uses: {
                    traditional: [
                        'แก้คลื่นไส้อาเจียน',
                        'ขับลม ขับเสมหะ',
                        'แก้ท้องเสีย',
                        'บรรเทาอาการหวัด',
                        'อุ่นท้อง'
                    ],
                    modern: [
                        'ลดอาการคลื่นไส้ (Motion sickness)',
                        'ต้านการอักเสบ',
                        'ลดอาการปวดข้อ',
                        'ปรับปรุงระบบย่อยอาหาร',
                        'ต้านอนุมูลอิสระ',
                        'ลดน้ำตาลในเลือด'
                    ]
                },
                cultivation_zones: {
                    north: 'ปลูกได้ดีในพื้นที่ภูเขา ให้ผลผลิตคุณภาพสูง',
                    central: 'เหมาะสำหรับการผลิตเชิงพาณิชย์ ใกล้ตลาด',
                    northeast: 'ต้องจัดการน้ำให้เพียงพอ',
                    south: 'ปลูกได้ตลอดปี ผลผลิตสม่ำเสมอ'
                },
                varieties: [
                    {
                        name: 'ขิงเล็ก',
                        characteristics: 'เหง้าเล็ก รสจัด เหมาะทำยา',
                        gingerol_content: '8-12%'
                    },
                    {
                        name: 'ขิงใหญ่',
                        characteristics: 'เหง้าใหญ่ เนื้อนุ่ม เหมาะทำอาหาร',
                        gingerol_content: '4-8%'
                    },
                    {
                        name: 'ขิงขาว',
                        characteristics: 'เปลือกบาง เนื้อขาว รสอ่อน',
                        gingerol_content: '3-6%'
                    }
                ],
                nutritional_value: {
                    'พลังงาน': '80 kcal/100g',
                    'คาร์โบไฮเดรต': '17.77 g/100g',
                    'ไขมัน': '0.75 g/100g',
                    'โปรตีน': '1.82 g/100g',
                    'วิตามิน C': '5 mg/100g',
                    'แมกนีเซียม': '43 mg/100g'
                },
                processing_methods: {
                    'สด': 'ล้างสะอาด ปอกเปลือก ใช้ทันที',
                    'แห้ง': 'หั่นบาง อบแห้งที่ 50-60°C เป็นเวลา 6-8 ชั่วโมง',
                    'ผง': 'บดเหง้าแห้งจนละเอียด',
                    'น้ำมัน': 'กลั่นด้วยไอน้ำ (Steam distillation)'
                },
                quality_standards: {
                    'Gingerol_content': 'ไม่น้อยกว่า 0.8% (แห้ง)',
                    'Moisture': 'ไม่เกิน 10%',
                    'Total_ash': 'ไม่เกิน 6%',
                    'Foreign_matter': 'ไม่เกิน 1%'
                },
                contraindications: [
                    'ผู้ที่มีแผลในกระเพาะอาหาร',
                    'ผู้ที่รับประทานยาต้านการแข็งตัวของเลือด',
                    'ผู้ที่มีนิ่วในถุงน้ำดี',
                    'หญิงตั้งครรภ์ (ควรจำกัดปริมาณ)'
                ],
                dosage: {
                    'สด': '1-4 กรัม/วัน',
                    'ผงแห้ง': '0.25-1 กรัม/วัน',
                    'สารสกัด': '0.1-0.3 กรัม/วัน'
                },
                side_effects: ['แสบกระเพาะ', 'ท้องร่วง', 'คลื่นไส้ (ถ้าใช้มากเกินไป)'],
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'เก็บในที่แห้ง เย็น อุณหภูมิ 10-15°C สำหรับขิงสด, 25-30°C สำหรับขิงแห้ง',
                    quality_control: 'ตรวจสอบสาร Gingerol, ความชื้น, เถ้า, โลหะหนัก, สารปนเปื้อน',
                    documentation: 'บันทึกแหล่งที่มา วันเก็บเกี่ยว กรรมวิธีการแปรรูป'
                },
                cultivation: {
                    growing_period: '8-12 เดือน',
                    harvest_season: 'พฤศจิกายน - มกราคม (ขิงแก่), มิถุนายน - สิงหาคม (ขิงอ่อน)',
                    soil_requirement: 'ดินร่วนปนทราย ระบายน้ำดี pH 6.0-6.8',
                    water_requirement: 'ปานกลาง 800-1200 มม./ปี',
                    fertilizer: 'ปุ่ยคอก 1-2 ตัน/ไร่ ปุ่ยเคมี 16-16-8',
                    plant_spacing: '25x30 ซม.'
                },
                market_value: {
                    fresh_young_price: '120-180 บาท/กิโลกรัม',
                    fresh_old_price: '60-100 บาท/กิโลกรัม',
                    dried_price: '180-280 บาท/กิโลกรัม',
                    powder_price: '250-400 บาท/กิโลกรัม',
                    oil_price: '8000-15000 บาท/กิโลกรัม'
                },
                regulation_status: 'ปกติ - ไม่ต้องใบอนุญาตพิเศษ',
                fee_multiplier: 1.0
            },
            'กระชายดำ': {
                id: 'black_galingale',
                scientific_name: 'Kaempferia parviflora Wall. ex Baker',
                english_name: 'Black Galingale, Thai Black Ginger, Krachai Dam',
                family: 'Zingiberaceae',
                category: 'สมุนไพรเวชภัณฑ์',
                traditional_names: ['กระชายดำ', 'ขิงดำ', 'กระชายไทย', 'โกฐหิมพานต์'],
                parts_used: ['เหง้า'],
                active_compounds: ['Methoxyflavones', '5,7-dimethoxyflavone', '3,5,7,3\',4\'-pentamethoxyflavone', 'Polymethoxyflavones'],
                therapeutic_uses: {
                    traditional: [
                        'บำรุงกำลัง',
                        'เสริมสมรรถภาพทางเพศ',
                        'แก้อ่อนเพลีย',
                        'บำรุงหัวใจ',
                        'แก้ปวดเมื่อย'
                    ],
                    modern: [
                        'ปรับปรุงสมรรถภาพทางเพศชาย',
                        'ต้านอนุมูลอิสระ',
                        'ต้านการอักเสบ',
                        'เพิ่มการไหลเวียนโลหิต',
                        'ต้านโรคเบาหวาน',
                        'ปรับปรุงการทำงานของกล้ามเนื้อ'
                    ]
                },
                cultivation_zones: {
                    north: 'ปลูกได้ในพื้นที่ป่าไผ่ ใต้ร่มไม้',
                    central: 'เหมาะสำหรับการผลิตเชิงพาณิชย์ในโรงเรือน',
                    northeast: 'ปลูกได้ดี แต่ต้องดูแลความชื้น',
                    south: 'เติบโตได้ดีในสภาพร่มรำไร'
                },
                research_findings: [
                    'เพิ่มระดับ Testosterone ในผู้ชาย',
                    'ปรับปรุงสมรรถภาพการออกกำลังกาย',
                    'ลดความดันโลหิต',
                    'ป้องกันโรคหัวใจและหลอดเลือด'
                ],
                active_compounds_detail: {
                    'Total_methoxyflavones': '0.8-2.5%',
                    '5,7-dimethoxyflavone': '0.3-0.8%',
                    'Pentamethoxyflavone': '0.2-0.5%'
                },
                processing_methods: {
                    'สด': 'ทำความสะอาด ปอกเปลือก',
                    'แห้ง': 'อบแห้งที่ 50°C เป็นเวลา 12-16 ชั่วโมง',
                    'สารสกัด': 'สกัดด้วย Ethanol 70% หรือน้ำ',
                    'แคปซูล': 'บดผงใส่แคปซูลเจลาติน'
                },
                quality_standards: {
                    'Methoxyflavones': 'ไม่น้อยกว่า 0.8%',
                    'Moisture': 'ไม่เกิน 10%',
                    'Total_ash': 'ไม่เกิน 8%',
                    'Heavy_metals': 'ตามมาตรฐาน WHO'
                },
                contraindications: [
                    'ผู้ที่มีความดันโลหิตสูงรุนแรง',
                    'ผู้ที่รับประทานยาหัวใจ',
                    'หญิงตั้งครรภ์และให้นมบุตร',
                    'เด็กอายุต่ำกว่า 18 ปี'
                ],
                dosage: {
                    'ผงแห้ง': '250-500 มก./วัน',
                    'สารสกัด': '100-300 มก./วัน',
                    'ชาสมุนไพร': '1-2 กรัม/ครั้ง'
                },
                side_effects: ['ปวดหัว', 'นอนไม่หลับ', 'หัวใจเต้นเร็ว (ถ้าใช้มากเกินไป)'],
                special_license_required: false,
                gacp_requirements: {
                    security_level: 'ปกติ',
                    storage_conditions: 'เก็บในที่แห้ง เย็น หลีกเลี่ยงแสงแดดโดยตรง อุณหภูมิ 25-30°C',
                    quality_control: 'ตรวจสอบ Methoxyflavones, ความชื้น, เถ้า, โลหะหนัก',
                    documentation: 'บันทึกแหล่งกำเนิด วันเก็บเกี่ยว การประมวลผล'
                },
                cultivation: {
                    growing_period: '12-18 เดือน',
                    harvest_season: 'ตุลาคม - ธันวาคม',
                    soil_requirement: 'ดินร่วนปนทราย มีการระบายน้ำดี pH 5.5-6.5',
                    water_requirement: 'ปานกลาง ไม่ชอบน้ำขัง',
                    shade_requirement: '50-70% ร่มเงา',
                    fertilizer: 'ปุ่ยอินทรีย์ 1-2 ตัน/ไร่'
                },
                market_value: {
                    fresh_price: '800-1500 บาท/กิโลกรัม',
                    dried_price: '3000-6000 บาท/กิโลกรัม',
                    extract_price: '15000-30000 บาท/กิโลกรัม',
                    capsule_price: '2-5 บาท/แคปซูล'
                },
                regulation_status: 'ปกติ - อยู่ในบัญชียาแผนโบราณ',
                fee_multiplier: 1.2
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
     * ค้นหาข้อมูลสมุนไพร (รองรับชื่อเรียกต่างๆ)
     */
    getHerbInfo(herbName) {
        // ค้นหาโดยตรง
        if (this.herbs[herbName]) {
            return this.herbs[herbName];
        }
        
        // ค้นหาจากชื่อเรียกทั่วไป
        const commonNames = {
            'ขมิ้น': 'ขมิ้นชัน',
            'ขมิ้นเหลือง': 'ขมิ้นชัน',
            'ขิงแก่': 'ขิง',
            'ขิงอ่อน': 'ขิง',
            'พลาย': 'ไพล',
            'กระท่อมใส': 'กระท่อม',
            'กระท่อมแดง': 'กระท่อม',
            'มิตรกันใน': 'กระท่อม',
            'กัญชง': 'กัญชา',
            'มารีฮัวนา': 'กัญชา',
            'hemp': 'กัญชา'
        };
        
        const standardName = commonNames[herbName];
        if (standardName && this.herbs[standardName]) {
            return this.herbs[standardName];
        }
        
        throw new Error(`ไม่พบข้อมูลสมุนไพร "${herbName}" ในฐานข้อมูล`);
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
     * ตรวจสอบความถูกต้องของชื่อสมุนไพร (รองรับชื่อเรียกต่างๆ)
     */
    validateHerbs(herbNames) {
        const invalid = [];
        for (const name of herbNames) {
            try {
                this.getHerbInfo(name); // ใช้ getHerbInfo ที่รองรับชื่อเรียกต่างๆ
            } catch (error) {
                invalid.push(name);
            }
        }
        
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
            const herb = this.getHerbInfo(herbName); // ใช้ getHerbInfo แทน direct access
            
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