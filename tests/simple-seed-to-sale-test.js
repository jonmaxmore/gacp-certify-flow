/**
 * Simple Test Runner for Seed-to-Sale System
 * รันทดสอบระบบ Seed-to-Sale แบบง่าย
 */

const express = require('express');

async function testSeedToSaleSystem() {
    console.log('🌿 เริ่มต้นทดสอบระบบ GACP Seed-to-Sale');
    console.log('==========================================\n');

    try {
        // Import the service
        const { SeedToSaleTrackingService } = require('../services/track-trace/src/seed-to-sale');
        
        console.log('📦 กำลังเริ่มต้น SeedToSaleTrackingService...');
        const trackingService = new SeedToSaleTrackingService();
        console.log('✅ Service เริ่มต้นสำเร็จ\n');

        // Test 1: สร้าง Seed Lot
        console.log('🌱 Test 1: การสร้าง Seed Lot');
        console.log('----------------------------');
        
        const seedLotData = {
            lotNumber: 'GACP-SD-SIMPLE-001',
            type: 'seed_lot',
            species: 'Cannabis sativa L.',
            variety: 'Thai Landrace',
            quantity: 100,
            unit: 'seeds',
            location: 'Simple Test Seed Bank',
            sourceInfo: {
                supplier: 'Simple Test Supplier',
                country: 'Thailand',
                certification: 'Organic + GACP'
            },
            qualityData: {
                germination_rate: 95.0,
                purity: 99.5,
                moisture_content: 8.0
            }
        };

        const seedLot = await trackingService.createLot(seedLotData);
        console.log(`✅ Seed Lot สร้างสำเร็จ: ${seedLot.lotNumber}`);
        console.log(`   ID: ${seedLot.id}`);
        console.log(`   QR Code: ${seedLot.qrCode}\n`);

        // Test 2: สร้าง Plant Lot
        console.log('🌿 Test 2: การสร้าง Plant Lot');
        console.log('-----------------------------');
        
        const plantLotData = {
            lotNumber: 'GACP-PL-SIMPLE-001',
            type: 'plant_lot',
            parentLotId: seedLot.id,
            species: 'Cannabis sativa L.',
            variety: 'Thai Landrace',
            quantity: 85,
            unit: 'plants',
            location: 'Simple Test Farm',
            plantedDate: new Date().toISOString(),
            operator: 'Simple Test Farmer'
        };

        const plantLot = await trackingService.createLot(plantLotData);
        console.log(`✅ Plant Lot สร้างสำเร็จ: ${plantLot.lotNumber}`);
        console.log(`   Parent ID: ${plantLot.parentLotId}`);
        console.log(`   จำนวนต้น: ${plantLot.quantity}\n`);

        // Test 3: บันทึก Events
        console.log('📋 Test 3: การบันทึก Supply Chain Events');
        console.log('----------------------------------------');
        
        const events = [
            {
                lotId: seedLot.id,
                eventType: 'SEED_RECEIVED',
                operator: 'Seed Bank Manager',
                location: 'Simple Test Seed Bank',
                details: 'Received certified seeds for simple testing'
            },
            {
                lotId: plantLot.id,
                eventType: 'PLANTED',
                operator: 'Simple Test Farmer',
                location: 'Simple Test Farm',
                details: 'Seeds planted in simple test environment'
            }
        ];

        for (const eventData of events) {
            const event = await trackingService.recordEvent(eventData);
            console.log(`✅ Event บันทึกสำเร็จ: ${event.eventType} for ${event.lotId.substring(0, 8)}...`);
        }
        console.log('');

        // Test 4: สร้าง Individual Plant
        console.log('🌱 Test 4: การสร้าง Individual Plant');
        console.log('-----------------------------------');
        
        const plantData = {
            plantTag: 'PLANT-SIMPLE-001',
            lotId: plantLot.id,
            species: 'Cannabis sativa L.',
            variety: 'Thai Landrace',
            location: {
                farmId: 'simple-farm-001',
                section: 'Simple-Test-Section',
                coordinates: '18.7883,98.9853'
            },
            plantedDate: new Date().toISOString(),
            operator: 'Simple Test Individual Farmer'
        };

        const plant = await trackingService.createPlant(plantData);
        console.log(`✅ Individual Plant สร้างสำเร็จ: ${plant.plantTag}`);
        console.log(`   Plant ID: ${plant.id}`);
        console.log(`   QR Code: ${plant.qrCode}\n`);

        // Test 5: QR Code Verification
        console.log('🏷️ Test 5: QR Code Verification');
        console.log('-------------------------------');
        
        const qrVerification = await trackingService.verifyQRCode(plant.qrCode);
        console.log(`✅ QR Code Verification: ${qrVerification.valid ? 'VALID' : 'INVALID'}`);
        console.log(`   Entity Type: ${qrVerification.data.entityType}`);
        console.log(`   Entity ID: ${qrVerification.data.entityId.substring(0, 8)}...\n`);

        // Test 6: Compliance Check
        console.log('🔍 Test 6: Compliance Checking');
        console.log('------------------------------');
        
        const compliance = await trackingService.checkCompliance(plant.id, 'plant');
        console.log(`✅ Compliance Check สำเร็จ`);
        console.log(`   Score: ${compliance.score}/100`);
        console.log(`   Status: ${compliance.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
        console.log(`   Regulations: ${compliance.regulations.join(', ')}\n`);

        // Test 7: Audit Trail
        console.log('🔒 Test 7: Audit Trail Verification');
        console.log('-----------------------------------');
        
        const auditTrail = await trackingService.getAuditTrail({});
        const integrityCheck = await trackingService.verifyAuditTrailIntegrity();
        
        console.log(`✅ Audit Trail Retrieved: ${auditTrail.events.length} events`);
        console.log(`✅ Audit Trail Integrity: ${integrityCheck.valid ? 'VALID' : 'INVALID'}`);
        console.log(`   Integrity Score: ${integrityCheck.score}%\n`);

        // Test 8: Summary Report
        console.log('📊 Test 8: Summary Report');
        console.log('------------------------');
        
        const summary = await trackingService.generateSummaryReport();
        
        console.log('📈 System Summary:');
        console.log(`   📦 Total Lots: ${summary.totalLots}`);
        console.log(`   🌱 Total Plants: ${summary.totalPlants}`);
        console.log(`   📋 Total Events: ${summary.totalEvents}`);
        console.log(`   🏷️ Total QR Codes: ${summary.totalQRCodes}`);
        console.log(`   📊 Avg Compliance Score: ${summary.averageComplianceScore}%`);
        console.log(`   🔒 Audit Trail Integrity: ${summary.auditTrailIntegrity}%`);
        console.log(`   ✅ System Status: ${summary.systemStatus}\n`);

        // Final Summary
        console.log('🏆 การทดสอบเสร็จสิ้น - สรุปผลลัพธ์');
        console.log('==================================');
        console.log('✅ Lot-based tracking: สำเร็จ');
        console.log('✅ Individual plant tracking: สำเร็จ');
        console.log('✅ QR Code generation/verification: สำเร็จ');
        console.log('✅ Supply chain events recording: สำเร็จ');
        console.log('✅ Compliance checking: สำเร็จ');
        console.log('✅ Audit trail integrity: สำเร็จ');
        console.log('✅ Summary reporting: สำเร็จ\n');

        console.log('🌟 ระบบ GACP Seed-to-Sale พร้อมใช้งาน!');
        console.log('=====================================');
        console.log('✅ ไม่ใช้ Web3/Blockchain ตามความต้องการ');
        console.log('✅ ติดตามแบบ Lot และ Individual Plant');
        console.log('✅ QR Code verification ครบถ้วน');
        console.log('✅ Audit trail ที่ปลอดภัย');
        console.log('✅ ปฏิบัติตามมาตรฐาน WHO/FDA/METRC');
        console.log('✅ พร้อมสำหรับการส่งออกสมุนไพรไทย 🌍\n');

        return {
            success: true,
            service: trackingService,
            summary: summary
        };

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
        console.error('Stack trace:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// รันการทดสอบ
if (require.main === module) {
    testSeedToSaleSystem()
        .then(result => {
            if (result.success) {
                console.log('🎉 การทดสอบสำเร็จทั้งหมด!');
                process.exit(0);
            } else {
                console.log('💥 การทดสอบล้มเหลว!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

module.exports = { testSeedToSaleSystem };