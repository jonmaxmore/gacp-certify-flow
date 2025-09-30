/**
 * Online Audit System Demo
 * สาธิตระบบตรวจประเมินออนไลน์
 */

const { OnlineAuditSystem } = require('../services/online-audit-system');

class OnlineAuditDemo {
    constructor() {
        this.auditSystem = new OnlineAuditSystem();
        this.demoData = this.prepareDemoData();
    }

    prepareDemoData() {
        return {
            farmer: {
                farmer_id: 'FARMER_001',
                name: 'นายสมชาย ใจดี',
                farm_name: 'ฟาร์มสมุนไพรใจดี',
                location: 'เชียงใหม่',
                farm_size: '2.5 ไร่',
                herbs: ['ขิง', 'ขมิ้น', 'ไพล']
            },
            auditor: {
                auditor_id: 'AUDITOR_001',
                name: 'ดร.สมหญิง ตรวจสอบ',
                certification: 'GACP Certified Auditor',
                experience: '5 ปี'
            },
            application: {
                application_id: 'GACP-2025-ONLINE-001',
                submitted_date: '2025-09-25',
                farm_coordinates: '18.7883,98.9853',
                audit_type: 'ONLINE_FIRST_ASSESSMENT'
            }
        };
    }

    async runFullDemo() {
        console.log('🌿 เริ่มต้นการสาธิต GACP Online Audit System');
        console.log('=' .repeat(60));

        try {
            // Step 1: เริ่มต้นการตรวจประเมินออนไลน์
            console.log('\n📋 Step 1: เริ่มต้นการตรวจประเมินออนไลน์');
            const initResult = await this.auditSystem.initiateOnlineAudit(
                this.demoData.application.application_id,
                this.demoData.auditor.auditor_id,
                this.demoData.farmer
            );

            console.log('✅ สร้าง Session สำเร็จ:');
            console.log(`   Session ID: ${initResult.session_id}`);
            console.log(`   Zoom Meeting: ${initResult.zoom_meeting_id}`);
            console.log(`   Join URL: ${initResult.zoom_meeting_url}`);
            console.log(`   Checklist Items: ${initResult.assessment_checklist.length}`);

            const sessionId = initResult.session_id;

            // Step 2: จำลองการประเมินแต่ละจุด
            console.log('\n🔍 Step 2: การประเมินแต่ละจุด SOP');
            await this.simulateCheckpointAssessments(sessionId);

            // Step 3: คำนวณผลการประเมิน
            console.log('\n📊 Step 3: คำนวณผลการประเมิน');
            const assessmentResult = await this.auditSystem.calculateAssessmentResult(sessionId);
            this.displayAssessmentResult(assessmentResult);

            // Step 4: ตัดสินใจขั้นต่อไป
            console.log('\n🎯 Step 4: การตัดสินใจขั้นต่อไป');
            await this.demonstrateDecisionMaking(sessionId);

            // Step 5: แสดงสรุปผล
            console.log('\n📑 Step 5: สรุปผลการตรวจประเมิน');
            this.displaySessionSummary(sessionId);

        } catch (error) {
            console.error('❌ Error in demo:', error.message);
        }
    }

