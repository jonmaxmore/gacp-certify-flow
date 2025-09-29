// tests/unit/application.test.js
/**
 * Unit Tests for Application API
 * GACP Platform - Thai Herbal Certification System
 */

const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const app = require('../../services/core-certification/src/enhanced-server');
const { generateToken } = require('../../services/core-certification/src/utils/jwt');

describe('Application API Unit Tests', () => {
  let authToken;
  let applicationId;
  
  beforeAll(async () => {
    // Generate test token for Thai farmer
    authToken = generateToken({
      sub: 'test-farmer-001',
      role: 'farmer',
      email: 'somchai@farmer.th',
      thai_id: '1234567890123',
      province: 'เชียงใหม่'
    });
  });
  
  describe('POST /api/v1/applications - Create Application', () => {
    it('should create new GACP application with Thai data', async () => {
      const thaiApplicationData = {
        farmer_data: {
          thai_id: '1234567890123',
          first_name: 'สมชาย',
          last_name: 'ใจดี',
          phone: '0812345678',
          email: 'somchai@farmer.th',
          province: 'เชียงใหม่',
          district: 'เมืองเชียงใหม่',
          subdistrict: 'ศรีภูมิ',
          address: '123 ถนนนิมมานเหมินท์',
          postal_code: '50200'
        },
        farm_details: {
          farm_name: 'ฟาร์มสมุนไพรใจดี',
          farm_size: 5.5,
          farm_type: 'สมุนไพร',
          latitude: 18.787747,
          longitude: 98.993128,
          elevation: 310,
          soil_type: 'ดินร่วนปนทราย',
          water_source: 'ระบบสปริงเกอร์',
          organic_certification: true
        },
        cultivation_data: {
          herbs: [
            {
              name: 'ขมิ้นชัน',
              scientific_name: 'Curcuma longa',
              planted_area: 2.0,
              planting_date: '2024-01-15',
              expected_harvest: '2024-10-15',
              cultivation_method: 'organic'
            },
            {
              name: 'ฟ้าทะลายโจร',
              scientific_name: 'Andrographis paniculata',
              planted_area: 1.5,
              planting_date: '2024-02-01',
              expected_harvest: '2024-11-01',
              cultivation_method: 'organic'
            }
          ],
          irrigation_system: 'drip_irrigation',
          fertilizer_type: 'organic_compost',
          pest_control: 'biological_control'
        }
      };

      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(thaiApplicationData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application_id).toBeDefined();
      expect(response.body.data.application_number).toMatch(/^GACP\d{4}\d{6}$/);
      
      applicationId = response.body.data.application_id;
    });
    
    it('should validate Thai national ID format', async () => {
      const invalidData = {
        farmer_data: {
          thai_id: '123456789', // Invalid format
          first_name: 'สมชาย',
          last_name: 'ใจดี'
        }
      };

      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('thai_id');
    });

    it('should validate Thai phone number format', async () => {
      const invalidData = {
        farmer_data: {
          thai_id: '1234567890123',
          phone: '123456789', // Invalid Thai phone format
          first_name: 'สมชาย'
        }
      };

      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('phone');
    });
    
    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .send({
          farmer_data: { thai_id: '1234567890123' }
        });
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('unauthorized');
    });
  });

  describe('GET /api/v1/applications - List Applications', () => {
    it('should return paginated applications list', async () => {
      const response = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10,
          province: 'เชียงใหม่'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter by Thai province', async () => {
      const response = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ province: 'กรุงเทพมหานคร' });
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/applications/:id - Get Application Details', () => {
    it('should return application with hybrid data', async () => {
      if (!applicationId) {
        pending('Application ID not available');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(applicationId);
      expect(response.body.data.farm_details).toBeDefined();
      expect(response.body.data.cultivation_data).toBeDefined();
    });

    it('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .get('/api/v1/applications/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/statistics - Application Statistics', () => {
    it('should return overview statistics', async () => {
      const response = await request(app)
        .get('/api/v1/statistics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.by_province).toBeInstanceOf(Array);
    });
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (global.gacpService) {
      await global.gacpService.shutdown();
    }
  });
});