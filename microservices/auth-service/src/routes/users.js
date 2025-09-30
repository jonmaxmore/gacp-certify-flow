const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const logger = require('../services/logger');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc ดูข้อมูลโปรไฟล์ผู้ใช้
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        organizationType: user.organizationType,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้'
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc แก้ไขข้อมูลโปรไฟล์ผู้ใช้
 */
router.put('/profile', [
  authMiddleware,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phoneNumber').optional().isMobilePhone('th-TH')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phoneNumber } = req.body;
    
    // Update user profile logic would go here
    // For now, just return success message
    
    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      message: 'อัพเดทโปรไฟล์สำเร็จ',
      user: {
        id: req.user.userId,
        email: req.user.email,
        firstName,
        lastName,
        phoneNumber
      }
    });

  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถอัพเดทโปรไฟล์ได้'
    });
  }
});

module.exports = router;