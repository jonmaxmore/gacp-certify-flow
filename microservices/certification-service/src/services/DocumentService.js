const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const logger = require('./logger');

/**
 * GACP Document Management Service
 * Handles file uploads, downloads, version control, and validation
 */

class GACPDocumentService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || '/app/uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    this.virusScanEnabled = process.env.VIRUS_SCAN_ENABLED === 'true';
    
    this.setupUploadDirectory();
    this.setupMulter();
    
    // Document type definitions
    this.DOCUMENT_TYPES = this.defineDocumentTypes();
    
    // Validation rules
    this.VALIDATION_RULES = this.defineValidationRules();
  }

  /**
   * Setup upload directory
   */
  async setupUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch (error) {
      await fs.mkdir(this.uploadPath, { recursive: true });
      logger.info('Upload directory created', { path: this.uploadPath });
    }
  }

  /**
   * Setup multer for file uploads
   */
  setupMulter() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const applicationId = req.params.applicationId || req.body.applicationId;
        const uploadDir = path.join(this.uploadPath, applicationId);
        
        try {
          await fs.access(uploadDir);
        } catch (error) {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
      },
      
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname);
        const sanitizedName = this.sanitizeFilename(path.basename(file.originalname, extension));
        
        const filename = `${sanitizedName}_${timestamp}_${randomString}${extension}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      
      if (this.allowedExtensions.includes(extension)) {
        cb(null, true);
      } else {
        cb(new Error(`ไม่รองรับไฟล์ประเภท ${extension}. กรุณาใช้ไฟล์: ${this.allowedExtensions.join(', ')}`), false);
      }
    };

    this.upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  /**
   * Define document types and requirements
   */
  defineDocumentTypes() {
    return {
      SOP: {
        code: 'sop',
        name: 'Standard Operating Procedures (SOP)',
        namesTH: 'มาตรฐานการปฏิบัติงาน (SOP)',
        required: true,
        maxFiles: 5,
        allowedFormats: ['.pdf', '.doc', '.docx'],
        maxSizeMB: 5,
        description: 'เอกสารมาตรฐานการปฏิบัติงานในการผลิตพืชสมุนไพร',
        validationCriteria: [
          'ต้องมีเนื้อหาครบถ้วนตามมาตรฐาน GACP',
          'ระบุขั้นตอนการปฏิบัติงานอย่างชัดเจน',
          'มีลายเซ็นผู้รับผิดชอบและวันที่'
        ]
      },
      
      COA: {
        code: 'coa',
        name: 'Certificate of Analysis (COA)',
        namesTH: 'ใบรับรองการวิเคราะห์ (COA)',
        required: true,
        maxFiles: 3,
        allowedFormats: ['.pdf'],
        maxSizeMB: 3,
        description: 'ใบรับรองการวิเคราะห์คุณภาพผลิตภัณฑ์',
        validationCriteria: [
          'ออกโดยห้องปฏิบัติการที่ได้รับการรับรอง',
          'ระบุวิธีการทดสอบและผลการวิเคราะห์',
          'ไม่เก่ากว่า 6 เดือน'
        ]
      },
      
      LAND_RIGHTS: {
        code: 'land_rights',
        name: 'Land Rights Document',
        namesTH: 'เอกสารสิทธิ์ในที่ดิน',
        required: true,
        maxFiles: 10,
        allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSizeMB: 2,
        description: 'เอกสารแสดงสิทธิ์ในการใช้ที่ดินเพื่อการเกษตร',
        validationCriteria: [
          'เป็นเอกสารที่ถูกต้องตามกฎหมาย',
          'ระบุพื้นที่และที่ตั้งชัดเจน',
          'ครอบคลุมพื้นที่ปลูกพืชสมุนไพรทั้งหมด'
        ]
      },
      
      LAYOUT_PLAN: {
        code: 'layout_plan',
        name: 'Farm Layout Plan',
        namesTH: 'แผนผังแปลงเกษตร',
        required: true,
        maxFiles: 3,
        allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSizeMB: 5,
        description: 'แผนผังการจัดวางพื้นที่ปลูกและสิ่งปลูกสร้าง',
        validationCriteria: [
          'แสดงพื้นที่ปลูกพืชสมุนไพรชัดเจน',
          'ระบุสิ่งปลูกสร้างและระบบสาธารณูปโภค',
          'มีขนาดและระยะห่างเหมาะสม'
        ]
      },
      
      WATER_ANALYSIS: {
        code: 'water_analysis',
        name: 'Water Quality Analysis',
        namesTH: 'ผลการวิเคราะห์คุณภาพน้ำ',
        required: false,
        maxFiles: 2,
        allowedFormats: ['.pdf'],
        maxSizeMB: 2,
        description: 'ผลการวิเคราะห์คุณภาพน้ำที่ใช้ในการปลูกพืช',
        validationCriteria: [
          'วิเคราะห์โดยห้องปฏิบัติการที่เชื่อถือได้',
          'ครอบคลุมพารามิเตอร์ที่สำคัญ',
          'ผลการวิเคราะห์อยู่ในเกณฑ์มาตรฐาน'
        ]
      },
      
      PESTICIDE_RECORD: {
        code: 'pesticide_record',
        name: 'Pesticide Usage Record',
        namesTH: 'บันทึกการใช้สารเคมี',
        required: false,
        maxFiles: 5,
        allowedFormats: ['.pdf', '.jpg', '.jpeg'],
        maxSizeMB: 3,
        description: 'บันทึกการใช้สารเคมีป้องกันกำจัดศัตรูพืช',
        validationCriteria: [
          'บันทึกครบถ้วนทุกครั้งที่ใช้',
          'ระบุชื่อสาร ปริมาณ และวันที่ใช้',
          'ใช้สารที่ได้รับอนุญาตเท่านั้น'
        ]
      },
      
      TRAINING_CERTIFICATE: {
        code: 'training_certificate',
        name: 'Training Certificate',
        namesTH: 'ใบรับรองการฝึกอบรม',
        required: false,
        maxFiles: 3,
        allowedFormats: ['.pdf', '.jpg', '.jpeg'],
        maxSizeMB: 2,
        description: 'ใบรับรองการฝึกอบรมด้าน GACP',
        validationCriteria: [
          'ออกโดยหน่วยงานที่ได้รับการรับรอง',
          'เนื้อหาเกี่ยวข้องกับมาตรฐาน GACP',
          'ยังไม่หมดอายุ'
        ]
      }
    };
  }

  /**
   * Define validation rules
   */
  defineValidationRules() {
    return {
      FILE_NAMING: {
        pattern: /^[a-zA-Z0-9_\-.\u0E00-\u0E7F\s]+$/,
        maxLength: 100,
        forbiddenChars: ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
      },
      
      SECURITY: {
        maxFiles: 20,
        scanTimeout: 30000, // 30 seconds
        quarantinePath: '/app/quarantine'
      },
      
      VERSION_CONTROL: {
        maxVersions: 10,
        autoCleanupDays: 90
      }
    };
  }

  /**
   * Upload document handler
   */
  uploadDocument(documentType) {
    return async (req, res, next) => {
      try {
        const docType = this.DOCUMENT_TYPES[documentType.toUpperCase()];
        if (!docType) {
          return res.status(400).json({
            success: false,
            message: `ไม่รองรับประเภทเอกสาร: ${documentType}`
          });
        }

        // Create multer middleware for this document type
        const uploadMiddleware = this.upload.array('files', docType.maxFiles);
        
        uploadMiddleware(req, res, async (err) => {
          if (err) {
            return res.status(400).json({
              success: false,
              message: this.getUploadErrorMessage(err)
            });
          }

          const applicationId = req.params.applicationId;
          const files = req.files;

          if (!files || files.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
          }

          // Validate files
          const validationResult = await this.validateFiles(files, docType);
          if (!validationResult.valid) {
            // Clean up uploaded files
            await this.cleanupFiles(files);
            
            return res.status(400).json({
              success: false,
              message: 'การตรวจสอบไฟล์ไม่ผ่าน',
              errors: validationResult.errors
            });
          }

          // Process files
          const processedFiles = [];
          for (const file of files) {
            try {
              const processedFile = await this.processFile(file, documentType, applicationId);
              processedFiles.push(processedFile);
            } catch (error) {
              logger.error('Error processing file', {
                filename: file.filename,
                error: error.message
              });
              
              // Clean up this file
              await this.cleanupFile(file.path);
            }
          }

          res.json({
            success: true,
            message: `อัปโหลดไฟล์สำเร็จ ${processedFiles.length} ไฟล์`,
            files: processedFiles,
            documentType: {
              code: docType.code,
              name: docType.namesTH
            }
          });

        });

      } catch (error) {
        logger.error('Upload document error', {
          documentType,
          error: error.message
        });
        
        res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        });
      }
    };
  }

  /**
   * Validate uploaded files
   */
  async validateFiles(files, docType) {
    const errors = [];
    
    // Check file count
    if (files.length > docType.maxFiles) {
      errors.push(`จำนวนไฟล์เกินกำหนด (สูงสุด ${docType.maxFiles} ไฟล์)`);
    }

    for (const file of files) {
      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      if (!docType.allowedFormats.includes(extension)) {
        errors.push(`ไฟล์ ${file.originalname}: ไม่รองรับไฟล์ประเภท ${extension}`);
      }

      // Check file size
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > docType.maxSizeMB) {
        errors.push(`ไฟล์ ${file.originalname}: ขนาดไฟล์เกิน ${docType.maxSizeMB} MB`);
      }

      // Check filename
      if (!this.VALIDATION_RULES.FILE_NAMING.pattern.test(file.originalname)) {
        errors.push(`ไฟล์ ${file.originalname}: ชื่อไฟล์มีอักขระที่ไม่อนุญาต`);
      }

      // Virus scan (if enabled)
      if (this.virusScanEnabled) {
        const scanResult = await this.scanFile(file.path);
        if (!scanResult.clean) {
          errors.push(`ไฟล์ ${file.originalname}: ตรวจพบไฟล์ที่ไม่ปลอดภัย`);
        }
      }

      // Content validation
      const contentValidation = await this.validateFileContent(file, docType);
      if (!contentValidation.valid) {
        errors.push(`ไฟล์ ${file.originalname}: ${contentValidation.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Process uploaded file
   */
  async processFile(file, documentType, applicationId) {
    try {
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        documentType: documentType.toLowerCase(),
        applicationId,
        uploadedAt: new Date(),
        version: 1,
        isActive: true
      };

      // Generate file hash for duplicate detection
      fileInfo.hash = await this.calculateFileHash(file.path);

      // Generate thumbnail for images
      if (this.isImageFile(file.mimetype)) {
        fileInfo.thumbnailPath = await this.generateThumbnail(file.path);
      }

      // Extract metadata
      fileInfo.metadata = await this.extractMetadata(file.path, file.mimetype);

      // Store file info in database (mock)
      await this.storeFileInfo(fileInfo);

      logger.info('File processed successfully', {
        filename: file.filename,
        applicationId,
        documentType
      });

      return {
        id: fileInfo.hash,
        originalName: fileInfo.originalName,
        filename: fileInfo.filename,
        size: fileInfo.size,
        documentType: fileInfo.documentType,
        uploadedAt: fileInfo.uploadedAt,
        downloadUrl: `/api/documents/download/${applicationId}/${fileInfo.filename}`,
        thumbnailUrl: fileInfo.thumbnailPath ? `/api/documents/thumbnail/${applicationId}/${path.basename(fileInfo.thumbnailPath)}` : null
      };

    } catch (error) {
      logger.error('Error processing file', {
        filename: file.filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Download document
   */
  async downloadDocument(req, res) {
    try {
      const { applicationId, filename } = req.params;
      const filePath = path.join(this.uploadPath, applicationId, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบไฟล์ที่ต้องการ'
        });
      }

      // Get file info
      const fileInfo = await this.getFileInfo(applicationId, filename);
      if (!fileInfo || !fileInfo.isActive) {
        return res.status(404).json({
          success: false,
          message: 'ไฟล์ไม่พร้อมใช้งาน'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
      res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');

      // Stream file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);

      // Log download
      logger.info('File downloaded', {
        applicationId,
        filename,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

    } catch (error) {
      logger.error('Download error', {
        applicationId: req.params.applicationId,
        filename: req.params.filename,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์'
      });
    }
  }

  /**
   * Get document list for application
   */
  async getApplicationDocuments(req, res) {
    try {
      const { applicationId } = req.params;
      const { documentType, includeInactive } = req.query;

      const documents = await this.getDocumentList(applicationId, {
        documentType,
        includeInactive: includeInactive === 'true'
      });

      // Group by document type
      const groupedDocuments = {};
      for (const doc of documents) {
        if (!groupedDocuments[doc.documentType]) {
          groupedDocuments[doc.documentType] = {
            type: this.DOCUMENT_TYPES[doc.documentType.toUpperCase()],
            files: []
          };
        }
        groupedDocuments[doc.documentType].files.push(doc);
      }

      // Check completeness
      const completeness = this.checkDocumentCompleteness(groupedDocuments);

      res.json({
        success: true,
        documents: groupedDocuments,
        completeness,
        summary: {
          totalFiles: documents.length,
          totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
          lastUpdated: documents.length > 0 ? Math.max(...documents.map(doc => new Date(doc.uploadedAt))) : null
        }
      });

    } catch (error) {
      logger.error('Error getting application documents', {
        applicationId: req.params.applicationId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร'
      });
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req, res) {
    try {
      const { applicationId, filename } = req.params;
      
      // Soft delete by marking as inactive
      const fileInfo = await this.getFileInfo(applicationId, filename);
      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบไฟล์ที่ต้องการลบ'
        });
      }

      await this.markFileInactive(applicationId, filename);

      res.json({
        success: true,
        message: 'ลบไฟล์เรียบร้อยแล้ว'
      });

      logger.info('File deleted', {
        applicationId,
        filename,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

    } catch (error) {
      logger.error('Delete error', {
        applicationId: req.params.applicationId,
        filename: req.params.filename,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบไฟล์'
      });
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(filePath) {
    try {
      const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
      
      await sharp(filePath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return thumbnailPath;

    } catch (error) {
      logger.error('Error generating thumbnail', {
        filePath,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Calculate file hash
   */
  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      logger.error('Error calculating file hash', {
        filePath,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Extract file metadata
   */
  async extractMetadata(filePath, mimeType) {
    try {
      const stats = await fs.stat(filePath);
      const metadata = {
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };

      // Extract additional metadata based on file type
      if (mimeType.startsWith('image/')) {
        try {
          const imageMetadata = await sharp(filePath).metadata();
          metadata.dimensions = {
            width: imageMetadata.width,
            height: imageMetadata.height
          };
          metadata.format = imageMetadata.format;
        } catch (error) {
          // Ignore metadata extraction errors
        }
      }

      return metadata;

    } catch (error) {
      logger.error('Error extracting metadata', {
        filePath,
        error: error.message
      });
      return {};
    }
  }

  /**
   * Validate file content
   */
  async validateFileContent(file, docType) {
    try {
      // Basic file validation
      if (file.size === 0) {
        return {
          valid: false,
          message: 'ไฟล์ว่างเปล่า'
        };
      }

      // PDF specific validation
      if (path.extname(file.originalname).toLowerCase() === '.pdf') {
        const pdfValidation = await this.validatePDF(file.path);
        if (!pdfValidation.valid) {
          return pdfValidation;
        }
      }

      // Image specific validation
      if (this.isImageFile(file.mimetype)) {
        const imageValidation = await this.validateImage(file.path);
        if (!imageValidation.valid) {
          return imageValidation;
        }
      }

      return { valid: true };

    } catch (error) {
      logger.error('Error validating file content', {
        filename: file.filename,
        error: error.message
      });

      return {
        valid: false,
        message: 'ไม่สามารถตรวจสอบเนื้อหาไฟล์ได้'
      };
    }
  }

  /**
   * Validate PDF file
   */
  async validatePDF(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Check PDF header
      if (!fileBuffer.toString('ascii', 0, 4).startsWith('%PDF')) {
        return {
          valid: false,
          message: 'ไฟล์ PDF ไม่ถูกต้อง'
        };
      }

      // Check if file is encrypted
      const content = fileBuffer.toString('ascii');
      if (content.includes('/Encrypt')) {
        return {
          valid: false,
          message: 'ไม่รองรับไฟล์ PDF ที่มีการเข้ารหัส'
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        message: 'ไม่สามารถตรวจสอบไฟล์ PDF ได้'
      };
    }
  }

  /**
   * Validate image file
   */
  async validateImage(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      
      // Check dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        return {
          valid: false,
          message: 'ขนาดภาพต่ำเกินไป (ต้องมากกว่า 100x100 pixels)'
        };
      }

      // Check if image is too large
      if (metadata.width > 10000 || metadata.height > 10000) {
        return {
          valid: false,
          message: 'ขนาดภาพใหญ่เกินไป (ต้องน้อยกว่า 10000x10000 pixels)'
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        message: 'ไม่สามารถตรวจสอบไฟล์ภาพได้'
      };
    }
  }

  /**
   * Scan file for viruses (mock implementation)
   */
  async scanFile(filePath) {
    try {
      // Mock virus scan - replace with real antivirus integration
      logger.info('File scanned (mock)', { filePath });
      
      return {
        clean: true,
        engine: 'mock-scanner',
        version: '1.0.0'
      };

    } catch (error) {
      logger.error('Virus scan error', {
        filePath,
        error: error.message
      });

      return {
        clean: false,
        error: error.message
      };
    }
  }

  /**
   * Check document completeness
   */
  checkDocumentCompleteness(groupedDocuments) {
    const completeness = {
      isComplete: true,
      required: [],
      optional: [],
      missing: []
    };

    // Check all document types
    for (const [typeKey, docType] of Object.entries(this.DOCUMENT_TYPES)) {
      const typeCode = docType.code;
      const hasFiles = groupedDocuments[typeCode] && groupedDocuments[typeCode].files.length > 0;

      if (docType.required) {
        completeness.required.push({
          type: typeCode,
          name: docType.namesTH,
          hasFiles,
          fileCount: hasFiles ? groupedDocuments[typeCode].files.length : 0
        });

        if (!hasFiles) {
          completeness.isComplete = false;
          completeness.missing.push(docType.namesTH);
        }
      } else {
        completeness.optional.push({
          type: typeCode,
          name: docType.namesTH,
          hasFiles,
          fileCount: hasFiles ? groupedDocuments[typeCode].files.length : 0
        });
      }
    }

    return completeness;
  }

  /**
   * Utility functions
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"|?*\\\/]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }

  getUploadErrorMessage(error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return `ขนาดไฟล์เกิน ${this.maxFileSize / (1024 * 1024)} MB`;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return 'จำนวนไฟล์เกินกำหนด';
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return 'ประเภทไฟล์ไม่ถูกต้อง';
    }
    return error.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์';
  }

  async cleanupFiles(files) {
    for (const file of files) {
      await this.cleanupFile(file.path);
    }
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error('Error cleaning up file', {
        filePath,
        error: error.message
      });
    }
  }

  // Mock database operations (replace with real database)
  async storeFileInfo(fileInfo) {
    logger.info('Storing file info (mock)', fileInfo);
    return fileInfo;
  }

  async getFileInfo(applicationId, filename) {
    // Mock implementation
    return {
      originalName: filename,
      filename,
      mimeType: 'application/pdf',
      isActive: true
    };
  }

  async getDocumentList(applicationId, options = {}) {
    // Mock implementation
    return [];
  }

  async markFileInactive(applicationId, filename) {
    logger.info('Marking file inactive (mock)', { applicationId, filename });
  }

  /**
   * Get document type information
   */
  getDocumentTypes() {
    return Object.values(this.DOCUMENT_TYPES).map(type => ({
      code: type.code,
      name: type.name,
      namesTH: type.namesTH,
      required: type.required,
      maxFiles: type.maxFiles,
      allowedFormats: type.allowedFormats,
      maxSizeMB: type.maxSizeMB,
      description: type.description,
      validationCriteria: type.validationCriteria
    }));
  }

  /**
   * Get upload limits
   */
  getUploadLimits() {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: this.maxFileSize / (1024 * 1024),
      allowedExtensions: this.allowedExtensions,
      maxFilesPerType: Math.max(...Object.values(this.DOCUMENT_TYPES).map(type => type.maxFiles)),
      totalMaxFiles: Object.values(this.DOCUMENT_TYPES).reduce((sum, type) => sum + type.maxFiles, 0)
    };
  }
}

module.exports = GACPDocumentService;