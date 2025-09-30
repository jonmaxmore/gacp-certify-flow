// Role-based Authorization System for GACP Platform
// Supports 5 roles: farmer, reviewer, auditor, approver, finance

const jwt = require('jsonwebtoken');
const logger = require('../services/logger');

// Role hierarchy and permissions
const ROLES = {
  FARMER: 'farmer',
  REVIEWER: 'reviewer', 
  AUDITOR: 'auditor',
  APPROVER: 'approver',
  FINANCE: 'finance'
};

// Permission definitions
const PERMISSIONS = {
  // Application permissions
  'application:create': [ROLES.FARMER],
  'application:view_own': [ROLES.FARMER],
  'application:view_assigned': [ROLES.REVIEWER, ROLES.AUDITOR, ROLES.APPROVER],
  'application:view_all': [ROLES.FINANCE],
  'application:edit_own': [ROLES.FARMER],
  'application:submit': [ROLES.FARMER],
  'application:cancel': [ROLES.FARMER],
  
  // Document permissions
  'document:upload': [ROLES.FARMER],
  'document:view': [ROLES.FARMER, ROLES.REVIEWER, ROLES.AUDITOR, ROLES.APPROVER],
  'document:delete': [ROLES.FARMER],
  
  // Review permissions
  'review:create': [ROLES.REVIEWER],
  'review:view': [ROLES.REVIEWER, ROLES.AUDITOR, ROLES.APPROVER, ROLES.FARMER],
  'review:approve': [ROLES.REVIEWER],
  'review:reject': [ROLES.REVIEWER],
  
  // Audit permissions
  'audit:schedule': [ROLES.AUDITOR],
  'audit:conduct': [ROLES.AUDITOR],
  'audit:report': [ROLES.AUDITOR],
  'audit:view': [ROLES.AUDITOR, ROLES.APPROVER, ROLES.FARMER],
  
  // Approval permissions
  'approval:decide': [ROLES.APPROVER],
  'approval:view': [ROLES.APPROVER, ROLES.FARMER],
  'certificate:generate': [ROLES.APPROVER],
  'certificate:sign': [ROLES.APPROVER],
  
  // Payment permissions
  'payment:make': [ROLES.FARMER],
  'payment:view_own': [ROLES.FARMER],
  'payment:view_all': [ROLES.FINANCE],
  'payment:process': [ROLES.FINANCE],
  'payment:refund': [ROLES.FINANCE],
  
  // Workflow permissions
  'workflow:view_history': [ROLES.FARMER, ROLES.REVIEWER, ROLES.AUDITOR, ROLES.APPROVER],
  'workflow:transition': [ROLES.REVIEWER, ROLES.AUDITOR, ROLES.APPROVER],
  
  // Admin permissions
  'user:assign': [ROLES.APPROVER],
  'reports:generate': [ROLES.FINANCE, ROLES.APPROVER],
  'system:configure': [ROLES.APPROVER]
};

// Application status permissions by role
const STATUS_PERMISSIONS = {
  [ROLES.FARMER]: {
    view: ['draft', 'submitted', 'payment_pending_1', 'reviewing', 'rejected', 
           'payment_pending_2', 'auditing', 'audit_failed', 'audit_doubt', 
           'payment_pending_3', 're_auditing', 'field_auditing', 'approval_pending', 
           'approved', 'certificate_issued', 'rejected_final'],
    edit: ['draft'],
    submit: ['draft'],
    pay: ['payment_pending_1', 'payment_pending_2', 'payment_pending_3']
  },
  
  [ROLES.REVIEWER]: {
    view: ['reviewing', 'rejected', 'payment_pending_2', 'auditing', 'approval_pending'],
    review: ['reviewing', 'rejected'],
    approve: ['reviewing'],
    reject: ['reviewing']
  },
  
  [ROLES.AUDITOR]: {
    view: ['auditing', 'audit_failed', 'audit_doubt', 'payment_pending_3', 
           're_auditing', 'field_auditing', 'approval_pending'],
    schedule: ['auditing', 're_auditing', 'field_auditing'],
    conduct: ['auditing', 're_auditing', 'field_auditing'],
    result: ['auditing', 're_auditing', 'field_auditing']
  },
  
  [ROLES.APPROVER]: {
    view: ['approval_pending', 'approved', 'certificate_issued', 'rejected_final'],
    approve: ['approval_pending'],
    reject: ['approval_pending'],
    certificate: ['approved']
  },
  
  [ROLES.FINANCE]: {
    view: ['payment_pending_1', 'payment_pending_2', 'payment_pending_3', 
           'submitted', 'reviewing', 'auditing', 'approved', 'certificate_issued'],
    payment: ['payment_pending_1', 'payment_pending_2', 'payment_pending_3']
  }
};

