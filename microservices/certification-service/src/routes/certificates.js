const express = require('express');
const router = express.Router();
const CertificateGenerationService = require('../services/CertificateGenerationService');
const roleAuth = require('../middleware/roleAuth');
const logger = require('../services/logger');

const certificateService = new CertificateGenerationService();

/**
 * Certificate Generation and Management API Routes
 */

/**
 * @route   POST /api/certificates/generate/:applicationId
 * @desc    Generate certificate for approved application
 * @access  Approver, Admin
 */
router.post('/generate/:applicationId', 
  roleAuth(['approver', 'admin']), 
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { options = {} } = req.body;

      // Get application data
      const Application = require('../models/EnhancedApplication');
      const application = await Application.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check if application is approved
      if (application.currentStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Application must be approved before certificate generation'
        });
      }

      // Check if certificate already exists
      if (application.approval?.certificateGenerated) {
        return res.status(400).json({
          success: false,
          message: 'Certificate already generated for this application',
          certificateNumber: application.approval.certificateNumber
        });
      }

      // Generate certificate
      const result = await certificateService.generateCertificate(application, options);

      logger.info('Certificate generated via API', {
        applicationId,
        certificateNumber: result.certificateNumber,
        userId: req.user.userId,
        userRole: req.user.role
      });

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Certificate generation API error', {
        applicationId: req.params.applicationId,
        error: error.message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Certificate generation failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/certificates/download/:certificateNumber
 * @desc    Download certificate PDF
 * @access  Public (with valid certificate number)
 */
router.get('/download/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const downloadInfo = await certificateService.downloadCertificate(certificateNumber);

    // Set headers for PDF download
    res.setHeader('Content-Type', downloadInfo.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadInfo.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream file
    const fs = require('fs');
    const fileStream = fs.createReadStream(downloadInfo.filePath);
    
    fileStream.on('error', (error) => {
      logger.error('Certificate download stream error', {
        certificateNumber,
        error: error.message
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download certificate'
        });
      }
    });

    fileStream.pipe(res);

    logger.info('Certificate downloaded', {
      certificateNumber,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

  } catch (error) {
    logger.error('Certificate download API error', {
      certificateNumber: req.params.certificateNumber,
      error: error.message
    });

    res.status(404).json({
      success: false,
      message: error.message || 'Certificate not found'
    });
  }
});

