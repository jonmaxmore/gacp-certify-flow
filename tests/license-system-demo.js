/**
 * Demo: Thai Herbal License Application & Audit System
 * สาธิตระบบขอใบอนุญาตปลูกสมุนไพรไทย และระบบ Audit เพื่อออกใบอนุญาต
 * พร้อมระบบป้องกันข้อมูลตาม PDPA
 */

const ThaiHerbalLicenseManager = require('../services/thai-herbal-license-manager');
const PDPAComplianceManager = require('../security/pdpa-compliance');

console.log('🌿 สาธิตระบบขอใบอนุญาตปลูกสมุนไพรไทย และระบบ Audit');
console.log('=======================================================\n');

async function demonstrateLicenseSystem() {
    const licenseManager = new ThaiHerbalLicenseManager();
    const pdpaManager = new PDPAComplianceManager();

    console.log('🎯 วัตถุประสงค์ของเว็บไซต์:');
    console.log('1. 📝 ขอใบอนุญาตปลูกสมุนไพรไทย 6 ชนิดหลัก');
    console.log('2. 🔍 ระบบ Audit เพื่อออกใบอนุญาต');
    console.log('3. 🛡️ ป้องกันข้อมูลลูกค้าตาม PDPA\n');

    console.log('🌿 สมุนไพรไทย 6 ชนิดหลักที่รองรับ:');
    console.log('   • กัญชา (Cannabis) - ควบคุมพิเศษ');
    console.log('   • ขมิ้นชัน (Turmeric) - อาหาร');
    console.log('   • ขิง (Ginger) - อาหาร');
    console.log('   • กระชายดำ (Black Galingale) - เวชภัณฑ์');
    console.log('   • ไพล (Plai) - เวชภัณฑ์');
    console.log('   • กระท่อม (Kratom) - ควบคุม\n');

    // จำลองการยื่นใบสมัคร
    console.log('📋 จำลองการยื่นใบสมัครขอใบอนุญาต');
    console.log('======================================');
    
    const applicantData = {
        user_id: 'USER-2025-001',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        
        // ข้อมูลส่วนบุคคล (จะถูกเข้ารหัสตาม PDPA)
        national_id: '1234567890123',
        full_name: 'นายสมชาย ใจดี',
        date_of_birth: '1980-05-15',
        address: '123 หมู่ 5 ตำบลบ้านสวน อำเภอเมือง จังหวัดเชียงใหม่ 50000',
        phone_number: '081-234-5678',
        email: 'somchai@example.com',
        
        // ข้อมูลฟาร์ม
        herbs: ['ขิง', 'ขมิ้นชัน', 'กระชายดำ'],
        farm_coordinates: { lat: 18.7883, lng: 98.9853 },
        farm_address: 'ฟาร์มสมุนไพรใจดี หมู่ 5 ตำบลบ้านสวน อำเภอเมือง จังหวัดเชียงใหม่',
        farm_size: 5.5, // ไร่
        ownership_type: 'เจ้าของเอง',
        cultivation_method: 'ปลูกแบบอินทรีย์',
        expected_yield: '2 ตัน/ปี',
        cultivation_purpose: 'จำหน่าย'
    };

    try {
        // ขั้นตอนที่ 1: ตรวจสอบความยินยอม PDPA
        console.log('🛡️ ตรวจสอบความยินยอม PDPA...');
        applicantData.consent_given = true; // จำลองการยินยอม
        
        const application = await licenseManager.createLicenseApplication(applicantData);
        console.log(`✅ สร้างใบสมัครสำเร็จ: ${application.application_id}`);
        console.log(`📊 ค่าธรรมเนียมประมาณ: ${application.fee_information.estimated_fees.total_cost.estimated_total} บาท`);
        console.log(`⚠️  ใบอนุญาตพิเศษ: ${application.fee_information.special_license_required ? 'ต้องการ' : 'ไม่ต้องการ'}`);
        
        // ขั้นตอนที่ 2: จัดตารางการ Audit
        console.log('\n🔍 จัดตารางการ Audit ภาคสนาม');
        console.log('================================');
        
        const audit = await licenseManager.scheduleFieldAudit(application.application_id);
        console.log(`📅 กำหนดการ Audit: ${new Date(audit.scheduled_date).toLocaleDateString('th-TH')}`);
        console.log(`👥 ทีม Audit: ${audit.audit_team.lead_auditor.license_number} และ ${audit.audit_team.technical_expert.license_number}`);
        console.log(`⏱️ ระยะเวลาประมาณ: ${audit.estimated_duration}`);
        
        console.log('\n📋 รายการตรวจสอบ Audit:');
        audit.audit_checklist.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.description} ${item.critical ? '(สำคัญ)' : ''}`);
        });
        console.log(`   ... และอีก ${audit.audit_checklist.length - 5} รายการ`);
        
        // ขั้นตอนที่ 3: บันทึกผลการ Audit
        console.log('\n📊 ผลการ Audit');
        console.log('================');
        
        const auditResults = {
            overall_result: 'PASS',
            overall_score: 92,
            criteria_results: [
                { criteria: 'SOIL_QUALITY', score: 95, status: 'PASS' },
                { criteria: 'WATER_SOURCE', score: 90, status: 'PASS' },
                { criteria: 'CULTIVATION_PRACTICES', score: 88, status: 'PASS' },
                { criteria: 'PEST_MANAGEMENT', score: 92, status: 'PASS' },
                { criteria: 'STORAGE_CONDITIONS', score: 85, status: 'PASS' }
            ],
            recommendations: [
                'ปรับปรุงระบบระบายน้ำในแปลงปลูก',
                'เพิ่มการบันทึกข้อมูลการใส่ปุ่ยอินทรีย์'
            ],
            auditor_notes: 'ฟาร์มมีมาตรฐานดี เกษตรกรมีความรู้และประสบการณ์',
            auditor_signature: 'DTAM-AUD-SIGN-2025-001',
            applicant_info: application.applicant,
            approved_herbs: ['ขิง', 'ขมิ้นชัน', 'กระชายดำ'],
            approved_area: '5.5 ไร่',
            approved_methods: ['ปลูกแบบอินทรีย์'],
            annual_quota: '2,000 กิโลกรัม',
            certificate_conditions: []
        };
        
        const auditReport = await licenseManager.recordAuditResults(audit.audit_id, auditResults);
        console.log(`✅ ผลการ Audit: ${auditReport.overall_result} (คะแนน: ${auditReport.overall_score})`);
        console.log(`📋 ข้อเสนอแนะ: ${auditReport.recommendations.length} รายการ`);
        console.log(`🎯 สิทธิ์ออกใบอนุญาต: ${auditReport.certificate_eligible ? 'มี' : 'ไม่มี'}`);
        
        // ขั้นตอนที่ 4: ออกใบอนุญาต
        if (auditReport.certificate_eligible) {
            console.log('\n📜 ออกใบอนุญาตปลูกสมุนไพร');
            console.log('==============================');
            
            const license = await licenseManager.issueLicense(application.application_id, auditResults);
            console.log(`🎉 ออกใบอนุญาตสำเร็จ!`);
            console.log(`📄 เลขที่ใบอนุญาต: ${license.license_number}`);
            console.log(`📅 วันที่ออกใบอนุญาต: ${new Date(license.issued_date).toLocaleDateString('th-TH')}`);
            console.log(`📅 วันหมดอายุ: ${new Date(license.valid_until).toLocaleDateString('th-TH')}`);
            console.log(`🌿 สมุนไพรที่อนุญาต: ${license.permitted_activities.herbs.join(', ')}`);
            console.log(`📍 พื้นที่ที่อนุญาต: ${license.permitted_activities.cultivation_area}`);
            console.log(`📊 ระดับใบอนุญาต: ${license.license_category}`);
            console.log(`🔗 QR Code ตรวจสอบ: ${license.qr_code}`);
        }
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }

    // แสดงระบบ PDPA Compliance
    console.log('\n🛡️ ระบบป้องกันข้อมูลตาม PDPA');
    console.log('=================================');
    
    const pdpaReport = pdpaManager.generateComplianceReport('monthly');
    console.log(`📊 การยินยอมเก็บข้อมูล: ${pdpaReport.data_collection.consent_rate}`);
    console.log(`👥 ผู้ใช้งานทั้งหมด: ${pdpaReport.data_processing.total_data_subjects} ราย`);
    console.log(`🔒 ข้อมูลอ่อนไหว: ${pdpaReport.data_processing.sensitive_data_subjects} ราย`);
    console.log(`🔐 การเข้ารหัส: ${pdpaReport.security_measures.encryption_coverage}`);
    console.log(`⭐ คะแนนการปฏิบัติตาม PDPA: ${pdpaReport.compliance_score}`);
    
    // แสดงการจัดการสิทธิของเจ้าของข้อมูล
    console.log('\n👤 สิทธิของเจ้าของข้อมูล (Data Subject Rights)');
    console.log('=============================================');
    
    const dataRightsDemo = [
        { type: 'ACCESS', description: 'สิทธิขอดูข้อมูลส่วนบุคคล' },
        { type: 'RECTIFICATION', description: 'สิทธิขอแก้ไขข้อมูล' },
        { type: 'ERASURE', description: 'สิทธิขอลบข้อมูล' },
        { type: 'PORTABILITY', description: 'สิทธิขอรับข้อมูลในรูปแบบที่อ่านได้' }
    ];
    
    dataRightsDemo.forEach((right, index) => {
        console.log(`${index + 1}. ${right.description}`);
    });

    console.log('\n📈 สถิติการใช้งานระบบ');
    console.log('====================');
    console.log('📝 ใบสมัครทั้งหมด: 1,245 ฉบับ');
    console.log('✅ อนุมัติแล้ว: 1,089 ฉบับ (87.5%)');
    console.log('❌ ปฏิเสธ: 67 ฉบับ (5.4%)');
    console.log('⏳ อยู่ระหว่างดำเนินการ: 89 ฉบับ (7.1%)');
    console.log('🔍 Audit ภาคสนาม: 156 ครั้ง');
    console.log('⭐ คะแนนเฉลี่ยการ Audit: 91.2 คะแนน');
    
    console.log('\n📊 สถิติสมุนไพรที่ขอใบอนุญาต');
    console.log('=============================');
    console.log('🥬 ขิง: 456 ราย (36.6%)');
    console.log('🧡 ขมิ้นชัน: 389 ราย (31.2%)');
    console.log('⚫ กระชายดำ: 234 ราย (18.8%)');
    console.log('🟢 ไพล: 123 ราย (9.9%)');
    console.log('🌿 กัญชา: 32 ราย (2.6%)');
    console.log('🍃 กระท่อม: 11 ราย (0.9%)');

    console.log('\n✅ สรุปการทำงานของเว็บไซต์');
    console.log('============================');
    console.log('✅ รับใบสมัครขอใบอนุญาตปลูกสมุนไพรไทย 6 ชนิด');
    console.log('✅ ระบบ Audit ภาคสนามเพื่อตรวจสอบมาตรฐาน');
    console.log('✅ ออกใบอนุญาตอิเล็กทรอนิกส์พร้อม QR Code');
    console.log('✅ ป้องกันข้อมูลลูกค้าตาม PDPA');
    console.log('✅ ระบบติดตามและรายงานครบถ้วน');
    
    console.log('\n🚀 เว็บไซต์พร้อมให้บริการเกษตรกรไทย! 🌿🇹🇭');
}

// เรียกใช้งานการสาธิต
demonstrateLicenseSystem().catch(console.error);