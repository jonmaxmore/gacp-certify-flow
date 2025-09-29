// routes/api/applications.js
/**
 * Application API Routes for GACP Platform
 * RESTful endpoints for application management
 */

const express = require('express');
const router = express.Router();
const ApplicationService = require('../../services/core-certification/src/application-service');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rate-limit');
const { body, param, query } = require('express-validator');

const applicationService = new ApplicationService();

// Rate limiting for API endpoints
const createApplicationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 applications per 15 minutes per user
  message: 'Too many applications created, please try again later'
});

const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per user
  message: 'Too many requests, please try again later'
});

/**
 * @route   POST /api/applications
 * @desc    Create new GACP application
 * @access  Private (Applicant)
 */
router.post('/',
  createApplicationLimit,
  authenticateToken,
  authorize(['applicant', 'admin', 'super_admin']),
  [
    body('productId')
      .isUUID()
      .withMessage('Valid product ID is required'),
    body('formData.applicantType')
      .isIn(['individual', 'company', 'cooperative', 'group'])
      .withMessage('Valid applicant type is required'),
    body('formData.contactPerson.fullName')
      .isLength({ min: 2, max: 255 })
      .withMessage('Full name must be between 2-255 characters'),
    body('formData.contactPerson.phoneNumber')
      .matches(/^[0-9+\-\s\(\)]+$/)
      .withMessage('Valid phone number is required'),
    body('formData.contactPerson.email')
      .isEmail()
      .withMessage('Valid email is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { productId, formData } = req.body;
      const userId = req.user.id;

      console.log(`📝 Creating application for user: ${userId}`);

      const application = await applicationService.createApplication(
        userId, 
        productId, 
        formData
      );

      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        data: application
      });

    } catch (error) {
      console.error('❌ Application creation failed:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application details
 * @access  Private (Owner, Staff, Admin)
 */
router.get('/:id',
  generalLimit,
  authenticateToken,
  [
    param('id')
      .custom(value => {
        // Accept UUID or application code format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const codeRegex = /^GACP-\d{13}-[A-Z0-9]{8}$/;
        
        if (!uuidRegex.test(value) && !codeRegex.test(value)) {
          throw new Error('Invalid application ID or code format');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const applicationId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`📋 Fetching application: ${applicationId} for user: ${userId}`);

      const application = await applicationService.getApplication(applicationId, userId);

      // Check permissions
      const isOwner = application.userId === userId;
      const isStaff = ['reviewer', 'auditor', 'admin', 'super_admin'].includes(userRole);
      const isAssigned = application.reviewerId === userId || application.auditorId === userId;

      if (!isOwner && !isStaff && !isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this application'
        });
      }

      // Filter sensitive data based on role
      let responseData = { ...application };
      
      if (!isStaff && !isOwner) {
        // Remove sensitive staff information
        delete responseData.formData?.contactPerson?.nationalId;
        delete responseData.metadata?.ipAddress;
      }

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('❌ Failed to fetch application:', error);
      
      if (error.message === 'Application not found') {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application
 * @access  Private (Owner, Staff)
 */
router.put('/:id',
  generalLimit,
  authenticateToken,
  [
    param('id').isUUID().withMessage('Valid application ID is required'),
    body('formData').optional().isObject(),
    body('status').optional().isIn([
      'draft', 'pending_initial_payment', 'pending_review',
      'review_passed', 'resubmission_required', 'pending_audit_payment',
      'pending_audit_visit', 'audit_scheduled', 'audit_completed',
      'pending_final_approval', 'approved', 'rejected', 'expired'
    ]),
    body('statusReason').optional().isString(),
    body('statusNotes').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const applicationId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      const updates = req.body;

      console.log(`✏️ Updating application: ${applicationId} by user: ${userId}`);

      // Validate status change permissions
      if (updates.status) {
        const isStaff = ['reviewer', 'auditor', 'admin', 'super_admin'].includes(userRole);
        
        if (!isStaff && !['draft', 'resubmission_required'].includes(updates.status)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for status change'
          });
        }
      }

      const result = await applicationService.updateApplication(
        applicationId, 
        updates, 
        userId
      );

      res.json({
        success: true,
        message: 'Application updated successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ Failed to update application:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   POST /api/applications/:id/submit
 * @desc    Submit application for review
 * @access  Private (Owner)
 */
router.post('/:id/submit',
  generalLimit,
  authenticateToken,
  authorize(['applicant', 'admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('Valid application ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const applicationId = req.params.id;
      const userId = req.user.id;

      console.log(`📤 Submitting application: ${applicationId} by user: ${userId}`);

      const result = await applicationService.submitApplication(applicationId, userId);

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ Failed to submit application:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   GET /api/applications
 * @desc    Search and list applications
 * @access  Private
 */
router.get('/',
  generalLimit,
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('status').optional().isString(),
    query('searchText').optional().isString(),
    query('sortBy').optional().isIn(['created_at', 'updated_at', 'submitted_at', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = { ...req.query };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Non-staff users can only see their own applications
      if (!['reviewer', 'auditor', 'admin', 'super_admin'].includes(userRole)) {
        filters.userId = userId;
      }

      console.log(`🔍 Searching applications for user: ${userId}, role: ${userRole}`);

      const results = await applicationService.searchApplications(filters, pagination);

      res.json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        filters: results.filters,
        mongoMatches: results.mongoMatches
      });

    } catch (error) {
      console.error('❌ Failed to search applications:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics
 * @access  Private (Staff, Admin)
 */
router.get('/stats',
  generalLimit,
  authenticateToken,
  authorize(['reviewer', 'auditor', 'admin', 'super_admin']),
  [
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {};
      
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }

      console.log(`📊 Generating application statistics`);

      const stats = await applicationService.getApplicationStats(filters);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Failed to get application stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   GET /api/applications/:id/history
 * @desc    Get application status history
 * @access  Private (Owner, Staff)
 */
router.get('/:id/history',
  generalLimit,
  authenticateToken,
  [
    param('id').isUUID().withMessage('Valid application ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const applicationId = req.params.id;
      const userId = req.user.id;

      // Check if user has access to this application
      const application = await applicationService.getApplication(applicationId);
      
      const isOwner = application.userId === userId;
      const isStaff = ['reviewer', 'auditor', 'admin', 'super_admin'].includes(req.user.role);
      
      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this application'
        });
      }

      // Get status history from PostgreSQL
      const historyQuery = `
        SELECT 
          ash.id,
          ash.from_status,
          ash.to_status,
          ash.reason,
          ash.notes,
          ash.changed_at,
          u.full_name as changed_by_name,
          u.role as changed_by_role
        FROM application_status_history ash
        JOIN users u ON ash.changed_by = u.id
        WHERE ash.application_id = $1
        ORDER BY ash.changed_at DESC
      `;

      const databaseService = require('../../services/database/database-service');
      const historyResult = await databaseService.executePostgreSQLQuery(
        historyQuery, 
        [applicationId]
      );

      res.json({
        success: true,
        data: historyResult.rows
      });

    } catch (error) {
      console.error('❌ Failed to get application history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route   POST /api/applications/:id/assign
 * @desc    Assign application to staff member
 * @access  Private (Admin, Super Admin)
 */
router.post('/:id/assign',
  generalLimit,
  authenticateToken,
  authorize(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('Valid application ID is required'),
    body('reviewerId').optional().isUUID().withMessage('Valid reviewer ID required'),
    body('auditorId').optional().isUUID().withMessage('Valid auditor ID required'),
    body('assignmentReason').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const applicationId = req.params.id;
      const { reviewerId, auditorId, assignmentReason } = req.body;
      const userId = req.user.id;

      console.log(`👥 Assigning application: ${applicationId}`);

      const assignments = {};
      if (reviewerId) assignments.reviewerId = reviewerId;
      if (auditorId) assignments.auditorId = auditorId;

      if (Object.keys(assignments).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one assignment (reviewer or auditor) is required'
        });
      }

      const result = await applicationService.updateApplication(
        applicationId,
        { 
          assignments,
          statusReason: assignmentReason || 'Staff assignment'
        },
        userId
      );

      res.json({
        success: true,
        message: 'Application assigned successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ Failed to assign application:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

module.exports = router;