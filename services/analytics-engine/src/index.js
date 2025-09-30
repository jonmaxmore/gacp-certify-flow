/**
 * GACP Analytics Engine
 * Real-time Analytics and Reporting Service
 * ระบบวิเคราะห์ข้อมูลและรายงานแบบเรียลไทม์
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');
const cron = require('node-cron');

class AnalyticsEngine {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3008;
        this.setupLogger();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupCronJobs();
        
        // Mock data stores (ใช้ database จริงในโปรดักชัน)
        this.applications = new Map();
        this.certifications = new Map();
        this.trackingData = new Map();
        this.analytics = new Map();
        
        this.seedMockData();
    }

    setupLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'analytics.log' })
            ]
        });
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json());
        
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'analytics-engine',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Dashboard overview
        this.app.get('/api/v1/dashboard', async (req, res) => {
            try {
                const dashboard = await this.getDashboardData();
                res.json({
                    success: true,
                    data: dashboard
                });
            } catch (error) {
                this.logger.error('Failed to get dashboard data:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Application analytics
        this.app.get('/api/v1/analytics/applications', async (req, res) => {
            try {
                const analytics = await this.getApplicationAnalytics(req.query);
                res.json({
                    success: true,
                    data: analytics
                });
            } catch (error) {
                this.logger.error('Failed to get application analytics:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Farm analytics
        this.app.get('/api/v1/analytics/farms', async (req, res) => {
            try {
                const analytics = await this.getFarmAnalytics(req.query);
                res.json({
                    success: true,
                    data: analytics
                });
            } catch (error) {
                this.logger.error('Failed to get farm analytics:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Herbal product analytics
        this.app.get('/api/v1/analytics/products', async (req, res) => {
            try {
                const analytics = await this.getProductAnalytics(req.query);
                res.json({
                    success: true,
                    data: analytics
                });
            } catch (error) {
                this.logger.error('Failed to get product analytics:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Regional analytics
        this.app.get('/api/v1/analytics/regions', async (req, res) => {
            try {
                const analytics = await this.getRegionalAnalytics(req.query);
                res.json({
                    success: true,
                    data: analytics
                });
            } catch (error) {
                this.logger.error('Failed to get regional analytics:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Trends and predictions
        this.app.get('/api/v1/analytics/trends', async (req, res) => {
            try {
                const trends = await this.getTrendsAndPredictions(req.query);
                res.json({
                    success: true,
                    data: trends
                });
            } catch (error) {
                this.logger.error('Failed to get trends:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Export reports
        this.app.post('/api/v1/reports/generate', async (req, res) => {
            try {
                const report = await this.generateReport(req.body);
                res.json({
                    success: true,
                    data: report
                });
            } catch (error) {
                this.logger.error('Failed to generate report:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Real-time metrics
        this.app.get('/api/v1/metrics/realtime', async (req, res) => {
            try {
                const metrics = await this.getRealTimeMetrics();
                res.json({
                    success: true,
                    data: metrics
                });
            } catch (error) {
                this.logger.error('Failed to get real-time metrics:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });
    }

    /**
     * Dashboard Overview Data
     */
    async getDashboardData() {
        const totalApplications = this.applications.size;
        const approvedApplications = Array.from(this.applications.values())
            .filter(app => app.status === 'approved').length;
        const pendingApplications = Array.from(this.applications.values())
            .filter(app => app.status === 'pending').length;
        const totalFarms = new Set(Array.from(this.applications.values())
            .map(app => app.farmId)).size;

        // Recent activity
        const recentApplications = Array.from(this.applications.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Monthly statistics
        const monthlyStats = this.calculateMonthlyStats();

        // Top herbs by application
        const topHerbs = this.calculateTopHerbs();

        return {
            overview: {
                totalApplications,
                approvedApplications,
                pendingApplications,
                totalFarms,
                approvalRate: totalApplications > 0 ? 
                    Math.round((approvedApplications / totalApplications) * 100) : 0,
                averageProcessingDays: this.calculateAverageProcessingTime()
            },
            recentActivity: recentApplications.map(app => ({
                id: app.id,
                applicantName: app.applicantName,
                product: app.product,
                status: app.status,
                createdAt: app.createdAt
            })),
            monthlyStats,
            topHerbs,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Application Analytics
     */
    async getApplicationAnalytics(filters) {
        const applications = Array.from(this.applications.values());
        
        // Filter by date range
        let filteredApps = applications;
        if (filters.dateFrom) {
            filteredApps = filteredApps.filter(app => 
                new Date(app.createdAt) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filteredApps = filteredApps.filter(app => 
                new Date(app.createdAt) <= new Date(filters.dateTo)
            );
        }

        // Status distribution
        const statusDistribution = _.countBy(filteredApps, 'status');

        // Applications over time
        const timeSeriesData = this.generateTimeSeriesData(filteredApps, filters.period || 'daily');

        // Processing time analysis
        const processingTimes = this.analyzeProcessingTimes(filteredApps);

        // Success rate by province
        const provinceStats = this.calculateProvinceStats(filteredApps);

        return {
            summary: {
                total: filteredApps.length,
                statusDistribution,
                averageProcessingTime: processingTimes.average,
                successRate: this.calculateSuccessRate(filteredApps)
            },
            timeSeries: timeSeriesData,
            processingTimes,
            provinceStats,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Farm Analytics
     */
    async getFarmAnalytics(filters) {
        const applications = Array.from(this.applications.values());
        
        // Group by farm
        const farmGroups = _.groupBy(applications, 'farmId');
        
        const farmStats = Object.keys(farmGroups).map(farmId => {
            const farmApps = farmGroups[farmId];
            const firstApp = farmApps[0];
            
            return {
                farmId,
                farmName: firstApp.farmName,
                province: firstApp.province,
                totalApplications: farmApps.length,
                approvedApplications: farmApps.filter(app => app.status === 'approved').length,
                uniqueHerbs: new Set(farmApps.map(app => app.product)).size,
                totalArea: farmApps.reduce((sum, app) => sum + (app.area || 0), 0),
                averageScore: farmApps.reduce((sum, app) => sum + (app.score || 0), 0) / farmApps.length,
                lastActivity: Math.max(...farmApps.map(app => new Date(app.createdAt)))
            };
        });

        // Farm size distribution
        const sizeDistribution = this.calculateFarmSizeDistribution(farmStats);

        // Performance metrics
        const performanceMetrics = this.calculateFarmPerformance(farmStats);

        return {
            summary: {
                totalFarms: farmStats.length,
                totalArea: farmStats.reduce((sum, farm) => sum + farm.totalArea, 0),
                averageApplicationsPerFarm: farmStats.reduce((sum, farm) => sum + farm.totalApplications, 0) / farmStats.length,
                topPerformingFarms: farmStats.sort((a, b) => b.averageScore - a.averageScore).slice(0, 10)
            },
            sizeDistribution,
            performanceMetrics,
            farmStats: farmStats.slice(0, 50), // Top 50 farms
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Product Analytics
     */
    async getProductAnalytics(filters) {
        const applications = Array.from(this.applications.values());
        
        // Product popularity
        const productCounts = _.countBy(applications, 'product');
        const productPopularity = Object.keys(productCounts)
            .map(product => ({
                product,
                count: productCounts[product],
                percentage: Math.round((productCounts[product] / applications.length) * 100)
            }))
            .sort((a, b) => b.count - a.count);

        // Product success rates
        const productSuccess = Object.keys(productCounts).map(product => {
            const productApps = applications.filter(app => app.product === product);
            const approved = productApps.filter(app => app.status === 'approved').length;
            
            return {
                product,
                totalApplications: productApps.length,
                approvedApplications: approved,
                successRate: Math.round((approved / productApps.length) * 100),
                averageScore: productApps.reduce((sum, app) => sum + (app.score || 0), 0) / productApps.length,
                averageArea: productApps.reduce((sum, app) => sum + (app.area || 0), 0) / productApps.length
            };
        });

        // Seasonal trends
        const seasonalTrends = this.calculateSeasonalTrends(applications);

        return {
            popularity: productPopularity,
            successRates: productSuccess,
            seasonalTrends,
            marketInsights: {
                fastestGrowing: this.findFastestGrowingProduct(applications),
                mostProfitable: this.findMostProfitableProduct(applications),
                emerging: this.findEmergingProducts(applications)
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Regional Analytics
     */
    async getRegionalAnalytics(filters) {
        const applications = Array.from(this.applications.values());
        
        // Group by province
        const provinceGroups = _.groupBy(applications, 'province');
        
        const provinceStats = Object.keys(provinceGroups).map(province => {
            const provinceApps = provinceGroups[province];
            const approved = provinceApps.filter(app => app.status === 'approved').length;
            
            return {
                province,
                totalApplications: provinceApps.length,
                approvedApplications: approved,
                successRate: Math.round((approved / provinceApps.length) * 100),
                totalArea: provinceApps.reduce((sum, app) => sum + (app.area || 0), 0),
                uniqueFarms: new Set(provinceApps.map(app => app.farmId)).size,
                topProducts: this.getTopProductsByProvince(provinceApps),
                averageScore: provinceApps.reduce((sum, app) => sum + (app.score || 0), 0) / provinceApps.length
            };
        });

        // Regional rankings
        const rankings = {
            byApplications: [...provinceStats].sort((a, b) => b.totalApplications - a.totalApplications),
            bySuccessRate: [...provinceStats].sort((a, b) => b.successRate - a.successRate),
            byArea: [...provinceStats].sort((a, b) => b.totalArea - a.totalArea),
            byScore: [...provinceStats].sort((a, b) => b.averageScore - a.averageScore)
        };

        return {
            provinceStats,
            rankings,
            regionalInsights: {
                leadingRegion: rankings.bySuccessRate[0]?.province,
                growthRegion: this.findFastestGrowingRegion(applications),
                totalCoverage: Object.keys(provinceGroups).length
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Trends and Predictions
     */
    async getTrendsAndPredictions(filters) {
        const applications = Array.from(this.applications.values());
        
        // Growth trends
        const growthTrends = this.calculateGrowthTrends(applications);
        
        // Seasonal patterns
        const seasonalPatterns = this.analyzeSeasonalPatterns(applications);
        
        // Predictions (simple linear regression)
        const predictions = this.generateSimplePredictions(applications);

        return {
            growthTrends,
            seasonalPatterns,
            predictions,
            insights: {
                recommendation: this.generateRecommendations(applications),
                alerts: this.generateAlerts(applications)
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Helper Methods
     */
    calculateMonthlyStats() {
        const applications = Array.from(this.applications.values());
        const monthlyData = {};
        
        applications.forEach(app => {
            const month = moment(app.createdAt).format('YYYY-MM');
            if (!monthlyData[month]) {
                monthlyData[month] = { total: 0, approved: 0 };
            }
            monthlyData[month].total++;
            if (app.status === 'approved') {
                monthlyData[month].approved++;
            }
        });
        
        return Object.keys(monthlyData).sort().map(month => ({
            month,
            total: monthlyData[month].total,
            approved: monthlyData[month].approved,
            successRate: Math.round((monthlyData[month].approved / monthlyData[month].total) * 100)
        }));
    }

    calculateTopHerbs() {
        const applications = Array.from(this.applications.values());
        const herbCounts = _.countBy(applications, 'product');
        
        return Object.keys(herbCounts)
            .map(herb => ({
                name: herb,
                count: herbCounts[herb],
                percentage: Math.round((herbCounts[herb] / applications.length) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    calculateAverageProcessingTime() {
        const applications = Array.from(this.applications.values())
            .filter(app => app.status === 'approved' && app.approvedAt);
        
        if (applications.length === 0) return 0;
        
        const totalDays = applications.reduce((sum, app) => {
            const days = moment(app.approvedAt).diff(moment(app.createdAt), 'days');
            return sum + days;
        }, 0);
        
        return Math.round(totalDays / applications.length);
    }

    generateTimeSeriesData(applications, period) {
        const grouped = _.groupBy(applications, app => {
            switch (period) {
                case 'weekly':
                    return moment(app.createdAt).format('YYYY-WW');
                case 'monthly':
                    return moment(app.createdAt).format('YYYY-MM');
                default:
                    return moment(app.createdAt).format('YYYY-MM-DD');
            }
        });
        
        return Object.keys(grouped).sort().map(date => ({
            date,
            count: grouped[date].length,
            approved: grouped[date].filter(app => app.status === 'approved').length
        }));
    }

    setupCronJobs() {
        // Update analytics cache every hour
        cron.schedule('0 * * * *', async () => {
            this.logger.info('Updating analytics cache...');
            await this.updateAnalyticsCache();
        });

        // Generate daily reports at midnight
        cron.schedule('0 0 * * *', async () => {
            this.logger.info('Generating daily reports...');
            await this.generateDailyReports();
        });
    }

    async updateAnalyticsCache() {
        try {
            const dashboard = await this.getDashboardData();
            this.analytics.set('dashboard', {
                data: dashboard,
                updatedAt: new Date().toISOString()
            });
            this.logger.info('Analytics cache updated successfully');
        } catch (error) {
            this.logger.error('Failed to update analytics cache:', error);
        }
    }

    async generateDailyReports() {
        // สร้างรายงานประจำวัน
        this.logger.info('Daily reports generated');
    }

    seedMockData() {
        // สร้างข้อมูลจำลองสำหรับการทดสอบ
        const herbs = ['กัญชา', 'ขมิ้นชัน', 'พลาย', 'ขิง', 'กระชายดำ', 'กระท่อม'];
        const provinces = ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'น่าน', 'แพร่', 'กรุงเทพฯ'];
        const statuses = ['pending', 'approved', 'rejected', 'processing'];

        for (let i = 1; i <= 100; i++) {
            const createdAt = moment().subtract(Math.floor(Math.random() * 365), 'days').toISOString();
            const application = {
                id: `app-${i}`,
                applicantName: `เกษตรกร ${i}`,
                farmId: `farm-${Math.floor(Math.random() * 50) + 1}`,
                farmName: `ฟาร์มสมุนไพร ${Math.floor(Math.random() * 50) + 1}`,
                product: herbs[Math.floor(Math.random() * herbs.length)],
                province: provinces[Math.floor(Math.random() * provinces.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                area: Math.floor(Math.random() * 100) + 10,
                score: Math.floor(Math.random() * 40) + 60,
                createdAt,
                approvedAt: Math.random() > 0.5 ? moment(createdAt).add(Math.floor(Math.random() * 30), 'days').toISOString() : null
            };
            
            this.applications.set(application.id, application);
        }
    }

    async start() {
        this.app.listen(this.port, () => {
            this.logger.info(`📊 Analytics Engine running on port ${this.port}`);
            console.log(`📊 Analytics Engine running on port ${this.port}`);
            console.log(`📈 Dashboard: http://localhost:${this.port}/api/v1/dashboard`);
        });
    }
}

// สร้างและรัน service
const analytics = new AnalyticsEngine();

if (require.main === module) {
    analytics.start();
}

module.exports = AnalyticsEngine;