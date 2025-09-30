/**
 * GACP Seed-to-Sale Tracking Service
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

class SeedToSaleTrackingService {
    constructor() {
        this.app = express();
        this.port = process.env.SEED_TO_SALE_PORT || 3009;
        
        // Data stores - ในการใช้งานจริงจะเชื่อมฐานข้อมูล
        this.lots = new Map(); // Lot-based tracking
        this.plants = new Map(); // Individual plant tracking
        this.products = new Map(); // Final products
        this.auditTrail = new Map(); // Immutable audit trail
        this.qrCodes = new Map(); // QR code registry
        this.supplyChainEvents = new Map(); // All supply chain events
        this.operators = new Map(); // Authorized operators
        this.locations = new Map(); // Registered locations
        
        // Tracking types
        this.trackingTypes = {
            LOT: 'lot_based',
            PLANT: 'individual_plant'
        };
        
        // Supply chain stages
        this.supplyChainStages = {
            SEED: 'seed_propagation',
            CULTIVATION: 'cultivation',
            HARVEST: 'harvest',
            PROCESSING: 'processing',
            TESTING: 'quality_testing',
            PACKAGING: 'packaging',
            DISTRIBUTION: 'distribution',
            RETAIL: 'retail',
            CONSUMER: 'consumer'
        };
        
        // Event types for audit trail
        this.eventTypes = {
            // Seed/Propagation events
            SEED_RECEIVED: 'seed_received',
            SEED_TESTED: 'seed_tested',
            SEED_APPROVED: 'seed_approved',
            LOT_CREATED: 'lot_created',
            
            // Planting events
            PLANTED: 'planted',
            PLANT_TAGGED: 'plant_tagged',
            GROWTH_RECORDED: 'growth_recorded',
            
            // Cultivation events
            WATERED: 'watered',
            FERTILIZED: 'fertilized',
            PEST_TREATMENT: 'pest_treatment',
            PRUNED: 'pruned',
            
            // Harvest events
            HARVEST_SCHEDULED: 'harvest_scheduled',
            HARVESTED: 'harvested',
            HARVEST_TESTED: 'harvest_tested',
            
            // Processing events
            PROCESSING_STARTED: 'processing_started',
            PROCESSING_STEP: 'processing_step',
            PROCESSING_COMPLETED: 'processing_completed',
            
            // Quality events
            QUALITY_TESTED: 'quality_tested',
            QUALITY_APPROVED: 'quality_approved',
            QUALITY_FAILED: 'quality_failed',
            
            // Distribution events
            PACKAGED: 'packaged',
            SHIPPED: 'shipped',
            RECEIVED: 'received',
            RETAIL_READY: 'retail_ready',
            SOLD: 'sold',
            
            // Audit events
            AUDIT_STARTED: 'audit_started',
            AUDIT_COMPLETED: 'audit_completed',
            COMPLIANCE_CHECK: 'compliance_check',
            
            // Alert events
            CONTAMINATION_ALERT: 'contamination_alert',
            RECALL_INITIATED: 'recall_initiated',
            SECURITY_INCIDENT: 'security_incident'
        };

        this.setupLogger();
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeMockData();
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
                new winston.transports.File({ filename: 'seed-to-sale.log' })
            ]
        });
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'GACP Seed-to-Sale Tracking Service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                tracking_stats: {
                    lots: this.lots.size,
                    plants: this.plants.size,
                    products: this.products.size,
                    events: this.supplyChainEvents.size
                }
            });
        });

        // Lot Management Routes
        this.app.post('/api/v1/lots', this.createLot.bind(this));
        this.app.get('/api/v1/lots', this.getLots.bind(this));
        this.app.get('/api/v1/lots/:lotId', this.getLotById.bind(this));
        this.app.put('/api/v1/lots/:lotId', this.updateLot.bind(this));
        this.app.get('/api/v1/lots/:lotId/history', this.getLotHistory.bind(this));
        this.app.get('/api/v1/lots/:lotId/qr', this.generateLotQR.bind(this));

        // Individual Plant Routes
        this.app.post('/api/v1/plants', this.createPlant.bind(this));
        this.app.get('/api/v1/plants', this.getPlants.bind(this));
        this.app.get('/api/v1/plants/:plantId', this.getPlantById.bind(this));
        this.app.put('/api/v1/plants/:plantId', this.updatePlant.bind(this));
        this.app.get('/api/v1/plants/:plantId/history', this.getPlantHistory.bind(this));
        this.app.get('/api/v1/plants/:plantId/qr', this.generatePlantQR.bind(this));

        // Event Tracking Routes
        this.app.post('/api/v1/events', this.recordEvent.bind(this));
        this.app.get('/api/v1/events', this.getEvents.bind(this));
        this.app.get('/api/v1/events/:eventId', this.getEventById.bind(this));

        // QR Code Routes
        this.app.get('/api/v1/verify/:qrId', this.verifyQRCode.bind(this));
        this.app.get('/api/v1/track/:entityId', this.trackEntity.bind(this));

        // Audit and Compliance Routes
        this.app.get('/api/v1/audit/:entityId', this.getAuditTrail.bind(this));
        this.app.post('/api/v1/compliance-check', this.performComplianceCheck.bind(this));
        this.app.get('/api/v1/reports/supply-chain/:entityId', this.getSupplyChainReport.bind(this));

        // Alert and Recall Routes
        this.app.post('/api/v1/alerts', this.createAlert.bind(this));
        this.app.post('/api/v1/recalls', this.initiateRecall.bind(this));
        this.app.get('/api/v1/recalls/:recallId', this.getRecallStatus.bind(this));

        // Public consumer verification
        this.app.get('/verify/:qrData', this.publicVerification.bind(this));
    }

    // ========================= LOT MANAGEMENT =========================

    async createLot(req, res) {
        try {
            const lotData = {
                id: uuidv4(),
                lotNumber: this.generateLotNumber(req.body.type),
                type: req.body.type, // seed_lot, plant_lot, harvest_lot, product_lot
                species: req.body.species,
                variety: req.body.variety,
                parentLotId: req.body.parentLotId || null,
                quantity: req.body.quantity,
                unit: req.body.unit,
                location: req.body.location,
                operator: req.body.operator,
                sourceInfo: req.body.sourceInfo || {},
                qualityData: req.body.qualityData || {},
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: req.body.metadata || {}
            };

            this.lots.set(lotData.id, lotData);

            // Create audit trail
            await this.recordAuditEvent({
                entityId: lotData.id,
                entityType: 'lot',
                eventType: this.eventTypes.LOT_CREATED,
                data: lotData,
                operator: req.body.operator,
                location: req.body.location
            });

            // Generate QR code
            const qrData = await this.generateQRCodeData('lot', lotData.id);
            this.qrCodes.set(qrData.id, qrData);

            this.logger.info(`Lot created: ${lotData.lotNumber}`, { lotId: lotData.id });

            res.status(201).json({
                success: true,
                data: {
                    lot: lotData,
                    qrCode: qrData
                }
            });
        } catch (error) {
            this.logger.error('Failed to create lot:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getLots(req, res) {
        try {
            const { type, status, species, page = 1, limit = 20 } = req.query;
            let lots = Array.from(this.lots.values());

            // Apply filters
            if (type) lots = lots.filter(lot => lot.type === type);
            if (status) lots = lots.filter(lot => lot.status === status);
            if (species) lots = lots.filter(lot => lot.species === species);

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedLots = lots.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    lots: paginatedLots,
                    pagination: {
                        total: lots.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(lots.length / limit)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to get lots:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getLotById(req, res) {
        try {
            const { lotId } = req.params;
            const lot = this.lots.get(lotId);

            if (!lot) {
                return res.status(404).json({
                    success: false,
                    message: 'Lot not found'
                });
            }

            // Get related information
            const events = this.getEventsForEntity(lotId);
            const children = Array.from(this.lots.values()).filter(l => l.parentLotId === lotId);
            const plants = Array.from(this.plants.values()).filter(p => p.lotId === lotId);

            res.json({
                success: true,
                data: {
                    lot,
                    events,
                    children,
                    plants: plants.length
                }
            });
        } catch (error) {
            this.logger.error('Failed to get lot:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ========================= PLANT MANAGEMENT =========================

    async createPlant(req, res) {
        try {
            const plantData = {
                id: uuidv4(),
                plantTag: this.generatePlantTag(),
                lotId: req.body.lotId,
                species: req.body.species,
                variety: req.body.variety,
                lifecycleStage: 'seedling',
                location: req.body.location,
                plantedDate: req.body.plantedDate || new Date().toISOString(),
                operator: req.body.operator,
                motherPlantId: req.body.motherPlantId || null,
                genetics: req.body.genetics || {},
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: req.body.metadata || {}
            };

            this.plants.set(plantData.id, plantData);

            // Create audit trail
            await this.recordAuditEvent({
                entityId: plantData.id,
                entityType: 'plant',
                eventType: this.eventTypes.PLANT_TAGGED,
                data: plantData,
                operator: req.body.operator,
                location: req.body.location
            });

            // Generate QR code
            const qrData = await this.generateQRCodeData('plant', plantData.id);
            this.qrCodes.set(qrData.id, qrData);

            this.logger.info(`Plant created: ${plantData.plantTag}`, { plantId: plantData.id });

            res.status(201).json({
                success: true,
                data: {
                    plant: plantData,
                    qrCode: qrData
                }
            });
        } catch (error) {
            this.logger.error('Failed to create plant:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getPlants(req, res) {
        try {
            const { lotId, stage, status, species, page = 1, limit = 20 } = req.query;
            let plants = Array.from(this.plants.values());

            // Apply filters
            if (lotId) plants = plants.filter(plant => plant.lotId === lotId);
            if (stage) plants = plants.filter(plant => plant.lifecycleStage === stage);
            if (status) plants = plants.filter(plant => plant.status === status);
            if (species) plants = plants.filter(plant => plant.species === species);

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedPlants = plants.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    plants: paginatedPlants,
                    pagination: {
                        total: plants.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(plants.length / limit)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to get plants:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ========================= EVENT RECORDING =========================

    async recordEvent(req, res) {
        try {
            const eventData = {
                id: uuidv4(),
                entityId: req.body.entityId,
                entityType: req.body.entityType, // lot, plant, product
                eventType: req.body.eventType,
                timestamp: req.body.timestamp || new Date().toISOString(),
                operator: req.body.operator,
                location: req.body.location,
                data: req.body.data || {},
                notes: req.body.notes || '',
                attachments: req.body.attachments || [],
                verified: false,
                verifiedBy: null,
                verifiedAt: null
            };

            this.supplyChainEvents.set(eventData.id, eventData);

            // Record in audit trail
            await this.recordAuditEvent(eventData);

            // Update entity status if needed
            await this.updateEntityStatus(eventData);

            this.logger.info(`Event recorded: ${eventData.eventType}`, { 
                eventId: eventData.id,
                entityId: eventData.entityId
            });

            res.status(201).json({
                success: true,
                data: eventData
            });
        } catch (error) {
            this.logger.error('Failed to record event:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ========================= QR CODE MANAGEMENT =========================

    async generateQRCodeData(entityType, entityId) {
        const qrData = {
            id: uuidv4(),
            entityType,
            entityId,
            version: '2.0',
            verificationUrl: `${process.env.PUBLIC_URL || 'https://track.gacp.go.th'}/verify/${uuidv4()}`,
            issuer: 'GACP Thailand',
            issuedDate: new Date().toISOString(),
            securityHash: this.generateSecurityHash(entityType, entityId),
            status: 'active'
        };

        return qrData;
    }

    async generateLotQR(req, res) {
        try {
            const { lotId } = req.params;
            const lot = this.lots.get(lotId);

            if (!lot) {
                return res.status(404).json({
                    success: false,
                    message: 'Lot not found'
                });
            }

            // Find existing QR or create new one
            let qrData = Array.from(this.qrCodes.values()).find(qr => 
                qr.entityType === 'lot' && qr.entityId === lotId
            );

            if (!qrData) {
                qrData = await this.generateQRCodeData('lot', lotId);
                this.qrCodes.set(qrData.id, qrData);
            }

            const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify({
                id: qrData.id,
                url: qrData.verificationUrl,
                type: 'lot',
                number: lot.lotNumber
            }), {
                type: 'png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            res.setHeader('Content-Type', 'image/png');
            res.send(qrCodeBuffer);
        } catch (error) {
            this.logger.error('Failed to generate QR code:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyQRCode(req, res) {
        try {
            const { qrId } = req.params;
            const qrData = this.qrCodes.get(qrId);

            if (!qrData) {
                return res.status(404).json({
                    success: false,
                    message: 'QR Code not found'
                });
            }

            if (qrData.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'QR Code is not active'
                });
            }

            // Get entity data
            let entity;
            if (qrData.entityType === 'lot') {
                entity = this.lots.get(qrData.entityId);
            } else if (qrData.entityType === 'plant') {
                entity = this.plants.get(qrData.entityId);
            } else if (qrData.entityType === 'product') {
                entity = this.products.get(qrData.entityId);
            }

            if (!entity) {
                return res.status(404).json({
                    success: false,
                    message: 'Entity not found'
                });
            }

            // Get audit trail
            const auditTrail = this.getEventsForEntity(qrData.entityId);

            res.json({
                success: true,
                data: {
                    qrCode: qrData,
                    entity,
                    auditTrail: auditTrail.slice(-10), // Last 10 events
                    verified: true,
                    verificationTime: new Date().toISOString()
                }
            });
        } catch (error) {
            this.logger.error('Failed to verify QR code:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ========================= AUDIT AND COMPLIANCE =========================

    async recordAuditEvent(eventData) {
        const auditEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            ...eventData,
            hash: this.generateAuditHash(eventData),
            verified: true
        };

        this.auditTrail.set(auditEntry.id, auditEntry);
        return auditEntry;
    }

    async getAuditTrail(req, res) {
        try {
            const { entityId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const auditEvents = this.getEventsForEntity(entityId);
            
            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedEvents = auditEvents.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    entityId,
                    events: paginatedEvents,
                    pagination: {
                        total: auditEvents.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(auditEvents.length / limit)
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to get audit trail:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async performComplianceCheck(req, res) {
        try {
            const { entityId, entityType, regulations } = req.body;
            
            // Get entity and its history
            let entity;
            if (entityType === 'lot') {
                entity = this.lots.get(entityId);
            } else if (entityType === 'plant') {
                entity = this.plants.get(entityId);
            }

            if (!entity) {
                return res.status(404).json({
                    success: false,
                    message: 'Entity not found'
                });
            }

            const auditTrail = this.getEventsForEntity(entityId);
            const complianceResult = this.checkCompliance(entity, auditTrail, regulations || ['GACP', 'WHO', 'FDA']);

            // Record compliance check event
            await this.recordAuditEvent({
                entityId,
                entityType,
                eventType: this.eventTypes.COMPLIANCE_CHECK,
                data: complianceResult,
                operator: req.body.operator || 'SYSTEM',
                location: req.body.location || 'SYSTEM'
            });

            res.json({
                success: true,
                data: complianceResult
            });
        } catch (error) {
            this.logger.error('Failed to perform compliance check:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // ========================= UTILITY METHODS =========================

    generateLotNumber(type) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        const typeCode = {
            'seed_lot': 'SD',
            'plant_lot': 'PL',
            'harvest_lot': 'HV',
            'product_lot': 'PR'
        };
        return `GACP-${typeCode[type] || 'LT'}-${year}${month}-${random}`;
    }

    generatePlantTag() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `PLANT-${year}-${random}`;
    }

    generateSecurityHash(entityType, entityId) {
        const data = `${entityType}:${entityId}:${new Date().getTime()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    generateAuditHash(eventData) {
        const data = JSON.stringify({
            entityId: eventData.entityId,
            eventType: eventData.eventType,
            timestamp: eventData.timestamp,
            operator: eventData.operator
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    getEventsForEntity(entityId) {
        return Array.from(this.supplyChainEvents.values())
            .filter(event => event.entityId === entityId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    checkCompliance(entity, auditTrail, regulations) {
        const complianceResult = {
            entityId: entity.id,
            entityType: entity.type || 'unknown',
            regulations,
            compliant: true,
            issues: [],
            score: 100,
            checkedAt: new Date().toISOString()
        };

        // GACP compliance checks
        if (regulations.includes('GACP')) {
            // Check for required events
            const requiredEvents = [this.eventTypes.LOT_CREATED];
            for (const eventType of requiredEvents) {
                if (!auditTrail.some(event => event.eventType === eventType)) {
                    complianceResult.issues.push(`Missing required event: ${eventType}`);
                    complianceResult.score -= 10;
                }
            }
        }

        // WHO compliance checks
        if (regulations.includes('WHO')) {
            // Check documentation completeness
            if (!entity.qualityData || Object.keys(entity.qualityData).length === 0) {
                complianceResult.issues.push('Missing quality data documentation');
                complianceResult.score -= 15;
            }
        }

        complianceResult.compliant = complianceResult.score >= 80;
        return complianceResult;
    }

    async updateEntityStatus(eventData) {
        // Update entity status based on event type
        const statusMap = {
            [this.eventTypes.PLANTED]: 'growing',
            [this.eventTypes.HARVESTED]: 'harvested',
            [this.eventTypes.PROCESSING_COMPLETED]: 'processed',
            [this.eventTypes.PACKAGED]: 'packaged',
            [this.eventTypes.SHIPPED]: 'in_transit',
            [this.eventTypes.RECEIVED]: 'received',
            [this.eventTypes.SOLD]: 'sold'
        };

        const newStatus = statusMap[eventData.eventType];
        if (!newStatus) return;

        if (eventData.entityType === 'lot') {
            const lot = this.lots.get(eventData.entityId);
            if (lot) {
                lot.status = newStatus;
                lot.updatedAt = new Date().toISOString();
                this.lots.set(eventData.entityId, lot);
            }
        } else if (eventData.entityType === 'plant') {
            const plant = this.plants.get(eventData.entityId);
            if (plant) {
                plant.status = newStatus;
                plant.updatedAt = new Date().toISOString();
                this.plants.set(eventData.entityId, plant);
            }
        }
    }

    initializeMockData() {
        // Create mock seed lot
        const seedLot = {
            id: 'seed-lot-001',
            lotNumber: 'GACP-SD-202509-0001',
            type: 'seed_lot',
            species: 'Cannabis sativa',
            variety: 'Thai Landrace',
            parentLotId: null,
            quantity: 1000,
            unit: 'seeds',
            location: 'Seed Bank - Chiang Mai',
            operator: 'Seed Specialist #001',
            sourceInfo: {
                supplier: 'Northern Thailand Seed Bank',
                country: 'Thailand',
                certification: 'Organic'
            },
            qualityData: {
                germination_rate: 95,
                purity: 99.5,
                moisture_content: 8.2
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.lots.set(seedLot.id, seedLot);

        // Create mock individual plant
        const plant = {
            id: 'plant-001',
            plantTag: 'PLANT-2025-000001',
            lotId: 'seed-lot-001',
            species: 'Cannabis sativa',
            variety: 'Thai Landrace',
            lifecycleStage: 'flowering',
            location: {
                farmId: 'farm-001',
                section: 'Field-A-Section-1',
                coordinates: '18.7883,98.9853'
            },
            plantedDate: '2025-06-01T00:00:00Z',
            operator: 'Farmer #001',
            motherPlantId: null,
            genetics: {
                strain: 'Thai Landrace',
                genetics_type: 'Sativa Dominant'
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.plants.set(plant.id, plant);

        this.logger.info('Mock data initialized');
    }

    async start() {
        try {
            this.app.listen(this.port, () => {
                this.logger.info(`GACP Seed-to-Sale Tracking Service running on port ${this.port}`);
                this.logger.info(`Service URL: http://localhost:${this.port}`);
                this.logger.info('Available endpoints:');
                this.logger.info('  - GET /health - Health check');
                this.logger.info('  - POST /api/v1/lots - Create lot');
                this.logger.info('  - GET /api/v1/lots - Get lots');
                this.logger.info('  - POST /api/v1/plants - Create plant');
                this.logger.info('  - GET /api/v1/plants - Get plants');
                this.logger.info('  - POST /api/v1/events - Record event');
                this.logger.info('  - GET /api/v1/verify/:qrId - Verify QR code');
                this.logger.info('  - GET /api/v1/audit/:entityId - Get audit trail');
            });
        } catch (error) {
            this.logger.error('Failed to start service:', error);
            process.exit(1);
        }
    }

    async stop() {
        this.logger.info('Shutting down Seed-to-Sale Tracking Service...');
        process.exit(0);
    }
}

// สร้างและรัน service
const service = new SeedToSaleTrackingService();

// Handle graceful shutdown
process.on('SIGTERM', () => service.stop());
process.on('SIGINT', () => service.stop());

if (require.main === module) {
    service.start();
}

module.exports = SeedToSaleTrackingService;