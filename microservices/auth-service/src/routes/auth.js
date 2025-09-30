const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const redisClient = require('../services/redis');
const logger = require('../services/logger');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc ลงทะเบียนผู้ใช้ใหม่
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('phoneNumber').isMobilePhone('th-TH'),
  body('organizationType').isIn(['farmer', 'processor', 'distributor', 'inspector', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phoneNumber, organizationType } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'อีเมลนี้ถูกใช้งานแล้ว' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      organizationType,
      isVerified: false,
      createdAt: new Date()
    };

    const user = await User.create(userData);
    
    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'ลงทะเบียนสำเร็จ',
      userId: user.id,
      email: user.email
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถลงทะเบียนได้ในขณะนี้' 
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc เข้าสู่ระบบ
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        organizationType: user.organizationType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store session in Redis
    const sessionData = {
      userId: user.id,
      email: user.email,
      organizationType: user.organizationType,
      loginTime: new Date().toISOString()
    };
    
    await redisClient.createSession(user.id, sessionData, 86400);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationType: user.organizationType
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc ออกจากระบบ
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Remove session from Redis
      await redisClient.destroySession(decoded.userId);
      
      logger.info(`User logged out: ${decoded.email}`);
    }

    res.json({ message: 'ออกจากระบบสำเร็จ' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถออกจากระบบได้ในขณะนี้'
    });
  }
});

/**
 * @route GET /api/auth/verify
 * @desc ตรวจสอบ token
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'ไม่พบ token การยืนยันตัวตน'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists in Redis
    const sessionData = await redisClient.getSession(decoded.userId);
    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Session expired',
        message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        organizationType: decoded.organizationType
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    logger.error('Token verification error:', error);
    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token ไม่ถูกต้อง'
    });
  }
});

module.exports = router;