/**
 * @route   GET /api/certificates/verify/:certificateNumber
 * @desc    Verify certificate authenticity
 * @access  Public
 */
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const verification = await certificateService.verifyCertificate(certificateNumber);

    logger.info('Certificate verification attempted', {
      certificateNumber,
      valid: verification.valid,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    logger.error('Certificate verification API error', {
      certificateNumber: req.params.certificateNumber,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/certificates/info/:certificateNumber
 * @desc    Get certificate information
 * @access  Public
 */
router.get('/info/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificateInfo = await certificateService.getCertificateInfo(certificateNumber);

    if (!certificateInfo) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      data: certificateInfo
    });

  } catch (error) {
    logger.error('Get certificate info API error', {
      certificateNumber: req.params.certificateNumber,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get certificate information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/certificates/user/:userId
 * @desc    Get all certificates for a user
 * @access  Private (user can see own certificates, admin can see all)
 */
router.get('/user/:userId', 
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'admin']), 
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check authorization - users can only see their own certificates unless admin
      if (req.user.role !== 'admin' && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const certificates = await certificateService.getUserCertificates(userId);

      res.json({
        success: true,
        data: certificates,
        count: certificates.length
      });

    } catch (error) {
      logger.error('Get user certificates API error', {
        userId: req.params.userId,
        requestUserId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get user certificates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/certificates/search
 * @desc    Search certificates (admin only)
 * @access  Admin
 */
router.get('/search', 
  roleAuth(['admin']), 
  async (req, res) => {
    try {
      const { 
        search, 
        status, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
      } = req.query;

      const Application = require('../models/EnhancedApplication');
      
      const query = {
        'approval.certificateGenerated': true
      };

      // Search by certificate number or holder name
      if (search) {
        query.$or = [
          { 'approval.certificateNumber': { $regex: search, $options: 'i' } },
          { 'applicantInfo.name': { $regex: search, $options: 'i' } },
          { 'businessInfo.name': { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        query['approval.certificateIssueDate'] = {};
        if (dateFrom) {
          query['approval.certificateIssueDate'].$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query['approval.certificateIssueDate'].$lte = new Date(dateTo);
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [applications, total] = await Promise.all([
        Application.find(query)
          .select('approval applicantInfo businessInfo scope applicationNumber')
          .sort({ 'approval.certificateIssueDate': -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Application.countDocuments(query)
      ]);

      const certificates = applications.map(app => ({
        certificateNumber: app.approval.certificateNumber,
        applicationNumber: app.applicationNumber,
        holderName: app.applicantInfo.name,
        businessName: app.businessInfo?.name,
        scope: app.scope,
        issueDate: app.approval.certificateIssueDate,
        expiryDate: app.approval.certificateExpiryDate,
        status: certificateService.getCertificateStatus(app.approval)
      }));

      res.json({
        success: true,
        data: certificates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Certificate search API error', {
        query: req.query,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Certificate search failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/certificates/stats
 * @desc    Get certificate statistics (admin only)
 * @access  Admin
 */
router.get('/stats', 
  roleAuth(['admin']), 
  async (req, res) => {
    try {
      const Application = require('../models/EnhancedApplication');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

      const [
        totalCertificates,
        recentCertificates,
        expiredCertificates,
        expiringSoon,
        yearlyStats
      ] = await Promise.all([
        // Total certificates
        Application.countDocuments({ 'approval.certificateGenerated': true }),
        
        // Recent certificates (last 30 days)
        Application.countDocuments({
          'approval.certificateGenerated': true,
          'approval.certificateIssueDate': { $gte: thirtyDaysAgo }
        }),
        
        // Expired certificates
        Application.countDocuments({
          'approval.certificateGenerated': true,
          'approval.certificateExpiryDate': { $lt: now }
        }),
        
        // Expiring soon (next 30 days)
        Application.countDocuments({
          'approval.certificateGenerated': true,
          'approval.certificateExpiryDate': { 
            $gte: now,
            $lt: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
          }
        }),
        
        // Yearly statistics
        Application.aggregate([
          {
            $match: {
              'approval.certificateGenerated': true,
              'approval.certificateIssueDate': { $gte: oneYearAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$approval.certificateIssueDate' },
                month: { $month: '$approval.certificateIssueDate' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': -1, '_id.month': -1 }
          }
        ])
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalCertificates,
            recentCertificates,
            expiredCertificates,
            expiringSoon
          },
          monthly: yearlyStats.map(stat => ({
            year: stat._id.year,
            month: stat._id.month,
            count: stat.count
          }))
        }
      });

    } catch (error) {
      logger.error('Certificate stats API error', {
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get certificate statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/certificates/regenerate/:certificateNumber
 * @desc    Regenerate certificate (admin only)
 * @access  Admin
 */
router.post('/regenerate/:certificateNumber', 
  roleAuth(['admin']), 
  async (req, res) => {
    try {
      const { certificateNumber } = req.params;
      const { reason = 'Regenerated by admin' } = req.body;

      const Application = require('../models/EnhancedApplication');
      
      const application = await Application.findOne({
        'approval.certificateNumber': certificateNumber
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      // Generate new certificate with same number
      const result = await certificateService.generateCertificate(application, {
        regenerate: true,
        reason
      });

      logger.info('Certificate regenerated', {
        certificateNumber,
        reason,
        userId: req.user.userId,
        userRole: req.user.role
      });

      res.json({
        success: true,
        message: 'Certificate regenerated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Certificate regeneration API error', {
        certificateNumber: req.params.certificateNumber,
        userId: req.user?.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Certificate regeneration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /verify/:certificateNumber
 * @desc    Public certificate verification page
 * @access  Public
 */
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const verification = await certificateService.verifyCertificate(certificateNumber);

    // Return HTML page for public verification
    const html = generateVerificationPage(verification, certificateNumber);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    logger.error('Public verification page error', {
      certificateNumber: req.params.certificateNumber,
      error: error.message
    });

    const errorHtml = generateErrorPage('Verification failed');
    res.status(500).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
});

/**
 * Generate HTML verification page
 */
function generateVerificationPage(verification, certificateNumber) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  if (!verification.valid) {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ตรวจสอบใบรับรอง GACP</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .invalid { color: #dc3545; border: 2px solid #dc3545; padding: 20px; border-radius: 5px; text-align: center; }
          .logo { width: 80px; height: 80px; margin: 0 auto 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🇹🇭</div>
            <h1>ระบบตรวจสอบใบรับรอง GACP</h1>
            <h2>กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์</h2>
          </div>
          <div class="invalid">
            <h2>❌ ใบรับรองไม่ถูกต้อง</h2>
            <p>หมายเลขใบรับรอง: <strong>${certificateNumber}</strong></p>
            <p>สาเหตุ: ${verification.error}</p>
            <p>กรุณาตรวจสอบหมายเลขใบรับรองอีกครั้ง</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ตรวจสอบใบรับรอง GACP</title>
      <style>
        body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .valid { color: #28a745; border: 2px solid #28a745; padding: 20px; border-radius: 5px; }
        .details { margin-top: 20px; }
        .detail-row { display: flex; margin-bottom: 10px; }
        .detail-label { font-weight: bold; width: 200px; }
        .detail-value { flex: 1; }
        .download-btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .logo { width: 80px; height: 80px; margin: 0 auto 20px; }
        .status { padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        .status.valid { background: #d4edda; color: #155724; }
        .status.expiring { background: #fff3cd; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🇹🇭</div>
          <h1>ระบบตรวจสอบใบรับรอง GACP</h1>
          <h2>กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์</h2>
        </div>
        
        <div class="valid">
          <h2>✅ ใบรับรองถูกต้องและใช้ได้</h2>
          
          <div class="details">
            <div class="detail-row">
              <div class="detail-label">หมายเลขใบรับรอง:</div>
              <div class="detail-value"><strong>${verification.certificateNumber}</strong></div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">ชื่อผู้ถือใบรับรอง:</div>
              <div class="detail-value">${verification.holderName}</div>
            </div>
            
            ${verification.businessName ? `
            <div class="detail-row">
              <div class="detail-label">ชื่อธุรกิจ:</div>
              <div class="detail-value">${verification.businessName}</div>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <div class="detail-label">ขอบเขตการรับรอง:</div>
              <div class="detail-value">${verification.scope}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">วันที่ออกใบรับรอง:</div>
              <div class="detail-value">${new Date(verification.issueDate).toLocaleDateString('th-TH')}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">วันหมดอายุ:</div>
              <div class="detail-value">${new Date(verification.expiryDate).toLocaleDateString('th-TH')}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">หน่วยงานที่ออกใบรับรอง:</div>
              <div class="detail-value">${verification.issuingAuthority}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">ลายเซ็นดิจิทัล:</div>
              <div class="detail-value">
                ${verification.digitalSignatureValid ? '✅ ถูกต้อง' : '❌ ไม่ถูกต้อง'}
              </div>
            </div>
          </div>
          
          <a href="${baseUrl}/api/certificates/download/${verification.certificateNumber}" 
             class="download-btn" target="_blank">
            📄 ดาวน์โหลดใบรับรอง
          </a>
        </div>
      </div>
      
      <script>
        // Print timestamp
        document.addEventListener('DOMContentLoaded', function() {
          const footer = document.createElement('div');
          footer.style.textAlign = 'center';
          footer.style.marginTop = '30px';
          footer.style.fontSize = '12px';
          footer.style.color = '#666';
          footer.innerHTML = 'ตรวจสอบเมื่อ: ' + new Date().toLocaleString('th-TH');
          document.querySelector('.container').appendChild(footer);
        });
      </script>
    </body>
    </html>
  `;
}

function generateErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ข้อผิดพลาด - ระบบตรวจสอบใบรับรอง GACP</title>
      <style>
        body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error { color: #dc3545; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">❌ เกิดข้อผิดพลาด</h1>
        <p>${message}</p>
        <p>กรุณาลองใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;