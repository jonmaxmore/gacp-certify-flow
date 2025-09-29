// tests/setup.js
/**
 * Global Test Setup for GACP Platform
 * Configures test environment and shared utilities
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const { GenericContainer } = require('testcontainers');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Global test configuration
global.TEST_CONFIG = {
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  },
  retries: {
    default: 2,
    flaky: 3
  },
  databases: {
    mongodb: null,
    postgresql: null,
    redis: null
  }
};

// Test database instances
let mongoServer;
let postgresContainer;
let redisContainer;

/**
 * Global setup before all tests
 */
before(async function() {
  this.timeout(60000); // Increase timeout for container startup
  
  console.log('🔧 Setting up test environment...');
  
  try {
    // Setup in-memory MongoDB
    await setupMongoDB();
    
    // Setup PostgreSQL container
    await setupPostgreSQL();
    
    // Setup Redis container
    await setupRedis();
    
    // Initialize test data
    await initializeTestData();
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

/**
 * Global cleanup after all tests
 */
after(async function() {
  this.timeout(30000);
  
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Stop MongoDB
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ MongoDB stopped');
    }
    
    // Stop PostgreSQL container
    if (postgresContainer) {
      await postgresContainer.stop();
      console.log('✅ PostgreSQL container stopped');
    }
    
    // Stop Redis container
    if (redisContainer) {
      await redisContainer.stop();
      console.log('✅ Redis container stopped');
    }
    
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

/**
 * Setup in-memory MongoDB for testing
 */
async function setupMongoDB() {
  console.log('🔄 Starting MongoDB Memory Server...');
  
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'gacp_test',
      port: 27017
    },
    binary: {
      version: '6.0.12'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  global.TEST_CONFIG.databases.mongodb = mongoUri;
  process.env.MONGODB_URI = mongoUri;
  
  console.log('✅ MongoDB Memory Server ready:', mongoUri);
}

/**
 * Setup PostgreSQL container for testing
 */
async function setupPostgreSQL() {
  console.log('🔄 Starting PostgreSQL container...');
  
  postgresContainer = await new GenericContainer('postgres:15-alpine')
    .withEnvironment({
      POSTGRES_DB: 'gacp_test',
      POSTGRES_USER: 'test_user',
      POSTGRES_PASSWORD: 'test_password'
    })
    .withExposedPorts(5432)
    .withWaitStrategy('LOG')
    .withLogConsumer(stream => {
      // Log container output for debugging
      // stream.on('data', line => console.log(line));
    })
    .start();
  
  const postgresPort = postgresContainer.getMappedPort(5432);
  const postgresUri = `postgresql://test_user:test_password@localhost:${postgresPort}/gacp_test`;
  
  global.TEST_CONFIG.databases.postgresql = postgresUri;
  process.env.DATABASE_URL = postgresUri;
  
  console.log('✅ PostgreSQL container ready:', postgresUri);
  
  // Wait a bit for PostgreSQL to be fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Setup Redis container for testing
 */
async function setupRedis() {
  console.log('🔄 Starting Redis container...');
  
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withCommand(['redis-server', '--appendonly', 'yes'])
    .start();
  
  const redisPort = redisContainer.getMappedPort(6379);
  const redisUrl = `redis://localhost:${redisPort}`;
  
  global.TEST_CONFIG.databases.redis = redisUrl;
  process.env.REDIS_URL = redisUrl;
  
  console.log('✅ Redis container ready:', redisUrl);
}

/**
 * Initialize test database schemas and seed data
 */
async function initializeTestData() {
  console.log('🔄 Initializing test data...');
  
  try {
    // Initialize database service with test configuration
    const databaseService = require('../services/database/database-service');
    await databaseService.initialize();
    
    // Run PostgreSQL schema migrations
    const fs = require('fs').promises;
    const schemaSQL = await fs.readFile(
      path.join(__dirname, '..', 'models', 'postgresql', 'schemas.sql'),
      'utf8'
    );
    
    await databaseService.executePostgreSQLQuery(schemaSQL);
    
    // Create test organizations
    await createTestOrganizations(databaseService);
    
    // Create test products
    await createTestProducts(databaseService);
    
    console.log('✅ Test data initialized');
    
  } catch (error) {
    console.error('❌ Test data initialization failed:', error);
    throw error;
  }
}

/**
 * Create test organizations
 */
async function createTestOrganizations(db) {
  const organizations = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก (ทดสอบ)',
      type: 'government',
      code: 'DTAM_TEST',
      contact_email: 'test@dtam.go.th'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002', 
      name: 'สำนักงานมาตรฐานสินค้าเกษตรและอาหารแห่งชาติ (ทดสอบ)',
      type: 'government',
      code: 'ACFS_TEST',
      contact_email: 'test@acfs.go.th'
    }
  ];
  
  for (const org of organizations) {
    await db.executePostgreSQLQuery(`
      INSERT INTO organizations (id, name, type, code, contact_email)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [org.id, org.name, org.type, org.code, org.contact_email]);
  }
}

/**
 * Create test products
 */
async function createTestProducts(db) {
  const products = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'สมุนไพรทั่วไป (ทดสอบ)',
      scientific_name: 'General Herbs',
      category: 'herbs',
      requirements: JSON.stringify({
        minArea: 1,
        documentation: ['cultivation_plan', 'soil_test'],
        inspections: ['initial', 'harvest']
      }),
      fee_structure: JSON.stringify({
        applicationFee: 1000,
        auditFee: 2000,
        renewalFee: 500
      })
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'ขมิ้นออร์แกนิค (ทดสอบ)',
      scientific_name: 'Curcuma longa',
      category: 'herbs',
      requirements: JSON.stringify({
        minArea: 0.5,
        organicCertification: true,
        documentation: ['organic_plan', 'soil_test', 'water_test'],
        inspections: ['initial', 'mid_season', 'harvest']
      }),
      fee_structure: JSON.stringify({
        applicationFee: 1500,
        auditFee: 2500,
        renewalFee: 750
      })
    }
  ];
  
  for (const product of products) {
    await db.executePostgreSQLQuery(`
      INSERT INTO products (id, name, scientific_name, category, requirements, fee_structure)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      product.id, 
      product.name, 
      product.scientific_name, 
      product.category,
      product.requirements,
      product.fee_structure
    ]);
  }
}

/**
 * Test utilities available globally
 */
global.TestUtils = {
  
  /**
   * Generate test user data
   */
  generateTestUser: (overrides = {}) => {
    const { faker } = require('@faker-js/faker');
    
    return {
      email: faker.internet.email(),
      full_name: faker.person.fullName(),
      phone_number: '08' + faker.string.numeric(8),
      role: 'applicant',
      is_active: true,
      email_verified: true,
      ...overrides
    };
  },
  
  /**
   * Generate test application data
   */
  generateTestApplication: (overrides = {}) => {
    const { faker } = require('@faker-js/faker');
    
    return {
      formData: {
        applicantType: 'individual',
        contactPerson: {
          fullName: faker.person.fullName(),
          phoneNumber: '08' + faker.string.numeric(8),
          email: faker.internet.email()
        },
        cultivationSites: [{
          address: {
            province: 'เชียงใหม่',
            district: 'เมืองเชียงใหม่',
            subdistrict: 'ศรีภูมิ',
            postalCode: '50200',
            fullAddress: faker.location.streetAddress(),
            coordinates: {
              type: 'Point',
              coordinates: [98.9931, 18.7883]
            }
          },
          totalAreaRai: faker.number.float({ min: 1, max: 20, multipleOf: 0.1 }),
          ownedOrRented: faker.helpers.arrayElement(['owned', 'rented'])
        }],
        waterSources: [{
          type: faker.helpers.arrayElement(['well', 'river', 'canal']),
          description: faker.lorem.sentence()
        }],
        herbalProducts: [{
          scientificName: 'Curcuma longa',
          commonName: 'Turmeric',
          thaiName: 'ขมิ้น',
          partUsed: ['root'],
          cultivationMethod: faker.helpers.arrayElement(['organic', 'conventional'])
        }]
      },
      ...overrides
    };
  },
  
  /**
   * Generate JWT token for testing
   */
  generateTestToken: (userId, role = 'applicant', expiresIn = '1h') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn }
    );
  },
  
  /**
   * Wait for a condition to be true
   */
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const result = await condition();
        if (result) return result;
      } catch (error) {
        // Condition threw an error, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  /**
   * Clean database between tests
   */
  cleanDatabase: async () => {
    const databaseService = require('../services/database/database-service');
    
    // Clean PostgreSQL tables (in dependency order)
    const tables = [
      'application_status_history',
      'payments',
      'notifications',
      'audit_logs',
      'user_sessions',
      'api_keys',
      'applications',
      'user_organizations'
      // Don't clean users, organizations, products as they're needed for tests
    ];
    
    for (const table of tables) {
      await databaseService.executePostgreSQLQuery(`DELETE FROM ${table}`);
    }
    
    // Clean MongoDB collections
    await databaseService.executeMongoDBOperation('gacp_applications', 'deleteMany', {});
    
    // Clear Redis cache
    try {
      await databaseService.redisClient?.flushdb();
    } catch (error) {
      // Redis might not be available in all test scenarios
    }
  },
  
  /**
   * Get test database connections
   */
  getTestDatabases: () => {
    return global.TEST_CONFIG.databases;
  }
};

/**
 * Common test hooks
 */
global.TestHooks = {
  
  /**
   * Setup hook for tests that need clean database
   */
  cleanDatabaseBeforeEach: () => {
    beforeEach(async function() {
      this.timeout(10000);
      await global.TestUtils.cleanDatabase();
    });
  },
  
  /**
   * Setup hook for tests that need authenticated user
   */
  setupAuthenticatedUser: () => {
    let testUser, authToken;
    
    beforeEach(async function() {
      this.timeout(10000);
      
      const databaseService = require('../services/database/database-service');
      const userData = global.TestUtils.generateTestUser();
      
      // Create test user
      const result = await databaseService.executePostgreSQLQuery(`
        INSERT INTO users (id, email, password_hash, role, full_name, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        require('crypto').randomUUID(),
        userData.email,
        'test_password_hash',
        userData.role,
        userData.full_name,
        userData.is_active,
        userData.email_verified
      ]);
      
      testUser = result.rows[0];
      authToken = global.TestUtils.generateTestToken(testUser.id, testUser.role);
      
      this.testUser = testUser;
      this.authToken = authToken;
    });
    
    return { testUser, authToken };
  }
};

// Handle uncaught exceptions in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('✅ Test setup configuration loaded');