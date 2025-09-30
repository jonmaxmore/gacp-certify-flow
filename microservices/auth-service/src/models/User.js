const { Pool } = require('pg');
const logger = require('../services/logger');

class User {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'gacp_auth',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection on startup
    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      logger.info('Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error.message);
      // Don't crash the app, just log the error
    }
  }

  async create(userData) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO users (
          email, password, first_name, last_name, 
          phone_number, organization_type, is_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, first_name, last_name, organization_type, created_at
      `;
      
      const values = [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.organizationType,
        userData.isVerified,
        userData.createdAt
      ];

      const result = await client.query(query, values);
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        organizationType: result.rows[0].organization_type,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEmail(email) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, email, password, first_name, last_name, 
               phone_number, organization_type, is_verified, 
               created_at, updated_at
        FROM users 
        WHERE email = $1
      `;
      
      const result = await client.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        organizationType: user.organization_type,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, email, first_name, last_name, 
               phone_number, organization_type, is_verified, 
               created_at, updated_at
        FROM users 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        organizationType: user.organization_type,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateVerificationStatus(id, isVerified) {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users 
        SET is_verified = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, is_verified
      `;
      
      const result = await client.query(query, [isVerified, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating verification status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePassword(id, hashedPassword) {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email
      `;
      
      const result = await client.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new User();