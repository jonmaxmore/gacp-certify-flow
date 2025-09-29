// services/database/database-service.js
/**
 * Unified Database Service for GACP Platform
 * Manages hybrid PostgreSQL + MongoDB operations
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');
const Redis = require('redis');
const crypto = require('crypto');
const config = require('../../config/database-hybrid');

class DatabaseService {
  constructor() {
    this.pgPool = null;
    this.mongoConnection = null;
    this.redisClient = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
  }

  /**
   * Initialize all database connections
   */
  async initialize() {
    try {
      console.log('🔄 Initializing database connections...');
      
      // Initialize PostgreSQL
      await this.connectPostgreSQL();
      
      // Initialize MongoDB
      await this.connectMongoDB();
      
      // Initialize Redis
      await this.connectRedis();
      
      this.isConnected = true;
      console.log('✅ All database connections established successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Connect to PostgreSQL with retry logic
   */
  async connectPostgreSQL() {
    try {
      this.pgPool = new Pool(config.postgresql.connection);
      
      // Test connection
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ PostgreSQL connected successfully');
      
      // Setup connection event handlers
      this.pgPool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
      });
      
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connectMongoDB() {
    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      
      this.mongoConnection = mongoose.connection;
      
      console.log('✅ MongoDB connected successfully');
      
      // Setup connection event handlers
      this.mongoConnection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
      
      this.mongoConnection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.attemptReconnect('mongodb');
      });
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }

  /**
   * Connect to Redis
   */
  async connectRedis() {
    try {
      this.redisClient = Redis.createClient(config.redis);
      
      await this.redisClient.connect();
      
      console.log('✅ Redis connected successfully');
      
      // Setup event handlers
      this.redisClient.on('error', (error) => {
        console.error('❌ Redis error:', error);
      });
      
      this.redisClient.on('disconnect', () => {
        console.warn('⚠️ Redis disconnected');
      });
      
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  /**
   * Attempt to reconnect to a specific database
   */
  async attemptReconnect(dbType) {
    if (this.connectionRetries >= this.maxRetries) {
      console.error(`❌ Max reconnection attempts reached for ${dbType}`);
      return;
    }

    this.connectionRetries++;
    console.log(`🔄 Attempting to reconnect to ${dbType} (attempt ${this.connectionRetries})`);

    try {
      const delay = Math.pow(2, this.connectionRetries) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));

      switch (dbType) {
        case 'postgresql':
          await this.connectPostgreSQL();
          break;
        case 'mongodb':
          await this.connectMongoDB();
          break;
        case 'redis':
          await this.connectRedis();
          break;
      }

      this.connectionRetries = 0; // Reset on successful reconnection
    } catch (error) {
      console.error(`❌ Reconnection failed for ${dbType}:`, error);
      setTimeout(() => this.attemptReconnect(dbType), 5000);
    }
  }

  /**
   * Route operation to appropriate database based on data type
   */
  routeOperation(operationType, dataType) {
    const routing = config.dataRouting[dataType];
    
    if (!routing) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    return routing[operationType] || routing.default || 'mongodb';
  }

  /**
   * Execute PostgreSQL query with error handling and metrics
   */
  async executePostgreSQLQuery(query, params = [], options = {}) {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }

    const startTime = Date.now();
    let client;

    try {
      client = await this.pgPool.connect();
      
      // Begin transaction if requested
      if (options.transaction) {
        await client.query('BEGIN');
      }

      const result = await client.query(query, params);
      
      // Commit transaction if successful
      if (options.transaction) {
        await client.query('COMMIT');
      }

      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > 1000) { // Log slow queries
        console.warn(`🐌 Slow PostgreSQL query (${duration}ms): ${query.substring(0, 100)}`);
      }

      return result;
    } catch (error) {
      // Rollback transaction on error
      if (options.transaction && client) {
        await client.query('ROLLBACK');
      }
      
      console.error('❌ PostgreSQL query error:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute MongoDB operation with error handling
   */
  async executeMongoDBOperation(collection, operation, query = {}, options = {}) {
    if (!this.mongoConnection || this.mongoConnection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }

    const startTime = Date.now();

    try {
      const db = this.mongoConnection.db;
      const coll = db.collection(collection);
      
      let result;
      
      switch (operation) {
        case 'find':
          result = await coll.find(query, options).toArray();
          break;
        case 'findOne':
          result = await coll.findOne(query, options);
          break;
        case 'insertOne':
          result = await coll.insertOne(query, options);
          break;
        case 'insertMany':
          result = await coll.insertMany(query, options);
          break;
        case 'updateOne':
          result = await coll.updateOne(query.filter, query.update, options);
          break;
        case 'updateMany':
          result = await coll.updateMany(query.filter, query.update, options);
          break;
        case 'deleteOne':
          result = await coll.deleteOne(query, options);
          break;
        case 'deleteMany':
          result = await coll.deleteMany(query, options);
          break;
        case 'aggregate':
          result = await coll.aggregate(query, options).toArray();
          break;
        case 'countDocuments':
          result = await coll.countDocuments(query, options);
          break;
        default:
          throw new Error(`Unsupported MongoDB operation: ${operation}`);
      }

      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > 1000) { // Log slow operations
        console.warn(`🐌 Slow MongoDB operation (${duration}ms): ${operation} on ${collection}`);
      }

      return result;
    } catch (error) {
      console.error('❌ MongoDB operation error:', error);
      throw error;
    }
  }

  /**
   * Cache operations with Redis
   */
  async cacheGet(key) {
    if (!this.redisClient) {
      console.warn('⚠️ Redis not available, skipping cache get');
      return null;
    }

    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis get error:', error);
      return null;
    }
  }

  async cacheSet(key, value, ttl = 3600) {
    if (!this.redisClient) {
      console.warn('⚠️ Redis not available, skipping cache set');
      return;
    }

    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('❌ Redis set error:', error);
    }
  }

  async cacheDelete(key) {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('❌ Redis delete error:', error);
    }
  }

  /**
   * Distributed transaction across PostgreSQL and MongoDB
   */
  async executeDistributedTransaction(operations) {
    const transactionId = crypto.randomUUID();
    console.log(`🔄 Starting distributed transaction: ${transactionId}`);

    let pgClient;
    let mongoSession;
    const rollbackOperations = [];

    try {
      // Start PostgreSQL transaction
      pgClient = await this.pgPool.connect();
      await pgClient.query('BEGIN');

      // Start MongoDB session and transaction
      mongoSession = await mongoose.startSession();
      await mongoSession.startTransaction();

      // Execute operations
      for (const operation of operations) {
        if (operation.database === 'postgresql') {
          const result = await pgClient.query(operation.query, operation.params);
          rollbackOperations.push({
            type: 'postgresql',
            rollbackQuery: operation.rollbackQuery,
            rollbackParams: operation.rollbackParams
          });
        } else if (operation.database === 'mongodb') {
          const result = await this.executeMongoDBOperation(
            operation.collection,
            operation.operation,
            operation.query,
            { ...operation.options, session: mongoSession }
          );
          rollbackOperations.push({
            type: 'mongodb',
            collection: operation.collection,
            rollbackOperation: operation.rollbackOperation,
            rollbackQuery: operation.rollbackQuery
          });
        }
      }

      // Commit both transactions
      await pgClient.query('COMMIT');
      await mongoSession.commitTransaction();

      console.log(`✅ Distributed transaction completed: ${transactionId}`);
      return { success: true, transactionId };

    } catch (error) {
      console.error(`❌ Distributed transaction failed: ${transactionId}`, error);

      // Rollback PostgreSQL
      if (pgClient) {
        try {
          await pgClient.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('❌ PostgreSQL rollback failed:', rollbackError);
        }
      }

      // Rollback MongoDB
      if (mongoSession) {
        try {
          await mongoSession.abortTransaction();
        } catch (rollbackError) {
          console.error('❌ MongoDB rollback failed:', rollbackError);
        }
      }

      throw error;

    } finally {
      // Cleanup
      if (pgClient) {
        pgClient.release();
      }
      if (mongoSession) {
        await mongoSession.endSession();
      }
    }
  }

  /**
   * Health check for all databases
   */
  async healthCheck() {
    const health = {
      postgresql: false,
      mongodb: false,
      redis: false,
      overall: false
    };

    try {
      // Check PostgreSQL
      if (this.pgPool) {
        const client = await this.pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        health.postgresql = true;
      }
    } catch (error) {
      console.error('❌ PostgreSQL health check failed:', error);
    }

    try {
      // Check MongoDB
      if (this.mongoConnection && this.mongoConnection.readyState === 1) {
        await this.mongoConnection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      console.error('❌ MongoDB health check failed:', error);
    }

    try {
      // Check Redis
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
    }

    health.overall = health.postgresql && health.mongodb && health.redis;
    return health;
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = {
      postgresql: {},
      mongodb: {},
      redis: {}
    };

    try {
      // PostgreSQL stats
      if (this.pgPool) {
        const result = await this.executePostgreSQLQuery(`
          SELECT 
            (SELECT count(*) FROM users) as total_users,
            (SELECT count(*) FROM applications) as total_applications,
            (SELECT count(*) FROM applications WHERE status = 'approved') as approved_applications,
            (SELECT count(*) FROM payments WHERE status = 'confirmed') as confirmed_payments
        `);
        stats.postgresql = result.rows[0];
      }

      // MongoDB stats
      if (this.mongoConnection) {
        const db = this.mongoConnection.db;
        const dbStats = await db.stats();
        stats.mongodb = {
          collections: dbStats.collections,
          documents: dbStats.objects,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize
        };
      }

      // Redis stats
      if (this.redisClient) {
        const info = await this.redisClient.info('memory');
        stats.redis = {
          memory: info,
          keyspace: await this.redisClient.info('keyspace')
        };
      }
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
    }

    return stats;
  }

  /**
   * Cleanup all connections
   */
  async cleanup() {
    console.log('🔄 Cleaning up database connections...');

    const cleanupPromises = [];

    // Close PostgreSQL pool
    if (this.pgPool) {
      cleanupPromises.push(
        this.pgPool.end().catch(error => 
          console.error('❌ PostgreSQL cleanup error:', error)
        )
      );
    }

    // Close MongoDB connection
    if (this.mongoConnection) {
      cleanupPromises.push(
        mongoose.disconnect().catch(error => 
          console.error('❌ MongoDB cleanup error:', error)
        )
      );
    }

    // Close Redis connection
    if (this.redisClient) {
      cleanupPromises.push(
        this.redisClient.quit().catch(error => 
          console.error('❌ Redis cleanup error:', error)
        )
      );
    }

    await Promise.all(cleanupPromises);
    
    this.isConnected = false;
    console.log('✅ Database cleanup completed');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Initiating graceful database shutdown...');
    
    // Stop accepting new connections
    this.isConnected = false;
    
    // Wait for ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup connections
    await this.cleanup();
    
    console.log('✅ Database shutdown completed');
  }
}

// Singleton instance
const databaseService = new DatabaseService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('📥 SIGTERM received, shutting down database connections...');
  await databaseService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📥 SIGINT received, shutting down database connections...');
  await databaseService.shutdown();
  process.exit(0);
});

module.exports = databaseService;