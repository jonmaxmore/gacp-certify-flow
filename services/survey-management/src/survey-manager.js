/**
 * 🌾 GACP Survey Management System
 * ระบบจัดการแบบสอบถามสมุนไพรไทย แยกตามภูมิภาค
 * - ภาคเหนือ: กัญชา, กระชายดำ, ไพล, ขมิ้นชัน, พริกไทย, โกฐเชียงกง
 * - ภาคใต้: กระชาย, ขมิ้น, สะตอ, พริก, ข่า, ตะไคร้
 * - ภาคกลาง: ตะไคร้, ใบเตย, ขมิ้น, ขิง, กระเพรา, โหระพา
 * - ภาคตะวันออกเฉียงเหนือ: ฟ้าทะลายโจร, ว่านหางจระเข้, บัวบก, ตะไคร้, ขิง
 * 
 * @author GACP Development Team
 * @version 2.0.0
 */

const { v4: uuidv4 } = require('uuid');

class SurveyManager {
    constructor() {
        this.surveys = new Map();
        this.responses = new Map();
        this.guestSessions = new Map(); // สำหรับผู้ที่ไม่ได้ล็อกอิน
        
        // ข้อมูลภูมิภาคไทย
        this.regions = {
            'north': {
                name: 'ภาคเหนือ',
                icon: '🏔️',
                provinces: ['เชียงใหม่', 'เชียงราย', 'ลำพูน', 'ลำปาง', 'พะเยา', 'แพร่', 'น่าน', 'แม่ฮ่องสอน', 'อุตรดิตถ์'],
                climate: 'อากาศหนาวเย็น มีหมอกหนา อุณหภูมิ 15-32°C',
                mainHerbs: ['กัญชา', 'ขมิ้นชัน', 'ขิง', 'กระชายดำ', 'ไพล', 'กระท่อม'],
                characteristics: ['เกษตรกรรายย่อย 70%', 'องค์ความรู้ภูมิปัญญาล้านนา', 'การปลูกแบบผสมผสาน', 'ศูนย์กลางการปลูกกัญชาทางการแพทย์']
            },
            'south': {
                name: 'ภาคใต้',
                icon: '🌴',
                provinces: ['สงขลา', 'ปัตตานี', 'ยะลา', 'นราธิวาส', 'ชุมพร', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'กระบี่', 'ภูเก็ต', 'พังงา', 'ระนอง', 'สตูล', 'ตรัง', 'พัทลุง'],
                climate: 'ชื้น ฝนตกตลอดปี อุณหภูมิ 24-34°C',
                mainHerbs: ['กัญชา', 'ขมิ้นชัน', 'ขิง', 'กระชายดำ', 'ไพล', 'กระท่อม'],
                characteristics: ['ผสมผสานวัฒนธรรมมุสลิม', 'การท่องเที่ยว + สมุนไพร', 'มีตลาด Halal', 'การปลูกกัญชาในเขตร้อนชื้น']
            },
            'central': {
                name: 'ภาคกลาง',
                icon: '🏭',
                provinces: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'สมุทรสงคราม', 'นครปฐม', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'กาญจนบุรี', 'สุพรรณบุรี', 'นครนายก', 'ฉะเชิงเทรา', 'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'สระแก้ว', 'ปราจีนบุรี', 'อ่างทอง', 'พระนครศรีอยุธยา'],
                climate: 'ร้อนชื้น ฝนตกสม่ำเสมอ',
                mainHerbs: ['กัญชา', 'ขมิ้นชัน', 'ขิง', 'กระชายดำ', 'ไพล', 'กระท่อม'],
                characteristics: ['ผู้ประกอบการ SME 60%', 'โรงงานขนาดกลาง-ใหญ่ 30%', 'เกษตรกร 10%', 'เน้นการแปรรูปและส่งออก', 'ศูนย์กลางธุรกิจกัญชาทางการแพทย์']
            },
            'northeast': {
                name: 'ภาคตะวันออกเฉียงเหนือ',
                icon: '🌾',
                provinces: ['นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศิลาลัย', 'อุบลราชธานี', 'ยโสธร', 'ชัยภูมิ', 'อำนาจเจริญ', 'หนองบัวลำภู', 'ขอนแก่น', 'อุดรธานี', 'เลย', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'บึงกาฬ'],
                climate: 'แห้งแล้ง ฝนน้อย อุณหภูมิสูง 25-40°C',
                mainHerbs: ['กัญชา', 'ขมิ้นชัน', 'ขิง', 'กระชายดำ', 'ไพล', 'กระท่อม'],
                characteristics: ['เกษตรกรรายย่อย 80%', 'พื้นที่ปลูกเฉลี่ย 3-5 ไร่', 'ทำเกษตรผสมผสาน', 'รายได้เสริมจากปศุสัตว์', 'การปลูกกัญชาทนแล้ง']
            }
        };
    }

