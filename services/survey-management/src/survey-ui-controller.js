/**
 * 🎨 Survey Frontend Components
 * UI/UX Components สำหรับระบบแบบสอบถาม
 */

const express = require('express');
const path = require('path');
const SurveyManager = require('./survey-manager');
const SurveyQuestions = require('./survey-questions');

class SurveyUIController {
    constructor() {
        this.surveyManager = new SurveyManager();
        this.surveyQuestions = new SurveyQuestions();
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // 🏠 หน้าหลักแบบสอบถาม
        this.router.get('/', this.renderSurveyHome.bind(this));
        
        // 🔐 เริ่มแบบสอบถาม (Guest/Logged in)
        this.router.post('/start', this.startSurvey.bind(this));
        
        // 📝 กรอกข้อมูลส่วนตัว (Guest)
        this.router.post('/guest-info', this.submitGuestInfo.bind(this));
        
        // 🗺️ เลือกภูมิภาค
        this.router.post('/select-region', this.selectRegion.bind(this));
        
        // 📋 แสดงแบบสอบถาม
        this.router.get('/survey/:sessionId', this.renderSurveyForm.bind(this));
        
        // 💾 บันทึกคำตอบ
        this.router.post('/response', this.submitResponse.bind(this));
        
        // ✅ ส่งแบบสอบถามสำเร็จ
        this.router.post('/complete', this.completeSurvey.bind(this));
        
        // 📊 ดูผลลัพธ์
        this.router.get('/results/:responseId', this.viewResults.bind(this));

        // 📈 API สำหรับ AJAX
        this.router.get('/api/regions', this.getRegions.bind(this));
        this.router.get('/api/questions/:region', this.getQuestionsByRegion.bind(this));
    }

    /**
     * 🏠 หน้าหลักแบบสอบถาม
     */
    async renderSurveyHome(req, res) {
        const isLoggedIn = req.session && req.session.user;
        
        res.json({
            view: 'survey_home',
            data: {
                title: '🌿 แบบสอบถามสมุนไพรไทย',
                subtitle: 'ระบบเก็บข้อมูลเกษตรกรและผู้ประกอบการ แยกตามภูมิภาค',
                isLoggedIn,
                user: isLoggedIn ? req.session.user : null,
                regions: this.surveyManager.regions,
                features: [
                    '📍 แบบสอบถามเฉพาะแต่ละภูมิภาค',
                    '🔒 ข้อมูลได้รับการปกป้องตาม PDPA',
                    '⚡ สามารถทำแบบสอบถามโดยไม่ต้องล็อกอิน',
                    '📊 ผลการวิเคราะห์เพื่อพัฒนาภาคเกษตร'
                ],
                flow: {
                    guest: [
                        '1. กรอกข้อมูลส่วนตัวและฟาร์ม',
                        '2. เลือกภูมิภาค',
                        '3. ทำแบบสอบถาม',
                        '4. รับผลการวิเคราะห์'
                    ],
                    logged: [
                        '1. เลือกภูมิภาค',
                        '2. ทำแบบสอบถาม',
                        '3. รับผลการวิเคราะห์'
                    ]
                }
            },
            template: this.generateSurveyHomeHTML()
        });
    }

