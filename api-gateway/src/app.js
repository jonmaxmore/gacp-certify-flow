const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'กรุณารอสักครู่แล้วลองใหม่'
  }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  certification: process.env.CERTIFICATION_SERVICE_URL || 'http://localhost:3002',
  survey: process.env.SURVEY_SERVICE_URL || 'http://localhost:3003',
  standards: process.env.STANDARDS_SERVICE_URL || 'http://localhost:3004',
  tracking: process.env.TRACK_TRACE_SERVICE_URL || 'http://localhost:3005',
  cms: process.env.CMS_SERVICE_URL || 'http://localhost:3006'
};

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      auth: services.auth,
      certification: services.certification,
      survey: services.survey,
      standards: services.standards,
      tracking: services.tracking,
      cms: services.cms
    }
  });
});

// Service routing with proxy
const createServiceProxy = (serviceName, serviceUrl) => {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: '/api'
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err.message);
      res.status(503).json({
        error: 'Service unavailable',
        message: `ไม่สามารถเชื่อมต่อกับระบบ ${serviceName} ได้`,
        service: serviceName
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying request to ${serviceName}:`, {
        originalUrl: req.originalUrl,
        target: serviceUrl + req.path
      });
    }
  });
};

// Auth service routes
app.use('/api/auth', createServiceProxy('auth', services.auth));

// Certification service routes  
app.use('/api/certification', createServiceProxy('certification', services.certification));

// Survey service routes
app.use('/api/survey', createServiceProxy('survey', services.survey));

// Standards service routes
app.use('/api/standards', createServiceProxy('standards', services.standards));

// Track & Trace service routes
app.use('/api/tracking', createServiceProxy('tracking', services.tracking));

// CMS service routes
app.use('/api/cms', createServiceProxy('cms', services.cms));

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'GACP Platform API Gateway',
    version: '1.0.0',
    services: {
      '/api/auth': 'Authentication & User Management',
      '/api/certification': 'Certification Application & Management', 
      '/api/survey': 'Survey Management & Analytics',
      '/api/standards': 'Standards Comparison (GACP vs WHO/FAO/Asian)',
      '/api/tracking': 'Track & Trace System',
      '/api/cms': 'Content Management & Website'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Gateway error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(err.statusCode || 500).json({
    error: 'Gateway error',
    message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'ไม่พบเส้นทาง API ที่ระบุ',
    availableRoutes: [
      '/api/auth',
      '/api/certification', 
      '/api/survey',
      '/api/standards',
      '/api/tracking',
      '/api/cms'
    ]
  });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Connected services:', services);
});

module.exports = app;