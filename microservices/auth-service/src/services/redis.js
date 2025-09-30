const Redis = require('redis');
const logger = require('./logger');

class RedisService {
  constructor() {
    this.client = null;
    this.connect();
  }

  async connect() {
    try {
      this.client = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async set(key, value, expiration = null) {
    try {
      if (expiration) {
        return await this.client.setEx(key, expiration, value);
      }
      return await this.client.set(key, value);
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async setex(key, expiration, value) {
    try {
      return await this.client.setEx(key, expiration, value);
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  async flushall() {
    try {
      return await this.client.flushAll();
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error);
      throw error;
    }
  }

  async close() {
    try {
      await this.client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }

  // Session management methods
  async createSession(userId, sessionData, expiration = 86400) {
    const sessionKey = `session:${userId}`;
    return await this.setex(sessionKey, expiration, JSON.stringify(sessionData));
  }

  async getSession(userId) {
    const sessionKey = `session:${userId}`;
    const sessionData = await this.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async destroySession(userId) {
    const sessionKey = `session:${userId}`;
    return await this.del(sessionKey);
  }

  async extendSession(userId, expiration = 86400) {
    const sessionKey = `session:${userId}`;
    return await this.expire(sessionKey, expiration);
  }
}

module.exports = new RedisService();