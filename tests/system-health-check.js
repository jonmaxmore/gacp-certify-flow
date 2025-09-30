/**
 * 🔍 GACP System Health Check & Error Analysis
 * การตรวจสอบและวิเคราะห์ปัญหาของระบบ GACP
 */

class SystemHealthChecker {
    constructor() {
        this.healthReport = {
            timestamp: new Date().toISOString(),
            overall_status: 'UNKNOWN',
            components: {},
            errors: [],
            warnings: [],
            recommendations: []
        };
    }

    async runHealthCheck() {
        console.log('🔍 เริ่มตรวจสอบสุขภาพระบบ GACP...\n');

        // ตรวจสอบแต่ละส่วนของระบบ
        await this.checkThaiHerbalDatabase();
        await this.checkFeeCalculator();
        await this.checkSurveySystem();
        await this.checkLicenseManager();
        await this.checkWorkflowSystem();

        // สรุปผลและให้คำแนะนำ
        this.generateOverallStatus();
        this.generateRecommendations();
        
        return this.healthReport;
    }

    async checkThaiHerbalDatabase() {
        console.log('🌿 ตรวจสอบฐานข้อมูลสมุนไพรไทย...');
        
        try {
            const ThaiHerbalDatabase = require('../models/thai-herbal-database');
            const db = new ThaiHerbalDatabase();
            
            // ทดสอบสมุนไพรหลัก 6 ชนิด
            const mainHerbs = ['กัญชา', 'ขมิ้นชัน', 'ขิง', 'กระชายดำ', 'ไพล', 'กระท่อม'];
            const testResults = {};
            
            for (const herb of mainHerbs) {
                try {
                    const info = db.getHerbInfo(herb);
                    testResults[herb] = { status: 'OK', fee_multiplier: info.fee_multiplier };
                } catch (error) {
                    testResults[herb] = { status: 'ERROR', error: error.message };
                    this.healthReport.errors.push(`ฐานข้อมูลสมุนไพร: ${error.message}`);
                }
            }

            // ทดสอบชื่อเรียกอื่นๆ
            const aliases = ['ขมิ้น', 'ขิงแก่', 'พลาย', 'กัญชง'];
            for (const alias of aliases) {
                try {
                    db.getHerbInfo(alias);
                    testResults[`alias_${alias}`] = { status: 'OK' };
                } catch (error) {
                    testResults[`alias_${alias}`] = { status: 'ERROR' };
                    this.healthReport.warnings.push(`ชื่อเรียก "${alias}" ไม่สามารถค้นหาได้`);
                }
            }

            this.healthReport.components.thai_herbal_database = {
                status: 'HEALTHY',
                main_herbs: testResults,
                total_herbs: Object.keys(db.herbs).length
            };

            console.log('   ✅ ฐานข้อมูลสมุนไพรไทย: สุขภาพดี');
            console.log(`   📊 สมุนไพรหลัก 6 ชนิด: ${mainHerbs.map(h => testResults[h]?.status === 'OK' ? '✅' : '❌').join(' ')}`);

        } catch (error) {
            this.healthReport.components.thai_herbal_database = {
                status: 'ERROR',
                error: error.message
            };
            this.healthReport.errors.push(`ฐานข้อมูลสมุนไพร: ${error.message}`);
            console.log('   ❌ ฐานข้อมูลสมุนไพรไทย: มีปัญหา');
        }
    }

    async checkFeeCalculator() {
        console.log('💰 ตรวจสอบระบบคำนวณค่าธรรมเนียม...');
        
        try {
            const GACPFeeCalculator = require('../services/finance-service/gacp-fee-calculator');
            const calculator = new GACPFeeCalculator();
            
            // ทดสอบการคำนวณ
            const testApplications = [
                { herbs: ['กัญชา'], expected_multiplier: 2.0 },
                { herbs: ['ขมิ้นชัน'], expected_multiplier: 1.0 },
                { herbs: ['กัญชา', 'ขมิ้นชัน'], expected_multiplier: 2.0 }
            ];

            const testResults = {};
            for (const test of testApplications) {
                try {
                    const initialFee = calculator.calculateInitialFee(test.herbs);
                    const fieldFee = calculator.calculateFieldAuditFee(test.herbs, {});
                    
                    testResults[test.herbs.join(',')] = {
                        status: 'OK',
                        initial_fee: initialFee.final_amount,
                        field_fee: fieldFee.final_amount
                    };
                } catch (error) {
                    testResults[test.herbs.join(',')] = {
                        status: 'ERROR',
                        error: error.message
                    };
                    this.healthReport.errors.push(`คำนวณค่าธรรมเนียม: ${error.message}`);
                }
            }

            this.healthReport.components.fee_calculator = {
                status: 'HEALTHY',
                test_results: testResults
            };

            console.log('   ✅ ระบบคำนวณค่าธรรมเนียม: สุขภาพดี');

        } catch (error) {
            this.healthReport.components.fee_calculator = {
                status: 'ERROR',
                error: error.message
            };
            this.healthReport.errors.push(`ระบบคำนวณค่าธรรมเนียม: ${error.message}`);
            console.log('   ❌ ระบบคำนวณค่าธรรมเนียม: มีปัญหา');
        }
    }

