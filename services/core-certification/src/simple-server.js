// services/core-certification/src/simple-server.js
/**
 * Simple Express Server for GACP Platform
 * Basic implementation for Docker container
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'core-certification',
    version: '2.0.0'
  });
});

// Ready check
app.get('/ready', (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Alive check
app.get('/alive', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/api/v1/applications', (req, res) => {
  res.json({
    success: true,
    message: 'GACP Application API - Under Development',
    data: [],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/applications', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Application creation endpoint ready',
    data: {
      id: 'test-' + Date.now(),
      status: 'draft'
    },
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    service: 'GACP Core Certification Service',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      ready: '/ready',
      alive: '/alive',
      api: '/api/v1/applications'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GACP Core Certification Service running on port ${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1/applications`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📥 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📥 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;