    /**
     * 🔐 เริ่มแบบสอบถาม
     */
    async startSurvey(req, res) {
        try {
            const userInfo = req.session && req.session.user ? req.session.user : null;
            const result = await this.surveyManager.initiateSurvey(userInfo);
            
            // เก็บ session ID
            req.session.surveySessionId = result.sessionId;
            
            res.json({
                success: true,
                ...result,
                nextAction: result.isGuest ? 'guest-info' : 'region-selection'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 📝 กรอกข้อมูลส่วนตัว (Guest)
     */
    async submitGuestInfo(req, res) {
        try {
            const { sessionId, guestInfo } = req.body;
            const result = await this.surveyManager.submitGuestInfo(sessionId, guestInfo);
            
            res.json({
                success: true,
                ...result,
                template: this.generateRegionSelectionHTML()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 🗺️ เลือกภูมิภาค
     */
    async selectRegion(req, res) {
        try {
            const { sessionId, regionCode } = req.body;
            const result = await this.surveyManager.selectRegion(sessionId, regionCode);
            
            res.json({
                success: true,
                ...result,
                surveyUrl: `/survey/survey/${sessionId}`,
                template: this.generateSurveyStartHTML(result.region)
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 📋 แสดงแบบสอบถาม
     */
    async renderSurveyForm(req, res) {
        try {
            const { sessionId } = req.params;
            const session = this.surveyManager.surveys.get(sessionId) || 
                           this.surveyManager.guestSessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Survey session not found'
                });
            }

            const questions = this.surveyQuestions.getQuestionsByRegion(session.selectedRegion);
            const completion = this.surveyQuestions.calculateCompletionPercentage(
                session.selectedRegion, 
                session.responses[session.selectedRegion] || {}
            );

            res.json({
                view: 'survey_form',
                data: {
                    session,
                    questions,
                    completion,
                    region: this.surveyManager.regions[session.selectedRegion]
                },
                template: this.generateSurveyFormHTML(questions, session, completion)
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 💾 บันทึกคำตอบ
     */
    async submitResponse(req, res) {
        try {
            const { sessionId, questionId, response } = req.body;
            const result = await this.surveyManager.submitSurveyResponse(sessionId, questionId, response);
            
            // คำนวณความคืบหน้า
            const session = this.surveyManager.surveys.get(sessionId) || 
                           this.surveyManager.guestSessions.get(sessionId);
            const completion = this.surveyQuestions.calculateCompletionPercentage(
                session.selectedRegion, 
                session.responses[session.selectedRegion] || {}
            );

            res.json({
                success: true,
                ...result,
                completion,
                canComplete: completion >= 80 // สามารถส่งได้เมื่อทำครบ 80%
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * ✅ ส่งแบบสอบถามสำเร็จ
     */
    async completeSurvey(req, res) {
        try {
            const { sessionId } = req.body;
            const result = await this.surveyManager.completeSurvey(sessionId);
            
            res.json({
                success: true,
                ...result,
                resultsUrl: `/survey/results/${result.responseId}`,
                template: this.generateCompletionHTML(result)
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 📊 ดูผลลัพธ์
     */
    async viewResults(req, res) {
        try {
            const { responseId } = req.params;
            const response = this.surveyManager.responses.get(responseId);
            
            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'Response not found'
                });
            }

            res.json({
                view: 'survey_results',
                data: response,
                template: this.generateResultsHTML(response)
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 📍 API: ดึงข้อมูลภูมิภาค
     */
    async getRegions(req, res) {
        res.json({
            success: true,
            regions: this.surveyManager.regions
        });
    }

    /**
     * 📋 API: ดึงคำถามตามภูมิภาค
     */
    async getQuestionsByRegion(req, res) {
        try {
            const { region } = req.params;
            const questions = this.surveyQuestions.getQuestionsByRegion(region);
            
            if (!questions) {
                return res.status(404).json({
                    success: false,
                    message: 'Region not found'
                });
            }

            res.json({
                success: true,
                questions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * 🎨 HTML Templates
     */
    generateSurveyHomeHTML() {
        return `
        <div class="survey-home">
            <div class="hero-section">
                <div class="container">
                    <h1 class="hero-title">🌿 แบบสอบถามสมุนไพรไทย</h1>
                    <p class="hero-subtitle">ระบบเก็บข้อมูลเกษตรกรและผู้ประกอบการ แยกตามภูมิภาค</p>
                    
                    <div class="user-options">
                        <div class="option-card guest-option">
                            <h3>👤 ผู้เยี่ยมชม</h3>
                            <p>ทำแบบสอบถามโดยไม่ต้องล็อกอิน</p>
                            <ul>
                                <li>✅ กรอกข้อมูลส่วนตัวและฟาร์ม</li>
                                <li>✅ เลือกภูมิภาค</li>
                                <li>✅ ทำแบบสอบถาม</li>
                                <li>✅ รับผลการวิเคราะห์</li>
                            </ul>
                            <button class="btn btn-secondary" onclick="startSurvey(false)">
                                เริ่มแบบสอบถาม
                            </button>
                        </div>
                        
                        <div class="option-card member-option">
                            <h3>🔐 สมาชิก</h3>
                            <p>ล็อกอินเพื่อประสบการณ์ที่ดีกว่า</p>
                            <ul>
                                <li>🚀 เริ่มทันที (ข้อมูลมีอยู่แล้ว)</li>
                                <li>📊 ติดตามประวัติการตอบ</li>
                                <li>🔄 แก้ไข/อัพเดทข้อมูล</li>
                                <li>📧 รับข่าวสารและอัพเดท</li>
                            </ul>
                            <button class="btn btn-primary" onclick="redirectToLogin()">
                                ล็อกอิน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="regions-preview">
                <div class="container">
                    <h2>🗺️ เลือกภูมิภาคของคุณ</h2>
                    <div class="regions-grid">
                        <div class="region-card" data-region="north">
                            <div class="region-icon">🏔️</div>
                            <h3>ภาคเหนือ</h3>
                            <p>9 จังหวัด • อากาศเย็น • ศูนย์กลางกัญชาคุณภาพ</p>
                            <div class="herbs-preview">
                                <span class="herb-tag main">🌿 กัญชา</span>
                                <span class="herb-tag">ขมิ้นชัน</span>
                                <span class="herb-tag">ขิง</span>
                            </div>
                        </div>

                        <div class="region-card" data-region="northeast">
                            <div class="region-icon">🌾</div>
                            <h3>ภาคตะวันออกเฉียงเหนือ</h3>
                            <p>20 จังหวัด • แห้งแล้ง • กัญชาทนแล้ง</p>
                            <div class="herbs-preview">
                                <span class="herb-tag main">🌿 กัญชา</span>
                                <span class="herb-tag">กระชายดำ</span>
                                <span class="herb-tag">ไพล</span>
                            </div>
                        </div>

                        <div class="region-card" data-region="central">
                            <div class="region-icon">🏭</div>
                            <h3>ภาคกลาง</h3>
                            <p>22 จังหวัด • ธุรกิจ SME • ศูนย์แปรรูปกัญชา</p>
                            <div class="herbs-preview">
                                <span class="herb-tag main">🌿 กัญชา</span>
                                <span class="herb-tag">ขมิ้นชัน</span>
                                <span class="herb-tag">กระท่อม</span>
                            </div>
                        </div>

                        <div class="region-card" data-region="south">
                            <div class="region-icon">🌴</div>
                            <h3>ภาคใต้</h3>
                            <p>14 จังหวัด • ชื้น • กัญชา Halal & ท่องเที่ยว</p>
                            <div class="herbs-preview">
                                <span class="herb-tag main">🌿 กัญชา</span>
                                <span class="herb-tag">ขิง</span>
                                <span class="herb-tag">กระชายดำ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="features-section">
                <div class="container">
                    <h2>✨ ความพิเศษของระบบ</h2>
                    <div class="features-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🔒</div>
                            <h3>ปลอดภัย PDPA</h3>
                            <p>ข้อมูลได้รับการปกป้องตามกฎหมาย</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📊</div>
                            <h3>วิเคราะห์เชิงลึก</h3>
                            <p>ได้รับคำแนะนำเฉพาะภูมิภาค</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🌍</div>
                            <h3>ครอบคลุมทั่วไทย</h3>
                            <p>แบบสอบถามเฉพาะแต่ละภูมิภาค</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📱</div>
                            <h3>ใช้งานง่าย</h3>
                            <p>ออกแบบสำหรับมือถือ</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
        .survey-home {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .hero-section {
            padding: 80px 0;
            color: white;
            text-align: center;
        }

        .hero-title {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }

        .hero-subtitle {
            font-size: 1.2rem;
            margin-bottom: 3rem;
            opacity: 0.9;
        }

        .user-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }

        .option-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            color: #333;
            text-align: left;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .option-card:hover {
            transform: translateY(-5px);
        }

        .regions-preview {
            background: white;
            padding: 80px 0;
        }

        .regions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .region-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 2px solid transparent;
        }

        .region-card:hover {
            background: #e9ecef;
            border-color: #667eea;
            transform: translateY(-3px);
        }

        .region-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .herbs-preview {
            margin-top: 1rem;
        }

        .herb-tag {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 10px;
            font-size: 0.8rem;
            margin: 0.2rem;
        }

        .herb-tag.main {
            background: #28a745;
            font-weight: bold;
            font-size: 0.9rem;
            border: 2px solid #20c997;
        }

        .features-section {
            background: #f8f9fa;
            padding: 80px 0;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .feature-item {
            text-align: center;
            padding: 1.5rem;
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 1rem;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        @media (max-width: 768px) {
            .hero-title {
                font-size: 2rem;
            }
            
            .user-options {
                grid-template-columns: 1fr;
            }
            
            .regions-grid {
                grid-template-columns: 1fr;
            }
        }
        </style>

        <script>
        function startSurvey(isLoggedIn) {
            fetch('/survey/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isLoggedIn })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.isGuest) {
                        showGuestInfoForm(data.sessionId);
                    } else {
                        showRegionSelection(data.sessionId);
                    }
                } else {
                    alert('เกิดข้อผิดพลาด: ' + data.message);
                }
            })
            .catch(error => {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            });
        }

        function redirectToLogin() {
            window.location.href = '/auth/login?redirect=/survey';
        }
        </script>
        `;
    }

    generateGuestInfoFormHTML() {
        return `
        <div class="guest-info-form">
            <div class="container">
                <h2>📝 ข้อมูลส่วนตัวและฟาร์ม</h2>
                <p>กรุณากรอกข้อมูลพื้นฐานก่อนทำแบบสอบถาม</p>
                
                <form id="guestInfoForm">
                    <div class="form-group">
                        <label>ชื่อ-นามสกุล *</label>
                        <input type="text" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label>เบอร์โทรศัพท์ *</label>
                        <input type="tel" name="phone" required>
                    </div>
                    
                    <div class="form-group">
                        <label>จังหวัด *</label>
                        <select name="province" required>
                            <option value="">เลือกจังหวัด</option>
                            <!-- จะใส่ options จังหวัดทั้งหมด -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>อำเภอ *</label>
                        <input type="text" name="district" required>
                    </div>
                    
                    <div class="form-group">
                        <label>ประเภทฟาร์ม/ธุรกิจ *</label>
                        <select name="farmType" required>
                            <option value="">เลือกประเภท</option>
                            <option value="farmer">เกษตรกร/ผู้ปลูก</option>
                            <option value="business">ผู้ประกอบการ/โรงงาน</option>
                            <option value="trader">ผู้รับซื้อ/พ่อค้าคนกลาง</option>
                            <option value="government">หน่วยงานรัฐ/สหกรณ์</option>
                            <option value="other">อื่นๆ</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>ขนาดพื้นที่ (ไร่) *</label>
                        <select name="farmSize" required>
                            <option value="">เลือกขนาด</option>
                            <option value="<1">น้อยกว่า 1 ไร่</option>
                            <option value="1-5">1-5 ไร่</option>
                            <option value="5-10">5-10 ไร่</option>
                            <option value="10-20">10-20 ไร่</option>
                            <option value=">20">มากกว่า 20 ไร่</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Email (ไม่บังคับ)</label>
                        <input type="email" name="email">
                    </div>
                    
                    <div class="form-group">
                        <label>Line ID (ไม่บังคับ)</label>
                        <input type="text" name="lineId">
                    </div>
                    
                    <div class="privacy-notice">
                        <h4>🔒 การใช้ข้อมูลส่วนบุคคล</h4>
                        <p>ข้อมูลของคุณจะได้รับการปกป้องตาม พ.ร.บ. คุมครองข้อมูลส่วนบุคคล พ.ศ. 2562 และจะใช้เพื่อ:</p>
                        <ul>
                            <li>📊 วิเคราะห์แนวโน้มการปลูกสมุนไพรในแต่ละภูมิภาค</li>
                            <li>📋 จัดทำรายงานสำหรับหน่วยงานรัฐ</li>
                            <li>📧 ส่งข้อมูลและข่าวสาร (หากให้ความยินยอม)</li>
                        </ul>
                        <label class="checkbox-container">
                            <input type="checkbox" name="consent" required>
                            <span class="checkmark"></span>
                            ฉันยินยอมให้ใช้ข้อมูลส่วนบุคคลตามวัตถุประสงค์ข้างต้น *
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        ถัดไป: เลือกภูมิภาค 🗺️
                    </button>
                </form>
            </div>
        </div>
        `;
    }

    generateRegionSelectionHTML() {
        return `
        <div class="region-selection">
            <div class="container">
                <h2>🗺️ เลือกภูมิภาคของคุณ</h2>
                <p>แต่ละภูมิภาคมีแบบสอบถามที่เฉพาะเจาะจงตามลักษณะสภาพแวดล้อมและสมุนไพรหลัก</p>
                
                <div class="regions-selection-grid">
                    ${Object.entries(this.surveyManager.regions).map(([code, region]) => `
                        <div class="region-selection-card" onclick="selectRegion('${code}')">
                            <div class="region-header">
                                <span class="region-icon">${region.icon}</span>
                                <h3>${region.name}</h3>
                            </div>
                            
                            <div class="region-details">
                                <div class="detail-item">
                                    <strong>จังหวัด:</strong> ${region.provinces.length} จังหวัด
                                </div>
                                <div class="detail-item">
                                    <strong>ภูมิอากาศ:</strong> ${region.climate}
                                </div>
                                <div class="detail-item">
                                    <strong>สมุนไพรหลัก:</strong> ${region.mainHerbs.join(', ')}
                                </div>
                            </div>
                            
                            <div class="region-characteristics">
                                <h4>ลักษณะเด่น:</h4>
                                <ul>
                                    ${region.characteristics.map(char => `<li>${char}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <button class="btn btn-primary region-select-btn">
                                เลือก${region.name}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <script>
        function selectRegion(regionCode) {
            const sessionId = new URLSearchParams(window.location.search).get('sessionId') || 
                             sessionStorage.getItem('surveySessionId');
            
            fetch('/survey/select-region', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId, regionCode })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = data.surveyUrl;
                } else {
                    alert('เกิดข้อผิดพลาด: ' + data.message);
                }
            })
            .catch(error => {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            });
        }
        </script>
        `;
    }
}

module.exports = SurveyUIController;