    /**
     * 🎯 เริ่มต้นแบบสอบถาม
     */
    async initiateSurvey(userInfo = null) {
        const sessionId = uuidv4();
        const isGuest = !userInfo;
        
        const surveySession = {
            id: sessionId,
            isGuest,
            userInfo: userInfo || {},
            guestInfo: isGuest ? {} : null,
            selectedRegion: null,
            currentStep: isGuest ? 'guest-info' : 'region-selection',
            startedAt: new Date(),
            responses: {},
            status: 'in-progress'
        };

        if (isGuest) {
            this.guestSessions.set(sessionId, surveySession);
        } else {
            this.surveys.set(sessionId, surveySession);
        }

        return {
            sessionId,
            isGuest,
            nextStep: surveySession.currentStep,
            message: isGuest ? 
                '👋 ยินดีต้อนรับ! เนื่องจากคุณยังไม่ได้ล็อกอิน กรุณากรอกข้อมูลส่วนตัวและข้อมูลฟาร์มก่อนทำแบบสอบถาม' :
                '🌿 ยินดีต้อนรับเข้าสู่ระบบแบบสอบถามสมุนไพรไทย'
        };
    }

    /**
     * 📝 กรอกข้อมูลส่วนตัวสำหรับ Guest
     */
    async submitGuestInfo(sessionId, guestInfo) {
        const session = this.guestSessions.get(sessionId);
        if (!session || !session.isGuest) {
            throw new Error('Invalid guest session');
        }

        // ตรวจสอบข้อมูลที่จำเป็น
        const requiredFields = ['name', 'phone', 'province', 'district', 'farmType', 'farmSize'];
        const missingFields = requiredFields.filter(field => !guestInfo[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        session.guestInfo = guestInfo;
        session.currentStep = 'region-selection';

        // อัพเดท guest session
        this.guestSessions.set(sessionId, session);

        return {
            success: true,
            nextStep: 'region-selection',
            message: '✅ ข้อมูลส่วนตัวสำเร็จ! กรุณาเลือกภูมิภาคของคุณ'
        };
    }

    /**
     * 🗺️ เลือกภูมิภาค
     */
    async selectRegion(sessionId, regionCode) {
        const session = this.surveys.get(sessionId) || this.guestSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session');
        }

        if (!this.regions[regionCode]) {
            throw new Error('Invalid region code');
        }

        session.selectedRegion = regionCode;
        session.currentStep = 'survey-questions';

        return {
            success: true,
            region: this.regions[regionCode],
            nextStep: 'survey-questions',
            message: `🎯 เลือก${this.regions[regionCode].name} สำเร็จ! เริ่มทำแบบสอบถาม`
        };
    }

    /**
     * 📊 รับคำตอบแบบสอบถาม
     */
    async submitSurveyResponse(sessionId, questionId, response) {
        const session = this.surveys.get(sessionId) || this.guestSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session');
        }

        if (!session.selectedRegion) {
            throw new Error('Region not selected');
        }

        // เก็บคำตอบ
        if (!session.responses[session.selectedRegion]) {
            session.responses[session.selectedRegion] = {};
        }
        
        session.responses[session.selectedRegion][questionId] = {
            answer: response,
            answeredAt: new Date()
        };

        return {
            success: true,
            message: 'คำตอบถูกบันทึกแล้ว'
        };
    }

    /**
     * ✅ ส่งแบบสอบถามสำเร็จ
     */
    async completeSurvey(sessionId) {
        const session = this.surveys.get(sessionId) || this.guestSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session');
        }

        session.status = 'completed';
        session.completedAt = new Date();

        // สร้างรายงานสรุป
        const summary = this.generateSurveyReport(session);

        // บันทึกลงฐานข้อมูล responses
        const responseId = uuidv4();
        this.responses.set(responseId, {
            id: responseId,
            sessionId,
            isGuest: session.isGuest,
            userInfo: session.isGuest ? session.guestInfo : session.userInfo,
            region: session.selectedRegion,
            responses: session.responses,
            summary,
            completedAt: session.completedAt
        });

