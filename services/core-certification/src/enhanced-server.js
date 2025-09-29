// services/core-certification/src/enhanced-server.js
/**
 * Enhanced Server for GACP Platform with Database Support
 */

require('dotenv').config();

// Import services
const GACPAdvancedService = require('./advanced-hybrid-service');

// Choose service mode
const USE_ADVANCED_SERVICE = process.env.USE_ADVANCED_SERVICE === 'true';

if (USE_ADVANCED_SERVICE) {
  console.log('🚀 Starting Advanced Hybrid Service...');
  global.gacpService = new GACPAdvancedService();
  global.gacpService.start(process.env.PORT || 3001);
} else {
  console.log('🚀 Starting Simple Express Service...');
  
  // Simple Express Server (fallback)
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'core-certification',
      version: '2.0.0'
    });
  });
  
  // Basic API endpoint
  app.get('/api/v1/applications', (req, res) => {
    res.json({
      success: true,
      message: 'GACP Application API - Under Development',
      data: [],
      timestamp: new Date().toISOString()
    });
  });
  
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log('🚀 GACP Core Certification Service running on port', port);
    console.log('📋 Health Check: http://localhost:' + port + '/health');
    console.log('🔗 API Base: http://localhost:' + port + '/api/v1/applications');
  });
}