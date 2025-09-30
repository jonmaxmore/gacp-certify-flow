const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Database Migration Runner
 * Runs database migrations and initial setup
 */

const logger = require('../microservices/certification-service/src/services/logger');

class MigrationRunner {
  constructor() {
    this.migrations = [];
    this.migrationPath = path.join(__dirname, '../migrations');
  }

  async run() {
    try {
      logger.info('Starting database migration...');

      // Connect to MongoDB
      await this.connectDatabase();

      // Load and run migrations
      await this.loadMigrations();
      await this.runMigrations();

      // Create initial data
      await this.createInitialData();

      // Setup indexes
      await this.setupIndexes();

      logger.info('Database migration completed successfully');

    } catch (error) {
      logger.error('Database migration failed', { error: error.message });
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }

  async connectDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gacp_certification';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Connected to MongoDB for migration', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
  }

  async loadMigrations() {
    try {
      const files = await fs.readdir(this.migrationPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.js') && file !== 'run-migrations.js')
        .sort();

      for (const file of migrationFiles) {
        const migration = require(path.join(this.migrationPath, file));
        this.migrations.push({
          name: file,
          ...migration
        });
      }

      logger.info(`Loaded ${this.migrations.length} migrations`);

    } catch (error) {
      logger.warn('No migrations directory found, skipping file-based migrations');
    }
  }

  async runMigrations() {
    // Create migration tracking collection
    const MigrationSchema = new mongoose.Schema({
      name: { type: String, unique: true, required: true },
      appliedAt: { type: Date, default: Date.now },
      version: String
    });

    const Migration = mongoose.model('Migration', MigrationSchema);

    for (const migration of this.migrations) {
      try {
        // Check if migration already applied
        const existingMigration = await Migration.findOne({ name: migration.name });
        
        if (existingMigration) {
          logger.info(`Skipping migration ${migration.name} (already applied)`);
          continue;
        }

        logger.info(`Running migration: ${migration.name}`);
        
        if (migration.up) {
          await migration.up();
        }

        // Record migration as applied
        await Migration.create({
          name: migration.name,
          version: migration.version || '1.0.0'
        });

        logger.info(`Completed migration: ${migration.name}`);

      } catch (error) {
        logger.error(`Migration failed: ${migration.name}`, { error: error.message });
        throw error;
      }
    }
  }

  async createInitialData() {
    logger.info('Creating initial data...');

    // Create admin user if not exists
    await this.createAdminUser();

    // Create default roles and permissions
    await this.createDefaultRoles();

    // Create system settings
    await this.createSystemSettings();

    logger.info('Initial data created');
  }

  async createAdminUser() {
    try {
      // This would typically use a User model
      // For now, we'll create a basic admin record in the applications collection
      const Application = require('../microservices/certification-service/src/models/EnhancedApplication');
      
      const existingAdmin = await Application.findOne({
        'applicantInfo.email': 'admin@gacp.doa.go.th'
      });

      if (!existingAdmin) {
        logger.info('No existing admin user found, admin setup required');
        // In a real implementation, you would create the admin user here
        // This is just a placeholder
      }

    } catch (error) {
      logger.error('Failed to create admin user', { error: error.message });
    }
  }

  async createDefaultRoles() {
    try {
      // Create a roles collection for reference
      const RoleSchema = new mongoose.Schema({
        name: { type: String, unique: true, required: true },
        permissions: [String],
        description: String,
        createdAt: { type: Date, default: Date.now }
      });

      const Role = mongoose.model('Role', RoleSchema);

      const defaultRoles = [
        {
          name: 'farmer',
          permissions: ['application:create', 'application:read', 'application:update', 'document:upload'],
          description: 'เกษตรกร - สามารถยื่นใบสมัครและจัดการเอกสาร'
        },
        {
          name: 'reviewer',
          permissions: ['application:read', 'application:review', 'document:read'],
          description: 'ผู้พิจารณา - ตรวจสอบใบสมัครเบื้องต้น'
        },
        {
          name: 'auditor',
          permissions: ['application:read', 'application:audit', 'document:read', 'audit:create'],
          description: 'ผู้ตรวจสอบ - ตรวจสอบในพื้นที่'
        },
        {
          name: 'approver',
          permissions: ['application:read', 'application:approve', 'certificate:generate'],
          description: 'ผู้อนุมัติ - อนุมัติใบสมัครและออกใบรับรอง'
        },
        {
          name: 'admin',
          permissions: ['*'],
          description: 'ผู้ดูแลระบบ - สิทธิ์เต็มในการจัดการระบบ'
        }
      ];

      for (const roleData of defaultRoles) {
        try {
          await Role.findOneAndUpdate(
            { name: roleData.name },
            roleData,
            { upsert: true, new: true }
          );
          logger.info(`Created/updated role: ${roleData.name}`);
        } catch (error) {
          if (error.code !== 11000) { // Ignore duplicate key errors
            throw error;
          }
        }
      }

    } catch (error) {
      logger.error('Failed to create default roles', { error: error.message });
    }
  }

  async createSystemSettings() {
    try {
      const SettingSchema = new mongoose.Schema({
        key: { type: String, unique: true, required: true },
        value: mongoose.Schema.Types.Mixed,
        description: String,
        category: String,
        updatedAt: { type: Date, default: Date.now }
      });

      const Setting = mongoose.model('Setting', SettingSchema);

      const defaultSettings = [
        {
          key: 'system.version',
          value: '1.0.0',
          description: 'Current system version',
          category: 'system'
        },
        {
          key: 'application.maxFileSize',
          value: 10485760, // 10MB
          description: 'Maximum file upload size in bytes',
          category: 'application'
        },
        {
          key: 'certificate.validityPeriod',
          value: 1095, // 3 years in days
          description: 'Certificate validity period in days',
          category: 'certificate'
        },
        {
          key: 'notification.emailEnabled',
          value: true,
          description: 'Enable email notifications',
          category: 'notification'
        },
        {
          key: 'notification.smsEnabled',
          value: false,
          description: 'Enable SMS notifications',
          category: 'notification'
        },
        {
          key: 'payment.gatewayEnabled',
          value: false,
          description: 'Enable payment gateway integration',
          category: 'payment'
        },
        {
          key: 'audit.retentionPeriod',
          value: 2555, // 7 years in days
          description: 'Audit log retention period in days',
          category: 'audit'
        }
      ];

      for (const setting of defaultSettings) {
        try {
          await Setting.findOneAndUpdate(
            { key: setting.key },
            setting,
            { upsert: true, new: true }
          );
          logger.info(`Created/updated setting: ${setting.key}`);
        } catch (error) {
          if (error.code !== 11000) { // Ignore duplicate key errors
            throw error;
          }
        }
      }

    } catch (error) {
      logger.error('Failed to create system settings', { error: error.message });
    }
  }

  async setupIndexes() {
    logger.info('Setting up database indexes...');

    try {
      // Get all models and ensure indexes
      const models = mongoose.modelNames();
      
      for (const modelName of models) {
        try {
          const model = mongoose.model(modelName);
          await model.ensureIndexes();
          logger.info(`Ensured indexes for model: ${modelName}`);
        } catch (error) {
          logger.warn(`Failed to ensure indexes for ${modelName}`, { error: error.message });
        }
      }

      // Create additional custom indexes
      await this.createCustomIndexes();

      logger.info('Database indexes setup completed');

    } catch (error) {
      logger.error('Failed to setup indexes', { error: error.message });
    }
  }

  async createCustomIndexes() {
    try {
      const db = mongoose.connection.db;

      // Applications collection indexes
      try {
        await db.collection('applications').createIndex(
          { 'applicantInfo.email': 1 },
          { unique: false }
        );
        
        await db.collection('applications').createIndex(
          { currentStatus: 1, createdAt: -1 }
        );

        await db.collection('applications').createIndex(
          { 'approval.certificateNumber': 1 },
          { unique: true, sparse: true }
        );

        logger.info('Created custom indexes for applications collection');
      } catch (error) {
        logger.warn('Some application indexes may already exist');
      }

      // Notifications collection indexes
      try {
        await db.collection('notifications').createIndex(
          { userId: 1, createdAt: -1 }
        );
        
        await db.collection('notifications').createIndex(
          { status: 1, scheduledFor: 1 }
        );

        await db.collection('notifications').createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 }
        );

        logger.info('Created custom indexes for notifications collection');
      } catch (error) {
        logger.warn('Some notification indexes may already exist');
      }

    } catch (error) {
      logger.error('Failed to create custom indexes', { error: error.message });
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run()
    .then(() => {
      console.log('✅ Database migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = MigrationRunner;