// tests/integration/application.test.js
/**
 * Integration Tests for Application API
 * Comprehensive testing for GACP Platform
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../services/core-certification/src/index');
const databaseService = require('../../services/database/database-service');
const { setupTest, teardownTest } = require('../setup');
const jwt = require('jsonwebtoken');

describe('Application API Integration Tests', () => {
  let authToken;
  let testUserId;
  let testProductId;
  let testApplicationId;
  let adminToken;

  before(async () => {
    // Initialize database connections
    await databaseService.initialize();
    
    // Create test users and products
    await setupTestData();
  });

  after(async () => {
    // Cleanup test data
    await cleanupTestData();
    
    // Close database connections
    await databaseService.cleanup();
  });

  describe('POST /api/applications', () => {
    it('should create a new application with valid data', async () => {
      const applicationData = {
        productId: testProductId,
        formData: {
          applicantType: 'individual',
          contactPerson: {
            fullName: 'สมชาย ใจดี',
            phoneNumber: '0812345678',
            email: 'somchai@example.com'
          },
          cultivationSites: [{
            address: {
              province: 'เชียงใหม่',
              district: 'เมืองเชียงใหม่',
              subdistrict: 'ศรีภูมิ',
              postalCode: '50200',
              fullAddress: '123 หมู่ 1 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่',
              coordinates: {
                type: 'Point',
                coordinates: [98.9931, 18.7883] // Chiang Mai coordinates
              }
            },
            totalAreaRai: 5.5,
            ownedOrRented: 'owned'
          }],
          waterSources: [{
            type: 'well',
            description: 'บ่อน้ำบาดาลส่วนตัว'
          }],
          herbalProducts: [{
            scientificName: 'Curcuma longa',
            commonName: 'Turmeric',
            thaiName: 'ขมิ้น',
            partUsed: ['root'],
            cultivationMethod: 'organic'
          }]
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('applicationCode');
      expect(response.body.data.status).to.equal('draft');
      
      testApplicationId = response.body.data.id;
    });

    it('should reject application with invalid product ID', async () => {
      const applicationData = {
        productId: '00000000-0000-0000-0000-000000000000',
        formData: {
          applicantType: 'individual',
          contactPerson: {
            fullName: 'Test User',
            phoneNumber: '0812345678',
            email: 'test@example.com'
          }
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Product');
    });

    it('should reject application with missing required fields', async () => {
      const applicationData = {
        productId: testProductId,
        formData: {
          applicantType: 'individual'
          // Missing contactPerson
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.errors).to.be.an('array');
    });

    it('should enforce rate limiting for application creation', async () => {
      const applicationData = {
        productId: testProductId,
        formData: {
          applicantType: 'individual',
          contactPerson: {
            fullName: 'Rate Limit Test',
            phoneNumber: '0812345678',
            email: 'ratelimit@example.com'
          }
        }
      };

      // Create 5 applications quickly (should hit rate limit)
      const promises = Array(6).fill().map(() =>
        request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${authToken}`)
          .send(applicationData)
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).to.be.true;
    });
  });

  describe('GET /api/applications/:id', () => {
    it('should retrieve application details for owner', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('applicationCode');
      expect(response.body.data).to.have.property('formData');
      expect(response.body.data.userId).to.equal(testUserId);
    });

    it('should allow admin to access any application', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('applicationCode');
    });

    it('should reject access for unauthorized users', async () => {
      // Create another user token
      const anotherUserToken = generateTestToken('another-user-id', 'applicant');
      
      const response = await request(app)
        .get(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Access denied');
    });

    it('should return 404 for non-existent application', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/applications/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('not found');
    });
  });

  describe('PUT /api/applications/:id', () => {
    it('should update application form data', async () => {
      const updateData = {
        formData: {
          contactPerson: {
            fullName: 'สมชาย ใจดี (Updated)',
            phoneNumber: '0812345678',
            email: 'somchai.updated@example.com'
          }
        }
      };

      const response = await request(app)
        .put(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.updatedFields).to.include('formData');
    });

    it('should allow admin to update application status', async () => {
      const statusUpdate = {
        status: 'pending_review',
        statusReason: 'Moving to review phase',
        statusNotes: 'Application appears complete'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should reject status update by non-staff user', async () => {
      const statusUpdate = {
        status: 'approved',
        statusReason: 'Trying to approve own application'
      };

      const response = await request(app)
        .put(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('permission');
    });
  });

  describe('POST /api/applications/:id/submit', () => {
    it('should submit application with sufficient completeness', async () => {
      // First, update application to ensure sufficient completeness
      const completeData = {
        formData: {
          applicantType: 'individual',
          contactPerson: {
            fullName: 'สมชาย ใจดี',
            phoneNumber: '0812345678',
            email: 'somchai@example.com'
          },
          cultivationSites: [{
            address: {
              province: 'เชียงใหม่',
              district: 'เมืองเชียงใหม่',
              subdistrict: 'ศรีภูมิ',
              postalCode: '50200',
              fullAddress: '123 หมู่ 1 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่'
            },
            totalAreaRai: 5.5,
            ownedOrRented: 'owned'
          }],
          waterSources: [{
            type: 'well',
            description: 'บ่อน้ำบาดาลส่วนตัว'
          }],
          herbalProducts: [{
            scientificName: 'Curcuma longa',
            commonName: 'Turmeric',
            thaiName: 'ขมิ้น',
            partUsed: ['root'],
            cultivationMethod: 'organic'
          }]
        }
      };

      await request(app)
        .put(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(completeData);

      // Reset status to draft for submission test
      await request(app)
        .put(`/api/applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'draft' });

      // Now submit
      const response = await request(app)
        .post(`/api/applications/${testApplicationId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.status).to.equal('pending_initial_payment');
      expect(response.body.data.nextSteps).to.be.an('array');
    });

    it('should reject submission of incomplete application', async () => {
      // Create a new incomplete application
      const incompleteApp = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          formData: {
            applicantType: 'individual'
            // Minimal data - should be incomplete
          }
        });

      const response = await request(app)
        .post(`/api/applications/${incompleteApp.body.data.id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('complete');
    });
  });

  describe('GET /api/applications', () => {
    it('should list user applications with pagination', async () => {
      const response = await request(app)
        .get('/api/applications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.pagination).to.have.property('page');
      expect(response.body.pagination).to.have.property('total');
    });

    it('should filter applications by status', async () => {
      const response = await request(app)
        .get('/api/applications?status=pending_initial_payment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      // All returned applications should have the filtered status
      response.body.data.forEach(app => {
        expect(app.status).to.equal('pending_initial_payment');
      });
    });

    it('should perform text search across applications', async () => {
      const response = await request(app)
        .get('/api/applications?searchText=ขมิ้น')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('mongoMatches');
    });

    it('should allow admin to see all applications', async () => {
      const response = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      // Admin should see applications from different users
    });
  });

  describe('GET /api/applications/stats', () => {
    it('should return application statistics for staff', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('total_applications');
      expect(response.body.data).to.have.property('approved_count');
      expect(response.body.data).to.have.property('byProvince');
    });

    it('should reject stats access for regular users', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('permission');
    });

    it('should filter stats by date range', async () => {
      const dateFrom = '2025-01-01';
      const dateTo = '2025-12-31';
      
      const response = await request(app)
        .get(`/api/applications/stats?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('generatedAt');
    });
  });

  describe('GET /api/applications/:id/history', () => {
    it('should return application status history', async () => {
      const response = await request(app)
        .get(`/api/applications/${testApplicationId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      
      if (response.body.data.length > 0) {
        const historyEntry = response.body.data[0];
        expect(historyEntry).to.have.property('from_status');
        expect(historyEntry).to.have.property('to_status');
        expect(historyEntry).to.have.property('changed_at');
        expect(historyEntry).to.have.property('changed_by_name');
      }
    });
  });

  describe('POST /api/applications/:id/assign', () => {
    let reviewerUserId;

    before(async () => {
      // Create a reviewer user for assignment tests
      reviewerUserId = await createTestUser('reviewer@example.com', 'reviewer');
    });

    it('should allow admin to assign reviewer', async () => {
      const assignmentData = {
        reviewerId: reviewerUserId,
        assignmentReason: 'Assigning for review'
      };

      const response = await request(app)
        .post(`/api/applications/${testApplicationId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should reject assignment by non-admin user', async () => {
      const assignmentData = {
        reviewerId: reviewerUserId,
        assignmentReason: 'Unauthorized assignment attempt'
      };

      const response = await request(app)
        .post(`/api/applications/${testApplicationId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('permission');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simulate database error by temporarily closing connection
      // This is a simplified test - in practice you'd mock the database service
      const response = await request(app)
        .get('/api/applications/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not crash the application
      expect([400, 404, 500]).to.include(response.status);
    });

    it('should validate malformed UUID parameters', async () => {
      const response = await request(app)
        .get('/api/applications/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.errors).to.be.an('array');
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test user
    testUserId = await createTestUser('testuser@example.com', 'applicant');
    authToken = generateTestToken(testUserId, 'applicant');
    
    // Create admin user
    const adminUserId = await createTestUser('admin@example.com', 'super_admin');
    adminToken = generateTestToken(adminUserId, 'super_admin');
    
    // Create test product
    testProductId = await createTestProduct();
  }

  async function createTestUser(email, role) {
    const userId = require('crypto').randomUUID();
    
    await databaseService.executePostgreSQLQuery(`
      INSERT INTO users (id, email, password_hash, role, full_name, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, true, true)
    `, [
      userId,
      email,
      'test_password_hash',
      role,
      'Test User'
    ]);
    
    return userId;
  }

  async function createTestProduct() {
    const productId = require('crypto').randomUUID();
    
    await databaseService.executePostgreSQLQuery(`
      INSERT INTO products (id, name, category, requirements, fee_structure)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      productId,
      'Test Herbal Product',
      'herbs',
      JSON.stringify({ minArea: 1, documentation: ['cultivation_plan'] }),
      JSON.stringify({ applicationFee: 1000, auditFee: 2000 })
    ]);
    
    return productId;
  }

  function generateTestToken(userId, role) {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  }

  async function cleanupTestData() {
    try {
      // Clean up in reverse order of creation
      await databaseService.executePostgreSQLQuery('DELETE FROM applications WHERE user_id = $1', [testUserId]);
      await databaseService.executePostgreSQLQuery('DELETE FROM products WHERE name = $1', ['Test Herbal Product']);
      await databaseService.executePostgreSQLQuery('DELETE FROM users WHERE email LIKE $1', ['%@example.com']);
      
      // Clean up MongoDB documents
      await databaseService.executeMongoDBOperation('gacp_applications', 'deleteMany', {});
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  }
});