// security/defense-in-depth.js

/**
 * Defense-in-Depth Security Implementation
 * 5 Layers of Security Controls
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const crypto = require('crypto');

class SecurityMiddleware {
  constructor(app) {
    this.app = app;
    this.initializeSecurityLayers();
  }

  /**
   * Layer 1: Network Security
   */
  setupNetworkSecurity() {
    // Helmet for security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'same-origin' },
      xssFilter: true
    }));

    // CORS Configuration
    const corsOptions = {
      origin: (origin, callback) => {
        const whitelist = process.env.CORS_WHITELIST?.split(',') || [
          'https://gacp.dtam.go.th',
          'https://api.gacp.dtam.go.th'
        ];
        
        if (process.env.NODE_ENV === 'development' || !origin) {
          callback(null, true);
        } else if (whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
      maxAge: 86400 // 24 hours
    };
    
    this.app.use(cors(corsOptions));
  }

  /**
   * Layer 2: Application Security
   */
  setupApplicationSecurity() {
    // Rate Limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: req.rateLimit.resetTime
        });
      }
    });
    
    // Stricter limiter for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true
    });
    
    this.app.use('/api/', limiter);
    this.app.use('/api/auth/', authLimiter);
    
    // Input Sanitization
    this.app.use(mongoSanitize()); // Prevent NoSQL injection
    this.app.use(xss()); // Clean user input from malicious HTML
    this.app.use(hpp()); // Prevent HTTP Parameter Pollution
    
    // Request Size Limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  /**
   * Layer 3: Authentication & Authorization
   */
  setupAuthenticationLayer() {
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    
    // Load RSA keys
    const privateKey = fs.readFileSync('./keys/private.key', 'utf8');
    const publicKey = fs.readFileSync('./keys/public.key', 'utf8');
    
    // JWT Middleware
    this.app.use('/api/protected', async (req, res, next) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        
        // Verify token
        const decoded = jwt.verify(token, publicKey, {
          algorithms: ['RS256'],
          issuer: 'gacp.dtam.go.th',
          audience: 'gacp-api'
        });
        
        // Check token expiration
        if (decoded.exp < Date.now() / 1000) {
          return res.status(401).json({ error: 'Token expired' });
        }
        
        // Check if token is blacklisted
        const isBlacklisted = await this.checkTokenBlacklist(token);
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token revoked' });
        }
        
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    });
  }

  /**
   * Layer 4: Data Protection
   */
  setupDataProtection() {
    const CryptoJS = require('crypto-js');
    
    // Encryption middleware for sensitive data
    this.app.use((req, res, next) => {
      // Encrypt sensitive fields before storing
      req.encryptField = (data, field) => {
        if (data[field]) {
          const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(data[field]),
            process.env.ENCRYPTION_KEY
          ).toString();
          data[field] = encrypted;
        }
        return data;
      };
      
      // Decrypt sensitive fields when retrieving
      req.decryptField = (data, field) => {
        if (data[field]) {
          const decrypted = CryptoJS.AES.decrypt(
            data[field],
            process.env.ENCRYPTION_KEY
          );
          data[field] = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        }
        return data;
      };
      
      next();
    });
  }

  /**
   * Layer 5: Monitoring & Incident Response
   */
  setupMonitoring() {
    const winston = require('winston');
    const { ElasticsearchTransport } = require('winston-elasticsearch');
    
    // Configure logging
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'gacp-api' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: { 
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
          },
          index: 'gacp-logs'
        })
      ]
    });
    
    // Log all requests
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        
        logger.info({
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.sub,
          timestamp: new Date().toISOString()
        });
        
        // Alert on suspicious activity
        if (res.statusCode === 401 || res.statusCode === 403) {
          this.checkSuspiciousActivity(req.ip);
        }
      });
      
      next();
    });
  }
  
  async checkSuspiciousActivity(ip) {
    // Implementation for checking suspicious patterns
    const redis = require('./redis-client');
    const key = `suspicious:${ip}`;
    
    const count = await redis.incr(key);
    await redis.expire(key, 3600); // 1 hour window
    
    if (count > 10) {
      // Block IP temporarily
      await redis.setex(`blocked:${ip}`, 3600, 'true');
      
      // Send alert
      this.sendSecurityAlert({
        type: 'SUSPICIOUS_ACTIVITY',
        ip,
        count,
        action: 'IP_BLOCKED'
      });
    }
  }
  
  initializeSecurityLayers() {
    this.setupNetworkSecurity();
    this.setupApplicationSecurity();
    this.setupAuthenticationLayer();
    this.setupDataProtection();
    this.setupMonitoring();
  }
}

module.exports = SecurityMiddleware;