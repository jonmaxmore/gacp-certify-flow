const express = require('express');
const DocumentManagementService = require('../services/DocumentManagementService');
const roleAuth = require('../middleware/roleAuth');
const logger = require('../services/logger');

const router = express.Router();
const documentService = new DocumentManagementService();

// Get multer configuration from document service
const upload = documentService.getMulterConfig();

// Upload single document
router.post('/upload/:applicationId', 
  roleAuth(['farmer', 'reviewer', 'auditor', 'admin']),
  upload.single('document'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { documentType, description, isPublic } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (!documentType) {
        return res.status(400).json({
          success: false,
          error: 'Document type is required'
        });
      }

      const result = await documentService.uploadDocument(req.file, {
        applicationId,
        documentType,
        uploadedBy: req.user.userId,
        description: description || '',
        isPublic: isPublic === 'true'
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Document upload failed', {
        error: error.message,
        applicationId: req.params.applicationId,
        userId: req.user?.userId
      });

      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Upload multiple documents
router.post('/upload-multiple/:applicationId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'admin']),
  upload.array('documents', 10), // Maximum 10 files
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { documentType, description, isPublic } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      // Add document type to each file if not specified individually
      const filesWithMetadata = req.files.map(file => ({
        ...file,
        documentType: file.documentType || documentType
      }));

      const result = await documentService.uploadMultipleDocuments(filesWithMetadata, {
        applicationId,
        documentType,
        uploadedBy: req.user.userId,
        description: description || '',
        isPublic: isPublic === 'true'
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Multiple document upload failed', {
        error: error.message,
        applicationId: req.params.applicationId,
        userId: req.user?.userId
      });

      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Download document
router.get('/download/:documentId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const result = await documentService.downloadDocument(
        documentId,
        req.user.userId,
        req.user.role
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(result.filePath);
      
      fileStream.on('error', (error) => {
        logger.error('File streaming error', {
          documentId,
          error: error.message
        });
        res.status(500).json({
          success: false,
          error: 'File streaming failed'
        });
      });

      fileStream.pipe(res);

    } catch (error) {
      logger.error('Document download failed', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.userId
      });

      res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get document information
router.get('/info/:documentId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const documentInfo = await documentService.getDocumentInfo(
        documentId,
        req.user.userId,
        req.user.role
      );

      if (!documentInfo) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      res.json({
        success: true,
        document: documentInfo
      });

    } catch (error) {
      logger.error('Get document info failed', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.userId
      });

      res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// List documents for application
router.get('/list/:applicationId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { documentType, isActive } = req.query;

      const filters = {};
      if (documentType) filters.documentType = documentType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await documentService.listDocuments(
        applicationId,
        req.user.userId,
        req.user.role,
        filters
      );

      res.json(result);

    } catch (error) {
      logger.error('List documents failed', {
        error: error.message,
        applicationId: req.params.applicationId,
        userId: req.user?.userId
      });

      res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Delete document (soft delete)
router.delete('/:documentId',
  roleAuth(['farmer', 'admin']),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;

      const result = await documentService.deleteDocument(
        documentId,
        req.user.userId,
        req.user.role,
        reason || 'User requested deletion'
      );

      res.json(result);

    } catch (error) {
      logger.error('Document deletion failed', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.userId
      });

      res.status(error.message.includes('Permission denied') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Validate required documents for application
router.get('/validate/:applicationId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'admin']),
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      const validation = await documentService.validateRequiredDocuments(applicationId);

      res.json({
        success: true,
        validation
      });

    } catch (error) {
      logger.error('Document validation failed', {
        error: error.message,
        applicationId: req.params.applicationId,
        userId: req.user?.userId
      });

      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get document requirements (for UI display)
router.get('/requirements',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const requirements = documentService.getDocumentRequirements();

      res.json({
        success: true,
        requirements
      });

    } catch (error) {
      logger.error('Get document requirements failed', {
        error: error.message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Preview document (for images/PDFs)
router.get('/preview/:documentId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const result = await documentService.downloadDocument(
        documentId,
        req.user.userId,
        req.user.role
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check if document is previewable
      const previewableMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
      ];

      if (!previewableMimeTypes.includes(result.mimeType)) {
        return res.status(400).json({
          success: false,
          error: 'Document type not previewable'
        });
      }

      // Set headers for inline display
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(result.filePath);
      
      fileStream.on('error', (error) => {
        logger.error('File preview streaming error', {
          documentId,
          error: error.message
        });
        res.status(500).json({
          success: false,
          error: 'File preview failed'
        });
      });

      fileStream.pipe(res);

    } catch (error) {
      logger.error('Document preview failed', {
        error: error.message,
        documentId: req.params.documentId,
        userId: req.user?.userId
      });

      res.status(error.message.includes('Access denied') ? 403 : 404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get document statistics for application
router.get('/stats/:applicationId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'admin']),
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      const documentsResult = await documentService.listDocuments(
        applicationId,
        req.user.userId,
        req.user.role
      );

      const validation = await documentService.validateRequiredDocuments(applicationId);

      const stats = {
        total: documentsResult.total,
        summary: documentsResult.summary,
        validation: validation.summary,
        completeness: {
          percentage: Math.round((validation.summary.completed / validation.summary.totalRequired) * 100),
          missingCount: validation.summary.missing,
          invalidCount: validation.summary.invalid
        },
        byType: documentsResult.summary.byType
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Document statistics failed', {
        error: error.message,
        applicationId: req.params.applicationId,
        userId: req.user?.userId
      });

      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
    }

    return res.status(400).json({
      success: false,
      error: message,
      details: error.message
    });
  }

  next(error);
});

module.exports = router;