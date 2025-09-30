/**
 * Online Audit System with Video Call and Digital Assessment
 * ระบบตรวจประเมินออนไลน์พร้อม Video Call และการประเมินดิจิทัล
 */

const express = require('express');
const router = express.Router();

class OnlineAuditSystem {
    constructor() {
        this.auditSessions = new Map();
        this.assessmentCriteria = this.initializeSOPCriteria();
        this.zoomConfig = {
            api_key: process.env.ZOOM_API_KEY,
            api_secret: process.env.ZOOM_API_SECRET,
            meeting_duration: 120 // นาที
        };
    }

    /**
     * เริ่มต้นการตรวจประเมินออนไลน์
     */
    async initiateOnlineAudit(applicationId, auditorId, farmerData) {
        try {
            const sessionId = `ONLINE_AUDIT_${Date.now()}`;
            
            // สร้าง Zoom Meeting
            const zoomMeeting = await this.createZoomMeeting(applicationId, farmerData);
            
            // สร้าง Session การตรวจประเมิน
            const auditSession = {
                session_id: sessionId,
                application_id: applicationId,
                auditor_id: auditorId,
                farmer_data: farmerData,
                zoom_meeting: zoomMeeting,
                status: 'INITIATED',
                start_time: new Date().toISOString(),
                sop_checklist: this.generateSOPChecklist(),
                photo_evidence: [],
                assessment_progress: 0,
                decision_pending: false,
                created_at: new Date().toISOString()
            };

            this.auditSessions.set(sessionId, auditSession);

            return {
                success: true,
                session_id: sessionId,
                zoom_meeting_url: zoomMeeting.join_url,
                zoom_meeting_id: zoomMeeting.id,
                zoom_password: zoomMeeting.password,
                assessment_checklist: auditSession.sop_checklist,
                message: 'การตรวจประเมินออนไลน์เริ่มต้นแล้ว'
            };

        } catch (error) {
            throw new Error(`Failed to initiate online audit: ${error.message}`);
        }
    }

    /**
     * สร้าง Zoom Meeting
     */
    async createZoomMeeting(applicationId, farmerData) {
        // จำลองการสร้าง Zoom Meeting
        const meetingId = Math.floor(Math.random() * 1000000000);
        const password = Math.random().toString(36).substring(2, 8);

        return {
            id: meetingId,
            topic: `GACP Online Audit - ${farmerData.farm_name || applicationId}`,
            type: 2, // Scheduled meeting
            start_time: new Date().toISOString(),
            duration: this.zoomConfig.meeting_duration,
            timezone: 'Asia/Bangkok',
            password: password,
            join_url: `https://zoom.us/j/${meetingId}?pwd=${password}`,
            settings: {
                host_video: true,
                participant_video: true,
                cn_meeting: false,
                in_meeting: false,
                join_before_host: false,
                mute_upon_entry: true,
                watermark: false,
                use_pmi: false,
                approval_type: 0,
                audio: 'both',
                auto_recording: 'cloud' // บันทึกการประชุม
            }
        };
    }

