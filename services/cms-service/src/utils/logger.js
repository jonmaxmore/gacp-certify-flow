const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for CMS service logs
const cmsLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, service = 'CMS', ...meta }) => {
        let log = `[${timestamp}] [${service}] ${level.toUpperCase()}: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += ` | Meta: ${JSON.stringify(meta)}`;
        }
        
        // Add stack trace for errors
        if (stack) {
            log += `\nStack: ${stack}`;
        }
        
        return log;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: cmsLogFormat,
    defaultMeta: { service: 'GACP-CMS' },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                cmsLogFormat
            )
        }),
        
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'cms-service.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Separate file for errors
        new winston.transports.File({
            filename: path.join(logsDir, 'cms-errors.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 3,
            tailable: true
        }),
        
        // Separate file for audit trails
        new winston.transports.File({
            filename: path.join(logsDir, 'cms-audit.log'),
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 20 * 1024 * 1024, // 20MB
            maxFiles: 10,
            tailable: true
        })
    ]
});

// Add production-specific transports
if (process.env.NODE_ENV === 'production') {
    // Add external logging service if configured
    if (process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT) {
        const papertrail = new winston.transports.Syslog({
            host: process.env.PAPERTRAIL_HOST,
            port: process.env.PAPERTRAIL_PORT,
            protocol: 'tls4',
            localhost: 'gacp-cms-service',
            eol: '\n'
        });
        logger.add(papertrail);
    }
    
    // Add file rotation for production
    logger.configure({
        level: 'warn', // Only log warnings and errors in production
        transports: logger.transports
    });
}

// Audit logging functions
const auditLogger = {
    contentCreated: (contentId, title, author) => {
        logger.info('Content created', {
            action: 'CONTENT_CREATED',
            contentId,
            title,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    contentUpdated: (contentId, title, author, changes) => {
        logger.info('Content updated', {
            action: 'CONTENT_UPDATED',
            contentId,
            title,
            author,
            changes,
            timestamp: new Date().toISOString()
        });
    },
    
    contentDeleted: (contentId, title, author) => {
        logger.warn('Content deleted', {
            action: 'CONTENT_DELETED',
            contentId,
            title,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    contentPublished: (contentId, title, author) => {
        logger.info('Content published', {
            action: 'CONTENT_PUBLISHED',
            contentId,
            title,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    contentUnpublished: (contentId, title, author) => {
        logger.warn('Content unpublished', {
            action: 'CONTENT_UNPUBLISHED',
            contentId,
            title,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    mediaUploaded: (mediaId, filename, size, author) => {
        logger.info('Media uploaded', {
            action: 'MEDIA_UPLOADED',
            mediaId,
            filename,
            size,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    mediaDeleted: (mediaId, filename, author) => {
        logger.warn('Media deleted', {
            action: 'MEDIA_DELETED',
            mediaId,
            filename,
            author,
            timestamp: new Date().toISOString()
        });
    },
    
    userAccess: (userId, action, resource, ip) => {
        logger.info('User access', {
            action: 'USER_ACCESS',
            userId,
            userAction: action,
            resource,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    systemEvent: (event, details) => {
        logger.info('System event', {
            action: 'SYSTEM_EVENT',
            event,
            details,
            timestamp: new Date().toISOString()
        });
    },
    
    securityEvent: (event, severity, details, ip) => {
        logger.warn('Security event', {
            action: 'SECURITY_EVENT',
            event,
            severity,
            details,
            ip,
            timestamp: new Date().toISOString()
        });
    }
};

// Performance logging
const performanceLogger = {
    requestTimer: (req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            const logLevel = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
            
            logger[logLevel]('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
        });
        
        next();
    },
    
    dbOperation: (operation, collection, duration, recordCount = null) => {
        logger.debug('Database operation', {
            operation,
            collection,
            duration: `${duration}ms`,
            recordCount,
            timestamp: new Date().toISOString()
        });
    },
    
    cacheOperation: (operation, key, hit = null, duration = null) => {
        logger.debug('Cache operation', {
            operation,
            key,
            hit,
            duration: duration ? `${duration}ms` : null,
            timestamp: new Date().toISOString()
        });
    }
};

// Error handling and reporting
const errorLogger = {
    logError: (error, context = {}) => {
        logger.error('Application error', {
            error: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    },
    
    logValidationError: (errors, context = {}) => {
        logger.warn('Validation error', {
            errors,
            context,
            timestamp: new Date().toISOString()
        });
    },
    
    logDatabaseError: (error, operation, collection = null) => {
        logger.error('Database error', {
            error: error.message,
            operation,
            collection,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    },
    
    logAuthError: (error, userId = null, ip = null) => {
        logger.warn('Authentication error', {
            error: error.message,
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    logFileError: (error, filename, operation) => {
        logger.error('File operation error', {
            error: error.message,
            filename,
            operation,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

// Health check logging
const healthLogger = {
    serviceStatus: (service, status, responseTime = null, details = null) => {
        const logLevel = status === 'healthy' ? 'debug' : 'warn';
        logger[logLevel]('Service health check', {
            service,
            status,
            responseTime: responseTime ? `${responseTime}ms` : null,
            details,
            timestamp: new Date().toISOString()
        });
    },
    
    databaseStatus: (status, responseTime = null, error = null) => {
        const logLevel = status === 'connected' ? 'debug' : 'error';
        logger[logLevel]('Database health check', {
            status,
            responseTime: responseTime ? `${responseTime}ms` : null,
            error: error ? error.message : null,
            timestamp: new Date().toISOString()
        });
    },
    
    memoryUsage: (usage) => {
        const usedMB = Math.round(usage.used / 1024 / 1024 * 100) / 100;
        const totalMB = Math.round(usage.total / 1024 / 1024 * 100) / 100;
        const percentage = Math.round((usage.used / usage.total) * 100);
        
        const logLevel = percentage > 90 ? 'warn' : percentage > 70 ? 'info' : 'debug';
        
        logger[logLevel]('Memory usage', {
            used: `${usedMB}MB`,
            total: `${totalMB}MB`,
            percentage: `${percentage}%`,
            timestamp: new Date().toISOString()
        });
    }
};

// Content-specific logging
const contentLogger = {
    contentViewed: (contentId, title, userId = null, ip = null) => {
        logger.debug('Content viewed', {
            action: 'CONTENT_VIEWED',
            contentId,
            title,
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    contentSearched: (query, resultCount, userId = null, ip = null) => {
        logger.info('Content searched', {
            action: 'CONTENT_SEARCHED',
            query,
            resultCount,
            userId,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    contentExported: (contentId, format, userId = null) => {
        logger.info('Content exported', {
            action: 'CONTENT_EXPORTED',
            contentId,
            format,
            userId,
            timestamp: new Date().toISOString()
        });
    },
    
    bulkOperation: (operation, count, userId = null) => {
        logger.info('Bulk operation performed', {
            action: 'BULK_OPERATION',
            operation,
            count,
            userId,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    logger,
    auditLogger,
    performanceLogger,
    errorLogger,
    healthLogger,
    contentLogger
};