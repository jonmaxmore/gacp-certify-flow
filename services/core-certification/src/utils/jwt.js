/**
 * JWT Utility Functions for GACP Platform
 * Thai Herbal Certification System - Authentication Helper
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'gacp-thai-herbal-secret-2024';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.issuer = 'gacp-platform';
    this.audience = 'thai-herbal-farmers';
  }

  /**
   * Generate JWT token with Thai-specific claims
   */
  generateToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        iss: this.issuer,
        aud: this.audience,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex'), // Token ID
        // Thai-specific claims
        thai_id: payload.thai_id || null,
        farmer_level: payload.farmer_level || 'basic',
        province: payload.province || null
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.expiresIn,
        algorithm: 'HS256'
      });
    } catch (error) {
      throw new Error('Token generation failed: ' + error.message);
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed: ' + error.message);
      }
    }
  }

  /**
   * Extract payload without verification (for debugging)
   */
  extractPayload(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      return decoded ? decoded.payload : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isExpired(token) {
    try {
      const payload = this.extractPayload(token);
      if (!payload || !payload.exp) return true;
      
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresh token if needed
   */
  refreshToken(token) {
    try {
      const payload = this.verifyToken(token);
      
      // Remove JWT standard claims for new token
      const { iat, exp, jti, ...userPayload } = payload;
      
      return this.generateToken(userPayload);
    } catch (error) {
      throw new Error('Token refresh failed: ' + error.message);
    }
  }

  /**
   * Validate Thai National ID format in token
   */
  validateThaiID(thaiId) {
    if (!thaiId || typeof thaiId !== 'string') return false;
    
    // Remove any spaces or dashes
    const cleanId = thaiId.replace(/[^0-9]/g, '');
    
    // Must be exactly 13 digits
    if (cleanId.length !== 13) return false;
    
    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanId[i]) * (13 - i);
    }
    
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleanId[12]);
  }
}

// Export singleton instance
const jwtService = new JWTService();

module.exports = {
  generateToken: (payload) => jwtService.generateToken(payload),
  verifyToken: (token) => jwtService.verifyToken(token),
  extractPayload: (token) => jwtService.extractPayload(token),
  isExpired: (token) => jwtService.isExpired(token),
  refreshToken: (token) => jwtService.refreshToken(token),
  validateThaiID: (thaiId) => jwtService.validateThaiID(thaiId),
  JWTService
};