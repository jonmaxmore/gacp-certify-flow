const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

/**
 * GACP Certification System - Main Application Server
 * Complete integrated system for Good Agricultural and Collection Practices certification
 */

const app = express();

// Import configuration
const config = require('./config/database-hybrid');
const logger = require('./microservices/certification-service/src/services/logger');

// Import middleware
const roleAuth = require('./microservices/certification-service/src/middleware/roleAuth');
const rateLimitMiddleware = require('./microservices/certification-service/src/middleware/rate-limit');

// Import services
const NotificationService = require('./microservices/certification-service/src/services/NotificationService');
const CertificateGenerationService = require('./microservices/certification-service/src/services/CertificateGenerationService');
const DocumentManagementService = require('./microservices/certification-service/src/services/DocumentManagementService');

// Import routes
const applicationRoutes = require('./microservices/certification-service/src/routes/applications');
const workflowRoutes = require('./routes/api/applications');
const documentRoutes = require('./microservices/certification-service/src/routes/documents');
const notificationRoutes = require('./microservices/certification-service/src/routes/notifications');
const certificateRoutes = require('./microservices/certification-service/src/routes/certificates');

// Initialize services
const notificationService = new NotificationService();
const certificateService = new CertificateGenerationService();
const documentService = new DocumentManagementService();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://gacp.doa.go.th',
      'https://api.gacp.doa.go.th'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certificate verification (public access)
    return req.path.startsWith('/verify/') || req.path.startsWith('/api/certificates/verify/');
  }
});

app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

// MongoDB connection
async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gacp_certification';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0
    });

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });

    // MongoDB event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
}

// PostgreSQL connection (for hybrid architecture)
async function connectPostgreSQL() {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.PG_USER || 'postgres',
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE || 'gacp_licenses',
      password: process.env.PG_PASSWORD || 'password',
      port: process.env.PG_PORT || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('PostgreSQL connected successfully', {
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE || 'gacp_licenses'
    });

    // Make pool available globally
    app.locals.pgPool = pool;

    return pool;

  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: error.message });
    // PostgreSQL is optional, continue without it
    logger.warn('Continuing without PostgreSQL - using MongoDB only');
  }
}

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      postgresql: app.locals.pgPool ? 'connected' : 'not_configured'
    }
  };

  try {
    // Quick MongoDB check
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = 'healthy';
  } catch (error) {
    health.services.mongodb = 'unhealthy';
    health.status = 'DEGRADED';
  }

  // Quick PostgreSQL check (if configured)
  if (app.locals.pgPool) {
    try {
      const client = await app.locals.pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      health.services.postgresql = 'healthy';
    } catch (error) {
      health.services.postgresql = 'unhealthy';
      health.status = 'DEGRADED';
    }
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GACP Certification System API',
    version: '1.0.0',
    description: 'Complete API for Good Agricultural and Collection Practices certification system',
    documentation: '/api/docs',
    endpoints: {
      applications: '/api/applications - Application management',
      workflow: '/api/workflow - Workflow operations', 
      documents: '/api/documents - Document management',
      notifications: '/api/notifications - Notification system',
      certificates: '/api/certificates - Certificate management',
      health: '/health - System health check'
    },
    authentication: 'Bearer token required for most endpoints',
    rateLimit: '100 requests per 15 minutes per IP'
  });
});

// Mount API routes
app.use('/api/applications', applicationRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);

// Public certificate verification (no /api prefix for public access)
app.use('/verify', certificateRoutes);

// =============================================================================
// WEBHOOK ENDPOINTS
// =============================================================================

// Payment gateway webhooks
app.post('/webhook/payment', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-payment-signature'];
    const payload = req.body;

    // Verify webhook signature (implement based on payment provider)
    // const isValid = verifyWebhookSignature(payload, signature);
    
    logger.info('Payment webhook received', {
      signature: signature?.substring(0, 20) + '...',
      payloadSize: payload.length
    });

    // Process payment notification
    const paymentData = JSON.parse(payload);
    
    // Update application payment status
    const Application = require('./microservices/certification-service/src/models/EnhancedApplication');
    
    if (paymentData.status === 'completed' && paymentData.applicationId) {
      await Application.findByIdAndUpdate(paymentData.applicationId, {
        'payment.status': 'completed',
        'payment.transactionId': paymentData.transactionId,
        'payment.completedAt': new Date(),
        'payment.method': paymentData.method,
        'payment.amount': paymentData.amount
      });

      // Send notification
      await notificationService.sendPaymentConfirmation(paymentData);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Payment webhook error', { error: error.message });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// SMS delivery status webhooks
app.post('/webhook/sms', async (req, res) => {
  try {
    const { messageId, status, deliveredAt } = req.body;

    logger.info('SMS webhook received', {
      messageId,
      status,
      deliveredAt
    });

    // Update notification status
    await notificationService.updateSMSStatus(messageId, status, deliveredAt);

    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('SMS webhook error', { error: error.message });
    res.status(400).json({ error: 'SMS webhook processing failed' });
  }
});

// =============================================================================
// FRONTEND ROUTES (if serving static frontend)
// =============================================================================

// Serve React/Vue frontend (if built for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 - Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  const server = app.listen(port, () => {
    logger.info('Server reference obtained for shutdown');
  });

  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }
      
      if (app.locals.pgPool) {
        await app.locals.pgPool.end();
        logger.info('PostgreSQL connection pool closed');
      }
      
      // Close other services
      await notificationService.cleanup?.();
      await certificateService.cleanup?.();
      await documentService.cleanup?.();
      
      logger.info('All services shutdown complete');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info('Starting GACP Certification System...');
    
    // Connect to databases
    await connectMongoDB();
    await connectPostgreSQL();
    
    // Initialize services
    await notificationService.initialize?.();
    await certificateService.initializeDirectories?.();
    await documentService.initialize?.();
    
    // Start HTTP server
    const server = app.listen(port, () => {
      logger.info('GACP Certification System started successfully', {
        port: port,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
      
      console.log(`
🚀 GACP Certification System is running!

🌐 Server: http://localhost:${port}
📚 API Documentation: http://localhost:${port}/api
💊 Health Check: http://localhost:${port}/health
🔍 Certificate Verification: http://localhost:${port}/verify/{certificateNumber}

Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });

    return server;

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;