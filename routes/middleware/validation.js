// routes/middleware/validation.js
/**
 * Request Validation Middleware
 * Express validator integration for GACP Platform
 */

const { validationResult } = require('express-validator');
const databaseService = require('../../services/database/database-service');

/**
 * Validate request and return formatted errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Custom validators for business logic
 */

/**
 * Check if user exists and is active
 */
const validateUserExists = async (userId) => {
  try {
    const result = await databaseService.executePostgreSQLQuery(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }
    
    return true;
  } catch (error) {
    throw new Error(`User validation failed: ${error.message}`);
  }
};

/**
 * Check if product exists and is active
 */
const validateProductExists = async (productId) => {
  try {
    const result = await databaseService.executePostgreSQLQuery(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Product not found or inactive');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Product validation failed: ${error.message}`);
  }
};

/**
 * Check if application exists and user has access
 */
const validateApplicationAccess = async (applicationId, userId, userRole) => {
  try {
    const query = `
      SELECT 
        a.user_id, a.reviewer_id, a.auditor_id, a.status
      FROM applications a
      WHERE a.id = $1
    `;
    
    const result = await databaseService.executePostgreSQLQuery(query, [applicationId]);
    
    if (result.rows.length === 0) {
      throw new Error('Application not found');
    }
    
    const app = result.rows[0];
    const isOwner = app.user_id === userId;
    const isAssigned = app.reviewer_id === userId || app.auditor_id === userId;
    const isStaff = ['admin', 'super_admin', 'reviewer', 'auditor'].includes(userRole);
    
    if (!isOwner && !isAssigned && !isStaff) {
      throw new Error('Access denied to this application');
    }
    
    return { application: app, isOwner, isAssigned, isStaff };
  } catch (error) {
    throw new Error(`Application access validation failed: ${error.message}`);
  }
};

/**
 * Validate Thai national ID format
 */
const validateThaiNationalId = (nationalId) => {
  if (!nationalId) return true; // Optional field
  
  // Remove any spaces or dashes
  const cleanId = nationalId.replace(/[\s-]/g, '');
  
  // Check if it's 13 digits
  if (!/^\d{13}$/.test(cleanId)) {
    throw new Error('Thai national ID must be 13 digits');
  }
  
  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i)) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  
  if (checkDigit !== parseInt(cleanId.charAt(12))) {
    throw new Error('Invalid Thai national ID checksum');
  }
  
  return true;
};

/**
 * Validate Thai phone number format
 */
const validateThaiPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Check Thai mobile patterns
  const mobilePatterns = [
    /^(\+66|66|0)[6-9]\d{8}$/, // Thai mobile numbers
    /^(\+66|66|0)[2-7]\d{7}$/, // Thai landline numbers
  ];
  
  return mobilePatterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Validate GPS coordinates for Thailand
 */
const validateThaiCoordinates = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new Error('Coordinates must be an array of [longitude, latitude]');
  }
  
  const [longitude, latitude] = coordinates;
  
  // Thailand bounding box (approximate)
  const thaiLongitudeRange = [97.343396, 105.636812];
  const thaiLatitudeRange = [5.612851, 20.463194];
  
  if (longitude < thaiLongitudeRange[0] || longitude > thaiLongitudeRange[1]) {
    throw new Error('Longitude must be within Thailand boundaries');
  }
  
  if (latitude < thaiLatitudeRange[0] || latitude > thaiLatitudeRange[1]) {
    throw new Error('Latitude must be within Thailand boundaries');
  }
  
  return true;
};

/**
 * Validate Thai postal code
 */
const validateThaiPostalCode = (postalCode) => {
  if (!postalCode) return false;
  
  // Thai postal codes are 5 digits
  return /^\d{5}$/.test(postalCode);
};

/**
 * Validate cultivation area (in Rai)
 */
const validateCultivationArea = (areaRai) => {
  if (typeof areaRai !== 'number' || areaRai <= 0) {
    throw new Error('Cultivation area must be a positive number');
  }
  
  // Maximum reasonable area for individual farms (1000 Rai = ~160 hectares)
  if (areaRai > 1000) {
    throw new Error('Cultivation area seems unusually large, please verify');
  }
  
  return true;
};

/**
 * Validate file upload metadata
 */
