// tests/integration/basic.test.js
/**
 * Basic Integration Tests for GACP Platform
 */

const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';

describe('GACP Platform - Basic Integration Tests', () => {
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(BASE_URL)
        .get('/health')
        .expect(200);
      
      expect(response.body).to.have.property('status', 'healthy');
      expect(response.body).to.have.property('service', 'core-certification');
      expect(response.body).to.have.property('version', '2.0.0');
    });
  });

  describe('Ready Check', () => {
    it('should return ready status', async () => {
      const response = await request(BASE_URL)
        .get('/ready')
        .expect(200);
      
      expect(response.body).to.have.property('ready', true);
    });
  });

  describe('Applications API', () => {
    it('should return applications list', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/applications')
        .expect(200);
      
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data').that.is.an('array');
    });

    it('should accept POST requests', async () => {
      const testData = {
        test: 'data',
        farmer_name: 'สมชาย ใจดี'
      };

      const response = await request(BASE_URL)
        .post('/api/v1/applications')
        .send(testData)
        .expect(201);
      
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('id');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/nonexistent')
        .expect(404);
      
      expect(response.body).to.have.property('success', false);
    });
  });

});