    /**
     * กำหนดเกณฑ์การประเมินตาม SOP
     */
    initializeSOPCriteria() {
        return {
            FARM_INFRASTRUCTURE: {
                name: 'โครงสร้างพื้นฐานฟาร์ม',
                weight: 15,
                checkpoints: [
                    { id: 'FI001', item: 'พื้นที่แปลงปลูกชัดเจน', required: true },
                    { id: 'FI002', item: 'ขอบเขตแปลงชัดเจน', required: true },
                    { id: 'FI003', item: 'ป้ายแสดงชื่อแปลง', required: false },
                    { id: 'FI004', item: 'ทางเข้า-ออกเหมาะสม', required: true }
                ]
            },
            WATER_MANAGEMENT: {
                name: 'การจัดการน้ำ',
                weight: 20,
                checkpoints: [
                    { id: 'WM001', item: 'แหล่งน้ำเพียงพอ', required: true },
                    { id: 'WM002', item: 'คุณภาพน้ำดี', required: true },
                    { id: 'WM003', item: 'ระบบชลประทานเหมาะสม', required: true },
                    { id: 'WM004', item: 'การระบายน้ำดี', required: true }
                ]
            },
            CULTIVATION_PRACTICES: {
                name: 'วิธีการปลูก',
                weight: 25,
                checkpoints: [
                    { id: 'CP001', item: 'ระยะปลูกเหมาะสม', required: true },
                    { id: 'CP002', item: 'การดูแลรักษาสม่ำเสมอ', required: true },
                    { id: 'CP003', item: 'การใช้ปุ่ยถูกต้อง', required: true },
                    { id: 'CP004', item: 'ไม่มีสารเคมีห้าม', required: true }
                ]
            },
            STORAGE_CONDITIONS: {
                name: 'การเก็บรักษา',
                weight: 20,
                checkpoints: [
                    { id: 'SC001', item: 'โกดังเก็บสินค้าเหมาะสม', required: true },
                    { id: 'SC002', item: 'อุณหภูมิและความชื้นเหมาะสม', required: true },
                    { id: 'SC003', item: 'การป้องกันแมลงศัตรูพืช', required: true },
                    { id: 'SC004', item: 'การจัดเรียงสินค้า', required: false }
                ]
            },
            DOCUMENTATION: {
                name: 'การบันทึกข้อมูล',
                weight: 20,
                checkpoints: [
                    { id: 'DOC001', item: 'บันทึกการปลูก', required: true },
                    { id: 'DOC002', item: 'บันทึกการใช้ปุ่ย', required: true },
                    { id: 'DOC003', item: 'บันทึกการเก็บเกี่ยว', required: true },
                    { id: 'DOC004', item: 'บันทึกการขาย', required: false }
                ]
            }
        };
    }

    /**
     * สร้าง Checklist สำหรับการประเมิน
     */
    generateSOPChecklist() {
        const checklist = [];
        
        Object.keys(this.assessmentCriteria).forEach(categoryKey => {
            const category = this.assessmentCriteria[categoryKey];
            
            category.checkpoints.forEach(checkpoint => {
                checklist.push({
                    category: categoryKey,
                    category_name: category.name,
                    checkpoint_id: checkpoint.id,
                    item: checkpoint.item,
                    required: checkpoint.required,
                    status: 'PENDING', // PENDING, PASS, FAIL, SUSPICIOUS
                    notes: '',
                    photo_required: true,
                    photos: [],
                    timestamp: null
                });
            });
        });

        return checklist;
    }

    /**
     * อัพเดตผลการประเมินแต่ละจุด
     */
    async updateCheckpoint(sessionId, checkpointId, assessment) {
        try {
            const session = this.auditSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // อัพเดต Checkpoint
            const checkpoint = session.sop_checklist.find(item => item.checkpoint_id === checkpointId);
            if (!checkpoint) {
                throw new Error('Checkpoint not found');
            }

            checkpoint.status = assessment.status; // PASS, FAIL, SUSPICIOUS
            checkpoint.notes = assessment.notes || '';
            checkpoint.timestamp = new Date().toISOString();

            // เพิ่มรูปภาพหลักฐาน
            if (assessment.photos && assessment.photos.length > 0) {
                checkpoint.photos = assessment.photos;
                session.photo_evidence.push(...assessment.photos);
            }

            // คำนวณความคืบหน้า
            const completedCheckpoints = session.sop_checklist.filter(item => item.status !== 'PENDING').length;
            session.assessment_progress = Math.round((completedCheckpoints / session.sop_checklist.length) * 100);

            // ตรวจสอบว่ามีข้อสงสัยหรือไม่
            const suspiciousItems = session.sop_checklist.filter(item => item.status === 'SUSPICIOUS');
            const failedRequiredItems = session.sop_checklist.filter(item => 
                item.required && item.status === 'FAIL'
            );

            session.decision_pending = suspiciousItems.length > 0 || failedRequiredItems.length > 0;

            this.auditSessions.set(sessionId, session);

            return {
                success: true,
                checkpoint_updated: checkpoint,
                progress: session.assessment_progress,
                decision_pending: session.decision_pending,
                suspicious_count: suspiciousItems.length,
                failed_required_count: failedRequiredItems.length
            };

        } catch (error) {
            throw new Error(`Failed to update checkpoint: ${error.message}`);
        }
    }

