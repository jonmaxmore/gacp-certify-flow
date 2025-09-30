const mongoose = require('mongoose');
require('dotenv').config();

/**
 * GACP Background Worker
 * Handles background tasks like notifications, certificate generation, and cleanup
 */

const logger = require('./microservices/certification-service/src/services/logger');
const NotificationService = require('./microservices/certification-service/src/services/NotificationService');
const CertificateGenerationService = require('./microservices/certification-service/src/services/CertificateGenerationService');

class GACPWorker {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    
    // Initialize services
    this.notificationService = new NotificationService();
    this.certificateService = new CertificateGenerationService();
    
    // Task configurations
    this.tasks = {
      processNotificationQueue: {
        interval: 5000, // 5 seconds
        enabled: true
      },
      cleanupExpiredSessions: {
        interval: 300000, // 5 minutes
        enabled: true
      },
      certificateExpiryWarning: {
        interval: 86400000, // 24 hours
        enabled: true
      },
      systemHealthCheck: {
        interval: 60000, // 1 minute
        enabled: true
      },
      logRotation: {
        interval: 3600000, // 1 hour
        enabled: true
      },
      databaseMaintenance: {
        interval: 86400000, // 24 hours
        enabled: true
      }
    };
  }

  async start() {
    try {
      logger.info('Starting GACP Background Worker...');

      // Connect to MongoDB
      await this.connectDatabase();

      // Initialize services
      await this.notificationService.initialize?.();
      await this.certificateService.initializeDirectories?.();

      // Start background tasks
      this.startBackgroundTasks();

      this.isRunning = true;
      logger.info('GACP Background Worker started successfully');

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start background worker', { error: error.message });
      process.exit(1);
    }
  }

  async connectDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gacp_certification';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 5, // Smaller pool for worker
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      logger.info('Worker MongoDB connected', {
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });

    } catch (error) {
      logger.error('Worker MongoDB connection failed', { error: error.message });
      throw error;
    }
  }

  startBackgroundTasks() {
    for (const [taskName, config] of Object.entries(this.tasks)) {
      if (config.enabled) {
        const intervalId = setInterval(async () => {
          try {
            await this[taskName]();
          } catch (error) {
            logger.error(`Background task failed: ${taskName}`, { error: error.message });
          }
        }, config.interval);

        this.intervals.set(taskName, intervalId);
        logger.info(`Started background task: ${taskName}`, { interval: config.interval });
      }
    }
  }

  // =============================================================================
  // BACKGROUND TASKS
  // =============================================================================

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    try {
      const processed = await this.notificationService.processQueue();
      
      if (processed > 0) {
        logger.debug(`Processed ${processed} notifications from queue`);
      }

    } catch (error) {
      logger.error('Notification queue processing failed', { error: error.message });
    }
  }

  /**
   * Clean up expired sessions and temporary data
   */
  async cleanupExpiredSessions() {
    try {
      const Application = require('./microservices/certification-service/src/models/EnhancedApplication');
      
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      // Clean up draft applications older than 30 days
      const deletedDrafts = await Application.deleteMany({
        currentStatus: 'draft',
        createdAt: { $lt: thirtyDaysAgo }
      });

      if (deletedDrafts.deletedCount > 0) {
        logger.info(`Cleaned up ${deletedDrafts.deletedCount} expired draft applications`);
      }

      // Clean up temporary files
      await this.cleanupTemporaryFiles();

    } catch (error) {
      logger.error('Cleanup expired sessions failed', { error: error.message });
    }
  }

  /**
   * Send certificate expiry warnings
   */
  async certificateExpiryWarning() {
    try {
      const Application = require('./microservices/certification-service/src/models/EnhancedApplication');
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Find certificates expiring in 30 days
      const expiringSoon = await Application.find({
        'approval.certificateGenerated': true,
        'approval.certificateExpiryDate': {
          $gte: now,
          $lte: thirtyDaysFromNow
        },
        'approval.expiryWarning30Sent': { $ne: true }
      });

      // Find certificates expiring in 7 days
      const expiringUrgent = await Application.find({
        'approval.certificateGenerated': true,
        'approval.certificateExpiryDate': {
          $gte: now,
          $lte: sevenDaysFromNow
        },
        'approval.expiryWarning7Sent': { $ne: true }
      });

      // Send 30-day warnings
      for (const application of expiringSoon) {
        try {
          await this.notificationService.sendCertificateExpiryWarning(application, 30);
          
          await Application.findByIdAndUpdate(application._id, {
            'approval.expiryWarning30Sent': true,
            'approval.expiryWarning30SentAt': new Date()
          });

          logger.info('Sent 30-day expiry warning', {
            applicationId: application._id,
            certificateNumber: application.approval.certificateNumber
          });

        } catch (error) {
          logger.error('Failed to send 30-day expiry warning', {
            applicationId: application._id,
            error: error.message
          });
        }
      }

      // Send 7-day warnings
      for (const application of expiringUrgent) {
        try {
          await this.notificationService.sendCertificateExpiryWarning(application, 7);
          
          await Application.findByIdAndUpdate(application._id, {
            'approval.expiryWarning7Sent': true,
            'approval.expiryWarning7SentAt': new Date()
          });

          logger.info('Sent 7-day expiry warning', {
            applicationId: application._id,
            certificateNumber: application.approval.certificateNumber
          });

        } catch (error) {
          logger.error('Failed to send 7-day expiry warning', {
            applicationId: application._id,
            error: error.message
          });
        }
      }

      if (expiringSoon.length > 0 || expiringUrgent.length > 0) {
        logger.info('Certificate expiry warnings processed', {
          thirtyDayWarnings: expiringSoon.length,
          sevenDayWarnings: expiringUrgent.length
        });
      }

    } catch (error) {
      logger.error('Certificate expiry warning failed', { error: error.message });
    }
  }

  /**
   * System health check
   */
  async systemHealthCheck() {
    try {
      const health = {
        timestamp: new Date(),
        mongodb: 'unknown',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };

      // Check MongoDB
      try {
        await mongoose.connection.db.admin().ping();
        health.mongodb = 'healthy';
      } catch (error) {
        health.mongodb = 'unhealthy';
        logger.error('MongoDB health check failed', { error: error.message });
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memUsageMB > 500) { // Warning if over 500MB
        logger.warn('High memory usage detected', {
          heapUsed: `${memUsageMB}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        });
      }

      // Log health status periodically
      if (Math.floor(Date.now() / 60000) % 10 === 0) { // Every 10 minutes
        logger.info('Worker health check', health);
      }

    } catch (error) {
      logger.error('System health check failed', { error: error.message });
    }
  }

  /**
   * Log rotation and cleanup
   */
  async logRotation() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logDir = './logs';
      const maxLogAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const now = Date.now();

      try {
        const files = await fs.readdir(logDir);
        
        for (const file of files) {
          const filePath = path.join(logDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxLogAge) {
            await fs.unlink(filePath);
            logger.info(`Rotated old log file: ${file}`);
          }
        }
      } catch (error) {
        // Log directory might not exist, ignore
      }

    } catch (error) {
      logger.error('Log rotation failed', { error: error.message });
    }
  }

  /**
   * Database maintenance
   */
  async databaseMaintenance() {
    try {
      // Compact collections (if supported)
      const collections = await mongoose.connection.db.collections();
      
      for (const collection of collections) {
        try {
          // Update statistics
          await collection.stats();
          
          // Rebuild indexes if needed
          if (Math.random() < 0.1) { // 10% chance to rebuild indexes
            await collection.reIndex();
            logger.debug(`Rebuilt indexes for collection: ${collection.collectionName}`);
          }
          
        } catch (error) {
          // Ignore individual collection errors
        }
      }

      logger.debug('Database maintenance completed');

    } catch (error) {
      logger.error('Database maintenance failed', { error: error.message });
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTemporaryFiles() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const tempDirs = ['./uploads/temp', './certificates/temp'];
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();

      for (const dir of tempDirs) {
        try {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
              await fs.unlink(filePath);
              logger.debug(`Cleaned up temporary file: ${file}`);
            }
          }
        } catch (error) {
          // Directory might not exist, ignore
        }
      }

    } catch (error) {
      logger.error('Temporary file cleanup failed', { error: error.message });
    }
  }

  // =============================================================================
  // SHUTDOWN HANDLING
  // =============================================================================

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down worker gracefully`);
        await this.shutdown();
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection in worker', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception in worker', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  async shutdown() {
    try {
      this.isRunning = false;
      
      // Clear all intervals
      for (const [taskName, intervalId] of this.intervals) {
        clearInterval(intervalId);
        logger.info(`Stopped background task: ${taskName}`);
      }
      
      // Close database connections
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('Worker MongoDB connection closed');
      }
      
      // Cleanup services
      await this.notificationService.cleanup?.();
      await this.certificateService.cleanup?.();
      
      logger.info('Worker shutdown completed');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during worker shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Start worker if this file is run directly
if (require.main === module) {
  const worker = new GACPWorker();
  worker.start().catch(error => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}

module.exports = GACPWorker;