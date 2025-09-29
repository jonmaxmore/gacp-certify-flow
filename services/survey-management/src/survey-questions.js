/**
 * 📋 Survey Questions Database
 * ฐานข้อมูลคำถามแบบสอบถามแยกตามภูมิภาค
 */

class SurveyQuestions {
    constructor() {
        this.questionSets = {
            // 🏔️ ภาคเหนือ
            north: {
                name: 'แบบสอบถามภาคเหนือ',
                icon: '🏔️',
                context: {
                    provinces: '9 จังหวัด (เชียงใหม่, เชียงราย, ลำพูน, ลำปาง, พะเยา, แพร่, น่าน, แม่ฮ่องสอน, อุตรดิตถ์)',
                    climate: 'อากาศหนาวเย็น มีหมอกหนา อุณหภูมิ 15-32°C เหมาะสำหรับการปลูกกัญชาคุณภาพสูง',
                    mainHerbs: 'กัญชา (หลัก), ขมิ้นชัน, ขิง, กระชายดำ, ไพล, กระท่อม',
                    characteristics: 'เกษตรกรรายย่อย 70%, องค์ความรู้ภูมิปัญญาล้านนา, การปลูกแบบผสมผสาน, ศูนย์กลางการปลูกกัญชาทางการแพทย์'
                },
                sections: [
                    {
                        id: 'general_info',
                        title: 'ส่วนที่ 1: ข้อมูลทั่วไป',
                        questions: [
                            {
                                id: 'participant_type',
                                text: 'ข้อมูลผู้ตอบแบบสอบถาม',
                                type: 'radio',
                                required: true,
                                options: [
                                    'เกษตรกร/ผู้ปลูก',
                                    'ผู้ประกอบการ/โรงงาน',
                                    'ผู้รับซื้อ/พ่อค้าคนกลาง',
                                    'หน่วยงานรัฐ/สหกรณ์',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'location',
                                text: 'พื้นที่ดำเนินการ',
                                type: 'location',
                                required: true,
                                fields: ['province', 'district', 'subdistrict']
                            },
                            {
                                id: 'farm_size',
                                text: 'ขนาดพื้นที่ปลูกสมุนไพร',
                                type: 'radio',
                                required: true,
                                options: [
                                    'น้อยกว่า 1 ไร่',
                                    '1-5 ไร่',
                                    '5-10 ไร่',
                                    '10-20 ไร่',
                                    'มากกว่า 20 ไร่'
                                ]
                            },
                            {
                                id: 'experience_years',
                                text: 'ระยะเวลาในการปลูกสมุนไพร',
                                type: 'radio',
                                required: true,
                                options: [
                                    'น้อยกว่า 1 ปี',
                                    '1-3 ปี',
                                    '3-5 ปี',
                                    '5-10 ปี',
                                    'มากกว่า 10 ปี'
                                ]
                            }
                        ]
                    },
                    {
                        id: 'herbs_cultivation',
                        title: 'ส่วนที่ 2: สมุนไพรที่ปลูก/ใช้งาน',
                        questions: [
                            {
                                id: 'current_herbs',
                                text: 'สมุนไพรที่ปลูกหรือใช้งานในปัจจุบัน (เลือกได้มากกว่า 1 ข้อ)',
                                type: 'checkbox_with_details',
                                required: true,
                                categories: [
                                    {
                                        name: 'สมุนไพรเศรษฐกิจสูง (เรียงตามความสำคัญ)',
                                        options: [
                                            { name: 'กัญชา (Cannabis)', fields: ['quantity', 'price', 'variety', 'medical_use'], priority: 1 },
                                            { name: 'ขมิ้นชัน (Turmeric)', fields: ['quantity', 'price'], priority: 2 },
                                            { name: 'ขิง (Ginger)', fields: ['quantity', 'price'], priority: 3 },
                                            { name: 'กระชายดำ (Black Galingale)', fields: ['quantity', 'price'], priority: 4 },
                                            { name: 'ไพล (Zingiber cassumunar)', fields: ['quantity', 'price'], priority: 5 },
                                            { name: 'กระท่อม (Kratom)', fields: ['quantity', 'price'], priority: 6 }
                                        ]
                                    },
                                    {
                                        name: 'สมุนไพรพื้นเมือง/พื้นบ้าน',
                                        options: [
                                            'โกฐเชียงกง',
                                            'ผักหวาน (Stevia)',
                                            'บัวบก',
                                            'ฟ้าทะลายโจร',
                                            'ว่านหางจระเข้',
                                            'ตะไคร้',
                                            'ใบเตย',
                                            'อื่นๆ'
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'future_herbs',
                                text: 'ความต้องการปลูกสมุนไพรเพิ่มเติม',
                                type: 'text_with_reasons',
                                fields: {
                                    herbs: 'สมุนไพรที่สนใจ (เน้นกัญชาและ 6 ชนิดหลัก)',
                                    reasons: {
                                        type: 'checkbox',
                                        options: ['ราคาดี', 'ตลาดรองรับ', 'ปลูกง่าย', 'เหมาะกับสภาพพื้นที่', 'มีความต้องการทางการแพทย์', 'กฎหมายสนับสนุน', 'อื่นๆ']
                                    }
                                }
                            },
                            {
                                id: 'cannabis_specific',
                                text: 'คำถามเฉพาะกัญชา (ตอบเฉพาะผู้ที่ปลูกหรือสนใจกัญชา)',
                                type: 'conditional_section',
                                condition: 'current_herbs.includes("กัญชา")',
                                questions: [
                                    {
                                        id: 'cannabis_varieties',
                                        text: 'พันธุ์กัญชาที่ปลูกหรือสนใจ',
                                        type: 'checkbox',
                                        options: [
                                            'กัญชาทางการแพทย์ (Medical Cannabis)',
                                            'กัญชาอุตสาหกรรม (Hemp)',
                                            'กัญชา CBD สูง',
                                            'กัญชา THC ต่ำ',
                                            'พันธุ์พื้นเมืองไทย',
                                            'พันธุ์ต่างประเทศ',
                                            'ยังไม่แน่ใจ'
                                        ]
                                    },
                                    {
                                        id: 'cannabis_purpose',
                                        text: 'วัตถุประสงค์การปลูกกัญชา',
                                        type: 'checkbox',
                                        options: [
                                            'เพื่อการแพทย์/รักษาโรค',
                                            'สกัดน้ำมัน CBD',
                                            'ใช้ใบ/ดอก',
                                            'ใช้เมล็ด (Hemp Seed)',
                                            'ใช้เส้นใย (Fiber)',
                                            'วิจัยและพัฒนา',
                                            'ขายให้ผู้ประกอบการ',
                                            'อื่นๆ'
                                        ]
                                    },
                                    {
                                        id: 'cannabis_challenges',
                                        text: 'ปัญหาและอุปสรรคเฉพาะกัญชา',
                                        type: 'rating_scale',
                                        scale: [1, 2, 3, 4, 5],
                                        items: [
                                            'กฎหมายและระเบียบซับซ้อน',
                                            'ใบอนุญาตยุ่งยาก',
                                            'ขาดความรู้เฉพาะทาง',
                                            'ต้นทุนการลงทุนสูง',
                                            'ขาดตลาดรับซื้อที่แน่นอน',
                                            'ความเสี่ยงด้านกฎหมาย',
                                            'การควบคุมคุณภาพ',
                                            'การเก็บรักษาและขนส่ง'
                                        ]
                                    },
                                    {
                                        id: 'cannabis_support_needed',
                                        text: 'ความต้องการสนับสนุนด้านกัญชา',
                                        type: 'checkbox',
                                        options: [
                                            'ความรู้ด้านกฎหมาย',
                                            'เทคนิคการปลูกเฉพาะทาง',
                                            'การขอใบอนุญาต',
                                            'มาตรฐาน GACP สำหรับกัญชา',
                                            'การหาตลาดรับซื้อ',
                                            'เทคโนโลยีการแปรรูป',
                                            'แหล่งเงินทุน',
                                            'การรับรองคุณภาพ'
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'problems_obstacles',
                        title: 'ส่วนที่ 3: ปัญหาและอุปสรรค',
                        questions: [
                            {
                                id: 'cultivation_problems',
                                text: 'ปัญหาในการปลูก/ผลิต (ให้คะแนน 1-5, 5=มากที่สุด)',
                                type: 'rating_scale',
                                required: true,
                                scale: [1, 2, 3, 4, 5],
                                items: [
                                    'ขาดแหล่งพันธุ์คุณภาพ',
                                    'ขาดความรู้ด้านการปลูก',
                                    'โรคและแมลงศัตรูพืช',
                                    'ภัยแล้ง/น้ำท่วม',
                                    'ต้นทุนการผลิตสูง',
                                    'แรงงานขาดแคลน',
                                    'ขาดเครื่องจักรอุปกรณ์'
                                ]
                            },
                            {
                                id: 'market_problems',
                                text: 'ปัญหาด้านการตลาด',
                                type: 'checkbox',
                                options: [
                                    'ราคาไม่แน่นอน',
                                    'ถูกกดราคา',
                                    'ไม่มีตลาดรับซื้อที่แน่นอน',
                                    'ขาดข้อมูลตลาด',
                                    'ไม่สามารถผลิตตามมาตรฐานที่ตลาดต้องการ',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'quality_standards_problems',
                                text: 'ปัญหาด้านมาตรฐานและคุณภาพ',
                                type: 'checkbox',
                                options: [
                                    'ไม่ทราบมาตรฐานที่ต้องใช้',
                                    'ต้นทุนการทำมาตรฐานสูง',
                                    'ขาดห้องปฏิบัติการทดสอบ',
                                    'เอกสารซับซ้อน',
                                    'ไม่มีผู้เชี่ยวชาญให้คำแนะนำ',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            }
                        ]
                    },
                    {
                        id: 'support_needs',
                        title: 'ส่วนที่ 4: ความต้องการสนับสนุน',
                        questions: [
                            {
                                id: 'knowledge_needs',
                                text: 'ความต้องการด้านความรู้ (เลือกได้มากกว่า 1 ข้อ)',
                                type: 'checkbox',
                                options: [
                                    'เทคนิคการปลูกที่ถูกต้อง',
                                    'การจัดการโรคแมลง',
                                    'การเก็บเกี่ยวและหลังการเก็บเกี่ยว',
                                    'มาตรฐาน GACP',
                                    'การแปรรูปเบื้องต้น',
                                    'การทำบัญชีต้นทุน',
                                    'การตลาดออนไลน์',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'learning_channels',
                                text: 'ช่องทางการรับความรู้ที่ต้องการ',
                                type: 'checkbox',
                                options: [
                                    'การอบรมเชิงปฏิบัติการ',
                                    'การศึกษาดูงาน',
                                    'คู่มือ/เอกสาร',
                                    'วิดีโอออนไลน์',
                                    'แอปพลิเคชัน',
                                    'ที่ปรึกษาประจำ',
                                    'กลุ่ม Line/Facebook',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'technology_needs',
                                text: 'ความต้องการด้านเทคโนโลยีและอุปกรณ์',
                                type: 'checkbox',
                                options: [
                                    'เครื่องอบแห้ง',
                                    'ระบบน้ำหยด/สปริงเกอร์',
                                    'โรงเรือนที่มีมาตรฐาน',
                                    'เครื่องสกัด',
                                    'เครื่องบด/หั่น',
                                    'เครื่องทดสอบคุณภาพ',
                                    'ระบบ IoT ติดตามสภาพแปลง',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'financial_needs',
                                text: 'ความต้องการด้านการเงิน',
                                type: 'checkbox',
                                options: [
                                    'เงินทุนหมุนเวียน',
                                    'เงินกู้ดอกเบี้ยต่ำ',
                                    'เงินอุดหนุนซื้ออุปกรณ์',
                                    'ประกันภัยพืชผล',
                                    'กองทุนฉุกเฉิน',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'project_interest',
                                text: 'ความสนใจเข้าร่วมโครงการพัฒนา',
                                type: 'checkbox',
                                options: [
                                    'โครงการเกษตรกรต้นแบบ GACP',
                                    'กลุ่มวิสาหกิจชุมชน',
                                    'สหกรณ์สมุนไพร',
                                    'Contract Farming กับบริษัทเอกชน',
                                    'โครงการส่งออก',
                                    'ไม่สนใจ'
                                ]
                            }
                        ]
                    },
                    {
                        id: 'north_specific',
                        title: 'ส่วนที่ 5: ข้อมูลเพิ่มเติมเฉพาะภาคเหนือ',
                        questions: [
                            {
                                id: 'lanna_wisdom',
                                text: 'การใช้ภูมิปัญญาล้านนา',
                                type: 'radio',
                                options: [
                                    'ใช้วิธีดั้งเดิมล้วนๆ',
                                    'ผสมผสานกับเทคนิคสมัยใหม่',
                                    'ไม่ได้ใช้ภูมิปัญญาท้องถิ่น'
                                ]
                            },
                            {
                                id: 'high_altitude_herbs',
                                text: 'ความสนใจปลูกสมุนไพรที่ระดับสูง (High Altitude Herbs)',
                                type: 'checkbox',
                                options: [
                                    'โสม',
                                    'อบเชย',
                                    'กระเทียม',
                                    'สตรอเบอร์รี่',
                                    'ไม่สนใจ'
                                ]
                            },
                            {
                                id: 'north_specific_problems',
                                text: 'ปัญหาเฉพาะภาคเหนือ',
                                type: 'checkbox',
                                options: [
                                    'หมอกควันไฟป่าส่งผลกระทบ',
                                    'อุณหภูมิเปลี่ยนแปลงรวดเร็ว',
                                    'การท่องเที่ยวแย่งที่ดิน',
                                    'แรงงานไปทำงานเมือง',
                                    'ราคาที่ดินสูง'
                                ]
                            }
                        ]
                    },
                    {
                        id: 'suggestions_contact',
                        title: 'ส่วนที่ 6: ข้อเสนอแนะและความคิดเห็น',
                        questions: [
                            {
                                id: 'government_suggestions',
                                text: 'ข้อเสนอแนะต่อหน่วยงานรัฐ',
                                type: 'textarea',
                                rows: 4
                            },
                            {
                                id: 'business_model',
                                text: 'โมเดลธุรกิจที่ต้องการ',
                                type: 'checkbox',
                                options: [
                                    'ขายวัตถุดิบ (Fresh/Dried)',
                                    'แปรรูปเบื้องต้น (ผง, สารสกัด)',
                                    'ผลิตภัณฑ์สำเร็จรูป',
                                    'การท่องเที่ยวเชิงสุขภาพ (Agro-tourism)',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'contact_info',
                                text: 'ช่องทางการติดต่อ (สำหรับติดตามผล)',
                                type: 'contact_form',
                                fields: {
                                    name: 'ชื่อ-นามสกุล',
                                    phone: 'เบอร์โทร',
                                    line: 'Line ID',
                                    email: 'Email',
                                    facebook: 'Facebook'
                                },
                                required: ['name', 'phone']
                            }
                        ]
                    }
                ]
            },

            // 🌴 ภาคใต้ (ย่อให้เหมาะสม เนื่องจากคล้ายกับภาคเหนือ)
            south: {
                name: 'แบบสอบถามภาคใต้',
                icon: '🌴',
                context: {
                    provinces: '14 จังหวัด',
                    climate: 'ชื้น ฝนตกตลอดปี อุณหภูมิ 24-34°C เหมาะสำหรับกัญชาเขตร้อนชื้น',
                    mainHerbs: 'กัญชา (หลัก), ขมิ้นชัน, ขิง, กระชายดำ, ไพล, กระท่อม',
                    characteristics: 'ผสมผสานวัฒนธรรมมุสลิม, การท่องเที่ยว + สมุนไพร, มีตลาด Halal, การปลูกกัญชาในเขตร้อนชื้น'
                },
                sections: [
                    // ส่วนพื้นฐานเหมือนกัน (1-4)
                    // เพิ่มส่วนพิเศษของภาคใต้
                    {
                        id: 'south_specific',
                        title: 'ส่วนที่ 5: ข้อมูลเพิ่มเติมเฉพาะภาคใต้',
                        questions: [
                            {
                                id: 'south_climate_problems',
                                text: 'ปัญหาเฉพาะภาคใต้',
                                type: 'rating_scale',
                                scale: [1, 2, 3, 4, 5],
                                items: [
                                    'ฝนตกหนัก/น้ำท่วม',
                                    'ความชื้นสูง/เชื้อรา',
                                    'พายุ',
                                    'ดินเป็นกรด',
                                    'แรงงานขาดแคลน (ฤดูท่องเที่ยว)'
                                ]
                            },
                            {
                                id: 'tropical_herbs',
                                text: 'สมุนไพรเขตร้อนชื้น',
                                type: 'checkbox',
                                options: [
                                    'กระชาย', 'ข่า', 'ตะไคร้', 'ใบเตย', 'มะกรูด', 
                                    'พริก', 'สะเดา', 'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'halal_interest',
                                text: 'ความสนใจตลาด Halal',
                                type: 'radio',
                                options: [
                                    'มีผลิตภัณฑ์ Halal แล้ว',
                                    'กำลังพัฒนา',
                                    'สนใจแต่ไม่รู้จะเริ่มต้นอย่างไร',
                                    'ไม่สนใจ'
                                ]
                            },
                            {
                                id: 'tourism_connection',
                                text: 'ความสนใจเชื่อมโยงการท่องเที่ยว',
                                type: 'checkbox',
                                options: [
                                    'Herb Garden & Spa',
                                    'Cooking Class',
                                    'Farm Stay',
                                    'Wellness Retreat',
                                    'ร้านอาหารสุขภาพ',
                                    'ไม่สนใจ'
                                ]
                            }
                        ]
                    }
                ]
            },

            // 🏭 ภาคกลาง
            central: {
                name: 'แบบสอบถามภาคกลาง',
                icon: '🏭',
                context: {
                    provinces: '22 จังหวัด (รวมกรุงเทพฯ และปริมณฑล)',
                    climate: 'ร้อนชื้น ฝนตกสม่ำเสมอ เหมาะสำหรับธุรกิจกัญชาและการแปรรูป',
                    mainHerbs: 'กัญชา (หลัก), ขมิ้นชัน, ขิง, กระชายดำ, ไพล, กระท่อม',
                    characteristics: 'ผู้ประกอบการ SME 60%, โรงงานขนาดกลาง-ใหญ่ 30%, เกษตรกร 10%, เน้นการแปรรูปและส่งออก, ศูนย์กลางธุรกิจกัญชาทางการแพทย์'
                },
                sections: [
                    // ส่วนพื้นฐาน + ส่วนพิเศษของภาคกลาง
                    {
                        id: 'central_business',
                        title: 'ส่วนที่ 5: ข้อมูลเพิ่มเติมเฉพาะภาคกลาง',
                        questions: [
                            {
                                id: 'business_type',
                                text: 'ประเภทธุรกิจ',
                                type: 'radio',
                                options: [
                                    'เกษตรกร/ผู้ปลูก',
                                    'ผู้รับซื้อ/Trader',
                                    'โรงงานแปรรูป',
                                    'ผู้ส่งออก',
                                    'ร้านค้า/Retailer',
                                    'E-commerce',
                                    'Startup',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            },
                            {
                                id: 'production_volume',
                                text: 'ปริมาณการผลิต/รับซื้อต่อปี',
                                type: 'radio',
                                options: [
                                    'น้อยกว่า 1 ตัน',
                                    '1-10 ตัน',
                                    '10-50 ตัน',
                                    '50-100 ตัน',
                                    'มากกว่า 100 ตัน'
                                ]
                            },
                            {
                                id: 'smart_factory_interest',
                                text: 'ความสนใจ Smart Factory',
                                type: 'checkbox',
                                options: [
                                    'Automation',
                                    'IoT Monitoring',
                                    'AI Quality Control',
                                    'ERP System',
                                    'Cold Chain Management',
                                    'ยังไม่พร้อม'
                                ]
                            }
                        ]
                    }
                ]
            },

            // 🌾 ภาคตะวันออกเฉียงเหนือ
            northeast: {
                name: 'แบบสอบถามภาคตะวันออกเฉียงเหนือ',
                icon: '🌾',
                context: {
                    provinces: '20 จังหวัด',
                    climate: 'แห้งแล้ง ฝนน้อย อุณหภูมิสูง 25-40°C เหมาะสำหรับกัญชาทนแล้ง',
                    mainHerbs: 'กัญชา (หลัก), ขมิ้นชัน, ขิง, กระชายดำ, ไพล, กระท่อม',
                    characteristics: 'เกษตรกรรายย่อย 80%, พื้นที่ปลูกเฉลี่ย 3-5 ไร่, ทำเกษตรผสมผสาน, รายได้เสริมจากปศุสัตว์, การปลูกกัญชาทนแล้ง'
                },
                sections: [
                    // ส่วนพื้นฐาน + ส่วนพิเศษของภาคตะวันออกเฉียงเหนือ
                    {
                        id: 'northeast_specific',
                        title: 'ส่วนที่ 5: ข้อมูลเพิ่มเติมเฉพาะภาคตะวันออกเฉียงเหนือ',
                        questions: [
                            {
                                id: 'northeast_problems',
                                text: 'ปัญหาเฉพาะภาคตะวันออกเฉียงเหนือ',
                                type: 'rating_scale',
                                scale: [1, 2, 3, 4, 5],
                                items: [
                                    'ฝนทิ้งช่วง/ภัยแล้งรุนแรง',
                                    'ดินเค็ม',
                                    'ดินขาดความอุดมสมบูรณ์',
                                    'ขาดแหล่งน้ำ',
                                    'ต้นทุนปรับปรุงดินสูง'
                                ]
                            },
                            {
                                id: 'water_management',
                                text: 'การจัดการน้ำ - แหล่งน้ำที่ใช้',
                                type: 'checkbox',
                                options: [
                                    'น้ำฝน',
                                    'บ่อน้ำตื้น',
                                    'บ่อน้ำบาดาล',
                                    'ฝายน้ำล้น',
                                    'โครงการชลประทาน',
                                    'ไม่มีแหล่งน้ำเพียงพอ'
                                ]
                            },
                            {
                                id: 'drought_resistant_herbs',
                                text: 'ความสนใจสมุนไพรที่ทนแล้ง (Drought-Resistant Herbs)',
                                type: 'checkbox',
                                options: [
                                    'ว่านหางจระเข้',
                                    'กระบองเพชร',
                                    'ตะไคร้',
                                    'มะรุม',
                                    'บอระเพ็ด',
                                    'พริกขี้หนู',
                                    'อื่นๆ'
                                ],
                                hasOtherText: true
                            }
                        ]
                    }
                ]
            }
        };
    }

    /**
     * ดึงคำถามตามภูมิภาค
     */
    getQuestionsByRegion(regionCode) {
        return this.questionSets[regionCode] || null;
    }

    /**
     * ดึงคำถามแบบเฉพาะเจาะจง
     */
    getQuestionById(regionCode, sectionId, questionId) {
        const region = this.questionSets[regionCode];
        if (!region) return null;

        const section = region.sections.find(s => s.id === sectionId);
        if (!section) return null;

        return section.questions.find(q => q.id === questionId) || null;
    }

    /**
     * ตรวจสอบคำตอบที่จำเป็น
     */
    validateResponse(regionCode, sectionId, questionId, response) {
        const question = this.getQuestionById(regionCode, sectionId, questionId);
        if (!question) {
            throw new Error('Question not found');
        }

        if (question.required && (!response || response === '')) {
            throw new Error(`Question "${question.text}" is required`);
        }

        // ตรวจสอบรูปแบบตามประเภทคำถาม
        switch (question.type) {
            case 'radio':
                if (question.required && !question.options.includes(response) && response !== 'อื่นๆ') {
                    throw new Error('Invalid radio option');
                }
                break;
            case 'checkbox':
                if (question.required && (!Array.isArray(response) || response.length === 0)) {
                    throw new Error('At least one checkbox option is required');
                }
                break;
            case 'rating_scale':
                if (question.required && typeof response !== 'object') {
                    throw new Error('Rating scale response must be an object');
                }
                break;
        }

        return true;
    }

    /**
     * คำนวณความสมบูรณ์ของการตอบ
     */
    calculateCompletionPercentage(regionCode, responses) {
        const region = this.questionSets[regionCode];
        if (!region) return 0;

        let totalQuestions = 0;
        let answeredQuestions = 0;

        region.sections.forEach(section => {
            section.questions.forEach(question => {
                totalQuestions++;
                if (responses[question.id]) {
                    answeredQuestions++;
                }
            });
        });

        return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    }
}

module.exports = SurveyQuestions;