    async simulateCheckpointAssessments(sessionId) {
        const session = this.auditSystem.getAuditSession(sessionId);
        const checkpoints = session.sop_checklist;

        console.log(`📝 จำลองการประเมิน ${checkpoints.length} จุดตรวจสอบ`);

        for (let i = 0; i < checkpoints.length; i++) {
            const checkpoint = checkpoints[i];
            
            // จำลองการประเมิน (80% ผ่าน, 10% ไม่ผ่าน, 10% น่าสงสัย)
            let status = 'PASS';
            let notes = 'อยู่ในเกณฑ์มาตรฐาน';
            
            const random = Math.random();
            if (random < 0.1) {
                status = 'FAIL';
                notes = 'ไม่เป็นไปตามมาตรฐาน ต้องปรับปรุง';
            } else if (random < 0.2) {
                status = 'SUSPICIOUS';
                notes = 'มีข้อสงสัย ต้องตรวจสอบเพิ่มเติม';
            }

            // จำลองการถ่ายรูป
            await this.simulatePhotoCapture(sessionId, checkpoint.checkpoint_id);

            // อัพเดตผลการประเมิน
            const updateResult = await this.auditSystem.updateCheckpoint(
                sessionId, 
                checkpoint.checkpoint_id, 
                {
                    status: status,
                    notes: notes,
                    photos: [`PHOTO_${checkpoint.checkpoint_id}_${Date.now()}`]
                }
            );

            console.log(`   ${this.getStatusIcon(status)} ${checkpoint.item} - ${status}`);
            if (notes) {
                console.log(`     💬 ${notes}`);
            }

            // แสดงความคืบหน้า
            if ((i + 1) % 5 === 0 || i === checkpoints.length - 1) {
                console.log(`     📊 ความคืบหน้า: ${updateResult.progress}%`);
            }
        }
    }

    async simulatePhotoCapture(sessionId, checkpointId) {
        // จำลองการอัพโหลดรูปภาพ
        const photoData = {
            fileName: `evidence_${checkpointId}.jpg`,
            fileSize: 1024 * 500, // 500KB
            mimeType: 'image/jpeg',
            notes: 'รูปภาพหลักฐานการตรวจสอบ'
        };

        await this.auditSystem.uploadPhotoEvidence(sessionId, checkpointId, photoData);
    }

    displayAssessmentResult(result) {
        console.log('📊 ผลการประเมิน:');
        console.log(`   ✅ ผ่าน: ${result.passed_checkpoints} จุด`);
        console.log(`   ❌ ไม่ผ่าน: ${result.failed_checkpoints} จุด`);
        console.log(`   ⚠️  น่าสงสัย: ${result.suspicious_checkpoints} จุด`);
        console.log(`   🏆 คะแนนรวม: ${result.overall_score.toFixed(1)} คะแนน`);

        console.log('\n📈 คะแนนแยกตามหมวด:');
        Object.keys(result.category_scores).forEach(categoryKey => {
            const category = result.category_scores[categoryKey];
            console.log(`   📂 ${category.name}: ${category.score.toFixed(1)}/${category.weight} คะแนน (${category.passed}/${category.total})`);
        });

        console.log(`\n🎯 การตัดสินใจของระบบ: ${this.getDecisionText(result.decision)}`);
        console.log(`🔄 ขั้นตอนต่อไป: ${this.getNextActionText(result.next_action)}`);

        if (result.suspicious_items && result.suspicious_items.length > 0) {
            console.log('\n⚠️  รายการที่น่าสงสัย:');
            result.suspicious_items.forEach(item => {
                console.log(`   - ${item.item}: ${item.notes}`);
            });
        }

        if (result.failed_required_items && result.failed_required_items.length > 0) {
            console.log('\n❌ รายการจำเป็นที่ไม่ผ่าน:');
            result.failed_required_items.forEach(item => {
                console.log(`   - ${item.item}: ${item.notes}`);
            });
        }
    }

