const axios = require('axios');
const logger = require('../services/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'ไม่พบ token การยืนยันตัวตน'
      });
    }

    // Verify token with auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.get(`${authServiceUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.data.valid) {
        req.user = response.data.user;
        next();
      } else {
        return res.status(401).json({ 
          error: 'Invalid token',
          message: 'Token ไม่ถูกต้อง'
        });
      }

    } catch (authError) {
      if (authError.response?.status === 401) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: authError.response.data.message || 'ไม่มีสิทธิ์เข้าถึง'
        });
      }

      logger.error('Auth service communication error:', authError.message);
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้'
      });
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};

module.exports = authMiddleware;