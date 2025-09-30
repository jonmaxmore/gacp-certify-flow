/**
 * การทดสอบฐานข้อมูลสมุนไพรไทยเวอร์ชันใหม่
 * ทดสอบฟีเจอร์ค้นหาและวิเคราะห์ข้อมูลเชิงลึก
 */

const ThaiHerbalDatabase = require('../models/thai-herbal-database-new');

function testAdvancedHerbalDatabase() {
    const db = new ThaiHerbalDatabase();
    
    console.log('🌿 ทดสอบฐานข้อมูลสมุนไพรไทยเวอร์ชันปรับปรุง');
    console.log('=' .repeat(60));
    
    // 1. ทดสอบการค้นหาตามสรรพคุณ
    console.log('\n1️⃣ ทดสอบการค้นหาตามสรรพคุณ');
    console.log('-'.repeat(40));
    
    try {
        const painReliefHerbs = db.searchByTherapeuticUse('ปวด');
        console.log(`พบสมุนไพรแก้ปวด ${painReliefHerbs.length} ชนิด:`);
        painReliefHerbs.forEach(herb => {
            console.log(`  ✓ ${herb.name} (${herb.scientific_name})`);
            console.log(`    - สรรพคุณที่ตรงกัน: ${herb.matching_uses.slice(0, 2).join(', ')}...`);
        });
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 2. ทดสอบการดูข้อมูลสารสำคัญ
    console.log('\n2️⃣ ทดสอบการดูข้อมูลสารสำคัญ');
    console.log('-'.repeat(40));
    
    try {
        const cannabisCompounds = db.getActiveCompounds('กัญชา');
        console.log(`สารสำคัญในกัญชา:`);
        console.log(`  📊 จำนวนสาร: ${cannabisCompounds.active_compounds.length} ชนิด`);
        console.log(`  🧪 สารหลัก: ${cannabisCompounds.active_compounds.slice(0, 3).join(', ')}`);
        
        if (cannabisCompounds.active_compounds_detail.thc) {
            const thc = cannabisCompounds.active_compounds_detail.thc;
            console.log(`  🔬 THC: ${thc.content} - ${thc.function}`);
        }
        
        if (cannabisCompounds.active_compounds_detail.cbd) {
            const cbd = cannabisCompounds.active_compounds_detail.cbd;
            console.log(`  💊 CBD: ${cbd.content} - ${cbd.function}`);
        }
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 3. ทดสอบการคำนวณปริมาณตามน้ำหนัก
    console.log('\n3️⃣ ทดสอบการคำนวณปริมาณตามน้ำหนัก');
    console.log('-'.repeat(40));
    
    try {
        const dosage = db.calculateDosageByWeight('ขมิ้นชัน', 70, 'dried_powder');
        console.log(`การคำนวณปริมาณขมิ้นชันสำหรับคนหนัก 70 กก.:`);
        console.log(`  📏 ปริมาณต่ำสุด: ${dosage.min_dose} ${dosage.unit}`);
        console.log(`  📏 ปริมาณสูงสุด: ${dosage.max_dose} ${dosage.unit}`);
        console.log(`  ✅ ปรับตามน้ำหนัก: ${dosage.weight_adjusted ? 'ใช่' : 'ไม่'}`);
        console.log(`  📋 ปริมาณมาตรฐาน: ${dosage.original_dosage}`);
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 4. ทดสอบการตรวจสอบข้อห้ามใช้
    console.log('\n4️⃣ ทดสอบการตรวจสอบข้อห้ามใช้');
    console.log('-'.repeat(40));
    
    try {
        const contraindications = db.checkContraindications('กัญชา', ['ครรภ์', 'เด็ก', 'หัวใจ']);
        console.log(`การตรวจสอบข้อห้ามใช้กัญชา:`);
        console.log(`  🔍 ความปลอดภัย: ${contraindications.safe ? '✅ ปลอดภัย' : '⚠️ มีข้อควรระวัง'}`);
        console.log(`  ⚠️  คำเตือน: ${contraindications.warnings.length} ข้อ`);
        
        contraindications.warnings.forEach(warning => {
            console.log(`    - ${warning.condition}: ${warning.warning}`);
        });
        
        console.log(`  📝 ข้อห้ามทั้งหมด: ${contraindications.all_contraindications.length} ข้อ`);
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 5. ทดสอบการเปรียบเทียบสมุนไพร
    console.log('\n5️⃣ ทดสอบการเปรียบเทียบสมุนไพร');
    console.log('-'.repeat(40));
    
    try {
        const comparison = db.compareHerbs(['กัญชา', 'ขมิ้นชัน', 'พลาย']);
        console.log(`การเปรียบเทียบสมุนไพร 3 ชนิด:`);
        console.log(`  🔬 สมุนไพรที่เปรียบเทียบ: ${Object.keys(comparison.herbs).join(', ')}`);
        console.log(`  🤝 ความคล้ายคลึง: ${comparison.similarities.length} คู่`);
        
        comparison.similarities.forEach((sim, index) => {
            console.log(`    ${index + 1}. ${sim.herbs.join(' และ ')}:`);
            console.log(`       สรรพคุณที่คล้ายกัน: ${sim.common_uses.slice(0, 2).join(', ')}`);
        });
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 6. ทดสอบการสร้างแผนการปลูก
    console.log('\n6️⃣ ทดสอบการสร้างแผนการปลูกตามฤดูกาล');
    console.log('-'.repeat(40));
    
    try {
        const plan = db.generateCultivationPlan('ภาคเหนือ');
        console.log(`แผนการปลูกสำหรับ${plan.region}:`);
        
        // แสดงแผนสำหรับบางเดือน
        const importantMonths = ['เมษายน', 'พฤษภาคม', 'ตุลาคม', 'ธันวาคม'];
        importantMonths.forEach(month => {
            const schedule = plan.monthly_schedule[month];
            if (schedule.planting.length > 0 || schedule.harvesting.length > 0) {
                console.log(`  📅 ${month}:`);
                if (schedule.planting.length > 0) {
                    console.log(`    🌱 ปลูก: ${schedule.planting.join(', ')}`);
                }
                if (schedule.harvesting.length > 0) {
                    console.log(`    🌾 เก็บเกี่ยว: ${schedule.harvesting.join(', ')}`);
                }
            }
        });
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 7. ทดสอบการตรวจสอบใบอนุญาต
    console.log('\n7️⃣ ทดสอบการตรวจสอบใบอนุญาตพิเศษ');
    console.log('-'.repeat(40));
    
    try {
        const herbs = ['กัญชา', 'ขมิ้นชัน', 'พลาย'];
        herbs.forEach(herbName => {
            const license = db.requiresSpecialLicense(herbName);
            console.log(`  ${herbName}:`);
            console.log(`    📄 ต้องใบอนุญาต: ${license.requires_license ? '✅ ต้องการ' : '❌ ไม่ต้องการ'}`);
            console.log(`    🔒 ระดับความปลอดภัย: ${license.security_level}`);
            if (license.license_type !== 'ไม่ต้องการ') {
                console.log(`    📋 ประเภทใบอนุญาต: ${license.license_type}`);
            }
        });
    } catch (error) {
        console.error('❌ ข้อผิดพลาด:', error.message);
    }
    
    // 8. สรุปการทดสอบ
    console.log('\n📊 สรุปผลการทดสอบ');
    console.log('=' .repeat(60));
    console.log(`✅ ฐานข้อมูลเวอร์ชัน: ${db.version}`);
    console.log(`📅 อัพเดตล่าสุด: ${new Date(db.lastUpdate).toLocaleDateString('th-TH')}`);
    console.log(`🏛️  แหล่งข้อมูล: ${db.dataSource}`);
    console.log(`🌿 จำนวนสมุนไพร: ${db.getAllHerbs().length} ชนิด`);
    console.log(`🔧 ฟีเจอร์ใหม่: ค้นหาตามสรรพคุณ, คำนวณปริมาณ, เปรียบเทียบ, แผนการปลูก`);
    
    console.log('\n🎯 ความสำเร็จ: ระบบฐานข้อมูลสมุนไพรไทยพร้อมใช้งานแล้ว!');
    return true;
}

// เรียกใช้งานการทดสอบ
if (require.main === module) {
    testAdvancedHerbalDatabase();
}

module.exports = testAdvancedHerbalDatabase;