const validateFileMetadata = (fileMetadata) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!fileMetadata.mimetype || !allowedTypes.includes(fileMetadata.mimetype)) {
    throw new Error('File type not allowed');
  }
  
  if (fileMetadata.size > maxSize) {
    throw new Error('File size too large (max 10MB)');
  }
  
  return true;
};

/**
 * Validate application status transition
 */
const validateStatusTransition = (currentStatus, newStatus, userRole) => {
  const transitions = {
    draft: {
      allowed: ['pending_initial_payment'],
      roles: ['applicant', 'admin', 'super_admin']
    },
    pending_initial_payment: {
      allowed: ['pending_review', 'draft'],
      roles: ['admin', 'super_admin']
    },
    pending_review: {
      allowed: ['review_passed', 'resubmission_required'],
      roles: ['reviewer', 'admin', 'super_admin']
    },
    review_passed: {
      allowed: ['pending_audit_payment'],
      roles: ['admin', 'super_admin']
    },
    resubmission_required: {
      allowed: ['pending_review'],
      roles: ['applicant', 'admin', 'super_admin']
    },
    pending_audit_payment: {
      allowed: ['pending_audit_visit'],
      roles: ['admin', 'super_admin']
    },
    pending_audit_visit: {
      allowed: ['audit_scheduled'],
      roles: ['auditor', 'admin', 'super_admin']
    },
    audit_scheduled: {
      allowed: ['audit_completed'],
      roles: ['auditor', 'admin', 'super_admin']
    },
    audit_completed: {
      allowed: ['pending_final_approval'],
      roles: ['auditor', 'admin', 'super_admin']
    },
    pending_final_approval: {
      allowed: ['approved', 'rejected'],
      roles: ['admin', 'super_admin']
    },
    approved: {
      allowed: ['expired'],
      roles: ['admin', 'super_admin']
    },
    rejected: {
      allowed: [],
      roles: []
    },
    expired: {
      allowed: [],
      roles: []
    }
  };
  
  const transition = transitions[currentStatus];
  
  if (!transition) {
    throw new Error(`Invalid current status: ${currentStatus}`);
  }
  
  if (!transition.allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  
  if (!transition.roles.includes(userRole)) {
    throw new Error(`User role ${userRole} cannot perform this status transition`);
  }
  
  return true;
};

/**
 * Sanitize and validate form data
 */
const sanitizeFormData = (formData) => {
  const sanitized = { ...formData };
  
  // Remove any potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  dangerousFields.forEach(field => {
    delete sanitized[field];
  });
  
  // Trim string fields
  const trimStringFields = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimStringFields(obj[key]);
      }
    }
  };
  
  trimStringFields(sanitized);
  
  return sanitized;
};

/**
 * Middleware for form data validation
 */
const validateFormData = (req, res, next) => {
  try {
    if (req.body.formData) {
      req.body.formData = sanitizeFormData(req.body.formData);
      
      // Validate specific form fields
      const { formData } = req.body;
      
      // Validate contact person phone number
      if (formData.contactPerson?.phoneNumber) {
        if (!validateThaiPhoneNumber(formData.contactPerson.phoneNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid Thai phone number format'
          });
        }
      }
      
      // Validate cultivation sites coordinates
      if (formData.cultivationSites) {
        for (const site of formData.cultivationSites) {
          if (site.address?.coordinates?.coordinates) {
            try {
              validateThaiCoordinates(site.address.coordinates.coordinates);
            } catch (error) {
              return res.status(400).json({
                success: false,
                message: error.message
              });
            }
          }
          
          if (site.totalAreaRai) {
            try {
              validateCultivationArea(site.totalAreaRai);
            } catch (error) {
              return res.status(400).json({
                success: false,
                message: error.message
              });
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Form data validation error:', error);
    return res.status(400).json({
      success: false,
      message: 'Form data validation failed',
      error: error.message
    });
  }
};

module.exports = {
  validateRequest,
  validateUserExists,
  validateProductExists,
  validateApplicationAccess,
  validateThaiNationalId,
  validateThaiPhoneNumber,
  validateThaiCoordinates,
  validateThaiPostalCode,
  validateCultivationArea,
  validateFileMetadata,
  validateStatusTransition,
  sanitizeFormData,
  validateFormData
};