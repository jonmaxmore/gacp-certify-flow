// tests/unit/jwt.test.js
/**
 * JWT Utility Unit Tests
 * GACP Platform - Thai Herbal Certification System
 */

const { generateToken, verifyToken, extractPayload } = require('../../services/core-certification/src/utils/jwt');
const jwt = require('jsonwebtoken');

describe('JWT Utility Tests', () => {
  const testPayload = {
    sub: 'farmer-001',
    role: 'farmer',
    email: 'test@farmer.th',
    thai_id: '1234567890123',
    province: 'เชียงใหม่'
  };

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include Thai-specific claims', () => {
      const token = generateToken(testPayload);
      const decoded = jwt.decode(token);
      
      expect(decoded.thai_id).toBe('1234567890123');
      expect(decoded.province).toBe('เชียงใหม่');
      expect(decoded.role).toBe('farmer');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(testPayload);
      const verified = verifyToken(token);
      
      expect(verified).toBeDefined();
      expect(verified.sub).toBe('farmer-001');
      expect(verified.thai_id).toBe('1234567890123');
    });

    it('should reject invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });
  });

  describe('extractPayload', () => {
    it('should extract payload without verification', () => {
      const token = generateToken(testPayload);
      const payload = extractPayload(token);
      
      expect(payload.sub).toBe('farmer-001');
      expect(payload.province).toBe('เชียงใหม่');
    });
  });
});