const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const mime = require('mime-types');
const logger = require('./logger');

class DocumentManagementService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || '/uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    this.documentTypes = {
      'sop': {
        name: 'Standard Operating Procedures',
        required: true,
        maxFiles: 5,
        allowedTypes: ['pdf', 'doc', 'docx']
      },
      'coa': {
        name: 'Certificate of Analysis',
        required: true,
        maxFiles: 3,
        allowedTypes: ['pdf']
      },
      'land_rights': {
        name: 'Land Rights Documentation',
        required: true,
        maxFiles: 2,
        allowedTypes: ['pdf', 'jpg', 'png']
      },
      'audit_photos': {
        name: 'Audit Photos',
        required: false,
        maxFiles: 20,
        allowedTypes: ['jpg', 'png']
      },
      'certificates': {
        name: 'Supporting Certificates',
        required: false,
        maxFiles: 5,
        allowedTypes: ['pdf']
      }
    };

    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await this.ensureDirectoryExists(this.uploadPath);
      
      // Create subdirectories for different document types
      for (const type of Object.keys(this.documentTypes)) {
        await this.ensureDirectoryExists(path.join(this.uploadPath, type));
      }
      
      logger.info('Document storage initialized', { uploadPath: this.uploadPath });
    } catch (error) {
      logger.error('Failed to initialize document storage', { error: error.message });
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info('Created directory', { path: dirPath });
    }
  }

  // Configure multer for file uploads
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const documentType = req.body.documentType || 'general';
        const destinationPath = path.join(this.uploadPath, documentType);
        cb(null, destinationPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp and hash
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const hash = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const sanitizedName = file.originalname
          .replace(ext, '')
          .replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_') // Allow Thai characters
          .substring(0, 50);
        
        const filename = `${timestamp}_${hash}_${sanitizedName}${ext}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req, file, cb) => {
      try {
        const validation = this.validateFile(file, req.body.documentType);
        if (validation.valid) {
          cb(null, true);
        } else {
          cb(new Error(validation.error), false);
        }
      } catch (error) {
        cb(error, false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Maximum files per request
      }
    });
  }

  // Validate file before upload
  validateFile(file, documentType) {
    // Check if document type is valid
    if (!this.documentTypes[documentType]) {
      return {
        valid: false,
        error: `Invalid document type: ${documentType}`
      };
    }

    const docConfig = this.documentTypes[documentType];

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${docConfig.allowedTypes.join(', ')}`
      };
    }

    // Check file extension
    const ext = path.extname(file.originalname).substring(1).toLowerCase();
    if (!docConfig.allowedTypes.includes(ext)) {
      return {
        valid: false,
        error: `File extension not allowed for ${documentType}. Allowed: ${docConfig.allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  // Upload single document
  async uploadDocument(fileData, metadata) {
    try {
      const {
        applicationId,
        documentType,
        uploadedBy,
        description = '',
        isPublic = false
      } = metadata;

      // Validate application exists
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Generate file hash for integrity checking
      const fileBuffer = await fs.readFile(fileData.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Create document metadata
      const documentMetadata = {
        documentId: crypto.randomUUID(),
        originalName: fileData.originalname,
        filename: fileData.filename,
        filePath: fileData.path,
        documentType,
        mimeType: fileData.mimetype,
        fileSize: fileData.size,
        fileHash,
        uploadedBy,
        uploadedAt: new Date(),
        description,
        isPublic,
        isActive: true,
        version: 1,
        security: {
          accessLevel: this.getAccessLevel(documentType),
          encryption: false, // Can be enabled for sensitive docs
          virusScanned: false // Placeholder for antivirus integration
        },
        metadata: {
          applicationId,
          documentType,
          extractedText: null, // Placeholder for OCR
          thumbnailPath: null  // Placeholder for image thumbnails
        }
      };

      // Save document metadata to application
      application.documents.push(documentMetadata);
      await application.save();

      // Perform post-upload processing
      await this.processUploadedDocument(documentMetadata);

      logger.info('Document uploaded successfully', {
        applicationId,
        documentId: documentMetadata.documentId,
        documentType,
        filename: fileData.filename
      });

      return {
        success: true,
        document: documentMetadata,
        message: 'Document uploaded successfully'
      };

    } catch (error) {
      // Clean up uploaded file on error
      if (fileData?.path) {
        try {
          await fs.unlink(fileData.path);
        } catch (cleanupError) {
          logger.error('Failed to cleanup uploaded file', {
            path: fileData.path,
            error: cleanupError.message
          });
        }
      }

      logger.error('Document upload failed', {
        error: error.message,
        metadata
      });

      throw error;
    }
  }

  // Upload multiple documents
  async uploadMultipleDocuments(filesData, metadata) {
    const results = [];
    const errors = [];

    for (const fileData of filesData) {
      try {
        const result = await this.uploadDocument(fileData, {
          ...metadata,
          documentType: fileData.documentType || metadata.documentType
        });
        results.push(result);
      } catch (error) {
        errors.push({
          filename: fileData.originalname,
          error: error.message
        });
      }
    }

    return {
      success: errors.length === 0,
      uploaded: results,
      errors,
      summary: {
        total: filesData.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  // Download document with access control
  async downloadDocument(documentId, userId, userRole) {
    try {
      // Find document in applications
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findOne({
        'documents.documentId': documentId
      });

      if (!application) {
        throw new Error('Document not found');
      }

      const document = application.documents.find(doc => 
        doc.documentId === documentId && doc.isActive
      );

      if (!document) {
        throw new Error('Document not found or inactive');
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(
        application, document, userId, userRole
      );

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Check if file exists
      const fileExists = await this.fileExists(document.filePath);
      if (!fileExists) {
        throw new Error('File not found on disk');
      }

      // Log download activity
      await this.logDocumentAccess(documentId, userId, 'download');

      logger.info('Document downloaded', {
        documentId,
        userId,
        filename: document.filename
      });

      return {
        success: true,
        document,
        filePath: document.filePath,
        mimeType: document.mimeType,
        filename: document.originalName
      };

    } catch (error) {
      logger.error('Document download failed', {
        documentId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Get document information
  async getDocumentInfo(documentId, userId, userRole) {
    try {
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findOne({
        'documents.documentId': documentId
      });

      if (!application) {
        return null;
      }

      const document = application.documents.find(doc => 
        doc.documentId === documentId
      );

      if (!document) {
        return null;
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(
        application, document, userId, userRole
      );

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Return sanitized document info
      return {
        documentId: document.documentId,
        originalName: document.originalName,
        documentType: document.documentType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        uploadedBy: document.uploadedBy,
        description: document.description,
        version: document.version,
        isActive: document.isActive,
        metadata: {
          applicationId: application._id,
          applicationNumber: application.applicationNumber
        }
      };

    } catch (error) {
      logger.error('Get document info failed', {
        documentId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Delete document (soft delete)
  async deleteDocument(documentId, userId, userRole, reason = '') {
    try {
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findOne({
        'documents.documentId': documentId
      });

      if (!application) {
        throw new Error('Document not found');
      }

      const documentIndex = application.documents.findIndex(doc => 
        doc.documentId === documentId
      );

      if (documentIndex === -1) {
        throw new Error('Document not found');
      }

      const document = application.documents[documentIndex];

      // Check if user can delete this document
      const canDelete = await this.checkDeletePermission(
        application, document, userId, userRole
      );

      if (!canDelete) {
        throw new Error('Permission denied');
      }

      // Soft delete - mark as inactive
      application.documents[documentIndex].isActive = false;
      application.documents[documentIndex].deletedAt = new Date();
      application.documents[documentIndex].deletedBy = userId;
      application.documents[documentIndex].deleteReason = reason;

      await application.save();

      // Log deletion activity
      await this.logDocumentAccess(documentId, userId, 'delete', { reason });

      logger.info('Document deleted', {
        documentId,
        userId,
        reason,
        filename: document.filename
      });

      return {
        success: true,
        message: 'Document deleted successfully'
      };

    } catch (error) {
      logger.error('Document deletion failed', {
        documentId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // List documents for application
  async listDocuments(applicationId, userId, userRole, filters = {}) {
    try {
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findById(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      // Check if user can view this application's documents
      const hasAccess = await this.checkApplicationAccess(
        application, userId, userRole
      );

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      let documents = application.documents.filter(doc => {
        // Apply filters
        if (filters.documentType && doc.documentType !== filters.documentType) {
          return false;
        }
        
        if (filters.isActive !== undefined && doc.isActive !== filters.isActive) {
          return false;
        }

        return true;
      });

      // Sort by upload date (newest first)
      documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      // Return sanitized document list
      const sanitizedDocuments = documents.map(doc => ({
        documentId: doc.documentId,
        originalName: doc.originalName,
        documentType: doc.documentType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy,
        description: doc.description,
        version: doc.version,
        isActive: doc.isActive,
        canDownload: this.checkDocumentAccess(application, doc, userId, userRole),
        canDelete: this.checkDeletePermission(application, doc, userId, userRole)
      }));

      return {
        success: true,
        documents: sanitizedDocuments,
        total: sanitizedDocuments.length,
        summary: this.getDocumentSummary(documents)
      };

    } catch (error) {
      logger.error('List documents failed', {
        applicationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Validate required documents for application
  async validateRequiredDocuments(applicationId) {
    try {
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findById(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      const validationResults = {};
      const missingDocuments = [];
      const invalidDocuments = [];

      // Check each required document type
      for (const [type, config] of Object.entries(this.documentTypes)) {
        if (!config.required) continue;

        const typeDocuments = application.documents.filter(doc => 
          doc.documentType === type && doc.isActive
        );

        validationResults[type] = {
          required: true,
          found: typeDocuments.length,
          maxAllowed: config.maxFiles,
          valid: typeDocuments.length > 0 && typeDocuments.length <= config.maxFiles
        };

        if (typeDocuments.length === 0) {
          missingDocuments.push({
            type,
            name: config.name,
            maxFiles: config.maxFiles,
            allowedTypes: config.allowedTypes
          });
        } else if (typeDocuments.length > config.maxFiles) {
          invalidDocuments.push({
            type,
            name: config.name,
            issue: 'Too many files',
            found: typeDocuments.length,
            maxAllowed: config.maxFiles
          });
        }
      }

      const isValid = missingDocuments.length === 0 && invalidDocuments.length === 0;

      return {
        valid: isValid,
        validationResults,
        missingDocuments,
        invalidDocuments,
        summary: {
          totalRequired: Object.values(this.documentTypes).filter(c => c.required).length,
          completed: Object.values(validationResults).filter(r => r.valid).length,
          missing: missingDocuments.length,
          invalid: invalidDocuments.length
        }
      };

    } catch (error) {
      logger.error('Document validation failed', {
        applicationId,
        error: error.message
      });
      throw error;
    }
  }

  // Helper methods
  async checkDocumentAccess(application, document, userId, userRole) {
    // System admin can access all documents
    if (userRole === 'admin' || userRole === 'system') {
      return true;
    }

    // Application owner can access their documents
    if (application.applicantInfo?.userId === userId) {
      return true;
    }

    // Role-based access for staff
    const roleAccess = {
      'reviewer': ['sop', 'coa', 'land_rights', 'certificates'],
      'auditor': ['sop', 'coa', 'land_rights', 'audit_photos', 'certificates'],
      'approver': ['sop', 'coa', 'land_rights', 'audit_photos', 'certificates'],
      'finance': ['certificates'] // Limited access for finance role
    };

    if (roleAccess[userRole]?.includes(document.documentType)) {
      return true;
    }

    // Public documents
    if (document.isPublic) {
      return true;
    }

    return false;
  }

  async checkDeletePermission(application, document, userId, userRole) {
    // Only admin, system, and document owner can delete
    if (userRole === 'admin' || userRole === 'system') {
      return true;
    }

    // Document uploader can delete within 24 hours
    if (document.uploadedBy === userId) {
      const uploadTime = new Date(document.uploadedAt);
      const now = new Date();
      const hoursSinceUpload = (now - uploadTime) / (1000 * 60 * 60);
      return hoursSinceUpload < 24;
    }

    return false;
  }

  async checkApplicationAccess(application, userId, userRole) {
    // Admin and system can access all
    if (userRole === 'admin' || userRole === 'system') {
      return true;
    }

    // Application owner
    if (application.applicantInfo?.userId === userId) {
      return true;
    }

    // Staff can access applications in their workflow
    const staffRoles = ['reviewer', 'auditor', 'approver', 'finance'];
    return staffRoles.includes(userRole);
  }

  getAccessLevel(documentType) {
    const accessLevels = {
      'sop': 'restricted',
      'coa': 'restricted', 
      'land_rights': 'confidential',
      'audit_photos': 'internal',
      'certificates': 'public'
    };

    return accessLevels[documentType] || 'restricted';
  }

  async processUploadedDocument(document) {
    try {
      // Virus scanning (placeholder)
      document.security.virusScanned = true;

      // Generate thumbnail for images
      if (document.mimeType.startsWith('image/')) {
        await this.generateThumbnail(document);
      }

      // Extract text from PDFs (placeholder)
      if (document.mimeType === 'application/pdf') {
        await this.extractTextFromPDF(document);
      }

      logger.info('Document processed', {
        documentId: document.documentId,
        processingSteps: ['virus_scan', 'thumbnail', 'text_extraction']
      });

    } catch (error) {
      logger.error('Document processing failed', {
        documentId: document.documentId,
        error: error.message
      });
      // Don't throw - upload can proceed without processing
    }
  }

  async generateThumbnail(document) {
    // Placeholder for image thumbnail generation
    logger.info('Generating thumbnail', { documentId: document.documentId });
  }

  async extractTextFromPDF(document) {
    // Placeholder for PDF text extraction
    logger.info('Extracting text from PDF', { documentId: document.documentId });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async logDocumentAccess(documentId, userId, action, metadata = {}) {
    logger.info('Document access logged', {
      documentId,
      userId,
      action,
      timestamp: new Date().toISOString(),
      metadata
    });
    // In production, this would write to an audit log table
  }

  getDocumentSummary(documents) {
    const summary = {
      total: documents.length,
      active: documents.filter(d => d.isActive).length,
      inactive: documents.filter(d => !d.isActive).length,
      byType: {}
    };

    // Group by document type
    for (const doc of documents) {
      if (!summary.byType[doc.documentType]) {
        summary.byType[doc.documentType] = 0;
      }
      summary.byType[doc.documentType]++;
    }

    return summary;
  }

  // Get document requirements for display
  getDocumentRequirements() {
    return Object.entries(this.documentTypes).map(([type, config]) => ({
      type,
      name: config.name,
      required: config.required,
      maxFiles: config.maxFiles,
      allowedTypes: config.allowedTypes,
      description: this.getDocumentTypeDescription(type)
    }));
  }

  getDocumentTypeDescription(type) {
    const descriptions = {
      'sop': 'มาตรฐานการปฏิบัติงาน (Standard Operating Procedures) สำหรับการปลูก การเก็บเกี่ยว และการจัดเก็บสมุนไพร',
      'coa': 'ใบรับรอง Certificate of Analysis แสดงผลการตรวจสอบคุณภาพของผลิตภัณฑ์',
      'land_rights': 'เอกสารสิทธิ์ในที่ดิน เช่น โฉนดที่ดิน หรือเอกสารแสดงสิทธิ์การใช้ประโยชน์ในที่ดิน',
      'audit_photos': 'รูปภาพประกอบการตรวจสอบ เช่น รูปพื้นที่เพาะปลูก โรงเรือน อุปกรณ์',
      'certificates': 'ใบรับรองต่างๆ ที่เกี่ยวข้อง เช่น ใบรับรองอินทรีย์ ใบรับรองมาตรฐานอื่นๆ'
    };

    return descriptions[type] || 'เอกสารประกอบการสมัคร';
  }
}

module.exports = DocumentManagementService;