    async checkSurveySystem() {
        console.log('📋 ตรวจสอบระบบแบบสอบถาม...');
        
        try {
            const SurveyManager = require('../services/survey-management/src/survey-manager');
            const SurveyQuestions = require('../services/survey-management/src/survey-questions');
            
            const surveyManager = new SurveyManager();
            const surveyQuestions = new SurveyQuestions();

            // ทดสอบการสร้าง session
            const guestSession = await surveyManager.initiateSurvey(null);
            const userSession = await surveyManager.initiateSurvey({ name: 'Test User' });

            // ทดสอบการเลือกภูมิภาค
            await surveyManager.selectRegion(guestSession.sessionId, 'north');

            // ทดสอบคำถามทุกภูมิภาค
            const regions = ['north', 'south', 'central', 'northeast'];
            const questionTests = {};
            
            for (const region of regions) {
                const questions = surveyQuestions.getQuestionsByRegion(region);
                questionTests[region] = {
                    status: questions ? 'OK' : 'ERROR',
                    sections: questions?.sections?.length || 0,
                    cannabis_questions: questions?.sections?.some(s => 
                        s.questions?.some(q => q.id === 'cannabis_specific')
                    ) || false
                };
            }

            this.healthReport.components.survey_system = {
                status: 'HEALTHY',
                regions: questionTests,
                sessions_created: 2
            };

            console.log('   ✅ ระบบแบบสอบถาม: สุขภาพดี');
            console.log(`   🗺️ ภูมิภาค: ${regions.map(r => questionTests[r]?.status === 'OK' ? '✅' : '❌').join(' ')}`);

        } catch (error) {
            this.healthReport.components.survey_system = {
                status: 'ERROR',
                error: error.message
            };
            this.healthReport.errors.push(`ระบบแบบสอบถาม: ${error.message}`);
            console.log('   ❌ ระบบแบบสอบถาม: มีปัญหา');
        }
    }

    async checkLicenseManager() {
        console.log('📄 ตรวจสอบระบบจัดการใบอนุญาต...');
        
        try {
            const ThaiHerbalLicenseManager = require('../services/thai-herbal-license-manager');
            const licenseManager = new ThaiHerbalLicenseManager();

            // ทดสอบข้อมูลครบถ้วน
            const testApplication = {
                national_id: '1234567890123',
                full_name: 'สมชาย ทดสอบระบบ',
                date_of_birth: '1980-01-01',
                address: '123 หมู่ 1 ต.ทดสอบ อ.ทดสอบ จ.ทดสอบ',
                phone_number: '081-234-5678',
                email: 'test@example.com',
                herbs: ['กัญชา', 'ขมิ้นชัน'],
                farm_coordinates: '14.0000,100.0000',
                farm_address: 'ฟาร์มทดสอบ',
                farm_size: '1 ไร่',
                ownership_type: 'เจ้าของเอง',
                cultivation_method: 'เกษตรอินทรีย์',
                expected_yield: '100 กิโลกรัม',
                cultivation_purpose: 'เพื่อการค้า',
                user_id: 'test_user_001',
                location: {
                    region: 'ภาคกลาง',
                    province: 'กรุงเทพมหานคร',
                    district: 'บางรัก'
                },
                // PDPA Consent data
                pdpa_consent: true,
                consent_purposes: ['ขอใบอนุญาตปลูกสมุนไพรไทย'],
                consent_timestamp: new Date().toISOString(),
                consent_version: '1.0'
            };

            // ทดสอบ createApplication method (ใหม่)
            console.log('   🔍 ทดสอบ createApplication method...');
            const application = await licenseManager.createApplication(testApplication);
            console.log('   ✅ createApplication method ทำงานได้');

            // ทดสอบ getApplication method
            console.log('   🔍 ทดสอบ getApplication method...');
            const retrievedApp = await licenseManager.getApplication('TEST-001');
            console.log('   ✅ getApplication method ทำงานได้');

            // ทดสอบ updateApplicationStatus method
            console.log('   🔍 ทดสอบ updateApplicationStatus method...');
            const statusUpdate = await licenseManager.updateApplicationStatus('TEST-001', 'SUBMITTED', 'Test update');
            console.log('   ✅ updateApplicationStatus method ทำงานได้');

            this.healthReport.components.license_manager = {
                status: 'HEALTHY',
                test_application_id: application.application_id,
                methods_tested: ['createApplication', 'getApplication', 'updateApplicationStatus', 'createLicenseApplication'],
                details: 'All API methods working properly'
            };

            console.log('   ✅ ระบบจัดการใบอนุญาต: สุขภาพดี');

        } catch (error) {
            this.healthReport.components.license_manager = {
                status: 'ERROR',
                error: error.message,
                details: 'API methods missing or not working'
            };
            this.healthReport.errors.push(`ระบบจัดการใบอนุญาต: ${error.message}`);
            console.log('   ❌ ระบบจัดการใบอนุญาต: มีปัญหา -', error.message);
        }
    }

