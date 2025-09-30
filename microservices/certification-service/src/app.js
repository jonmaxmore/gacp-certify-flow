const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const applicationRoutes = require('./routes/applications');
const certificateRoutes = require('./routes/certificates');
const documentRoutes = require('./routes/documents');
const { errorHandler } = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const logger = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gacp_certification')
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded documents
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/certificates', authMiddleware, certificateRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'certification-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    service: 'certification-service'
  });
});

app.listen(PORT, () => {
  logger.info(`Certification Service running on port ${PORT}`);
});

module.exports = app;