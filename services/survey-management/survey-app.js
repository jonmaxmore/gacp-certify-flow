/**
 * 🌿 GACP Survey System - Main Entry Point
 * ระบบแบบสอบถามสมุนไพรไทย แยกตามภูมิภาค
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const SurveyUIController = require('./src/survey-ui-controller');
const SurveyManager = require('./src/survey-manager');

class SurveyApp {
    constructor() {
        this.app = express();
        this.port = process.env.SURVEY_PORT || 3005;
        this.setupMiddleware();
        this.setupRoutes();
        this.surveyManager = new SurveyManager();
    }

    setupMiddleware() {
        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Session management
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'gacp-survey-secret-2024',
            resave: false,
            saveUninitialized: false,
            cookie: { 
                secure: false, // Set to true in production with HTTPS
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // Static files
        this.app.use('/static', express.static(path.join(__dirname, 'public')));

        // CORS for API calls
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
    }

    setupRoutes() {
        // Survey UI Controller
        const surveyController = new SurveyUIController();
        this.app.use('/survey', surveyController.router);

        // API Routes
        this.app.use('/api/survey', this.createAPIRoutes());

        // Main route
        this.app.get('/', (req, res) => {
            res.redirect('/survey');
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'GACP Survey System',
                version: '2.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Route not found',
                availableRoutes: [
                    'GET /survey - Survey homepage',
                    'POST /survey/start - Start survey',
                    'GET /api/survey/stats - Survey statistics',
                    'GET /health - Health check'
                ]
            });
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Survey System Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
    }

    createAPIRoutes() {
        const router = express.Router();

        // Statistics
        router.get('/stats', async (req, res) => {
            try {
                const stats = await this.surveyManager.getAllSurveyStatistics();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // Export data
        router.get('/export/:region?', async (req, res) => {
            try {
                const { region } = req.params;
                const data = await this.surveyManager.exportSurveyData(region);
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
                
                // Convert to CSV
                const csv = [
                    data.headers.join(','),
                    ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');
                
                res.send(csv);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // Recent activity
        router.get('/activity', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const activity = await this.surveyManager.getRecentSurveyActivity(limit);
                res.json({ success: true, activity });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // Search responses
        router.get('/search', async (req, res) => {
            try {
                const filters = {
                    region: req.query.region,
                    isGuest: req.query.isGuest !== undefined ? req.query.isGuest === 'true' : undefined
                };
                
                const results = await this.surveyManager.searchSurveyResponses(filters);
                res.json({ success: true, results });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        return router;
    }

    async start() {
        try {
            this.app.listen(this.port, () => {
                console.log(`
🌿 GACP Survey System Started Successfully!
==========================================
🚀 Server: http://localhost:${this.port}
📊 Survey: http://localhost:${this.port}/survey
📈 API: http://localhost:${this.port}/api/survey
🏥 Health: http://localhost:${this.port}/health

📋 Survey Features:
✅ Guest & Registered User Support
✅ 4 Regional Questionnaires
✅ PDPA Compliant Data Protection
✅ Real-time Progress Tracking
✅ Comprehensive Analytics

🗺️ Supported Regions:
🏔️ ภาคเหนือ - กระชายดำ, ไพล, ขมิ้นชัน
🌾 ภาคอีสาน - ฟ้าทะลายโจร, ว่านหางจระเข้
🏭 ภาคกลาง - ตะไคร้, ใบเตย, กระเพรา
🌴 ภาคใต้ - กระชาย, ข่า, ตะไคร้

Ready to collect valuable agricultural data! 🇹🇭
                `);
            });
        } catch (error) {
            console.error('Failed to start GACP Survey System:', error);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Shutting down GACP Survey System...');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = SurveyApp;

// Start if called directly
if (require.main === module) {
    const app = new SurveyApp();
    app.start().catch(console.error);
}