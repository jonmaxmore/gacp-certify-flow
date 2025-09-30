/**
 * การทดสอบขั้นสูงสำหรับฐานข้อมูลสมุนไพรไทย
 * ทดสอบสมุนไพรทั้ง 6 ชนิดและฟีเจอร์ค้นหาเชิงลึก
 */

const ThaiHerbalDatabase = require('../models/thai-herbal-database-new');

function testComprehensiveHerbalFeatures() {
    const db = new ThaiHerbalDatabase();
    
    console.log('🌿 การทดสอบครอบคลุมฐานข้อมูลสมุนไพรไทย 6 ชนิด');
    console.log('=' .repeat(70));
    
    // 1. ทดสอบการค้นหาสมุนไพรทั้งหมด
    console.log('\n1️⃣ รายการสมุนไพรทั้งหมดในระบบ');
    console.log('-'.repeat(50));
    
    const allHerbs = db.getAllHerbs();
    allHerbs.forEach((herb, index) => {
        const info = db.getHerbInfo(herb);
        console.log(`  ${index + 1}. ${herb} (${info.scientific_name})`);
        console.log(`     ประเภท: ${info.plant_type}`);
        console.log(`     ตระกูล: ${info.family}`);
    });
    
    // 2. ทดสอบการค้นหาตามคำสำคัญต่างๆ
    console.log('\n2️⃣ การค้นหาตามสรรพคุณเฉพาะ');
    console.log('-'.repeat(50));
    
    const searchTerms = ['อักเสบ', 'แก้ไอ', 'บำรุง', 'ต้านมะเร็ง'];
    
    searchTerms.forEach(term => {
        const results = db.searchByTherapeuticUse(term);
        console.log(`\n🔍 ค้นหา "${term}": พบ ${results.length} ชนิด`);
        results.forEach(herb => {
            console.log(`  ✓ ${herb.name}: ${herb.matching_uses.slice(0, 1).join('')}`);
        });
    });
    
    // 3. ทดสอบการเปรียบเทียบสมุนไพรหลายคู่
    console.log('\n3️⃣ การเปรียบเทียบสมุนไพรหลายคู่');
    console.log('-'.repeat(50));
    
    const comparisonPairs = [
        ['กัญชา', 'กระท่อม'],
        ['ขมิ้นชัน', 'พลาย'],
        ['ขิง', 'กระชายดำ']
    ];
    
    comparisonPairs.forEach(([herb1, herb2]) => {
        const comparison = db.compareHerbs([herb1, herb2]);
        console.log(`\n🔬 เปรียบเทียบ ${herb1} กับ ${herb2}:`);
        
        if (comparison.similarities.length > 0) {
            console.log(`  🤝 สรรพคุณที่คล้ายกัน:`);
            comparison.similarities.forEach(sim => {
                console.log(`    - ${sim.common_uses.slice(0, 2).join(', ')}`);
            });
        } else {
            console.log(`  ⚡ ไม่พบสรรพคุณที่คล้ายกันโดยตรง`);
        }
    });
    
    // 4. ทดสอบการคำนวณปริมาณสำหรับน้ำหนักต่างๆ
    console.log('\n4️⃣ การคำนวณปริมาณสำหรับน้ำหนักต่างๆ');
    console.log('-'.repeat(50));
    
    const testWeights = [50, 60, 70, 80];
    const testHerb = 'พลาย';
    
    console.log(`\n💊 ปริมาณ${testHerb}ตามน้ำหนักตัว:`);
    testWeights.forEach(weight => {
        try {
            const dosage = db.calculateDosageByWeight(testHerb, weight, 'dried');
            console.log(`  ${weight} กก.: ${dosage.min_dose}-${dosage.max_dose} ${dosage.unit}`);
        } catch (error) {
            console.log(`  ${weight} กก.: ข้อมูลไม่เพียงพอ`);
        }
    });
    
    // 5. ทดสอบการตรวจสอบข้อห้ามใช้สำหรับกลุ่มเสี่ยง
    console.log('\n5️⃣ การตรวจสอบข้อห้ามใช้สำหรับกลุ่มเสี่ยง');
    console.log('-'.repeat(50));
    
    const riskGroups = ['ครรภ์', 'เด็ก', 'หัวใจ', 'ตับ'];
    const controlledHerbs = ['กัญชา', 'กระท่อม'];
    
    controlledHerbs.forEach(herb => {
        console.log(`\n⚠️  การตรวจสอบ${herb}:`);
        const check = db.checkContraindications(herb, riskGroups);
        console.log(`  ความปลอดภัย: ${check.safe ? '✅ ปลอดภัย' : '❌ มีข้อควรระวัง'}`);
        check.warnings.forEach(warning => {
            console.log(`  - ${warning.condition}: ${warning.warning.substring(0, 50)}...`);
        });
    });
    
    // 6. ทดสอบการค้นหาสารสำคัญ
    console.log('\n6️⃣ การค้นหาสารสำคัญในสมุนไพรต่างๆ');
    console.log('-'.repeat(50));
    
    allHerbs.slice(0, 3).forEach(herb => {
        const compounds = db.getActiveCompounds(herb);
        console.log(`\n🧪 ${herb}:`);
        console.log(`  สารสำคัญ: ${compounds.active_compounds.slice(0, 3).join(', ')}`);
        
        // แสดงสารหลัก
        const details = compounds.active_compounds_detail;
        const firstCompound = Object.keys(details)[0];
        if (firstCompound && details[firstCompound]) {
            console.log(`  ${firstCompound}: ${details[firstCompound].content} - ${details[firstCompound].function}`);
        }
    });
    
    // 7. ทดสอบการตรวจสอบใบอนุญาตทั้งหมด
    console.log('\n7️⃣ สรุปสถานะใบอนุญาตทั้งหมด');
    console.log('-'.repeat(50));
    
    const licenseCategories = {
        'ไม่ต้องใบอนุญาต': [],
        'ใบอนุญาตปานกลาง': [],
        'ใบอนุญาตพิเศษ': []
    };
    
    allHerbs.forEach(herb => {
        const license = db.requiresSpecialLicense(herb);
        if (!license.requires_license) {
            licenseCategories['ไม่ต้องใบอนุญาต'].push(herb);
        } else if (license.security_level === 'ปานกลาง') {
            licenseCategories['ใบอนุญาตปานกลาง'].push(herb);
        } else {
            licenseCategories['ใบอนุญาตพิเศษ'].push(herb);
        }
    });
    
    Object.entries(licenseCategories).forEach(([category, herbs]) => {
        console.log(`\n📄 ${category}: ${herbs.length} ชนิด`);
        herbs.forEach(herb => {
            console.log(`  ✓ ${herb}`);
        });
    });
    
    // 8. ทดสอบแผนการปลูกแบบละเอียด
    console.log('\n8️⃣ แผนการปลูกรายเดือนแบบละเอียด');
    console.log('-'.repeat(50));
    
    const plan = db.generateCultivationPlan('ภาคเหนือ');
    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    months.forEach(month => {
        const schedule = plan.monthly_schedule[month];
        if (schedule.planting.length > 0 || schedule.harvesting.length > 0) {
            console.log(`\n📅 ${month}:`);
            if (schedule.planting.length > 0) {
                console.log(`  🌱 ปลูก: ${schedule.planting.join(', ')}`);
            }
            if (schedule.harvesting.length > 0) {
                console.log(`  🌾 เก็บเกี่ยว: ${schedule.harvesting.join(', ')}`);
            }
        }
    });
    
    // 9. สถิติและข้อมูลสรุป
    console.log('\n9️⃣ สถิติและข้อมูลสรุปของระบบ');
    console.log('-'.repeat(50));
    
    // นับสมุนไพรตามประเภท
    const typeCount = {};
    const familyCount = {};
    let totalCompounds = 0;
    
    allHerbs.forEach(herb => {
        const info = db.getHerbInfo(herb);
        typeCount[info.plant_type] = (typeCount[info.plant_type] || 0) + 1;
        familyCount[info.family] = (familyCount[info.family] || 0) + 1;
        totalCompounds += info.active_compounds ? info.active_compounds.length : 0;
    });
    
    console.log(`\n📊 สถิติทั่วไป:`);
    console.log(`  🌿 จำนวนสมุนไพรทั้งหมด: ${allHerbs.length} ชนิด`);
    console.log(`  🧪 จำนวนสารสำคัญรวม: ${totalCompounds} สาร`);
    console.log(`  📈 เฉลี่ยสารต่อสมุนไพร: ${(totalCompounds / allHerbs.length).toFixed(1)} สาร`);
    
    console.log(`\n🌱 ประเภทสมุนไพร:`);
    Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} ชนิด`);
    });
    
    console.log(`\n🏛️  ตระกูลพืช:`);
    Object.entries(familyCount).forEach(([family, count]) => {
        console.log(`  - ${family}: ${count} ชนิด`);
    });
    
    // 10. ข้อเสนอแนะและการใช้งาน
    console.log('\n🔟 ข้อเสนอแนะการใช้งานระบบ');
    console.log('-'.repeat(50));
    
    console.log(`\n💡 การใช้งานที่แนะนำ:`);
    console.log(`  1. ใช้ searchByTherapeuticUse() ค้นหาสมุนไพรตามอาการ`);
    console.log(`  2. ใช้ compareHerbs() เปรียบเทียบสมุนไพรทางเลือก`);
    console.log(`  3. ใช้ calculateDosageByWeight() คำนวณปริมาณที่เหมาะสม`);
    console.log(`  4. ใช้ checkContraindications() ตรวจสอบความปลอดภัย`);
    console.log(`  5. ใช้ generateCultivationPlan() วางแผนการปลูก`);
    
    console.log(`\n⚠️  ข้อควรระวัง:`);
    console.log(`  - ตรวจสอบใบอนุญาตก่อนปลูกสมุนไพรควบคุม`);
    console.log(`  - ปรึกษาแพทย์ก่อนใช้สมุนไพรในผู้ป่วย`);
    console.log(`  - ปฏิบัติตาม GACP ในการผลิต`);
    console.log(`  - ติดตามข้อมูลอัพเดตจากมหาวิทยาลัย`);
    
    console.log('\n🎯 สรุป: ระบบฐานข้อมูลสมุนไพรไทยพร้อมใช้งานเต็มประสิทธิภาพ!');
    return true;
}

// เรียกใช้งานการทดสอบ
if (require.main === module) {
    testComprehensiveHerbalFeatures();
}

module.exports = testComprehensiveHerbalFeatures;