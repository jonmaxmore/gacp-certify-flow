const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * GACP Certificate Generation Service
 * Generates official GACP certificates with QR codes, digital signatures, and security features
 */
class CertificateGenerationService {
  constructor() {
    this.certificatePath = process.env.CERTIFICATE_PATH || '/certificates';
    this.templatePath = process.env.TEMPLATE_PATH || '/templates';
    this.publicKeyPath = process.env.PUBLIC_KEY_PATH || '/keys/public.pem';
    this.privateKeyPath = process.env.PRIVATE_KEY_PATH || '/keys/private.pem';
    
    // Certificate configuration
    this.config = {
      pageSize: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      colors: {
        primary: '#2E7D32',    // Dark Green
        secondary: '#4CAF50',  // Green
        accent: '#FFC107',     // Amber
        text: '#2E2E2E',       // Dark Gray
        light: '#E8F5E8'       // Light Green
      },
      fonts: {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique'
      }
    };

    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await this.ensureDirectoryExists(this.certificatePath);
      await this.ensureDirectoryExists(this.templatePath);
      await this.ensureDirectoryExists(path.dirname(this.publicKeyPath));
      
      logger.info('Certificate service initialized', {
        certificatePath: this.certificatePath,
        templatePath: this.templatePath
      });
    } catch (error) {
      logger.error('Failed to initialize certificate service', { error: error.message });
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate GACP Certificate
   */
  async generateCertificate(applicationData, options = {}) {
    try {
      const certificateData = await this.prepareCertificateData(applicationData);
      const qrCodeData = await this.generateQRCode(certificateData);
      const digitalSignature = await this.generateDigitalSignature(certificateData);
      
      const pdfBuffer = await this.createPDFCertificate(certificateData, qrCodeData, digitalSignature);
      const filePath = await this.saveCertificate(pdfBuffer, certificateData.certificateNumber);
      
      // Update application with certificate information
      await this.updateApplicationWithCertificate(applicationData.applicationId, {
        certificateNumber: certificateData.certificateNumber,
        certificatePath: filePath,
        issueDate: certificateData.issueDate,
        expiryDate: certificateData.expiryDate,
        digitalSignature: digitalSignature.signature,
        qrCode: qrCodeData.text
      });

      logger.info('Certificate generated successfully', {
        certificateNumber: certificateData.certificateNumber,
        applicationId: applicationData.applicationId,
        filePath
      });

      return {
        success: true,
        certificateNumber: certificateData.certificateNumber,
        filePath,
        downloadUrl: `/api/certificates/download/${certificateData.certificateNumber}`,
        verificationUrl: `/verify/${certificateData.certificateNumber}`,
        issueDate: certificateData.issueDate,
        expiryDate: certificateData.expiryDate
      };

    } catch (error) {
      logger.error('Certificate generation failed', {
        applicationId: applicationData.applicationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Prepare certificate data
   */
  async prepareCertificateData(applicationData) {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3); // 3 years validity

    const certificateNumber = this.generateCertificateNumber();
    
    return {
      // Certificate Information
      certificateNumber,
      issueDate: now,
      expiryDate,
      
      // Organization Information
      issuingAuthority: 'กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์',
      issuingAuthorityEn: 'Department of Agriculture, Ministry of Agriculture and Cooperatives',
      
      // Application Information
      applicationId: applicationData.applicationId,
      applicationNumber: applicationData.applicationNumber,
      
      // Farmer/Business Information
      farmerName: applicationData.applicantInfo.name,
      farmerNameEn: applicationData.applicantInfo.nameEn || '',
      businessName: applicationData.businessInfo?.name || '',
      businessNameEn: applicationData.businessInfo?.nameEn || '',
      address: applicationData.applicantInfo.address,
      
      // Certificate Details
      scope: applicationData.scope || 'การปลูกและผลิตสมุนไพรตามมาตรฐาน GACP',
      scopeEn: applicationData.scopeEn || 'Cultivation and Production of Medicinal Plants according to GACP Standards',
      products: applicationData.products || [],
      
      // Verification Information
      verificationUrl: `${process.env.BASE_URL}/verify/${certificateNumber}`,
      
      // Audit Information
      auditDate: applicationData.auditInfo?.completedDate,
      auditorName: applicationData.auditInfo?.auditorName,
      auditScore: applicationData.auditInfo?.score,
      
      // Approval Information
      approvalDate: applicationData.approval?.approvedDate,
      approverName: applicationData.approval?.approverName,
      approverTitle: applicationData.approval?.approverTitle || 'ผู้อำนวยการกรมวิชาการเกษตร'
    };
  }

  /**
   * Generate QR Code for certificate verification
   */
  async generateQRCode(certificateData) {
    const qrData = {
      certificateNumber: certificateData.certificateNumber,
      holderName: certificateData.farmerName,
      issueDate: certificateData.issueDate.toISOString(),
      expiryDate: certificateData.expiryDate.toISOString(),
      verificationUrl: certificateData.verificationUrl,
      hash: this.generateDataHash(certificateData)
    };

    const qrText = JSON.stringify(qrData);
    const qrCodeBuffer = await QRCode.toBuffer(qrText, {
      type: 'png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      text: qrText,
      buffer: qrCodeBuffer,
      data: qrData
    };
  }

  /**
   * Generate digital signature
   */
  async generateDigitalSignature(certificateData) {
    try {
      // Create hash of certificate data
      const dataHash = this.generateDataHash(certificateData);
      
      // Read private key (in production, this should be securely stored)
      let privateKey;
      try {
        privateKey = await fs.readFile(this.privateKeyPath, 'utf8');
      } catch {
        // Generate key pair if not exists
        const keyPair = await this.generateKeyPair();
        privateKey = keyPair.privateKey;
      }

      // Create digital signature
      const sign = crypto.createSign('SHA256');
      sign.update(dataHash);
      const signature = sign.sign(privateKey, 'base64');

      return {
        algorithm: 'SHA256withRSA',
        signature,
        dataHash,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Digital signature generation failed', { error: error.message });
      throw new Error('Failed to generate digital signature');
    }
  }

  /**
   * Create PDF Certificate
   */
  async createPDFCertificate(certificateData, qrCodeData, digitalSignature) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: this.config.pageSize,
          margins: this.config.margins,
          info: {
            Title: `GACP Certificate - ${certificateData.certificateNumber}`,
            Author: certificateData.issuingAuthority,
            Subject: 'Good Agricultural and Collection Practices Certificate',
            Creator: 'GACP Certification System',
            Producer: 'Department of Agriculture',
            CreationDate: new Date(),
            Keywords: 'GACP, Certificate, Agriculture, Thailand'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Create certificate content
        this.drawCertificateHeader(doc, certificateData);
        this.drawCertificateTitle(doc, certificateData);
        this.drawCertificateBody(doc, certificateData);
        this.drawCertificateDetails(doc, certificateData);
        this.drawSignatureSection(doc, certificateData);
        this.drawQRCodeSection(doc, qrCodeData);
        this.drawSecurityFeatures(doc, digitalSignature);
        this.drawFooter(doc, certificateData);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw certificate header
   */
  drawCertificateHeader(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Background color strip
    doc.rect(0, 0, doc.page.width, 80)
       .fill(colors.primary);

    // Reset to content area
    doc.fill(colors.text);

    // Government logo placeholder (in production, use actual logo)
    doc.fontSize(12)
       .fill('white')
       .text('🇹🇭', 60, 25, { width: 50, align: 'center' });

    // Issuing authority
    doc.fontSize(16)
       .font(fonts.bold)
       .fill('white')
       .text(data.issuingAuthority, 120, 20, { width: pageWidth - 160, align: 'left' });

    doc.fontSize(12)
       .font(fonts.regular)
       .text(data.issuingAuthorityEn, 120, 45, { width: pageWidth - 160, align: 'left' });

    // Certificate number
    doc.fontSize(10)
       .text(`Certificate No: ${data.certificateNumber}`, pageWidth - 150, 25, { width: 140, align: 'right' });

    // Move cursor below header
    doc.y = 100;
  }

  /**
   * Draw certificate title
   */
  drawCertificateTitle(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Title background
    doc.rect(doc.page.margins.left, doc.y - 10, pageWidth, 60)
       .fill(colors.light)
       .stroke(colors.secondary);

    // Title text
    doc.fontSize(24)
       .font(fonts.bold)
       .fill(colors.primary)
       .text('ใบรับรองมาตรฐาน GACP', doc.page.margins.left + 20, doc.y + 5, { 
         width: pageWidth - 40, 
         align: 'center' 
       });

    doc.fontSize(16)
       .font(fonts.regular)
       .fill(colors.text)
       .text('Good Agricultural and Collection Practices Certificate', doc.page.margins.left + 20, doc.y + 35, { 
         width: pageWidth - 40, 
         align: 'center' 
       });

    doc.y += 80;
  }

  /**
   * Draw certificate body
   */
  drawCertificateBody(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Main certificate text
    doc.fontSize(14)
       .font(fonts.regular)
       .fill(colors.text)
       .text('กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์ ขอรับรองว่า', doc.page.margins.left, doc.y, {
         width: pageWidth,
         align: 'center'
       });

    doc.y += 30;

    // Holder name
    doc.fontSize(20)
       .font(fonts.bold)
       .fill(colors.primary)
       .text(data.farmerName, doc.page.margins.left, doc.y, {
         width: pageWidth,
         align: 'center',
         underline: true
       });

    if (data.farmerNameEn) {
      doc.y += 25;
      doc.fontSize(16)
         .font(fonts.italic)
         .fill(colors.text)
         .text(`(${data.farmerNameEn})`, doc.page.margins.left, doc.y, {
           width: pageWidth,
           align: 'center'
         });
    }

    doc.y += 35;

    // Business name (if applicable)
    if (data.businessName) {
      doc.fontSize(14)
         .font(fonts.regular)
         .text('ผู้ประกอบการ:', doc.page.margins.left, doc.y);
      
      doc.fontSize(16)
         .font(fonts.bold)
         .fill(colors.primary)
         .text(data.businessName, doc.page.margins.left + 80, doc.y);

      doc.y += 25;
    }

    // Certification statement
    doc.fontSize(14)
       .font(fonts.regular)
       .fill(colors.text)
       .text('ได้ปฏิบัติตามมาตรฐานการปฏิบัติทางการเกษตรและการเก็บรวบรวมที่ดี (GACP)', doc.page.margins.left, doc.y, {
         width: pageWidth,
         align: 'center'
       });

    doc.y += 20;

    doc.text('สำหรับ', doc.page.margins.left, doc.y, {
      width: pageWidth,
      align: 'center'
    });

    doc.y += 25;

    // Scope
    doc.fontSize(16)
       .font(fonts.bold)
       .fill(colors.primary)
       .text(data.scope, doc.page.margins.left, doc.y, {
         width: pageWidth,
         align: 'center'
       });

    doc.y += 20;

    if (data.scopeEn) {
      doc.fontSize(12)
         .font(fonts.italic)
         .fill(colors.text)
         .text(`(${data.scopeEn})`, doc.page.margins.left, doc.y, {
           width: pageWidth,
           align: 'center'
         });
    }

    doc.y += 40;
  }

  /**
   * Draw certificate details
   */
  drawCertificateDetails(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftCol = doc.page.margins.left;
    const rightCol = leftCol + (pageWidth / 2) + 20;
    const startY = doc.y;

    // Details box
    doc.rect(leftCol, startY - 10, pageWidth, 120)
       .stroke(colors.secondary)
       .fillAndStroke(colors.light, colors.secondary);

    doc.fill(colors.text);

    // Left column
    doc.fontSize(11)
       .font(fonts.bold)
       .text('รายละเอียดการรับรอง:', leftCol + 10, startY + 5);

    doc.fontSize(10)
       .font(fonts.regular)
       .text(`วันที่ออกใบรับรอง: ${this.formatThaiDate(data.issueDate)}`, leftCol + 10, startY + 25)
       .text(`วันหมดอายุ: ${this.formatThaiDate(data.expiryDate)}`, leftCol + 10, startY + 40)
       .text(`หมายเลขใบสมัคร: ${data.applicationNumber}`, leftCol + 10, startY + 55);

    if (data.auditDate) {
      doc.text(`วันที่ตรวจสอบ: ${this.formatThaiDate(data.auditDate)}`, leftCol + 10, startY + 70);
    }

    if (data.auditScore) {
      doc.text(`คะแนนการตรวจสอบ: ${data.auditScore}/100`, leftCol + 10, startY + 85);
    }

    // Right column
    doc.fontSize(11)
       .font(fonts.bold)
       .text('ที่อยู่:', rightCol, startY + 5);

    doc.fontSize(10)
       .font(fonts.regular)
       .text(data.address, rightCol, startY + 25, { width: (pageWidth / 2) - 30 });

    // Products (if any)
    if (data.products && data.products.length > 0) {
      doc.fontSize(11)
         .font(fonts.bold)
         .text('ผลิตภัณฑ์ที่ได้รับการรับรอง:', rightCol, startY + 65);

      let productY = startY + 80;
      data.products.slice(0, 3).forEach(product => {
        doc.fontSize(9)
           .font(fonts.regular)
           .text(`• ${product}`, rightCol, productY);
        productY += 12;
      });
    }

    doc.y = startY + 130;
  }

  /**
   * Draw signature section
   */
  drawSignatureSection(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftCol = doc.page.margins.left;
    const rightCol = leftCol + (pageWidth / 2) + 40;

    doc.y += 20;

    // Signature lines
    const signatureY = doc.y + 40;

    // Left signature (if auditor info available)
    if (data.auditorName) {
      doc.fontSize(10)
         .font(fonts.regular)
         .text('ผู้ตรวจสอบ', leftCol + 50, doc.y, { width: 150, align: 'center' });

      doc.moveTo(leftCol, signatureY)
         .lineTo(leftCol + 150, signatureY)
         .stroke(colors.text);

      doc.fontSize(11)
         .font(fonts.bold)
         .text(data.auditorName, leftCol, signatureY + 10, { width: 150, align: 'center' });

      if (data.auditDate) {
        doc.fontSize(9)
           .font(fonts.regular)
           .text(`วันที่ ${this.formatThaiDate(data.auditDate)}`, leftCol, signatureY + 25, { width: 150, align: 'center' });
      }
    }

    // Right signature (approver)
    doc.fontSize(10)
       .font(fonts.regular)
       .text('ผู้อนุมัติ', rightCol + 50, doc.y, { width: 150, align: 'center' });

    doc.moveTo(rightCol, signatureY)
       .lineTo(rightCol + 150, signatureY)
       .stroke(colors.text);

    doc.fontSize(11)
       .font(fonts.bold)
       .text(data.approverName || 'ผู้อำนวยการกรมวิชาการเกษตร', rightCol, signatureY + 10, { width: 150, align: 'center' });

    doc.fontSize(9)
       .font(fonts.regular)
       .text(data.approverTitle || 'ผู้อำนวยการกรมวิชาการเกษตร', rightCol, signatureY + 25, { width: 150, align: 'center' });

    if (data.approvalDate) {
      doc.text(`วันที่ ${this.formatThaiDate(data.approvalDate)}`, rightCol, signatureY + 40, { width: 150, align: 'center' });
    }

    doc.y = signatureY + 60;
  }

  /**
   * Draw QR code section
   */
  drawQRCodeSection(doc, qrCodeData) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // QR code positioning
    const qrSize = 80;
    const qrX = doc.page.margins.left + pageWidth - qrSize - 10;
    const qrY = doc.y;

    // QR code image
    doc.image(qrCodeData.buffer, qrX, qrY, { width: qrSize, height: qrSize });

    // QR code description
    doc.fontSize(8)
       .font(fonts.regular)
       .fill(colors.text)
       .text('สแกนเพื่อตรวจสอบ', qrX - 20, qrY + qrSize + 5, { width: qrSize + 40, align: 'center' })
       .text('ความถูกต้อง', qrX - 20, qrY + qrSize + 15, { width: qrSize + 40, align: 'center' });

    doc.y = Math.max(doc.y, qrY + qrSize + 30);
  }

  /**
   * Draw security features
   */
  drawSecurityFeatures(doc, digitalSignature) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Security information box
    const securityY = doc.y + 10;
    doc.rect(doc.page.margins.left, securityY, pageWidth, 30)
       .fill('#f8f9fa')
       .stroke('#dee2e6');

    // Security features text
    doc.fontSize(8)
       .font(fonts.regular)
       .fill('#6c757d')
       .text('Security Features:', doc.page.margins.left + 5, securityY + 5)
       .text(`Digital Signature: ${digitalSignature.signature.substring(0, 32)}...`, doc.page.margins.left + 5, securityY + 15)
       .text(`Timestamp: ${digitalSignature.timestamp}`, doc.page.margins.left + 250, securityY + 15);

    doc.y = securityY + 35;
  }

  /**
   * Draw footer
   */
  drawFooter(doc, data) {
    const { colors, fonts } = this.config;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const footerY = doc.page.height - 60;

    // Footer line
    doc.moveTo(doc.page.margins.left, footerY)
       .lineTo(doc.page.margins.left + pageWidth, footerY)
       .stroke(colors.secondary);

    // Footer text
    doc.fontSize(8)
       .font(fonts.regular)
       .fill(colors.text)
       .text('ใบรับรองนี้เป็นเอกสารราชการ การปลอมแปลงถือเป็นความผิดตามกฎหมาย', 
             doc.page.margins.left, footerY + 10, { width: pageWidth, align: 'center' });

    doc.text(`Generated on ${new Date().toISOString()} | Verification: ${data.verificationUrl}`,
             doc.page.margins.left, footerY + 25, { width: pageWidth, align: 'center' });
  }

  /**
   * Save certificate to file system
   */
  async saveCertificate(pdfBuffer, certificateNumber) {
    const fileName = `${certificateNumber}.pdf`;
    const filePath = path.join(this.certificatePath, fileName);
    
    await fs.writeFile(filePath, pdfBuffer);
    
    return filePath;
  }

  /**
   * Update application with certificate information
   */
  async updateApplicationWithCertificate(applicationId, certificateInfo) {
    try {
      const Application = require('../models/EnhancedApplication');
      
      await Application.findByIdAndUpdate(applicationId, {
        'approval.certificateNumber': certificateInfo.certificateNumber,
        'approval.certificatePath': certificateInfo.certificatePath,
        'approval.certificateIssueDate': certificateInfo.issueDate,
        'approval.certificateExpiryDate': certificateInfo.expiryDate,
        'approval.digitalSignature': certificateInfo.digitalSignature,
        'approval.qrCode': certificateInfo.qrCode,
        'approval.certificateGenerated': true,
        currentStatus: 'certificate_issued',
        updatedAt: new Date()
      });

      logger.info('Application updated with certificate info', {
        applicationId,
        certificateNumber: certificateInfo.certificateNumber
      });

    } catch (error) {
      logger.error('Failed to update application with certificate', {
        applicationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(certificateNumber) {
    try {
      const Application = require('../models/EnhancedApplication');
      
      const application = await Application.findOne({
        'approval.certificateNumber': certificateNumber
      });

      if (!application) {
        return {
          valid: false,
          error: 'Certificate not found'
        };
      }

      const certificate = application.approval;
      const now = new Date();

      // Check expiry
      if (certificate.certificateExpiryDate && new Date(certificate.certificateExpiryDate) < now) {
        return {
          valid: false,
          error: 'Certificate expired',
          expiryDate: certificate.certificateExpiryDate
        };
      }

      // Verify digital signature
      const isSignatureValid = await this.verifyDigitalSignature(
        certificate.digitalSignature,
        certificate
      );

      return {
        valid: true,
        certificateNumber,
        holderName: application.applicantInfo.name,
        businessName: application.businessInfo?.name,
        issueDate: certificate.certificateIssueDate,
        expiryDate: certificate.certificateExpiryDate,
        scope: application.scope,
        issuingAuthority: 'กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์',
        digitalSignatureValid: isSignatureValid,
        applicationNumber: application.applicationNumber
      };

    } catch (error) {
      logger.error('Certificate verification failed', {
        certificateNumber,
        error: error.message
      });
      
      return {
        valid: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Download certificate
   */
  async downloadCertificate(certificateNumber) {
    try {
      const Application = require('../models/EnhancedApplication');
      
      const application = await Application.findOne({
        'approval.certificateNumber': certificateNumber
      });

      if (!application || !application.approval.certificatePath) {
        throw new Error('Certificate not found');
      }

      const filePath = application.approval.certificatePath;
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('Certificate file not found');
      }

      return {
        filePath,
        fileName: `GACP_Certificate_${certificateNumber}.pdf`,
        contentType: 'application/pdf'
      };

    } catch (error) {
      logger.error('Certificate download failed', {
        certificateNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Utility methods
   */
  generateCertificateNumber() {
    const year = new Date().getFullYear() + 543; // Buddhist year
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `GACP${year}${month}${randomPart}`;
  }

  generateDataHash(data) {
    const dataString = JSON.stringify({
      certificateNumber: data.certificateNumber,
      farmerName: data.farmerName,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      scope: data.scope
    });
    
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }, async (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Save keys to files
          await fs.writeFile(this.publicKeyPath, publicKey);
          await fs.writeFile(this.privateKeyPath, privateKey);
          
          resolve({ publicKey, privateKey });
        } catch (saveError) {
          reject(saveError);
        }
      });
    });
  }

  async verifyDigitalSignature(signature, certificateData) {
    try {
      const publicKey = await fs.readFile(this.publicKeyPath, 'utf8');
      const dataHash = this.generateDataHash(certificateData);
      
      const verify = crypto.createVerify('SHA256');
      verify.update(dataHash);
      
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      logger.error('Digital signature verification failed', { error: error.message });
      return false;
    }
  }

  formatThaiDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist year
    
    return `${day} ${month} ${year}`;
  }

  /**
   * Public API methods
   */

  // Get certificate information
  async getCertificateInfo(certificateNumber) {
    try {
      const Application = require('../models/EnhancedApplication');
      
      const application = await Application.findOne({
        'approval.certificateNumber': certificateNumber
      }).select('approval applicantInfo businessInfo scope applicationNumber');

      if (!application) {
        return null;
      }

      return {
        certificateNumber,
        holderName: application.applicantInfo.name,
        businessName: application.businessInfo?.name,
        issueDate: application.approval.certificateIssueDate,
        expiryDate: application.approval.certificateExpiryDate,
        scope: application.scope,
        applicationNumber: application.applicationNumber,
        status: this.getCertificateStatus(application.approval)
      };

    } catch (error) {
      logger.error('Get certificate info failed', {
        certificateNumber,
        error: error.message
      });
      throw error;
    }
  }

  getCertificateStatus(approval) {
    const now = new Date();
    const expiryDate = new Date(approval.certificateExpiryDate);
    
    if (expiryDate < now) {
      return 'expired';
    }
    
    // Warning if expires within 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    if (expiryDate < thirtyDaysFromNow) {
      return 'expiring_soon';
    }
    
    return 'valid';
  }

  // List certificates for user
  async getUserCertificates(userId) {
    try {
      const Application = require('../models/EnhancedApplication');
      
      const applications = await Application.find({
        'applicantInfo.userId': userId,
        'approval.certificateGenerated': true
      }).select('approval applicantInfo businessInfo scope applicationNumber currentStatus');

      return applications.map(app => ({
        certificateNumber: app.approval.certificateNumber,
        applicationNumber: app.applicationNumber,
        holderName: app.applicantInfo.name,
        businessName: app.businessInfo?.name,
        scope: app.scope,
        issueDate: app.approval.certificateIssueDate,
        expiryDate: app.approval.certificateExpiryDate,
        status: this.getCertificateStatus(app.approval),
        downloadUrl: `/api/certificates/download/${app.approval.certificateNumber}`
      }));

    } catch (error) {
      logger.error('Get user certificates failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = CertificateGenerationService;