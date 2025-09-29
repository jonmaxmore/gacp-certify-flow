/**
 * 🌿 GACP Survey System Demo
 * การสาธิตระบบแบบสอบถามเน้นกัญชาเป็นหลัก
 * พร้อมสมุนไพร 6 ชนิดหลัก: กัญชา > ขมิ้นชัน > ขิง > กระชายดำ > ไพล > กระท่อม
 */

const SurveyManager = require('../src/survey-manager');
const SurveyQuestions = require('../src/survey-questions');

class CannabisFirstSurveyDemo {
    constructor() {
        this.surveyManager = new SurveyManager();
        this.surveyQuestions = new SurveyQuestions();
        console.log('🌿 เริ่มต้นการสาธิต: ระบบแบบสอบถามโดยเน้นกัญชาเป็นหลัก');
    }

    async runDemo() {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('🌿 GACP Survey System - Cannabis First Demo');
            console.log('='.repeat(60));

            // 1. แสดงข้อมูลภูมิภาคที่อัพเดทใหม่
            await this.showUpdatedRegions();

            // 2. สาธิตการเริ่มแบบสอบถามแบบ Guest
            await this.demoGuestSurvey();

            // 3. สาธิตการเริ่มแบบสอบถามแบบ Logged in User
            await this.demoLoggedInSurvey();

            // 4. สาธิตคำถามเฉพาะกัญชา
            await this.demoCannabisSpecificQuestions();

            // 5. แสดงสถิติและผลการวิเคราะห์
            await this.showSurveyAnalytics();

            console.log('\n🎉 การสาธิตเสร็จสิ้น! ระบบพร้อมใช้งานแล้ว');

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการสาธิต:', error);
        }
    }

    async showUpdatedRegions() {
        console.log('\n🗺️ ข้อมูลภูมิภาคที่อัพเดทใหม่ (เน้นกัญชา):');
        console.log('-'.repeat(50));

        Object.entries(this.surveyManager.regions).forEach(([code, region]) => {
            console.log(`\n${region.icon} ${region.name}:`);
            console.log(`   📍 ${region.provinces.length} จังหวัด`);
            console.log(`   🌡️ ${region.climate}`);
            console.log(`   🌿 สมุนไพรหลัก: ${region.mainHerbs.join(', ')}`);
            console.log(`   ✨ ลักษณะเด่น:`);
            region.characteristics.forEach(char => {
                console.log(`      • ${char}`);
            });
        });
    }

    async demoGuestSurvey() {
        console.log('\n👤 สาธิต: การทำแบบสอบถามแบบ Guest');
        console.log('-'.repeat(50));

        // เริ่มแบบสอบถาม (Guest)
        const surveyStart = await this.surveyManager.initiateSurvey(null);
        console.log(`✅ เริ่มแบบสอบถาม: ${surveyStart.message}`);
        console.log(`📋 Session ID: ${surveyStart.sessionId}`);
        console.log(`🔄 ขั้นตอนถัดไป: ${surveyStart.nextStep}`);

        // กรอกข้อมูลส่วนตัว (Guest)
        const guestInfo = {
            name: 'นายสมชาย เกษตรกร',
            phone: '081-234-5678',
            province: 'เชียงใหม่',
            district: 'ดอยสะเก็ด',
            farmType: 'farmer',
            farmSize: '5-10',
            email: 'somchai.farmer@example.com',
            lineId: 'somchai_cannabis'
        };

        const guestInfoResult = await this.surveyManager.submitGuestInfo(surveyStart.sessionId, guestInfo);
        console.log(`✅ ${guestInfoResult.message}`);

        // เลือกภูมิภาค
        const regionResult = await this.surveyManager.selectRegion(surveyStart.sessionId, 'north');
        console.log(`✅ ${regionResult.message}`);
        console.log(`🏔️ เลือกภูมิภาค: ${regionResult.region.name}`);

        return surveyStart.sessionId;
    }

    async demoLoggedInSurvey() {
        console.log('\n🔐 สาธิต: การทำแบบสอบถามแบบ Logged-in User');
        console.log('-'.repeat(50));

        // ผู้ใช้ที่ล็อกอินแล้ว
        const loggedUser = {
            id: 'user_123',
            name: 'นางสาวมาลี ธุรกิจกัญชา',
            email: 'malee.cannabis@business.co.th',
            phone: '089-876-5432',
            userType: 'business_owner'
        };

        const surveyStart = await this.surveyManager.initiateSurvey(loggedUser);
        console.log(`✅ เริ่มแบบสอบถาม: ${surveyStart.message}`);
        console.log(`👤 ผู้ใช้: ${loggedUser.name}`);
        console.log(`🔄 ขั้นตอนถัดไป: ${surveyStart.nextStep}`);

        // เลือกภูมิภาค
        const regionResult = await this.surveyManager.selectRegion(surveyStart.sessionId, 'central');
        console.log(`✅ ${regionResult.message}`);
        console.log(`🏭 เลือกภูมิภาค: ${regionResult.region.name}`);

        return surveyStart.sessionId;
    }

    async demoCannabisSpecificQuestions() {
        console.log('\n🌿 สาธิต: คำถามเฉพาะกัญชาและสมุนไพร 6 ชนิดหลัก');
        console.log('-'.repeat(50));

        // แสดงคำถามสำหรับภาคเหนือ
        const northQuestions = this.surveyQuestions.getQuestionsByRegion('north');
        
        console.log(`\n📋 แบบสอบถาม${northQuestions.name}:`);
        console.log(`🏔️ ${northQuestions.context.climate}`);
        console.log(`🌿 สมุนไพรหลัก: ${northQuestions.context.mainHerbs}`);

        // ค้นหาคำถามเกี่ยวกับสมุนไพร
        const herbsSection = northQuestions.sections.find(s => s.id === 'herbs_cultivation');
        if (herbsSection) {
            const currentHerbsQ = herbsSection.questions.find(q => q.id === 'current_herbs');
            if (currentHerbsQ) {
                console.log('\n🌿 สมุนไพรที่ปลูก (เรียงตามความสำคัญ):');
                
                const economicHerbs = currentHerbsQ.categories[0];
                console.log(`\n💰 ${economicHerbs.name}:`);
                economicHerbs.options.forEach((herb, index) => {
                    const priority = herb.priority ? ` (อันดับ ${herb.priority})` : '';
                    const fields = herb.fields ? ` - ต้องกรอก: ${herb.fields.join(', ')}` : '';
                    console.log(`   ${index + 1}. ${herb.name}${priority}${fields}`);
                });

                const localHerbs = currentHerbsQ.categories[1];
                console.log(`\n🌱 ${localHerbs.name}:`);
                localHerbs.options.forEach((herb, index) => {
                    console.log(`   ${index + 1}. ${herb}`);
                });
            }

            // แสดงคำถามเฉพาะกัญชา
            const cannabisQ = herbsSection.questions.find(q => q.id === 'cannabis_specific');
            if (cannabisQ) {
                console.log('\n🌿 คำถามเฉพาะกัญชา:');
                cannabisQ.questions.forEach(q => {
                    console.log(`\n   📝 ${q.text}:`);
                    if (q.options) {
                        q.options.forEach((option, i) => {
                            console.log(`      ${i + 1}. ${option}`);
                        });
                    }
                    if (q.items) {
                        q.items.forEach((item, i) => {
                            console.log(`      ${i + 1}. ${item} (คะแนน 1-5)`);
                        });
                    }
                });
            }
        }
    }

    async demoSurveyResponses() {
        console.log('\n💾 สาธิต: การตอบแบบสอบถามเน้นกัญชา');
        console.log('-'.repeat(50));

        // สร้าง session ใหม่สำหรับการตอบ
        const userInfo = {
            name: 'นายธนาคาร เกษตรกร',
            email: 'thanakar@cannabis-farm.com'
        };
        
        const session = await this.surveyManager.initiateSurvey(userInfo);
        await this.surveyManager.selectRegion(session.sessionId, 'north');

        // ตอบคำถามเกี่ยวกับสมุนไพรที่ปลูก
        const responses = [
            {
                questionId: 'participant_type',
                response: 'เกษตรกร/ผู้ปลูก'
            },
            {
                questionId: 'farm_size',
                response: '5-10 ไร่'
            },
            {
                questionId: 'current_herbs',
                response: {
                    'กัญชา': { 
                        quantity: '50 กก./ปี', 
                        price: '15000 บาท/กก.',
                        variety: 'กัญชาทางการแพทย์',
                        medical_use: 'เพื่อการแพทย์/รักษาโรค'
                    },
                    'ขมิ้นชัน': { 
                        quantity: '200 กก./ปี', 
                        price: '800 บาท/กก.' 
                    },
                    'ขิง': { 
                        quantity: '150 กก./ปี', 
                        price: '600 บาท/กก.' 
                    }
                }
            },
            {
                questionId: 'cannabis_varieties',
                response: ['กัญชาทางการแพทย์', 'กัญชา CBD สูง', 'พันธุ์พื้นเมืองไทย']
            },
            {
                questionId: 'cannabis_purpose',
                response: ['เพื่อการแพทย์/รักษาโรค', 'สกัดน้ำมัน CBD', 'ขายให้ผู้ประกอบการ']
            },
            {
                questionId: 'cannabis_challenges',
                response: {
                    'กฎหมายและระเบียบซับซ้อน': 4,
                    'ใบอนุญาตยุ่งยาก': 5,
                    'ขาดความรู้เฉพาะทาง': 3,
                    'ต้นทุนการลงทุนสูง': 4,
                    'ขาดตลาดรับซื้อที่แน่นอน': 3
                }
            }
        ];

        console.log('\n📝 ตัวอย่างคำตอบ:');
        for (const response of responses) {
            await this.surveyManager.submitSurveyResponse(
                session.sessionId, 
                response.questionId, 
                response.response
            );
            console.log(`✅ บันทึกคำตอบ: ${response.questionId}`);
        }

        // ส่งแบบสอบถาม
        const completion = await this.surveyManager.completeSurvey(session.sessionId);
        console.log(`🎉 ${completion.message}`);
        console.log(`📊 Response ID: ${completion.responseId}`);

        return completion;
    }

    async showSurveyAnalytics() {
        console.log('\n📊 สาธิต: การวิเคราะห์ข้อมูลแบบสอบถาม');
        console.log('-'.repeat(50));

        // สร้างข้อมูลตัวอย่างเพิ่มเติม
        await this.createSampleData();

        // แสดงสถิติทั้งหมด
        const stats = await this.surveyManager.getAllSurveyStatistics();
        console.log('\n📈 สถิติการตอบแบบสอบถาม:');
        console.log(`   📋 จำนวนคำตอบทั้งหมด: ${stats.totalResponses} คำตอบ`);
        
        console.log('\n🗺️ สถิติตามภูมิภาค:');
        Object.entries(stats.byRegion).forEach(([region, count]) => {
            const regionInfo = this.surveyManager.regions[region];
            console.log(`   ${regionInfo?.icon || '📍'} ${regionInfo?.name || region}: ${count} คำตอบ`);
        });

        // แสดงกิจกรรมล่าสุด
        const recentActivity = await this.surveyManager.getRecentSurveyActivity(5);
        console.log('\n🕐 กิจกรรมล่าสุด:');
        recentActivity.forEach((activity, index) => {
            console.log(`   ${index + 1}. ${activity.region} - ${activity.participantType} (${activity.questionsAnswered} คำถาม)`);
        });

        // ข้อเสนะแนะเฉพาะกัญชา
        console.log('\n💡 ข้อเสนะแนะสำหรับผู้ปลูกกัญชา:');
        console.log('   🌿 ภาคเหนือ: เหมาะสำหรับกัญชาคุณภาพสูง อากาศเย็น');
        console.log('   🏭 ภาคกลาง: ศูนย์กลางธุรกิจแปรรูปกัญชาทางการแพทย์');
        console.log('   🌾 ภาคอีสาน: พัฒนาพันธุ์กัญชาทนแล้ง');
        console.log('   🌴 ภาคใต้: โอกาสตลาด Halal และการท่องเที่ยวเชิงสุขภาพ');
    }

    async createSampleData() {
        // สร้างข้อมูลตัวอย่างสำหรับแต่ละภูมิภาค
        const sampleUsers = [
            { name: 'เกษตรกรภาคเหนือ', region: 'north' },
            { name: 'ธุรกิจภาคกลาง', region: 'central' },
            { name: 'เกษตรกรอีสาน', region: 'northeast' },
            { name: 'ผู้ประกอบการภาคใต้', region: 'south' }
        ];

        for (const user of sampleUsers) {
            const session = await this.surveyManager.initiateSurvey({ name: user.name });
            await this.surveyManager.selectRegion(session.sessionId, user.region);
            
            // ตอบคำถามพื้นฐาน
            await this.surveyManager.submitSurveyResponse(session.sessionId, 'participant_type', 'เกษตรกร/ผู้ปลูก');
            await this.surveyManager.submitSurveyResponse(session.sessionId, 'current_herbs', ['กัญชา', 'ขมิ้นชัน']);
            
            await this.surveyManager.completeSurvey(session.sessionId);
        }
    }

    // รายงานสรุปการใช้งาน
    showUsageReport() {
        console.log('\n📋 รายงานสรุปการใช้งานระบบ:');
        console.log('='.repeat(50));
        console.log('✅ ระบบแบบสอบถามเน้นกัญชาเป็นหลัก');
        console.log('✅ สมุนไพร 6 ชนิดหลัก: กัญชา > ขมิ้นชัน > ขิง > กระชายดำ > ไพล > กระท่อม');
        console.log('✅ รองรับทั้ง Guest และ Registered User');
        console.log('✅ แบบสอบถามเฉพาะแต่ละภูมิภาค');
        console.log('✅ คำถามเฉพาะกัญชา (พันธุ์, วัตถุประสงค์, ปัญหา)');
        console.log('✅ การวิเคราะห์และรายงานผล');
        console.log('✅ ปกป้องข้อมูลตาม PDPA');
        
        console.log('\n🚀 การใช้งานจริง:');
        console.log('   1. เริ่มเซิร์ฟเวอร์: npm run start');
        console.log('   2. เข้าใช้งาน: http://localhost:3005/survey');
        console.log('   3. API: http://localhost:3005/api/survey');
        
        console.log('\n🌟 ฟีเจอร์พิเศษ:');
        console.log('   🌿 เน้นกัญชาเป็นหลัก พร้อมข้อมูลเฉพาะทาง');
        console.log('   📊 Analytics เชิงลึกแยกตามภูมิภาค');
        console.log('   🔒 ระบบรักษาความปลอดภัยข้อมูล');
        console.log('   📱 รองรับการใช้งานบนมือถือ');
    }
}

// เริ่มการสาธิต
async function runDemo() {
    const demo = new CannabisFirstSurveyDemo();
    await demo.runDemo();
    await demo.demoSurveyResponses();
    demo.showUsageReport();
}

// เรียกใช้งาน
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = CannabisFirstSurveyDemo;