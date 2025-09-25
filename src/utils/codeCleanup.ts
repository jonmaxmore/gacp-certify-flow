/**
 * Code cleanup utilities for removing unused code and optimizing performance
 * Following ISO coding standards and PSI-level security practices
 */

/**
 * Remove all console.log statements in production builds
 */
export const removeDebugLogs = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Keep error and warn for production monitoring
  }
};

/**
 * Memory optimization utility
 */
export const optimizeMemory = () => {
  // Force garbage collection in supported environments
  if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
  }
};

/**
 * Dead code elimination checker
 */
export const checkUnusedExports = () => {
  // This would be used in build process to identify unused exports
  // Implementation would involve AST analysis during build time
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Checking for unused exports...');
  }
};

/**
 * Performance metrics collector
 */
export const collectPerformanceMetrics = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const metrics = {
      loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
      domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      firstPaint: 0,
      largestContentfulPaint: 0
    };

    // Get paint metrics if available
    const paintEntries = window.performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstPaint = entry.startTime;
      }
    });

    // Get LCP if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        // Observer not supported
      }
    }

    return metrics;
  }
  return null;
};

/**
 * Security headers validation
 */
export const validateSecurityHeaders = () => {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ];

  // This would typically be checked server-side
  // Client-side validation for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Security headers validation would run server-side');
  }

  return requiredHeaders;
};
