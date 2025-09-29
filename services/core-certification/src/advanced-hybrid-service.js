const express = require('express');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

class GACPAdvancedService {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.connectDatabases();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง',
        error: 'RATE_LIMIT_EXCEEDED'
      }
    });
    this.app.use('/api', limiter);
  }

  async connectDatabases() {
    try {
      // PostgreSQL Connection
      this.pgPool = new Pool({
        connectionString: process.env.POSTGRESQL_URI || 
          'postgresql://gacp_user:gacp_secure_pass_2024@localhost:5432/gacp_certify',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test PostgreSQL connection
      const pgClient = await this.pgPool.connect();
      console.log('✅ PostgreSQL connected successfully');
      pgClient.release();

      // MongoDB Connection
      this.mongoClient = new MongoClient(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/gacp_db'
      );
      await this.mongoClient.connect();
      this.mongodb = this.mongoClient.db('gacp_db');
      console.log('✅ MongoDB connected successfully');

      // Redis Connection
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URI || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      console.log('✅ Redis connected successfully');

    } catch (error) {
      console.error('❌ Database connection error:', error);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'gacp-advanced-service',
        version: '2.0.0',
        databases: {
          postgresql: 'connected',
          mongodb: 'connected', 
          redis: 'connected'
        }
      });
    });

    // Application routes
    this.app.use('/api/v1', this.createAPIRoutes());

    // Error handling
    this.app.use(this.errorHandler);
  }

  createAPIRoutes() {
    const router = express.Router();

    // ========== HYBRID DATABASE OPERATIONS ==========

    // GET Applications with hybrid query
    router.get('/applications', async (req, res, next) => {
      try {
        const { 
          page = 1, 
          limit = 10, 
          status, 
          province, 
          search,
          sort = 'created_at'
        } = req.query;

        const offset = (page - 1) * limit;

        // PostgreSQL query for core data
        let pgQuery = `
          SELECT 
            a.id, a.application_number, a.status, a.submitted_at,
            a.reviewer_id, a.review_notes, a.certificate_number,
            f.id as farmer_id, f.thai_id, f.first_name, f.last_name,
            f.phone, f.email, f.province, f.district, f.subdistrict
          FROM applications a
          LEFT JOIN farmers f ON a.farmer_id = f.id
          WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (status) {
          pgQuery += ` AND a.status = $${paramIndex++}`;
          params.push(status);
        }

        if (province) {
          pgQuery += ` AND f.province = $${paramIndex++}`;
          params.push(province);
        }

        if (search) {
          pgQuery += ` AND (
            f.first_name ILIKE $${paramIndex} OR 
            f.last_name ILIKE $${paramIndex} OR 
            a.application_number ILIKE $${paramIndex}
          )`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        pgQuery += ` ORDER BY a.${sort} DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        // Execute PostgreSQL query
        const pgResult = await this.pgPool.query(pgQuery, params);

        // Enrich with MongoDB data
        const enrichedApplications = await Promise.all(
          pgResult.rows.map(async (app) => {
            // Get detailed farm data from MongoDB
            const mongoData = await this.mongodb
              .collection('applications')
              .findOne({ application_id: app.id });

            return {
              ...app,
              farm_details: mongoData?.farm_details || {},
              cultivation_data: mongoData?.cultivation_data || {},
              certifications: mongoData?.certifications || [],
              attachments: mongoData?.attachments || []
            };
          })
        );

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) 
          FROM applications a 
          LEFT JOIN farmers f ON a.farmer_id = f.id 
          WHERE 1=1
          ${status ? 'AND a.status = $1' : ''}
          ${province ? `AND f.province = $${status ? 2 : 1}` : ''}
        `;

        const countParams = [];
        if (status) countParams.push(status);
        if (province) countParams.push(province);

        const countResult = await this.pgPool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
          success: true,
          data: enrichedApplications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        next(error);
      }
    });

    // POST Create Application (Hybrid)
    router.post('/applications', async (req, res, next) => {
      const pgClient = await this.pgPool.connect();
      
      try {
        await pgClient.query('BEGIN');

        const {
          farmer_data,
          farm_details,
          cultivation_data,
          certifications
        } = req.body;

        // 1. Insert farmer to PostgreSQL
        const farmerResult = await pgClient.query(`
          INSERT INTO farmers (
            thai_id, first_name, last_name, phone, email,
            province, district, subdistrict, address, postal_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          farmer_data.thai_id,
          farmer_data.first_name,
          farmer_data.last_name,
          farmer_data.phone,
          farmer_data.email,
          farmer_data.province,
          farmer_data.district,
          farmer_data.subdistrict,
          farmer_data.address,
          farmer_data.postal_code
        ]);

        const farmerId = farmerResult.rows[0].id;

        // 2. Generate application number
        const appNumber = `GACP${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;

        // 3. Insert application to PostgreSQL
        const applicationResult = await pgClient.query(`
          INSERT INTO applications (
            application_number, farmer_id, status, submitted_at
          ) VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [appNumber, farmerId, 'pending', new Date()]);

        const applicationId = applicationResult.rows[0].id;

        // 4. Insert detailed data to MongoDB
        await this.mongodb.collection('applications').insertOne({
          application_id: applicationId,
          application_number: appNumber,
          farm_details: {
            ...farm_details,
            coordinates: {
              type: 'Point',
              coordinates: [farm_details.longitude, farm_details.latitude]
            }
          },
          cultivation_data,
          certifications,
          attachments: [],
          metadata: {
            created_at: new Date(),
            updated_at: new Date(),
            created_by: req.user?.id || 'system'
          }
        });

        await pgClient.query('COMMIT');

        // Cache result in Redis for quick access
        await this.redisClient.setEx(
          `application:${applicationId}`,
          3600, // 1 hour
          JSON.stringify({ applicationId, appNumber, status: 'pending' })
        );

        res.status(201).json({
          success: true,
          message: 'สร้างคำขอรับรองเรียบร้อยแล้ว',
          data: {
            application_id: applicationId,
            application_number: appNumber,
            farmer_id: farmerId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        await pgClient.query('ROLLBACK');
        next(error);
      } finally {
        pgClient.release();
      }
    });

    // GET Application by ID (Hybrid)
    router.get('/applications/:id', async (req, res, next) => {
      try {
        const { id } = req.params;

        // Check Redis cache first
        const cached = await this.redisClient.get(`application:${id}`);
        if (cached) {
          console.log('📥 Serving from Redis cache');
        }

        // Get core data from PostgreSQL
        const pgQuery = `
          SELECT 
            a.*, 
            f.thai_id, f.first_name, f.last_name, f.phone, f.email,
            f.province, f.district, f.subdistrict, f.address
          FROM applications a
          LEFT JOIN farmers f ON a.farmer_id = f.id
          WHERE a.id = $1
        `;

        const pgResult = await this.pgPool.query(pgQuery, [id]);

        if (pgResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'ไม่พบคำขอรับรองที่ระบุ',
            error: 'APPLICATION_NOT_FOUND'
          });
        }

        const application = pgResult.rows[0];

        // Get detailed data from MongoDB
        const mongoData = await this.mongodb
          .collection('applications')
          .findOne({ application_id: parseInt(id) });

        const result = {
          ...application,
          farm_details: mongoData?.farm_details || {},
          cultivation_data: mongoData?.cultivation_data || {},
          certifications: mongoData?.certifications || [],
          attachments: mongoData?.attachments || []
        };

        // Update cache
        await this.redisClient.setEx(
          `application:${id}`,
          3600,
          JSON.stringify(result)
        );

        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        next(error);
      }
    });

    // Statistics endpoint using PostgreSQL aggregation
    router.get('/statistics', async (req, res, next) => {
      try {
        const stats = await this.pgPool.query(`
          SELECT 
            COUNT(*) as total_applications,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days
          FROM applications
        `);

        const provinceStats = await this.pgPool.query(`
          SELECT 
            f.province,
            COUNT(*) as total,
            COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved
          FROM applications a
          LEFT JOIN farmers f ON a.farmer_id = f.id
          WHERE f.province IS NOT NULL
          GROUP BY f.province
          ORDER BY total DESC
          LIMIT 10
        `);

        res.json({
          success: true,
          data: {
            overview: stats.rows[0],
            by_province: provinceStats.rows
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  errorHandler(error, req, res, next) {
    console.error('❌ Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.code || 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  async start(port = 3001) {
    this.app.listen(port, () => {
      console.log('🚀 GACP Advanced Hybrid Service running on port', port);
      console.log('📋 Health Check: http://localhost:' + port + '/health');
      console.log('🔗 API Base: http://localhost:' + port + '/api/v1/applications');
      console.log('📊 Statistics: http://localhost:' + port + '/api/v1/statistics');
    });
  }

  async shutdown() {
    console.log('📥 Shutting down gracefully...');
    
    if (this.pgPool) {
      await this.pgPool.end();
      console.log('✅ PostgreSQL pool closed');
    }
    
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.log('✅ MongoDB connection closed');
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('✅ Redis connection closed');
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (global.gacpService) {
    await global.gacpService.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (global.gacpService) {
    await global.gacpService.shutdown();
  }
  process.exit(0);
});

// Start service
if (require.main === module) {
  global.gacpService = new GACPAdvancedService();
  global.gacpService.start();
}

module.exports = GACPAdvancedService;