// Middleware: Extract and verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || decoded.organizationType,
      organizationType: decoded.organizationType
    };

    // Validate required user fields
    if (!req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      });
    }

    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      endpoint: req.originalUrl
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      endpoint: req.originalUrl,
      ip: req.ip
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Middleware: Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
};

// Middleware: Check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      logger.warn('Access denied - missing permission', {
        userId: req.user.id,
        userRole,
        permission,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${permission}`,
        code: 'MISSING_PERMISSION',
        permission,
        userRole
      });
    }

    next();
  };
};

// Middleware: Check application access based on role and ownership
const checkApplicationAccess = (action = 'view') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const userRole = req.user.role;
      const userId = req.user.id;
      const applicationId = req.params.id;

      // For general listing, allow based on role
      if (!applicationId) {
        return next();
      }

      // Get application (assumes application is loaded in middleware or we load it here)
      // This is a simplified check - in practice, you'd load the application
      const application = req.application; // Assumes application is pre-loaded

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          code: 'NOT_FOUND'
        });
      }

      let hasAccess = false;

      switch (userRole) {
        case ROLES.FARMER:
          hasAccess = application.farmerId === userId;
          break;
          
        case ROLES.REVIEWER:
          hasAccess = application.assignedReviewer?.userId === userId;
          // Check if application is in reviewable status
          if (hasAccess && action === 'review') {
            const reviewableStatuses = STATUS_PERMISSIONS[ROLES.REVIEWER].review || [];
            hasAccess = reviewableStatuses.includes(application.currentStatus);
          }
          break;
          
        case ROLES.AUDITOR:
          hasAccess = application.assignedAuditor?.userId === userId;
          // Check if application is in auditable status
          if (hasAccess && action === 'audit') {
            const auditableStatuses = STATUS_PERMISSIONS[ROLES.AUDITOR].conduct || [];
            hasAccess = auditableStatuses.includes(application.currentStatus);
          }
          break;
          
        case ROLES.APPROVER:
          hasAccess = application.assignedApprover?.userId === userId;
          // Check if application is in approvable status
          if (hasAccess && action === 'approve') {
            const approvableStatuses = STATUS_PERMISSIONS[ROLES.APPROVER].approve || [];
            hasAccess = approvableStatuses.includes(application.currentStatus);
          }
          break;
          
        case ROLES.FINANCE:
          hasAccess = true; // Finance can view all applications
          break;
          
        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        logger.warn('Access denied - application access', {
          userId,
          userRole,
          applicationId,
          action,
          endpoint: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied to this application',
          code: 'APPLICATION_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking application access', {
        error: error.message,
        userId: req.user?.id,
        applicationId: req.params.id
      });

      return res.status(500).json({
        success: false,
        message: 'Error checking access permissions',
        code: 'ACCESS_CHECK_ERROR'
      });
    }
  };
};

// Utility: Check if user can perform action on application status
const canPerformAction = (userRole, action, applicationStatus) => {
  const rolePermissions = STATUS_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  const allowedStatuses = rolePermissions[action];
  if (!allowedStatuses) return false;

  return allowedStatuses.includes(applicationStatus);
};

// Utility: Get user permissions
const getUserPermissions = (userRole) => {
  const permissions = [];
  
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(userRole)) {
      permissions.push(permission);
    }
  }
  
  return permissions;
};

// Utility: Check if user has specific permission
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

// Middleware: Load application and check ownership/assignment
const loadApplicationWithAccess = async (req, res, next) => {
  try {
    const applicationId = req.params.id;
    if (!applicationId) {
      return next();
    }

    // This would typically load from database
    // For now, we'll assume it's loaded elsewhere and attached to req
    if (!req.application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    next();
  } catch (error) {
    logger.error('Error loading application', {
      error: error.message,
      applicationId: req.params.id
    });

    return res.status(500).json({
      success: false,
      message: 'Error loading application',
      code: 'LOAD_ERROR'
    });
  }
};

// Export all authorization functions
module.exports = {
  // Constants
  ROLES,
  PERMISSIONS,
  STATUS_PERMISSIONS,
  
  // Middleware
  authenticateToken,
  requireRole,
  requirePermission,
  checkApplicationAccess,
  loadApplicationWithAccess,
  
  // Utilities
  canPerformAction,
  getUserPermissions,
  hasPermission
};