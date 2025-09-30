/**
 * GACP Track & Trace Service - Seed to Sale Audit System
 * ระบบติดตามสมุนไพรจากเมล็ดถึงผู้บริโภค แบบ Audit-based ไม่ใช้ Blockchain
 * Based on WHO/FDA/METRC standards for pharmaceutical and controlled substance tracking
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment');

class TrackTraceService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3007;
        this.setupLogger();
        this.setupMiddleware();
        this.setupRoutes();
        
        // In-memory storage for demo (ใช้ database จริงในโปรดักชัน)
        this.batches = new Map();
        this.trackingEvents = new Map();
        this.locations = new Map();
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
                new winston.transports.File({ filename: 'track-trace.log' })
            ]
        });
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
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
                service: 'track-trace',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Create new batch (ผลิตภัณฑ์ใหม่)
        this.app.post('/api/v1/batches', async (req, res) => {
            try {
                const batch = await this.createBatch(req.body);
                res.status(201).json({
                    success: true,
                    data: batch
                });
            } catch (error) {
                this.logger.error('Failed to create batch:', error);
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Track batch (เพิ่มข้อมูลการติดตาม)
        this.app.post('/api/v1/batches/:batchId/track', async (req, res) => {
            try {
                const event = await this.addTrackingEvent(req.params.batchId, req.body);
                res.json({
                    success: true,
                    data: event
                });
            } catch (error) {
                this.logger.error('Failed to add tracking event:', error);
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Get batch info (ข้อมูลการติดตาม)
        this.app.get('/api/v1/batches/:batchId', async (req, res) => {
            try {
                const batchInfo = await this.getBatchInfo(req.params.batchId);
                res.json({
                    success: true,
                    data: batchInfo
                });
            } catch (error) {
                this.logger.error('Failed to get batch info:', error);
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Generate QR Code
        this.app.get('/api/v1/batches/:batchId/qr', async (req, res) => {
            try {
                const qrCode = await this.generateQRCode(req.params.batchId);
                res.setHeader('Content-Type', 'image/png');
                res.send(qrCode);
            } catch (error) {
                this.logger.error('Failed to generate QR code:', error);
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Get tracking history
        this.app.get('/api/v1/batches/:batchId/history', async (req, res) => {
            try {
                const history = await this.getTrackingHistory(req.params.batchId);
                res.json({
                    success: true,
                    data: history
                });
            } catch (error) {
                this.logger.error('Failed to get tracking history:', error);
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Search batches
        this.app.get('/api/v1/batches', async (req, res) => {
            try {
                const batches = await this.searchBatches(req.query);
                res.json({
                    success: true,
                    data: batches
                });
            } catch (error) {
                this.logger.error('Failed to search batches:', error);
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Verify batch authenticity
        this.app.get('/api/v1/verify/:batchId', async (req, res) => {
            try {
                const verification = await this.verifyBatch(req.params.batchId);
                res.json({
                    success: true,
                    data: verification
                });
            } catch (error) {
                this.logger.error('Failed to verify batch:', error);
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        });
    }

    /**
     * สร้าง Batch ใหม่
     */
    async createBatch(data) {
        const batchId = uuidv4();
        const batch = {
            id: batchId,
            batchNumber: this.generateBatchNumber(),
            product: {
                name: data.productName,
                scientificName: data.scientificName,
                category: data.category,
                variety: data.variety
            },
            farm: {
                id: data.farmId,
                name: data.farmName,
                location: data.farmLocation,
                coordinates: data.coordinates,
                gacpCertNumber: data.gacpCertNumber
            },
            planting: {
                date: data.plantingDate,
                season: data.season,
                seedBatch: data.seedBatch
            },
            harvest: {
                date: data.harvestDate,
                method: data.harvestMethod,
                quantity: data.quantity,
                unit: data.unit
            },
            quality: {
                grade: data.grade,
                moistureContent: data.moistureContent,
                pesticides: data.pesticides || [],
                heavyMetals: data.heavyMetals || {},
                microorganisms: data.microorganisms || {}
            },
            status: 'harvested',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.batches.set(batchId, batch);
        
        // สร้าง tracking event แรก
        await this.addTrackingEvent(batchId, {
            eventType: 'batch_created',
            location: data.farmLocation,
            coordinates: data.coordinates,
            description: 'Batch created and harvest completed',
            operator: data.operator,
            timestamp: new Date().toISOString()
        });

        this.logger.info(`Batch created: ${batchId}`, { batchNumber: batch.batchNumber });
        return batch;
    }

    /**
     * เพิ่ม Tracking Event
     */
    async addTrackingEvent(batchId, eventData) {
        if (!this.batches.has(batchId)) {
            throw new Error('Batch not found');
        }

        const eventId = uuidv4();
        const event = {
            id: eventId,
            batchId,
            eventType: eventData.eventType,
            timestamp: eventData.timestamp || new Date().toISOString(),
            location: eventData.location,
            coordinates: eventData.coordinates,
            description: eventData.description,
            operator: eventData.operator,
            data: eventData.data || {},
            verified: false
        };

        // เก็บ events ของแต่ละ batch
        if (!this.trackingEvents.has(batchId)) {
            this.trackingEvents.set(batchId, []);
        }
        this.trackingEvents.get(batchId).push(event);

        // อัพเดต status ของ batch
        const batch = this.batches.get(batchId);
        batch.status = this.determineStatus(eventData.eventType);
        batch.updatedAt = new Date().toISOString();
        batch.currentLocation = eventData.location;

        this.logger.info(`Tracking event added: ${eventId}`, { 
            batchId, 
            eventType: eventData.eventType 
        });

        return event;
    }

    /**
     * ดึงข้อมูล Batch
     */
    async getBatchInfo(batchId) {
        if (!this.batches.has(batchId)) {
            throw new Error('Batch not found');
        }

        const batch = this.batches.get(batchId);
        const events = this.trackingEvents.get(batchId) || [];
        
        // คำนวณ supply chain metrics
        const metrics = this.calculateSupplyChainMetrics(events);

        return {
            ...batch,
            trackingEvents: events.length,
            supplyChainMetrics: metrics,
            lastUpdate: events.length > 0 ? events[events.length - 1].timestamp : batch.updatedAt
        };
    }

    /**
     * สร้าง QR Code
     */
    async generateQRCode(batchId) {
        if (!this.batches.has(batchId)) {
            throw new Error('Batch not found');
        }

        const batch = this.batches.get(batchId);
        const trackingUrl = `${process.env.PUBLIC_URL || 'https://gacp.example.com'}/track/${batchId}`;
        
        const qrData = {
            batchId: batchId,
            batchNumber: batch.batchNumber,
            product: batch.product.name,
            farm: batch.farm.name,
            url: trackingUrl
        };

        const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeBuffer;
    }

    /**
     * ดึงประวัติการติดตาม
     */
    async getTrackingHistory(batchId) {
        if (!this.batches.has(batchId)) {
            throw new Error('Batch not found');
        }

        const events = this.trackingEvents.get(batchId) || [];
        
        // เรียงตามเวลา
        const sortedEvents = events.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        // คำนวณระยะทางที่เดินทาง
        let totalDistance = 0;
        for (let i = 1; i < sortedEvents.length; i++) {
            if (sortedEvents[i].coordinates && sortedEvents[i-1].coordinates) {
                const distance = geolib.getDistance(
                    sortedEvents[i-1].coordinates,
                    sortedEvents[i].coordinates
                );
                totalDistance += distance;
            }
        }

        return {
            batchId,
            totalEvents: sortedEvents.length,
            totalDistanceKm: Math.round(totalDistance / 1000 * 100) / 100,
            timeline: sortedEvents.map(event => ({
                id: event.id,
                type: event.eventType,
                timestamp: event.timestamp,
                location: event.location,
                description: event.description,
                operator: event.operator,
                verified: event.verified
            }))
        };
    }

    /**
     * ค้นหา Batches
     */
    async searchBatches(filters) {
        let results = Array.from(this.batches.values());

        if (filters.farmId) {
            results = results.filter(b => b.farm.id === filters.farmId);
        }

        if (filters.productName) {
            results = results.filter(b => 
                b.product.name.toLowerCase().includes(filters.productName.toLowerCase())
            );
        }

        if (filters.status) {
            results = results.filter(b => b.status === filters.status);
        }

        if (filters.dateFrom) {
            results = results.filter(b => 
                new Date(b.createdAt) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            results = results.filter(b => 
                new Date(b.createdAt) <= new Date(filters.dateTo)
            );
        }

        // Pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        const paginatedResults = results.slice(offset, offset + limit);

        return {
            batches: paginatedResults.map(batch => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                product: batch.product,
                farm: batch.farm.name,
                status: batch.status,
                createdAt: batch.createdAt,
                trackingEvents: (this.trackingEvents.get(batch.id) || []).length
            })),
            pagination: {
                total: results.length,
                page,
                limit,
                pages: Math.ceil(results.length / limit)
            }
        };
    }

    /**
     * ตรวจสอบความถูกต้องของ Batch
     */
    async verifyBatch(batchId) {
        if (!this.batches.has(batchId)) {
            throw new Error('Batch not found');
        }

        const batch = this.batches.get(batchId);
        const events = this.trackingEvents.get(batchId) || [];

        // ตรวจสอบความสมบูรณ์ของข้อมูล
        const verification = {
            batchId,
            batchNumber: batch.batchNumber,
            authentic: true,
            verification: {
                farmCertification: !!batch.farm.gacpCertNumber,
                completeTrackingChain: events.length >= 3, // ต้องมีอย่างน้อย 3 events
                qualityData: !!batch.quality.grade,
                locationTracking: events.every(e => e.coordinates),
                timestamp: new Date().toISOString()
            },
            riskFactors: []
        };

        // ตรวจสอบ risk factors
        if (events.length < 3) {
            verification.riskFactors.push('Incomplete tracking chain');
        }

        if (!batch.farm.gacpCertNumber) {
            verification.riskFactors.push('Farm not GACP certified');
        }

        if (batch.quality.pesticides && batch.quality.pesticides.length > 0) {
            verification.riskFactors.push('Pesticide residue detected');
        }

        verification.authentic = verification.riskFactors.length === 0;

        return verification;
    }

    /**
     * Helper Methods
     */
    generateBatchNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `GACP${year}${month}${day}${random}`;
    }

    determineStatus(eventType) {
        const statusMap = {
            'batch_created': 'harvested',
            'processing_started': 'processing',
            'processing_completed': 'processed',
            'packaging_started': 'packaging',
            'packaging_completed': 'packaged',
            'quality_tested': 'tested',
            'shipped': 'in_transit',
            'delivered': 'delivered',
            'retail_received': 'at_retail',
            'sold': 'sold'
        };
        return statusMap[eventType] || 'unknown';
    }

    calculateSupplyChainMetrics(events) {
        if (events.length < 2) {
            return { totalTimeHours: 0, averageStayTime: 0, totalStages: 0 };
        }

        const sortedEvents = events.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        
        const totalTimeMs = new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp);
        const totalTimeHours = Math.round(totalTimeMs / (1000 * 60 * 60) * 100) / 100;

        return {
            totalTimeHours,
            averageStayTime: Math.round(totalTimeHours / events.length * 100) / 100,
            totalStages: events.length,
            startDate: firstEvent.timestamp,
            endDate: lastEvent.timestamp
        };
    }

    async start() {
        this.app.listen(this.port, () => {
            this.logger.info(`🔍 Track & Trace Service running on port ${this.port}`);
            console.log(`🔍 Track & Trace Service running on port ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
            console.log(`📋 API Documentation: http://localhost:${this.port}/api/v1/batches`);
        });
    }

    async stop() {
        this.logger.info('Track & Trace Service stopping...');
        process.exit(0);
    }
}

// สร้างและรัน service
const service = new TrackTraceService();

// Handle graceful shutdown
process.on('SIGTERM', () => service.stop());
process.on('SIGINT', () => service.stop());

if (require.main === module) {
    service.start();
}

module.exports = TrackTraceService;