    async demonstrateDecisionMaking(sessionId) {
        const assessmentResult = await this.auditSystem.calculateAssessmentResult(sessionId);
        
        let auditorDecision;
        
        // จำลองการตัดสินใจของผู้ตรวจสอบ
        if (assessmentResult.failed_checkpoints === 0 && assessmentResult.suspicious_checkpoints === 0) {
            auditorDecision = {
                action: 'APPROVE_IMMEDIATELY',
                reasoning: 'ผ่านการประเมินทุกจุด ไม่มีข้อสงสัย',
                confidence_level: 'HIGH'
            };
        } else if (assessmentResult.suspicious_checkpoints > 0) {
            if (Math.random() > 0.5) {
                auditorDecision = {
                    action: 'SCHEDULE_ONLINE_FOLLOWUP',
                    reasoning: 'มีจุดที่น่าสงสัย ต้องชี้แจงเพิ่มเติมผ่าน Video Call',
                    confidence_level: 'MEDIUM'
                };
            } else {
                auditorDecision = {
                    action: 'SCHEDULE_FIELD_AUDIT',
                    reasoning: 'จำเป็นต้องลงพื้นที่ตรวจสอบภาคสนามเพื่อยืนยัน',
                    confidence_level: 'LOW'
                };
            }
        } else {
            auditorDecision = {
                action: 'REJECT_APPLICATION',
                reasoning: 'มีรายการจำเป็นที่ไม่ผ่านเกณฑ์',
                confidence_level: 'HIGH'
            };
        }

        console.log('🎯 การตัดสินใจของผู้ตรวจสอบ:');
        console.log(`   📋 การดำเนินการ: ${this.getActionText(auditorDecision.action)}`);
        console.log(`   💭 เหตุผล: ${auditorDecision.reasoning}`);
        console.log(`   📊 ความเชื่อมั่น: ${auditorDecision.confidence_level}`);

        // ทำการตัดสินใจ
        const decisionResult = await this.auditSystem.makeAuditDecision(sessionId, auditorDecision);

        console.log('\n✅ ผลการตัดสินใจ:');
        console.log(`   🎯 การดำเนินการสุดท้าย: ${decisionResult.decision.final_action}`);
        console.log(`   📝 เหตุผล: ${decisionResult.decision.reasoning}`);
        
        console.log('\n📋 ขั้นตอนต่อไป:');
        decisionResult.decision.next_steps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step}`);
        });

        // ถ้าต้องนัดหมายครั้งต่อไป
        if (auditorDecision.action === 'SCHEDULE_ONLINE_FOLLOWUP' || 
            auditorDecision.action === 'SCHEDULE_FIELD_AUDIT') {
            await this.demonstrateFollowUpScheduling(sessionId, auditorDecision.action);
        }

        return decisionResult;
    }

    async demonstrateFollowUpScheduling(sessionId, followUpType) {
        console.log(`\n📅 การนัดหมาย${followUpType === 'SCHEDULE_ONLINE_FOLLOWUP' ? 'ออนไลน์' : 'ลงพื้นที่'}:`);
        
        const proposedDates = [
            '2025-10-05T09:00:00.000Z',
            '2025-10-06T14:00:00.000Z',
            '2025-10-07T10:00:00.000Z'
        ];

        const followUpResult = await this.auditSystem.scheduleFollowUp(
            sessionId, 
            followUpType === 'SCHEDULE_ONLINE_FOLLOWUP' ? 'ONLINE_MEETING' : 'FIELD_AUDIT',
            proposedDates
        );

        console.log(`   📝 Follow-up ID: ${followUpResult.followup_id}`);
        console.log(`   📋 ประเภท: ${followUpResult.type}`);
        
        if (followUpResult.zoom_meeting) {
            console.log(`   🔗 Zoom Meeting: ${followUpResult.zoom_meeting.id}`);
        }
        
        console.log(`   🎯 จุดที่ต้องเน้น: ${followUpResult.focus_areas.length} รายการ`);
        console.log('   📅 วันที่เสนอ:');
        proposedDates.forEach((date, index) => {
            console.log(`      ${index + 1}. ${new Date(date).toLocaleString('th-TH')}`);
        });
    }

    displaySessionSummary(sessionId) {
        const session = this.auditSystem.getAuditSession(sessionId);
        
        console.log('📑 สรุปผลการตรวจประเมินออนไลน์:');
        console.log('=' .repeat(60));
        
        console.log(`📋 ข้อมูลเซสชัน:`);
        console.log(`   🆔 Session ID: ${session.session_id}`);
        console.log(`   🌾 เกษตรกร: ${session.farmer_data.name}`);
        console.log(`   👨‍💼 ผู้ตรวจสอบ: ${this.demoData.auditor.name}`);
        console.log(`   ⏰ เริ่มต้น: ${new Date(session.start_time).toLocaleString('th-TH')}`);
        console.log(`   ⏱️  สิ้นสุด: ${new Date(session.end_time).toLocaleString('th-TH')}`);
        
        const duration = this.auditSystem.calculateSessionDuration(session.start_time, session.end_time);
        console.log(`   🕐 ระยะเวลา: ${duration.display}`);

        console.log(`\n📊 สถิติการประเมิน:`);
        console.log(`   📝 จุดตรวจสอบทั้งหมด: ${session.sop_checklist.length}`);
        console.log(`   ✅ ผ่าน: ${session.sop_checklist.filter(cp => cp.status === 'PASS').length}`);
        console.log(`   ❌ ไม่ผ่าน: ${session.sop_checklist.filter(cp => cp.status === 'FAIL').length}`);
        console.log(`   ⚠️  น่าสงสัย: ${session.sop_checklist.filter(cp => cp.status === 'SUSPICIOUS').length}`);
        console.log(`   📷 รูปภาพหลักฐาน: ${session.photo_evidence.length} รูป`);

        if (session.final_decision) {
            console.log(`\n🎯 การตัดสินใจสุดท้าย:`);
            console.log(`   📋 การดำเนินการ: ${session.final_decision.final_action}`);
            console.log(`   💭 เหตุผล: ${session.final_decision.reasoning}`);
        }

        console.log(`\n🌟 ข้อดีของระบบตรวจประเมินออนไลน์:`);
        console.log(`   ⚡ ประหยัดเวลาและค่าใช้จ่าย`);
        console.log(`   🌍 สามารถเข้าถึงได้ทุกที่`);
        console.log(`   📋 มีระบบ SOP ที่ชัดเจน`);
        console.log(`   📷 บันทึกหลักฐานครบถ้วน`);
        console.log(`   🎯 ตัดสินใจได้อย่างมีระบบ`);
        
        console.log('\n🎉 การสาธิตเสร็จสิ้น!');
    }

    // Helper methods
    getStatusIcon(status) {
        const icons = {
            'PASS': '✅',
            'FAIL': '❌',
            'SUSPICIOUS': '⚠️',
            'PENDING': '⏳'
        };
        return icons[status] || '❓';
    }

    getDecisionText(decision) {
        const texts = {
            'APPROVED': '✅ อนุมัติ',
            'REQUIRES_VERIFICATION': '⚠️ ต้องตรวจสอบเพิ่มเติม',
            'REQUIRES_IMPROVEMENT': '🔄 ต้องปรับปรุง',
            'FAILED': '❌ ไม่ผ่านเกณฑ์',
            'ASSESSMENT_INCOMPLETE': '⏳ การประเมินยังไม่เสร็จ'
        };
        return texts[decision] || decision;
    }

    getNextActionText(action) {
        const texts = {
            'ISSUE_CERTIFICATE': '📜 ออกใบรับรอง',
            'SCHEDULE_FOLLOWUP': '📅 นัดหมายติดตาม',
            'SCHEDULE_REAUDIT': '🔄 นัดตรวจซ้ำ',
            'REJECT_APPLICATION': '❌ ปฏิเสธใบสมัคร',
            'CONTINUE_ASSESSMENT': '▶️ ประเมินต่อ'
        };
        return texts[action] || action;
    }

    getActionText(action) {
        const texts = {
            'APPROVE_IMMEDIATELY': '✅ อนุมัติทันที',
            'SCHEDULE_ONLINE_FOLLOWUP': '💻 นัดออนไลน์เพิ่มเติม',
            'SCHEDULE_FIELD_AUDIT': '🚗 ลงพื้นที่ตรวจสอบ',
            'REJECT_APPLICATION': '❌ ปฏิเสธใบสมัคร'
        };
        return texts[action] || action;
    }
}

// รันการสาธิต
async function runDemo() {
    const demo = new OnlineAuditDemo();
    await demo.runFullDemo();
}

// Export for testing
module.exports = { OnlineAuditDemo, runDemo };

// รันถ้าเรียกไฟล์นี้โดยตรง
if (require.main === module) {
    runDemo().catch(console.error);
}