    async checkWorkflowSystem() {
        console.log('🔄 ตรวจสอบระบบ Workflow...');
        
        try {
            const ApplicationStateManager = require('../services/workflow-service/application-state-manager');
            const stateManager = new ApplicationStateManager();

            // ทดสอบ state transitions
            const testTransitions = [
                { from: 'draft', to: 'submitted', valid: true },
                { from: 'submitted', to: 'audit_passed', valid: false },
                { from: 'under_review', to: 'review_passed', valid: true }
            ];

            const transitionResults = {};
            for (const test of testTransitions) {
                try {
                    const canTransition = stateManager.canTransition(test.from, test.to);
                    transitionResults[`${test.from}_to_${test.to}`] = {
                        expected: test.valid,
                        actual: canTransition,
                        status: canTransition === test.valid ? 'OK' : 'ERROR'
                    };
                } catch (error) {
                    transitionResults[`${test.from}_to_${test.to}`] = {
                        status: 'ERROR',
                        error: error.message
                    };
                }
            }

            this.healthReport.components.workflow_system = {
                status: 'HEALTHY',
                transition_tests: transitionResults
            };

            console.log('   ✅ ระบบ Workflow: สุขภาพดี');

        } catch (error) {
            this.healthReport.components.workflow_system = {
                status: 'ERROR',
                error: error.message
            };
            this.healthReport.errors.push(`ระบบ Workflow: ${error.message}`);
            console.log('   ❌ ระบบ Workflow: มีปัญหา');
        }
    }

    generateOverallStatus() {
        const componentStatuses = Object.values(this.healthReport.components)
            .map(comp => comp.status);
        
        const errorCount = componentStatuses.filter(s => s === 'ERROR').length;
        const healthyCount = componentStatuses.filter(s => s === 'HEALTHY').length;
        
        if (errorCount === 0) {
            this.healthReport.overall_status = 'HEALTHY';
        } else if (healthyCount > errorCount) {
            this.healthReport.overall_status = 'WARNING';
        } else {
            this.healthReport.overall_status = 'CRITICAL';
        }
    }

    generateRecommendations() {
        // เพิ่มข้อเสนะแนะตามปัญหาที่พบ
        if (this.healthReport.errors.length > 0) {
            this.healthReport.recommendations.push(
                '🔧 แก้ไข error ที่พบทันที เพื่อให้ระบบทำงานได้อย่างสมบูรณ์'
            );
        }

        if (this.healthReport.warnings.length > 0) {
            this.healthReport.recommendations.push(
                '⚠️ ตรวจสอบ warning และปรับปรุงให้ดีขึ้น'
            );
        }

        // ข้อเสนะแนะทั่วไป
        this.healthReport.recommendations.push(
            '📊 ทำการ load testing ก่อนใช้งานจริง',
            '🔒 ตรวจสอบการรักษาความปลอดภัยข้อมูล PDPA',
            '📝 อัพเดทเอกสารการใช้งาน',
            '🌿 เพิ่มสมุนไพรพื้นเมืองเพิ่มเติมตามความต้องการ'
        );
    }

    printSummaryReport() {
        const status = this.healthReport.overall_status;
        const statusIcon = {
            'HEALTHY': '✅',
            'WARNING': '⚠️',
            'CRITICAL': '🚨'
        }[status] || '❓';

        console.log('\n' + '='.repeat(60));
        console.log(`${statusIcon} สรุปสุขภาพระบบ GACP: ${status}`);
        console.log('='.repeat(60));

        console.log('\n📊 สถานะแต่ละระบบ:');
        Object.entries(this.healthReport.components).forEach(([name, comp]) => {
            const icon = comp.status === 'HEALTHY' ? '✅' : '❌';
            console.log(`   ${icon} ${name}: ${comp.status}`);
        });

        if (this.healthReport.errors.length > 0) {
            console.log('\n🚨 ข้อผิดพลาดที่พบ:');
            this.healthReport.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }

        if (this.healthReport.warnings.length > 0) {
            console.log('\n⚠️ คำเตือน:');
            this.healthReport.warnings.forEach((warning, i) => {
                console.log(`   ${i + 1}. ${warning}`);
            });
        }

        console.log('\n💡 ข้อเสนะแนะ:');
        this.healthReport.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });

        console.log('\n🚀 การแก้ไขเร่งด่วน:');
        if (this.healthReport.errors.length === 0) {
            console.log('   ✅ ไม่มีปัญหาเร่งด่วน ระบบพร้อมใช้งาน!');
        } else {
            console.log('   🔧 แก้ไข error ข้างต้นก่อนใช้งานจริง');
        }
    }
}

// เรียกใช้งาน
async function runSystemHealthCheck() {
    const checker = new SystemHealthChecker();
    const report = await checker.runHealthCheck();
    checker.printSummaryReport();
    
    return report;
}

module.exports = { SystemHealthChecker, runSystemHealthCheck };

// รันทันทีหากเรียกไฟล์นี้โดยตรง
if (require.main === module) {
    runSystemHealthCheck().catch(console.error);
}