const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Application = require('../models/Application');
const logger = require('../services/logger');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route GET /api/applications
 * @desc ดูรายการคำขอของผู้ใช้
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'submitted', 'under_review', 'inspection_scheduled', 'inspection_completed', 'approved', 'rejected', 'revision_required'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { userId: req.user.userId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .select('applicationId applicantInfo.organizationName farmInfo.farmName status submittedAt createdAt fees.totalFee fees.paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(filter);

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching applications:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถดึงข้อมูลคำขอได้'
    });
  }
});

/**
 * @route GET /api/applications/:id
 * @desc ดูรายละเอียดคำขอ
 */
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ 
        error: 'Application not found',
        message: 'ไม่พบคำขอที่ระบุ'
      });
    }

    res.json({ application });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid application ID',
        message: 'รหัสคำขอไม่ถูกต้อง'
      });
    }

    logger.error('Error fetching application:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถดึงข้อมูลคำขอได้'
    });
  }
});

/**
 * @route POST /api/applications
 * @desc สร้างคำขอใหม่
 */
router.post('/', [
  body('applicantInfo.organizationName').trim().isLength({ min: 2 }),
  body('applicantInfo.ownerName').trim().isLength({ min: 2 }),
  body('applicantInfo.contactEmail').isEmail(),
  body('applicantInfo.contactPhone').isMobilePhone('th-TH'),
  body('farmInfo.farmName').trim().isLength({ min: 2 }),
  body('farmInfo.farmArea').isFloat({ min: 0.1 }),
  body('cropInfo.crops').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const applicationData = {
      ...req.body,
      userId: req.user.userId,
      status: 'draft'
    };

    const application = new Application(applicationData);
    
    // Calculate fees
    application.calculateFees();
    
    await application.save();

    logger.info(`New application created: ${application.applicationId} by user ${req.user.userId}`);

    res.status(201).json({
      message: 'สร้างคำขอสำเร็จ',
      application: {
        id: application._id,
        applicationId: application.applicationId,
        status: application.status,
        totalFee: application.fees.totalFee
      }
    });

  } catch (error) {
    logger.error('Error creating application:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถสร้างคำขอได้'
    });
  }
});

/**
 * @route PUT /api/applications/:id
 * @desc แก้ไขคำขอ (เฉพาะสถานะ draft)
 */
router.put('/:id', [
  body('applicantInfo.organizationName').optional().trim().isLength({ min: 2 }),
  body('applicantInfo.ownerName').optional().trim().isLength({ min: 2 }),
  body('applicantInfo.contactEmail').optional().isEmail(),
  body('applicantInfo.contactPhone').optional().isMobilePhone('th-TH'),
  body('farmInfo.farmName').optional().trim().isLength({ min: 2 }),
  body('farmInfo.farmArea').optional().isFloat({ min: 0.1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ 
        error: 'Application not found',
        message: 'ไม่พบคำขอที่ระบุ'
      });
    }

    if (application.status !== 'draft' && application.status !== 'revision_required') {
      return res.status(400).json({ 
        error: 'Cannot edit application',
        message: 'ไม่สามารถแก้ไขคำขอในสถานะนี้ได้'
      });
    }

    // Update application
    Object.assign(application, req.body);
    application.lastUpdated = new Date();
    
    // Recalculate fees if farm area changed
    if (req.body.farmInfo?.farmArea) {
      application.calculateFees();
    }

    await application.save();

    logger.info(`Application updated: ${application.applicationId} by user ${req.user.userId}`);

    res.json({
      message: 'อัพเดทคำขอสำเร็จ',
      application: {
        id: application._id,
        applicationId: application.applicationId,
        status: application.status,
        totalFee: application.fees.totalFee
      }
    });

  } catch (error) {
    logger.error('Error updating application:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถอัพเดทคำขอได้'
    });
  }
});

/**
 * @route POST /api/applications/:id/submit
 * @desc ยื่นคำขอ (เปลี่ยนสถานะจาก draft เป็น submitted)
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ 
        error: 'Application not found',
        message: 'ไม่พบคำขอที่ระบุ'
      });
    }

    if (application.status !== 'draft' && application.status !== 'revision_required') {
      return res.status(400).json({ 
        error: 'Cannot submit application',
        message: 'ไม่สามารถยื่นคำขอในสถานะนี้ได้'
      });
    }

    // Check if required documents are uploaded
    const requiredDocs = ['farm_map', 'land_ownership', 'business_license'];
    const uploadedDocs = application.documents.map(doc => doc.documentType);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

    if (missingDocs.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required documents',
        message: 'ยังขาดเอกสารที่จำเป็น',
        missingDocuments: missingDocs
      });
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    application.lastUpdated = new Date();

    await application.save();

    logger.info(`Application submitted: ${application.applicationId} by user ${req.user.userId}`);

    res.json({
      message: 'ยื่นคำขอสำเร็จ',
      application: {
        id: application._id,
        applicationId: application.applicationId,
        status: application.status,
        submittedAt: application.submittedAt
      }
    });

  } catch (error) {
    logger.error('Error submitting application:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถยื่นคำขอได้'
    });
  }
});

/**
 * @route DELETE /api/applications/:id
 * @desc ลบคำขอ (เฉพาะสถานะ draft)
 */
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ 
        error: 'Application not found',
        message: 'ไม่พบคำขอที่ระบุ'
      });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot delete application',
        message: 'ไม่สามารถลบคำขอในสถานะนี้ได้'
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    logger.info(`Application deleted: ${application.applicationId} by user ${req.user.userId}`);

    res.json({
      message: 'ลบคำขอสำเร็จ'
    });

  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'ไม่สามารถลบคำขอได้'
    });
  }
});

module.exports = router;