        return {
            success: true,
            responseId,
            summary,
            message: '🎉 ขอบคุณที่ทำแบบสอบถาม! ข้อมูลจะช่วยพัฒนาภาคเกษตรไทย'
        };
    }

    /**
     * 📈 สร้างรายงานสรุปผล
     */
    generateSurveyReport(session) {
        const region = this.regions[session.selectedRegion];
        const responses = session.responses[session.selectedRegion] || {};
        
        return {
            participantInfo: {
                type: session.isGuest ? 'Guest' : 'Registered User',
                region: region.name,
                submittedAt: session.completedAt
            },
            responseCount: Object.keys(responses).length,
            keyInsights: this.extractKeyInsights(session.selectedRegion, responses),
            recommendations: this.generateRecommendations(session.selectedRegion, responses)
        };
    }

    /**
     * 🔍 วิเคราะห์ข้อมูลเชิงลึก
     */
    extractKeyInsights(regionCode, responses) {
        const insights = [];
        
        // วิเคราะห์ตามประเภทผู้ตอบ
        if (responses['participant_type']) {
            insights.push(`ประเภทผู้ตอบ: ${responses['participant_type'].answer}`);
        }

        // วิเคราะห์สมุนไพรที่ปลูก
        if (responses['current_herbs']) {
            insights.push(`สมุนไพรหลักที่ปลูก: ${responses['current_herbs'].answer}`);
        }

        // วิเคราะห์ปัญหาสำคัญ
        if (responses['main_problems']) {
            insights.push(`ปัญหาหลัก: ${responses['main_problems'].answer}`);
        }

        return insights;
    }

    /**
     * 💡 สร้างข้อเสนอแนะ
     */
    generateRecommendations(regionCode, responses) {
        const region = this.regions[regionCode];
        const recommendations = [];

        // ข้อเสนอแนะทั่วไปตามภูมิภาค
        switch (regionCode) {
            case 'north':
                recommendations.push('🏔️ แนะนำการปลูกสมุนไพรที่เหมาะกับภูมิอากาศหนาวเย็น');
                recommendations.push('🌿 ใช้ประโยชน์จากภูมิปัญญาล้านนา');
                break;
            case 'south':
                recommendations.push('🌴 พัฒนาสู่ตลาด Halal และการท่องเที่ยว');
                recommendations.push('🌊 จัดการความชื้นและการระบายน้ำ');
                break;
            case 'central':
                recommendations.push('🏭 โอกาสการแปรรูปและส่งออก');
                recommendations.push('💼 เชื่อมโยงกับผู้ประกอบการ SME');
                break;
            case 'northeast':
                recommendations.push('🌾 เน้นพืชทนแล้งและการจัดการน้ำ');
                recommendations.push('🤝 การรวมกลุ่มเกษตรกร');
                break;
        }

        return recommendations;
    }

    /**
     * 📊 ดึงข้อมูลสถิติทั้งหมด
     */
    async getAllSurveyStatistics() {
        const stats = {
            totalResponses: this.responses.size,
            byRegion: {},
            byParticipantType: {},
            completionRate: 0
        };

        // สถิติตามภูมิภาค
        for (const [id, response] of this.responses) {
            const region = response.region;
            if (!stats.byRegion[region]) {
                stats.byRegion[region] = 0;
            }
            stats.byRegion[region]++;
        }

        return stats;
    }

    /**
     * 🔎 ค้นหาผลการสำรวจ
     */
    async searchSurveyResponses(filters = {}) {
        const results = [];
        
        for (const [id, response] of this.responses) {
            let match = true;
            
            if (filters.region && response.region !== filters.region) {
                match = false;
            }
            
            if (filters.isGuest !== undefined && response.isGuest !== filters.isGuest) {
                match = false;
            }
            
            if (match) {
                results.push(response);
            }
        }
        
        return results;
    }

    /**
     * 📋 ส่งออกข้อมูลเป็น CSV
     */
    async exportSurveyData(regionCode = null) {
        const responses = regionCode ? 
            await this.searchSurveyResponses({ region: regionCode }) :
            Array.from(this.responses.values());

        // สร้าง CSV headers
        const headers = ['Response ID', 'Region', 'Participant Type', 'Completed At', 'Total Questions'];
        
        // สร้าง CSV rows
        const rows = responses.map(response => [
            response.id,
            this.regions[response.region]?.name || response.region,
            response.isGuest ? 'Guest' : 'Registered',
            response.completedAt.toISOString(),
            Object.keys(response.responses[response.region] || {}).length
        ]);

        return {
            headers,
            rows,
            filename: `survey_data_${regionCode || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
        };
    }

    /**
     * 📱 ดึงข้อมูลการตอบแบบสอบถามล่าสุด
     */
    async getRecentSurveyActivity(limit = 10) {
        const recent = Array.from(this.responses.values())
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, limit);

        return recent.map(response => ({
            id: response.id,
            region: this.regions[response.region]?.name,
            participantType: response.isGuest ? 'Guest' : 'Registered User',
            completedAt: response.completedAt,
            questionsAnswered: Object.keys(response.responses[response.region] || {}).length
        }));
    }
}

module.exports = SurveyManager;