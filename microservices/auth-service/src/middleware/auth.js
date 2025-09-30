const jwt = require('jsonwebtoken');
const redisClient = require('../services/redis');
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

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists in Redis
    const sessionData = await redisClient.getSession(decoded.userId);
    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Session expired',
        message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      organizationType: decoded.organizationType
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token ไม่ถูกต้อง'
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};

module.exports = authMiddleware;