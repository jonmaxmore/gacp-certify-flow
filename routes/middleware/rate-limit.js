// routes/middleware/rate-limit.js
/**
 * Rate Limiting Middleware for GACP Platform
 * Advanced rate limiting with Redis backing
 */

const Redis = require('redis');

class RateLimiter {
  constructor() {
    this.redisClient = null;
    this.fallbackStore = new Map(); // In-memory fallback
    this.initialized = false;
  }

  async initialize() {
    try {
      // Use the same Redis instance as the database service
      const config = require('../../config/database-hybrid');
      this.redisClient = Redis.createClient(config.redis);
      await this.redisClient.connect();
      this.initialized = true;
      console.log('✅ Rate limiter Redis connection established');
    } catch (error) {
      console.warn('⚠️ Rate limiter falling back to in-memory store:', error.message);
      this.initialized = false;
    }
  }

  async increment(key, windowMs) {
    if (this.redisClient && this.initialized) {
      try {
        const pipeline = this.redisClient.multi();
        pipeline.incr(key);
        pipeline.expire(key, Math.ceil(windowMs / 1000));
        const results = await pipeline.exec();
        return results[0][1]; // Return the incremented value
      } catch (error) {
        console.warn('⚠️ Redis rate limit error, using fallback:', error.message);
        return this.incrementFallback(key, windowMs);
      }
    } else {
      return this.incrementFallback(key, windowMs);
    }
  }

  incrementFallback(key, windowMs) {
    const now = Date.now();
    const record = this.fallbackStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }
    
    this.fallbackStore.set(key, record);
    
    // Clean up expired entries periodically
    if (this.fallbackStore.size > 10000) {
      this.cleanupFallbackStore();
    }
    
    return record.count;
  }

  cleanupFallbackStore() {
    const now = Date.now();
    for (const [key, record] of this.fallbackStore.entries()) {
      if (now > record.resetTime) {
        this.fallbackStore.delete(key);
      }
    }
  }

  async getRemainingRequests(key, limit, windowMs) {
    if (this.redisClient && this.initialized) {
      try {
        const count = await this.redisClient.get(key);
        return Math.max(0, limit - (parseInt(count) || 0));
      } catch (error) {
        console.warn('⚠️ Redis get error, using fallback:', error.message);
        return this.getRemainingRequestsFallback(key, limit);
      }
    } else {
      return this.getRemainingRequestsFallback(key, limit);
    }
  }

  getRemainingRequestsFallback(key, limit) {
    const record = this.fallbackStore.get(key);
    if (!record || Date.now() > record.resetTime) {
      return limit;
    }
    return Math.max(0, limit - record.count);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 */
const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Maximum requests per window
    message = 'Too many requests, please try again later',
    standardHeaders = true, // Include rate limit info in headers
    legacyHeaders = false,
    keyGenerator = (req) => {
      // Use user ID if authenticated, otherwise IP address
      return req.user?.id || req.ip;
    },
    skip = () => false, // Function to skip rate limiting
    onLimitReached = null, // Callback when limit is reached
    store = null // Custom store (optional)
  } = options;

  return async (req, res, next) => {
    try {
      // Initialize rate limiter on first use
      if (!rateLimiter.initialized && !rateLimiter.redisClient) {
        await rateLimiter.initialize();
      }

      // Check if this request should be skipped
      if (skip(req, res)) {
        return next();
      }

      const key = keyGenerator(req);
      const rateLimitKey = `rate_limit:${key}:${req.route?.path || req.path}`;

      // Increment the request count
      const requestCount = await rateLimiter.increment(rateLimitKey, windowMs);
      const remaining = Math.max(0, max - requestCount);
      const resetTime = new Date(Date.now() + windowMs);

      // Add rate limit headers
      if (standardHeaders) {
        res.set({
          'RateLimit-Limit': max.toString(),
          'RateLimit-Remaining': remaining.toString(),
          'RateLimit-Reset': resetTime.toISOString()
        });
      }

      if (legacyHeaders) {
        res.set({
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000).toString()
        });
      }

      // Check if limit exceeded
      if (requestCount > max) {
        // Call callback if provided
        if (onLimitReached) {
          onLimitReached(req, res, options);
        }

        // Log rate limit exceeded
        console.warn(`🚫 Rate limit exceeded for ${key}: ${requestCount}/${max} requests`);

        return res.status(429).json({
          success: false,
          message: typeof message === 'function' ? message(req, res) : message,
          retryAfter: Math.ceil(windowMs / 1000),
          limit: max,
          remaining: 0,
          resetTime: resetTime.toISOString()
        });
      }

      next();

    } catch (error) {
      console.error('❌ Rate limiting error:', error);
      // Don't fail the request due to rate limiting errors
      next();
    }
  };
};

/**
 * Sliding window rate limiter
 */
const slidingWindowRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    keyGenerator = (req) => req.user?.id || req.ip
  } = options;

  return async (req, res, next) => {
    try {
      if (!rateLimiter.initialized && !rateLimiter.redisClient) {
        await rateLimiter.initialize();
      }

      const key = keyGenerator(req);
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const previousWindow = window - 1;

      const currentKey = `sliding:${key}:${window}`;
      const previousKey = `sliding:${key}:${previousWindow}`;

      let currentCount = 0;
      let previousCount = 0;

      if (rateLimiter.redisClient && rateLimiter.initialized) {
        try {
          const pipeline = rateLimiter.redisClient.multi();
          pipeline.incr(currentKey);
          pipeline.expire(currentKey, Math.ceil(windowMs * 2 / 1000));
          pipeline.get(previousKey);
          
          const results = await pipeline.exec();
          currentCount = results[0][1];
          previousCount = parseInt(results[2][1]) || 0;
        } catch (error) {
          console.warn('⚠️ Sliding window rate limit Redis error:', error.message);
          return next(); // Skip rate limiting on Redis errors
        }
      } else {
        // Fallback for sliding window is complex, so just use simple rate limiting
        return rateLimit(options)(req, res, next);
      }

      // Calculate the weighted count based on position in current window
      const percentageInCurrentWindow = (now % windowMs) / windowMs;
      const weightedCount = currentCount + previousCount * (1 - percentageInCurrentWindow);

      if (weightedCount > max) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((windowMs - (now % windowMs)) / 1000)
        });
      }

      next();

    } catch (error) {
      console.error('❌ Sliding window rate limiting error:', error);
      next();
    }
  };
};

/**
 * Progressive rate limiting (increases restriction on repeated violations)
 */
const progressiveRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    multiplier = 2, // Multiply restriction on each violation
    maxMultiplier = 16, // Maximum multiplier
    keyGenerator = (req) => req.user?.id || req.ip
  } = options;

  return async (req, res, next) => {
    try {
      if (!rateLimiter.initialized && !rateLimiter.redisClient) {
        await rateLimiter.initialize();
      }

      const key = keyGenerator(req);
      const violationKey = `progressive_violations:${key}`;
      const requestKey = `progressive_requests:${key}`;

      let violations = 0;
      let requests = 0;

      if (rateLimiter.redisClient && rateLimiter.initialized) {
        try {
          violations = parseInt(await rateLimiter.redisClient.get(violationKey)) || 0;
          requests = await rateLimiter.increment(requestKey, windowMs);
        } catch (error) {
          console.warn('⚠️ Progressive rate limit Redis error:', error.message);
          return next();
        }
      } else {
        return rateLimit(options)(req, res, next);
      }

      // Calculate adjusted limit based on violations
      const penalty = Math.min(Math.pow(multiplier, violations), maxMultiplier);
      const adjustedMax = Math.floor(max / penalty);

      if (requests > adjustedMax) {
        // Increment violation count
        if (rateLimiter.redisClient && rateLimiter.initialized) {
          await rateLimiter.redisClient.setEx(
            violationKey,
            windowMs * 4 / 1000, // Violations last longer than requests
            violations + 1
          );
        }

        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Limit reduced due to ${violations} previous violations.`,
          retryAfter: Math.ceil(windowMs / 1000),
          adjustedLimit: adjustedMax,
          violations: violations + 1
        });
      }

      next();

    } catch (error) {
      console.error('❌ Progressive rate limiting error:', error);
      next();
    }
  };
};

/**
 * API endpoint specific rate limits
 */
const apiEndpointLimits = {
  // Authentication endpoints
  '/api/auth/login': rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later',
    keyGenerator: (req) => req.ip // Use IP for login attempts
  }),

  '/api/auth/register': rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later',
    keyGenerator: (req) => req.ip
  }),

  '/api/auth/forgot-password': rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: 'Too many password reset requests, please try again later',
    keyGenerator: (req) => req.ip
  }),

  // Application endpoints
  '/api/applications': {
    POST: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 application creations per 15 minutes
      message: 'Too many applications created, please try again later'
    }),
    GET: rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      message: 'Too many search requests, please slow down'
    })
  },

  // File upload endpoints
  '/api/files/upload': rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 file uploads per 10 minutes
    message: 'Too many file uploads, please try again later'
  }),

  // Payment endpoints
  '/api/payments': rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 payment operations per 5 minutes
    message: 'Too many payment requests, please try again later'
  }),

  // Admin endpoints (more restrictive)
  '/api/admin': rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 admin operations per minute
    message: 'Admin rate limit exceeded'
  })
};

/**
 * Apply rate limit based on endpoint
 */
const smartRateLimit = (req, res, next) => {
  const path = req.route?.path || req.path;
  const method = req.method;
  
  // Check for endpoint-specific limits
  const endpointLimit = apiEndpointLimits[path];
  
  if (endpointLimit) {
    const limiter = typeof endpointLimit === 'function' 
      ? endpointLimit 
      : endpointLimit[method] || endpointLimit;
      
    if (limiter) {
      return limiter(req, res, next);
    }
  }
  
  // Check for path pattern matches
  for (const [pattern, limiter] of Object.entries(apiEndpointLimits)) {
    if (path.startsWith(pattern)) {
      const appliedLimiter = typeof limiter === 'function' 
        ? limiter 
        : limiter[method] || limiter;
        
      if (appliedLimiter) {
        return appliedLimiter(req, res, next);
      }
    }
  }
  
  // Default rate limit
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Rate limit exceeded'
  })(req, res, next);
};

module.exports = {
  rateLimit,
  slidingWindowRateLimit,
  progressiveRateLimit,
  smartRateLimit,
  apiEndpointLimits,
  rateLimiter
};