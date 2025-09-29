// services/core-certification/src/index.js
const fastify = require('fastify');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Import models
const { User, Farm, Application, Certificate, Payment, Inspection, Standard } = require('./models');

// Initialize Fastify with production settings
const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  trustProxy: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  bodyLimit: 10485760 // 10MB
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/gacp_db';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis client for caching
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3
});

// JWT middleware
app.decorate('authenticate', async function(request, reply) {
  try {
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return reply.code(401).send({ error: 'Token has been revoked' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    
    request.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
});

// Role-based access control middleware
app.decorate('requireRole', function(roles) {
  return async function(request, reply) {
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ 
        error: 'Insufficient permissions',
        required: roles,
        current: request.user.role
      });
    }
  };
});

// Health check endpoint
app.get('/health', async (request, reply) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    
    // Check Redis connection
    await redis.ping();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    };
  } catch (error) {
    reply.code(503).send({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Application submission endpoint
app.post('/api/v1/applications', {
  preHandler: [app.authenticate, app.requireRole(['farmer'])],
  schema: {
    body: {
      type: 'object',
      required: ['product_id', 'form_data'],
      properties: {
        product_id: { type: 'string', format: 'uuid' },
        form_data: {
          type: 'object',
          required: ['applicant_type', 'site_address', 'water_source'],
          properties: {
            applicant_type: { 
              type: 'string',
              enum: ['individual', 'company', 'cooperative']
            },
            business_name: { type: 'string', maxLength: 200 },
            tax_id: { type: 'string', pattern: '^[0-9]{13}$' },
            site_address: {
              type: 'object',
              required: ['province', 'district', 'subdistrict'],
              properties: {
                province: { type: 'string' },
                district: { type: 'string' },
                subdistrict: { type: 'string' },
                postal_code: { type: 'string', pattern: '^[0-9]{5}$' }
              }
            },
            site_gps: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lng: { type: 'number', minimum: -180, maximum: 180 }
              }
            },
            total_area_rai: { type: 'number', minimum: 0.1 },
            water_source: { type: 'string' },
            soil_ph: { type: 'number', minimum: 0, maximum: 14 }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const { product_id, form_data } = request.body;
  const user_id = request.user.sub;
  
  try {
    // Check if user has completed e-learning
    const user = await User.findById(user_id);
    
    if (!user?.isActive) {
      throw new Error('User account is not active');
    }
    
    // Generate application code
    const applicationCode = `GACP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create application
    const application = new Application({
      applicationNumber: applicationCode,
      farmerId: user_id,
      farmId: form_data.farm_id,
      applicationType: 'new',
      status: 'draft',
      standardType: product_id,
      fees: {
        applicationFee: 5000,
        inspectionFee: 3000,
        certificateFee: 2000,
        totalFee: 10000,
        paidAmount: 0,
        paymentStatus: 'pending'
      }
    });
    
    await application.save();
    
    // Invalidate cache
    await redis.del(`applications:${user_id}`);
    
    // Send notification
    app.log.info(`New application created: ${applicationCode}`);
    
    return {
      success: true,
      application_id: application._id,
      application_code: applicationCode,
      status: 'draft',
      message: 'Application created successfully'
    };
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ 
      error: 'Failed to create application',
      message: error.message 
    });
  }
});

// Submit application for review
app.post('/api/v1/applications/:id/submit', {
  preHandler: [app.authenticate, app.requireRole(['farmer'])]
}, async (request, reply) => {
  const application_id = request.params.id;
  const user_id = request.user.sub;
  
  try {
    // Verify ownership and get application
    const application = await Application.findOne({
      _id: application_id,
      farmerId: user_id
    });
    
    if (!application) {
      throw new Error('Application not found or unauthorized');
    }
    
    if (application.status !== 'draft') {
      throw new Error('Application already submitted');
    }
    
    // Update status to submitted
    application.status = 'submitted';
    application.submissionDate = new Date();
    await application.save();
    
    // Create payment record
    const paymentCode = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const payment = new Payment({
      paymentId: paymentCode,
      applicationId: application_id,
      payerId: user_id,
      amount: 5000.00,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending'
    });
    
    await payment.save();
    
    // Update application fees
    application.fees.paidAmount = 0;
    application.fees.paymentStatus = 'pending';
    await application.save();
    
    return {
      success: true,
      application_id,
      payment_id: payment._id,
      payment_code: paymentCode,
      amount: 5000.00,
      next_action: 'payment_required',
      message: 'Application submitted successfully. Please proceed with payment.'
    };
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ 
      error: 'Failed to submit application',
      message: error.message 
    });
  }
});

// Get application status
app.get('/api/v1/applications/:id/status', {
  preHandler: [app.authenticate]
}, async (request, reply) => {
  const application_id = request.params.id;
  const user_id = request.user.sub;
  const user_role = request.user.role;
  
  try {
    // Check cache first
    const cached = await redis.get(`app-status:${application_id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    let application;
    
    if (user_role === 'farmer') {
      // Farmers can only see their own applications
      application = await Application.findOne({
        _id: application_id,
        farmerId: user_id
      }).populate('farmerId', 'email fullName')
        .populate('farmId', 'farmName')
        .populate('dtamOfficer', 'fullName email');
    } else {
      // Staff can see all applications
      application = await Application.findById(application_id)
        .populate('farmerId', 'email fullName')
        .populate('farmId', 'farmName')
        .populate('dtamOfficer', 'fullName email');
    }
    
    if (!application) {
      return reply.code(404).send({ error: 'Application not found' });
    }
    
    // Get payment information
    const payment = await Payment.findOne({ applicationId: application_id });
    
    const response = {
      id: application._id,
      application_code: application.applicationNumber,
      status: application.status,
      submitted_at: application.submissionDate,
      approved_at: application.approvalDate,
      standard_type: application.standardType,
      applicant_email: application.farmerId?.email,
      payment_status: payment?.paymentStatus || 'pending',
      payment_amount: payment?.amount || application.fees?.totalFee
    };
    
    // Cache for 5 minutes
    await redis.setex(
      `app-status:${application_id}`,
      300,
      JSON.stringify(response)
    );
    
    return response;
    
  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ 
      error: 'Failed to retrieve application status',
      message: error.message 
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  app.log.info('Starting graceful shutdown...');
  
  await app.close();
  await mongoose.connection.close();
  await redis.quit();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    await app.listen({ 
      port: process.env.PORT || 3001,
      host: '0.0.0.0'
    });
    
    app.log.info(`Server listening on port ${process.env.PORT || 3001}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();