    /**
     * อัพโหลดรูปภาพหลักฐาน
     */
    async uploadPhotoEvidence(sessionId, checkpointId, photoData) {
        try {
            const session = this.auditSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const photoId = `PHOTO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const photoRecord = {
                photo_id: photoId,
                session_id: sessionId,
                checkpoint_id: checkpointId,
                file_name: photoData.fileName,
                file_size: photoData.fileSize,
                mime_type: photoData.mimeType,
                upload_timestamp: new Date().toISOString(),
                auditor_notes: photoData.notes || '',
                // จำลองการเก็บไฟล์
                file_path: `/uploads/audit-photos/${sessionId}/${photoId}.jpg`,
                thumbnail_path: `/uploads/audit-photos/${sessionId}/thumb_${photoId}.jpg`
            };

            // อัพเดต Checkpoint
            const checkpoint = session.sop_checklist.find(item => item.checkpoint_id === checkpointId);
            if (checkpoint) {
                checkpoint.photos.push(photoRecord);
            }

            session.photo_evidence.push(photoRecord);
            this.auditSessions.set(sessionId, session);

            return {
                success: true,
                photo_id: photoId,
                photo_url: photoRecord.file_path,
                thumbnail_url: photoRecord.thumbnail_path,
                message: 'อัพโหลดรูปภาพหลักฐานสำเร็จ'
            };

        } catch (error) {
            throw new Error(`Failed to upload photo: ${error.message}`);
        }
    }

    /**
     * คำนวณผลการประเมินและตัดสินใจ
     */
    async calculateAssessmentResult(sessionId) {
        try {
            const session = this.auditSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const results = {
                session_id: sessionId,
                total_checkpoints: session.sop_checklist.length,
                completed_checkpoints: 0,
                passed_checkpoints: 0,
                failed_checkpoints: 0,
                suspicious_checkpoints: 0,
                category_scores: {},
                overall_score: 0,
                decision: 'PENDING',
                next_action: 'CONTINUE_ASSESSMENT'
            };

            // คำนวณคะแนนแต่ละหมวด
            Object.keys(this.assessmentCriteria).forEach(categoryKey => {
                const category = this.assessmentCriteria[categoryKey];
                const categoryCheckpoints = session.sop_checklist.filter(item => item.category === categoryKey);
                
                const passedInCategory = categoryCheckpoints.filter(item => item.status === 'PASS').length;
                const totalInCategory = categoryCheckpoints.length;
                const categoryScore = totalInCategory > 0 ? (passedInCategory / totalInCategory) * category.weight : 0;

                results.category_scores[categoryKey] = {
                    name: category.name,
                    weight: category.weight,
                    passed: passedInCategory,
                    total: totalInCategory,
                    score: Math.round(categoryScore * 100) / 100
                };
            });

            // คำนวณสถิติรวม
            session.sop_checklist.forEach(checkpoint => {
                if (checkpoint.status !== 'PENDING') {
                    results.completed_checkpoints++;
                    
                    switch (checkpoint.status) {
                        case 'PASS':
                            results.passed_checkpoints++;
                            break;
                        case 'FAIL':
                            results.failed_checkpoints++;
                            break;
                        case 'SUSPICIOUS':
                            results.suspicious_checkpoints++;
                            break;
                    }
                }
            });

            // คำนวณคะแนนรวม
            results.overall_score = Object.values(results.category_scores)
                .reduce((sum, category) => sum + category.score, 0);

            // ตัดสินใจขั้นต่อไป
            const failedRequired = session.sop_checklist.filter(item => 
                item.required && item.status === 'FAIL'
            );

            if (results.completed_checkpoints < results.total_checkpoints) {
                results.decision = 'ASSESSMENT_INCOMPLETE';
                results.next_action = 'CONTINUE_ASSESSMENT';
            } else if (failedRequired.length > 0) {
                results.decision = 'FAILED';
                results.next_action = 'REJECT_APPLICATION';
                results.failed_required_items = failedRequired.map(item => ({
                    id: item.checkpoint_id,
                    item: item.item,
                    notes: item.notes
                }));
            } else if (results.suspicious_checkpoints > 0) {
                results.decision = 'REQUIRES_VERIFICATION';
                results.next_action = 'SCHEDULE_FOLLOWUP';
                results.suspicious_items = session.sop_checklist
                    .filter(item => item.status === 'SUSPICIOUS')
                    .map(item => ({
                        id: item.checkpoint_id,
                        item: item.item,
                        notes: item.notes
                    }));
            } else if (results.overall_score >= 75) {
                results.decision = 'APPROVED';
                results.next_action = 'ISSUE_CERTIFICATE';
            } else {
                results.decision = 'REQUIRES_IMPROVEMENT';
                results.next_action = 'SCHEDULE_REAUDIT';
            }

            return results;

        } catch (error) {
            throw new Error(`Failed to calculate assessment result: ${error.message}`);
        }
    }

    /**
     * ตัดสินใจขั้นต่อไปหลังการประเมิน
     */
    async makeAuditDecision(sessionId, auditorDecision) {
        try {
            const session = this.auditSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const assessmentResult = await this.calculateAssessmentResult(sessionId);
            
            let finalDecision = {
                session_id: sessionId,
                auditor_decision: auditorDecision,
                system_recommendation: assessmentResult.decision,
                final_action: '',
                reasoning: '',
                next_steps: [],
                timestamp: new Date().toISOString()
            };

            switch (auditorDecision.action) {
                case 'APPROVE_IMMEDIATELY':
                    finalDecision.final_action = 'ISSUE_CERTIFICATE';
                    finalDecision.reasoning = 'ผ่านการประเมินออนไลน์ ไม่มีข้อสงสัย';
                    finalDecision.next_steps = [
                        'ออกใบรับรองภายใน 3-5 วันทำการ',
                        'ส่งใบรับรองทางอีเมลและไปรษณีย์',
                        'เพิ่มเข้าฐานข้อมูลผู้ได้รับการรับรอง'
                    ];
                    break;

                case 'SCHEDULE_ONLINE_FOLLOWUP':
                    finalDecision.final_action = 'SCHEDULE_ONLINE_MEETING';
                    finalDecision.reasoning = 'มีข้อสงสัยเล็กน้อย ต้องชี้แจงเพิ่มเติม';
                    finalDecision.next_steps = [
                        'นัดหมาย Video Call รอบเพิ่มเติม',
                        'ขอเอกสารหลักฐานเพิ่มเติม',
                        'ตรวจสอบจุดที่น่าสงสัย'
                    ];
                    break;

                case 'SCHEDULE_FIELD_AUDIT':
                    finalDecision.final_action = 'SCHEDULE_PHYSICAL_INSPECTION';
                    finalDecision.reasoning = 'ต้องการตรวจสอบภาคสนามเพื่อยืนยัน';
                    finalDecision.next_steps = [
                        'ประสานงานการนัดหมายลงพื้นที่',
                        'แจ้งกำหนดการตรวจสอบล่วงหน้า 7 วัน',
                        'เตรียมทีมตรวจสอบภาคสนาม'
                    ];
                    break;

                case 'REJECT_APPLICATION':
                    finalDecision.final_action = 'REJECT_WITH_FEEDBACK';
                    finalDecision.reasoning = 'ไม่ผ่านเกณฑ์การประเมิน';
                    finalDecision.next_steps = [
                        'แจ้งผลการประเมินพร้อมเหตุผล',
                        'แนะนำการปรับปรุง',
                        'เปิดโอกาสยื่นขอใหม่หลังแก้ไข'
                    ];
                    break;
            }

            // อัพเดต Session
            session.status = 'COMPLETED';
            session.end_time = new Date().toISOString();
            session.final_decision = finalDecision;
            session.assessment_result = assessmentResult;

            this.auditSessions.set(sessionId, session);

            return {
                success: true,
                decision: finalDecision,
                assessment_result: assessmentResult,
                session_summary: {
                    duration: this.calculateSessionDuration(session.start_time, session.end_time),
                    photos_collected: session.photo_evidence.length,
                    checkpoints_completed: assessmentResult.completed_checkpoints,
                    overall_score: assessmentResult.overall_score
                }
            };

        } catch (error) {
            throw new Error(`Failed to make audit decision: ${error.message}`);
        }
    }

    /**
     * จัดการการนัดหมายครั้งต่อไป
     */
    async scheduleFollowUp(sessionId, followUpType, proposedDates) {
        try {
            const session = this.auditSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const followUpId = `FOLLOWUP_${Date.now()}`;
            const followUp = {
                followup_id: followUpId,
                original_session_id: sessionId,
                type: followUpType, // ONLINE_MEETING, FIELD_AUDIT
                status: 'SCHEDULED',
                proposed_dates: proposedDates,
                scheduled_date: null,
                special_focus_areas: session.sop_checklist
                    .filter(item => item.status === 'SUSPICIOUS')
                    .map(item => item.checkpoint_id),
                created_at: new Date().toISOString()
            };

            if (followUpType === 'ONLINE_MEETING') {
                // สร้าง Zoom Meeting ใหม่
                followUp.zoom_meeting = await this.createZoomMeeting(
                    session.application_id, 
                    session.farmer_data
                );
            }

            return {
                success: true,
                followup_id: followUpId,
                type: followUpType,
                zoom_meeting: followUp.zoom_meeting,
                focus_areas: followUp.special_focus_areas,
                proposed_dates: proposedDates,
                message: `นัดหมาย${followUpType === 'ONLINE_MEETING' ? 'ออนไลน์' : 'ลงพื้นที่'}เพิ่มเติมแล้ว`
            };

        } catch (error) {
            throw new Error(`Failed to schedule follow-up: ${error.message}`);
        }
    }

    /**
     * ดูข้อมูล Session
     */
    getAuditSession(sessionId) {
        return this.auditSessions.get(sessionId) || null;
    }

    /**
     * คำนวณระยะเวลา Session
     */
    calculateSessionDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return {
            total_minutes: minutes,
            display: hours > 0 ? `${hours} ชั่วโมง ${remainingMinutes} นาที` : `${remainingMinutes} นาที`
        };
    }
}

// Export class และ router
const onlineAuditSystem = new OnlineAuditSystem();

// API Routes
router.post('/initiate', async (req, res) => {
    try {
        const { application_id, auditor_id, farmer_data } = req.body;
        const result = await onlineAuditSystem.initiateOnlineAudit(application_id, auditor_id, farmer_data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/checkpoint/update', async (req, res) => {
    try {
        const { session_id, checkpoint_id, assessment } = req.body;
        const result = await onlineAuditSystem.updateCheckpoint(session_id, checkpoint_id, assessment);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/photo/upload', async (req, res) => {
    try {
        const { session_id, checkpoint_id, photo_data } = req.body;
        const result = await onlineAuditSystem.uploadPhotoEvidence(session_id, checkpoint_id, photo_data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/decision', async (req, res) => {
    try {
        const { session_id, auditor_decision } = req.body;
        const result = await onlineAuditSystem.makeAuditDecision(session_id, auditor_decision);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/schedule-followup', async (req, res) => {
    try {
        const { session_id, followup_type, proposed_dates } = req.body;
        const result = await onlineAuditSystem.scheduleFollowUp(session_id, followup_type, proposed_dates);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/session/:sessionId', (req, res) => {
    try {
        const session = onlineAuditSystem.getAuditSession(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { OnlineAuditSystem, router, onlineAuditSystem };