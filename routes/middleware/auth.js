// routes/middleware/auth.js
/**
 * Authentication and Authorization Middleware
 * JWT-based security for GACP Platform
 */

const jwt = require('jsonwebtoken');
const databaseService = require('../../services/database/database-service');

/**
 * Authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const userQuery = `
      SELECT 
        id, email, role, full_name, 
        is_active, email_verified, two_factor_enabled
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const userResult = await databaseService.executePostgreSQLQuery(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = userResult.rows[0];

    // Check if email is verified for sensitive operations
    if (!user.email_verified && req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        message: 'Email verification required for this operation'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    // Update last activity
    await databaseService.executePostgreSQLQuery(
      'UPDATE user_sessions SET last_activity_at = NOW() WHERE session_token = $1',
      [token]
    ).catch(err => console.warn('Failed to update session activity:', err));

    next();

  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorize user roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Optional authentication (user may or may not be logged in)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userQuery = `
      SELECT id, email, role, full_name, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const userResult = await databaseService.executePostgreSQLQuery(userQuery, [decoded.userId]);
    
    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
      req.token = token;
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // Don't fail on optional auth errors
    req.user = null;
    next();
  }
};

/**
 * Rate limiting per user
 */
const userRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId);
      requests.set(userId, userRequests.filter(time => time > windowStart));
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
};

/**
 * Check if user owns resource
 */
const checkOwnership = (resourceIdParam = 'id', resourceType = 'application') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admins and super admins can access any resource
      if (['admin', 'super_admin'].includes(userRole)) {
        return next();
      }

      let ownershipQuery;
      let queryParams;

      switch (resourceType) {
        case 'application':
          ownershipQuery = 'SELECT user_id FROM applications WHERE id = $1';
          queryParams = [resourceId];
          break;
        case 'payment':
          ownershipQuery = `
            SELECT a.user_id 
            FROM payments p 
            JOIN applications a ON p.application_id = a.id 
            WHERE p.id = $1
          `;
          queryParams = [resourceId];
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      const result = await databaseService.executePostgreSQLQuery(ownershipQuery, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      const resourceOwnerId = result.rows[0].user_id;

      if (resourceOwnerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * API key authentication for system integrations
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Extract prefix and hash
    const keyPrefix = apiKey.substring(0, 8);
    const keyHash = require('crypto')
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const keyQuery = `
      SELECT 
        ak.id, ak.user_id, ak.organization_id, ak.scopes,
        ak.rate_limit, ak.is_active, ak.expires_at,
        u.role as user_role, u.full_name as user_name,
        o.name as organization_name
      FROM api_keys ak
      LEFT JOIN users u ON ak.user_id = u.id
      LEFT JOIN organizations o ON ak.organization_id = o.id
      WHERE ak.key_prefix = $1 AND ak.key_hash = $2 AND ak.is_active = true
    `;

    const keyResult = await databaseService.executePostgreSQLQuery(
      keyQuery, 
      [keyPrefix, keyHash]
    );

    if (keyResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const apiKeyData = keyResult.rows[0];

    // Check expiration
    if (apiKeyData.expires_at && new Date() > new Date(apiKeyData.expires_at)) {
      return res.status(401).json({
        success: false,
        message: 'API key expired'
      });
    }

    // Update last used timestamp
    await databaseService.executePostgreSQLQuery(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [apiKeyData.id]
    );

    // Attach API key info to request
    req.apiKey = apiKeyData;
    req.user = {
      id: apiKeyData.user_id,
      role: apiKeyData.user_role,
      type: 'api'
    };

    next();

  } catch (error) {
    console.error('❌ API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Check API key scopes
 */
const checkApiScopes = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API authentication required'
      });
    }

    const userScopes = req.apiKey.scopes || [];
    const hasRequiredScope = requiredScopes.some(scope => userScopes.includes(scope));

    if (!hasRequiredScope) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient API permissions',
        requiredScopes,
        userScopes
      });
    }

    next();
  };
};

/**
 * Session management
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.token) {
      return next();
    }

    const sessionQuery = `
      SELECT 
        id, user_id, expires_at, is_active, device_info
      FROM user_sessions 
      WHERE session_token = $1 AND is_active = true
    `;

    const sessionResult = await databaseService.executePostgreSQLQuery(
      sessionQuery, 
      [req.token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    const session = sessionResult.rows[0];

    // Check session expiration
    if (new Date() > new Date(session.expires_at)) {
      await databaseService.executePostgreSQLQuery(
        'UPDATE user_sessions SET is_active = false WHERE id = $1',
        [session.id]
      );

      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    req.session = session;
    next();

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Session validation failed'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
  userRateLimit,
  checkOwnership,
  authenticateApiKey,
  checkApiScopes,
  validateSession
};