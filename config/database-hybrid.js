// config/database-hybrid.js
/**
 * Hybrid Database Configuration for Thai Herbal GACP Platform
 * Department of Thai Traditional and Alternative Medicine (DTAM)
 * 
 * Architecture:
 * - PostgreSQL: Critical transactional data (payments, certificates, audit)
 * - MongoDB: Flexible document data (applications, surveys, products)
 */

module.exports = {
  // PostgreSQL for critical & transactional data
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://gacp_user:secure_password@postgres:5432/gacp_db',
    ssl: { rejectUnauthorized: false },
    max: 20, // connection pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    
    // ใช้สำหรับ:
    tables: {
      // User authentication & profiles
      users: ['user_profiles', 'user_sessions', 'user_permissions'],
      
      // Financial records (ACID compliance required)
      financial: ['payments', 'invoices', 'receipts', 'refunds'],
      
      // Legal documents (immutable audit trail)
      legal: ['certificates', 'licenses', 'legal_documents'],
      
      // Audit logs (compliance & traceability)
      audit: ['audit_logs', 'status_history', 'approval_logs'],
      
      // Workflow management
      workflow: ['application_status_history', 'staff_assignments']
    }
  },
  
  // MongoDB for flexible & document-heavy data
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:gacp2025secure@mongodb:27017/gacp_db?authSource=admin',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // MongoDB 4.0+ Transactions support
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000
    },
    
    // ใช้สำหรับ:
    collections: {
      // Application forms (dynamic schema)
      applications: ['gacp_applications', 'resubmissions'],
      
      // Survey data (regional variations)
      surveys: ['survey_responses', 'survey_templates', 'regional_surveys'],
      
      // Document management
      documents: ['document_metadata', 'file_attachments', 'document_versions'],
      
      // Product catalog
      products: ['herbal_products', 'product_specifications', 'standards_library'],
      
      // Analytics & reporting
      analytics: ['user_behavior', 'application_metrics', 'regional_statistics']
    }
  },
  
  // Redis for caching & sessions
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'redis2025secure',
    db: 0,
    keyPrefix: 'gacp:',
    retryStrategy: (times) => Math.min(times * 50, 2000)
  },
  
  // Data routing logic
  routing: {
    usePostgres: (operation) => {
      const pgOperations = [
        'payment', 'invoice', 'receipt', 'refund',
        'certificate', 'license', 'legal_document',
        'audit_log', 'user_auth', 'session',
        'status_change', 'approval', 'staff_assignment'
      ];
      return pgOperations.includes(operation);
    },
    
    useMongoDB: (operation) => {
      const mongoOperations = [
        'application_form', 'resubmission',
        'survey_response', 'survey_template',
        'document_upload', 'file_metadata',
        'product_search', 'product_catalog',
        'analytics', 'user_behavior', 'metrics'
      ];
      return mongoOperations.includes(operation);
    },
    
    useRedis: (operation) => {
      const redisOperations = [
        'cache', 'session', 'rate_limit',
        'temporary_data', 'queue'
      ];
      return redisOperations.includes(operation);
    }
  },
  
  // Connection pooling configuration
  pools: {
    postgres: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    
    mongodb: {
      maxPoolSize: 50,
      minPoolSize: 5,
      maxConnecting: 2,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000
    }
  },
  
  // Security configuration
  security: {
    postgres: {
      // Row Level Security policies
      enableRLS: true,
      policies: [
        'payment_access_policy',
        'certificate_access_policy',
        'audit_log_policy'
      ]
    },
    
    mongodb: {
      // Field level encryption
      enableFieldEncryption: true,
      encryptedFields: [
        'nationalId', 'taxId', 'phoneNumber',
        'bankAccount', 'personalData'
      ],
      encryptionKey: process.env.FIELD_ENCRYPTION_KEY
    }
  }
};