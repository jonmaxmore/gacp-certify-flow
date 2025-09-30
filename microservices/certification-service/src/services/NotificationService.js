const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * GACP Notification Service - Complete notification system
 * Handles email, SMS, and in-app notifications for all workflow states
 */

class GACPNotificationService {
  constructor() {
    this.setupEmailTransporter();
    
    // Define notification templates
    this.TEMPLATES = this.defineNotificationTemplates();
    
    // Define notification rules
    this.NOTIFICATION_RULES = this.defineNotificationRules();
    
    // Track notification history
    this.notificationHistory = new Map();
  }

  /**
   * Setup email transporter (production would use real SMTP)
   */
  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      // Production SMTP configuration
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'noreply@gacp.go.th',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
  }

  /**
   * Define notification templates for all scenarios
   */
  defineNotificationTemplates() {
    return {
      // Farmer notifications
      APPLICATION_SUBMITTED: {
        subject: 'แจ้งเตือน: ได้รับใบสมัครขอใบรับรองมาตรฐาน GACP แล้ว',
        email: `
เรียน คุณ {{farmerName}}

ระบบได้รับใบสมัครขอใบรับรองมาตรฐาน GACP หมายเลข {{applicationNumber}} เรียบร้อยแล้ว

รายละเอียด:
- หมายเลขใบสมัคร: {{applicationNumber}}
- วันที่ยื่นสมัคร: {{submissionDate}}
- สถานะปัจจุบัน: รอชำระค่าธรรมเนียม
- ค่าธรรมเนียมเบื้องต้น: 5,000 บาท

กรุณาชำระค่าธรรมเนียมภายใน 7 วัน เพื่อให้ระบบดำเนินการตรวจสอบเอกสารต่อไป

ติดตามสถานะได้ที่: {{dashboardUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์
`,
        sms: 'แจ้งเตือน: ได้รับใบสมัคร GACP เลขที่ {{applicationNumber}} แล้ว กรุณาชำระค่าธรรมเนียม 5,000 บาท ภายใน 7 วัน'
      },

      PAYMENT_REQUIRED_INITIAL: {
        subject: 'แจ้งเตือน: กรุณาชำระค่าธรรมเนียมการตรวจสอบเอกสาร GACP',
        email: `
เรียน คุณ {{farmerName}}

กรุณาชำระค่าธรรมเนียมการตรวจสอบเอกสารสำหรับใบสมัครหมายเลข {{applicationNumber}}

รายละเอียดการชำระเงิน:
- ค่าธรรมเนียม: 5,000 บาท
- ประเภท: ค่าตรวจสอบเอกสารครั้งแรก
- กำหนดชำระ: ภายใน {{dueDate}}
- วิธีการชำระ: {{paymentMethods}}

หลังจากชำระเงินแล้ว ระบบจะส่งเรื่องให้เจ้าหน้าที่ตรวจสอบเอกสารภายใน 5 วันทำการ

ชำระเงินได้ที่: {{paymentUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'แจ้งชำระเงิน: GACP {{applicationNumber}} จำนวน 5,000 บาท กำหนด {{dueDate}} ชำระที่ {{paymentUrl}}'
      },

      PAYMENT_REQUIRED_THIRD_REVIEW: {
        subject: 'แจ้งเตือน: กรุณาชำระค่าธรรมเนียมการตรวจสอบเอกสารครั้งที่ 3',
        email: `
เรียน คุณ {{farmerName}}

ใบสมัครหมายเลข {{applicationNumber}} ถูกตีกลับแล้ว 2 ครั้ง 

สำหรับการส่งเอกสารครั้งที่ 3 จำเป็นต้องชำระค่าธรรมเนียมเพิ่มเติม:
- ค่าธรรมเนียม: 5,000 บาท
- ประเภท: ค่าตรวจสอบเอกสารครั้งที่ 3
- เหตุผลที่ถูกตีกลับ: {{rejectionReasons}}

กรุณาปรับปรุงเอกสารตามข้อเสนอแนะและชำระค่าธรรมเนียมก่อนส่งเอกสารใหม่

ชำระเงินได้ที่: {{paymentUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'GACP {{applicationNumber}}: ถูกตีกลับ 2 ครั้งแล้ว ส่งครั้งที่ 3 ต้องชำระ 5,000 บาท เพิ่ม'
      },

      PAYMENT_REQUIRED_AUDIT: {
        subject: 'แจ้งเตือน: กรุณาชำระค่าธรรมเนียมการตรวจสอบภาคสนาม GACP',
        email: `
เรียน คุณ {{farmerName}}

ยินดีด้วย! เอกสารของใบสมัครหมายเลข {{applicationNumber}} ผ่านการตรวจสอบแล้ว

ขั้นตอนต่อไป: การตรวจสอบภาคสนาม (Audit)
- ค่าธรรมเนียม: 25,000 บาท
- ประเภท: ค่าตรวจสอบภาคสนาม
- การตรวจสอบจะดำเนินการโดย: {{auditorName}}
- วันที่นัดตรวจ: {{auditDate}}

หมายเหตุ: จำเป็นต้องชำระค่าธรรมเนียมก่อนเจ้าหน้าที่จะเดินทางไปตรวจสอบ

ชำระเงินได้ที่: {{paymentUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'GACP {{applicationNumber}}: เอกสารผ่าน! กรุณาชำระค่าตรวจสอบภาคสนาม 25,000 บาท'
      },

      DOCUMENTS_REJECTED: {
        subject: 'แจ้งเตือน: เอกสารใบสมัคร GACP ถูกตีกลับ',
        email: `
เรียน คุณ {{farmerName}}

เอกสารของใบสมัครหมายเลข {{applicationNumber}} ถูกตีกลับ

รายละเอียด:
- วันที่ตรวจสอบ: {{reviewDate}}
- เจ้าหน้าที่ผู้ตรวจ: {{reviewerName}}
- จำนวนครั้งที่ถูกตีกลับ: {{rejectionCount}}/3

ข้อเสนอแนะและข้อที่ต้องแก้ไข:
{{rejectionReasons}}

การดำเนินการต่อไป:
{{nextActions}}

กรุณาปรับปรุงเอกสารและส่งใหม่ภายใน 30 วัน

แก้ไขเอกสารได้ที่: {{dashboardUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'GACP {{applicationNumber}}: เอกสารถูกตีกลับครั้งที่ {{rejectionCount}} กรุณาแก้ไขภายใน 30 วัน'
      },

      AUDIT_SCHEDULED: {
        subject: 'แจ้งเตือน: กำหนดการตรวจสอบภาคสนาม GACP',
        email: `
เรียน คุณ {{farmerName}}

กำหนดการตรวจสอบภาคสนามสำหรับใบสมัครหมายเลข {{applicationNumber}}

รายละเอียดการตรวจสอบ:
- วันที่: {{auditDate}}
- เวลา: {{auditTime}}
- ประเภท: {{auditType}}
- เจ้าหน้าที่ผู้ตรวจ: {{auditorName}}
- เบอร์ติดต่อ: {{auditorPhone}}

สิ่งที่ต้องเตรียม:
- เอกสารต้นฉบับทั้งหมด
- ผู้รับผิดชอบต้องอยู่ในพื้นที่ตรวจ
- อุปกรณ์และสถานที่ให้พร้อมสำหรับการตรวจสอบ

หากต้องการเปลี่ยนแปลงกำหนดการ กรุณาติดต่อล่วงหน้าอย่างน้อย 3 วันทำการ

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'GACP {{applicationNumber}}: นัดตรวจภาคสนาม {{auditDate}} {{auditTime}} โดย {{auditorName}}'
      },

      AUDIT_PASSED: {
        subject: 'ยินดีด้วย! ผ่านการตรวจสอบภาคสนาม GACP',
        email: `
เรียน คุณ {{farmerName}}

ยินดีด้วย! การตรวจสอบภาคสนามสำหรับใบสมัครหมายเลข {{applicationNumber}} ผ่านเกณฑ์

ผลการตรวจสอบ:
- วันที่ตรวจ: {{auditDate}}
- เจ้าหน้าที่ผู้ตรวจ: {{auditorName}}
- คะแนนรวม: {{auditScore}}/100
- ผลการประเมิน: ผ่าน (Pass)

ขั้นตอนต่อไป:
เอกสารจะถูกส่งไปยังผู้อนุมัติขั้นสุดท้าย คาดว่าจะได้รับใบรับรองภายใน 7 วันทำการ

ติดตามสถานะได้ที่: {{dashboardUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'ยินดีด้วย! GACP {{applicationNumber}} ผ่านการตรวจภาคสนาม คะแนน {{auditScore}}/100'
      },

      AUDIT_FAILED: {
        subject: 'แจ้งเตือน: ไม่ผ่านการตรวจสอบภาคสนาม GACP',
        email: `
เรียน คุณ {{farmerName}}

การตรวจสอบภาคสนามสำหรับใบสมัครหมายเลข {{applicationNumber}} ไม่ผ่านเกณฑ์

ผลการตรวจสอบ:
- วันที่ตรวจ: {{auditDate}}
- เจ้าหน้าที่ผู้ตรวจ: {{auditorName}}
- คะแนนรวม: {{auditScore}}/100
- ผลการประเมิน: ไม่ผ่าน (Failed)

ข้อบกพร่องที่พบ:
{{auditFindings}}

ข้อเสนอแนะ:
{{recommendations}}

การดำเนินการต่อไป:
หากต้องการตรวจสอบใหม่ กรุณาแก้ไขข้อบกพร่องและชำระค่าธรรมเนียมการตรวจสอบใหม่ 25,000 บาท

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'GACP {{applicationNumber}}: ไม่ผ่านการตรวจ คะแนน {{auditScore}}/100 ต้องตรวจใหม่'
      },

      CERTIFICATE_ISSUED: {
        subject: 'ยินดีด้วย! ได้รับใบรับรองมาตรฐาน GACP แล้ว',
        email: `
เรียน คุณ {{farmerName}}

ยินดีด้วย! ใบรับรองมาตรฐาน GACP ได้รับการอนุมัติแล้ว

รายละเอียดใบรับรอง:
- หมายเลขใบรับรอง: {{certificateNumber}}
- วันที่ออกใบรับรอง: {{issuanceDate}}
- วันหมดอายุ: {{expiryDate}}
- ระยะเวลาดำเนินการ: {{processingTime}} วัน

ดาวน์โหลดใบรับรองได้ที่: {{certificateUrl}}

การต่ออายุใบรับรอง:
ใบรับรองจะหมดอายุใน {{validityPeriod}} ปี กรุณาเริ่มกระบวนการต่ออายุล่วงหน้า 3 เดือน

ขอแสดงความนับถือ
กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์
`,
        sms: 'ยินดีด้วย! ได้รับใบรับรอง GACP เลขที่ {{certificateNumber}} แล้ว หมดอายุ {{expiryDate}}'
      },

      // Staff notifications
      NEW_APPLICATION_ASSIGNED: {
        subject: '[ระบบ GACP] มีใบสมัครใหม่มอบหมายให้ตรวจสอบ',
        email: `
เรียน คุณ {{staffName}}

มีใบสมัครขอใบรับรองมาตรฐาน GACP ใหม่มอบหมายให้ท่านตรวจสอบ

รายละเอียด:
- หมายเลขใบสมัคร: {{applicationNumber}}
- ชื่อผู้สมัคร: {{farmerName}}
- ประเภทพืช: {{cropType}}
- วันที่รับเรื่อง: {{submissionDate}}
- กำหนดการตรวจสอบ: ภายใน {{reviewDeadline}}

เข้าระบบตรวจสอบได้ที่: {{reviewUrl}}

ขอแสดงความนับถือ
ระบบ GACP
`,
        sms: 'มีใบสมัคร GACP ใหม่: {{applicationNumber}} มอบหมายให้ตรวจสอบ กำหนด {{reviewDeadline}}'
      },

      REVIEW_DEADLINE_WARNING: {
        subject: '[เร่งด่วน] ใบสมัคร GACP ใกล้เกินกำหนดการตรวจสอบ',
        email: `
เรียน คุณ {{staffName}}

ใบสมัครหมายเลข {{applicationNumber}} ใกล้เกินกำหนดการตรวจสอบแล้ว

รายละเอียด:
- กำหนดการตรวจสอบ: {{reviewDeadline}}
- เหลือเวลา: {{timeRemaining}}
- ความเร่งด่วน: {{urgencyLevel}}

กรุณาดำเนินการให้เสร็จสิ้นก่อนกำหนดเวลา

เข้าระบบได้ที่: {{reviewUrl}}

ขอแสดงความนับถือ
ระบบ GACP
`,
        sms: 'เร่งด่วน! GACP {{applicationNumber}} เกินกำหนดในอีก {{timeRemaining}}'
      },

      PAYMENT_OVERDUE: {
        subject: 'แจ้งเตือน: ค่าธรรมเนียม GACP เกินกำหนดชำระ',
        email: `
เรียน คุณ {{farmerName}}

ค่าธรรมเนียมสำหรับใบสมัครหมายเลข {{applicationNumber}} เกินกำหนดชำระแล้ว

รายละเอียด:
- จำนวนเงิน: {{amount}} บาท
- กำหนดชำระ: {{dueDate}}
- เกินกำหนด: {{overdueDays}} วัน

หากไม่ชำระภายใน {{finalDeadline}} ใบสมัครจะถูกยกเลิกโดยอัตโนมัติ

ชำระเงินได้ที่: {{paymentUrl}}

ขอแสดงความนับถือ
กรมวิชาการเกษตร
`,
        sms: 'เกินกำหนดชำระ: GACP {{applicationNumber}} จำนวน {{amount}} บาท เกิน {{overdueDays}} วัน'
      }
    };
  }

  /**
   * Define notification rules for automatic triggers
   */
  defineNotificationRules() {
    return {
      // Immediate notifications
      IMMEDIATE: [
        'APPLICATION_SUBMITTED',
        'DOCUMENTS_REJECTED',
        'AUDIT_PASSED',
        'AUDIT_FAILED',
        'CERTIFICATE_ISSUED',
        'NEW_APPLICATION_ASSIGNED'
      ],

      // Scheduled notifications
      PAYMENT_REMINDERS: {
        // Send reminders at 1, 3, 5 days before due date
        schedules: [-1, -3, -5], // Days before due date
        template: 'PAYMENT_REQUIRED_INITIAL'
      },

      REVIEW_DEADLINES: {
        // Send warnings at 1, 2 days before deadline
        schedules: [-1, -2],
        template: 'REVIEW_DEADLINE_WARNING'
      },

      OVERDUE_PAYMENTS: {
        // Send overdue notices daily for 7 days
        schedules: [1, 2, 3, 4, 5, 6, 7], // Days after due date
        template: 'PAYMENT_OVERDUE'
      }
    };
  }

  /**
   * Send notification based on application state change
   */
  async sendStateChangeNotification(application, newState, actor, metadata = {}) {
    try {
      const notifications = this.getNotificationsForState(newState, application, actor);
      
      for (const notification of notifications) {
        await this.sendNotification(notification);
      }

      logger.info('State change notifications sent', {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        newState,
        notificationCount: notifications.length
      });

    } catch (error) {
      logger.error('Error sending state change notifications', {
        applicationId: application._id,
        newState,
        error: error.message
      });
    }
  }

  /**
   * Get notifications for specific state
   */
  getNotificationsForState(state, application, actor) {
    const notifications = [];

    switch (state) {
      case 'submitted':
        notifications.push(this.createNotification(
          'APPLICATION_SUBMITTED',
          application,
          'farmer'
        ));
        break;

      case 'payment_pending_1':
        notifications.push(this.createNotification(
          'PAYMENT_REQUIRED_INITIAL',
          application,
          'farmer'
        ));
        break;

      case 'payment_pending_2':
        notifications.push(this.createNotification(
          'PAYMENT_REQUIRED_THIRD_REVIEW',
          application,
          'farmer'
        ));
        break;

      case 'audit_payment_pending':
        notifications.push(this.createNotification(
          'PAYMENT_REQUIRED_AUDIT',
          application,
          'farmer'
        ));
        break;

      case 'reviewing':
        notifications.push(this.createNotification(
          'NEW_APPLICATION_ASSIGNED',
          application,
          'reviewer'
        ));
        break;

      case 'rejected_1':
      case 'rejected_2':
        notifications.push(this.createNotification(
          'DOCUMENTS_REJECTED',
          application,
          'farmer'
        ));
        break;

      case 'audit_scheduled':
        notifications.push(this.createNotification(
          'AUDIT_SCHEDULED',
          application,
          'farmer'
        ));
        break;

      case 'audit_passed':
        notifications.push(this.createNotification(
          'AUDIT_PASSED',
          application,
          'farmer'
        ));
        break;

      case 'audit_failed':
        notifications.push(this.createNotification(
          'AUDIT_FAILED',
          application,
          'farmer'
        ));
        break;

      case 'certificate_issued':
        notifications.push(this.createNotification(
          'CERTIFICATE_ISSUED',
          application,
          'farmer'
        ));
        break;
    }

    return notifications;
  }

  /**
   * Create notification object
   */
  createNotification(templateName, application, recipientType, additionalData = {}) {
    const template = this.TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Get recipient information
    const recipient = this.getRecipientInfo(application, recipientType);
    
    // Prepare template data
    const templateData = {
      ...this.getApplicationData(application),
      ...additionalData,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone
    };

    return {
      id: this.generateNotificationId(),
      templateName,
      recipient,
      subject: this.processTemplate(template.subject, templateData),
      emailContent: this.processTemplate(template.email, templateData),
      smsContent: template.sms ? this.processTemplate(template.sms, templateData) : null,
      channels: this.getNotificationChannels(recipientType),
      priority: this.getNotificationPriority(templateName),
      scheduledAt: new Date(),
      status: 'pending'
    };
  }

  /**
   * Get recipient information based on type
   */
  getRecipientInfo(application, recipientType) {
    switch (recipientType) {
      case 'farmer':
        return {
          type: 'farmer',
          userId: application.farmerId,
          name: application.farmerDetails?.name || 'เกษตรกร',
          email: application.farmerDetails?.email || 'farmer@example.com',
          phone: application.farmerDetails?.phone || '',
          preferredLanguage: application.farmerDetails?.preferredLanguage || 'th'
        };

      case 'reviewer':
        return {
          type: 'reviewer',
          userId: application.assignedReviewer?.userId,
          name: application.assignedReviewer?.name || 'เจ้าหน้าที่ตรวจสอบ',
          email: application.assignedReviewer?.email || 'reviewer@example.com',
          phone: application.assignedReviewer?.phone || '',
          preferredLanguage: 'th'
        };

      case 'auditor':
        return {
          type: 'auditor',
          userId: application.assignedAuditor?.userId,
          name: application.assignedAuditor?.name || 'เจ้าหน้าที่ตรวจสอบภาคสนาม',
          email: application.assignedAuditor?.email || 'auditor@example.com',
          phone: application.assignedAuditor?.phone || '',
          preferredLanguage: 'th'
        };

      case 'approver':
        return {
          type: 'approver',
          userId: application.assignedApprover?.userId,
          name: application.assignedApprover?.name || 'ผู้อนุมัติ',
          email: application.assignedApprover?.email || 'approver@example.com',
          phone: application.assignedApprover?.phone || '',
          preferredLanguage: 'th'
        };

      case 'finance':
        return {
          type: 'finance',
          name: 'เจ้าหน้าที่การเงิน',
          email: 'finance@gacp.go.th',
          phone: '',
          preferredLanguage: 'th'
        };

      default:
        throw new Error(`Unknown recipient type: ${recipientType}`);
    }
  }

  /**
   * Get application data for templates
   */
  getApplicationData(application) {
    const latestPayment = application.paymentHistory?.[application.paymentHistory.length - 1];
    const latestReview = application.reviews?.[application.reviews.length - 1];
    const latestAudit = application.audits?.[application.audits.length - 1];

    return {
      applicationNumber: application.applicationNumber,
      farmerName: application.farmerDetails?.name || 'เกษตรกร',
      cropType: application.applicationDetails?.cropType || '',
      submissionDate: this.formatDate(application.timeline?.submittedAt),
      reviewDate: this.formatDate(latestReview?.reviewedAt),
      reviewerName: latestReview?.reviewerName || '',
      rejectionCount: application.rejectionCount || 0,
      rejectionReasons: this.formatRejectionReasons(application.reviews),
      nextActions: this.getNextActionsText(application),
      auditDate: this.formatDate(application.auditSchedule?.scheduledDate),
      auditTime: this.formatTime(application.auditSchedule?.scheduledDate),
      auditType: application.auditSchedule?.auditType || 'ออนไซต์',
      auditorName: application.assignedAuditor?.name || '',
      auditorPhone: application.assignedAuditor?.phone || '',
      auditScore: latestAudit?.overallScore || '',
      auditFindings: this.formatAuditFindings(latestAudit),
      recommendations: this.formatRecommendations(latestAudit),
      certificateNumber: application.approval?.certificateNumber || '',
      issuanceDate: this.formatDate(application.approval?.approvedAt),
      expiryDate: this.formatDate(application.approval?.expiryDate),
      processingTime: application.timeline?.totalProcessingTime || '',
      validityPeriod: '3',
      paymentAmount: latestPayment?.amount || '',
      dueDate: this.formatDate(latestPayment?.dueDate),
      overdueDays: this.calculateOverdueDays(latestPayment?.dueDate),
      finalDeadline: this.formatDate(this.calculateFinalDeadline(latestPayment?.dueDate)),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      paymentUrl: `${process.env.FRONTEND_URL}/payment/${application._id}`,
      certificateUrl: `${process.env.FRONTEND_URL}/certificate/${application._id}`,
      reviewUrl: `${process.env.FRONTEND_URL}/review/${application._id}`,
      paymentMethods: 'Internet Banking, PromptPay, เคาน์เตอร์ธนาคาร'
    };
  }

  /**
   * Process template with data substitution
   */
  processTemplate(template, data) {
    let processed = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    return processed;
  }

  /**
   * Get notification channels based on recipient type
   */
  getNotificationChannels(recipientType) {
    const channelMap = {
      farmer: ['email', 'sms', 'in_app'],
      reviewer: ['email', 'in_app'],
      auditor: ['email', 'in_app'],
      approver: ['email', 'in_app'],
      finance: ['email', 'in_app']
    };

    return channelMap[recipientType] || ['email'];
  }

  /**
   * Get notification priority
   */
  getNotificationPriority(templateName) {
    const highPriority = [
      'PAYMENT_REQUIRED_INITIAL',
      'PAYMENT_REQUIRED_AUDIT',
      'AUDIT_SCHEDULED',
      'CERTIFICATE_ISSUED',
      'REVIEW_DEADLINE_WARNING',
      'PAYMENT_OVERDUE'
    ];

    return highPriority.includes(templateName) ? 'high' : 'normal';
  }

  /**
   * Send notification through appropriate channels
   */
  async sendNotification(notification) {
    try {
      const results = {};

      for (const channel of notification.channels) {
        switch (channel) {
          case 'email':
            if (notification.recipient.email) {
              results.email = await this.sendEmail(notification);
            }
            break;

          case 'sms':
            if (notification.recipient.phone && notification.smsContent) {
              results.sms = await this.sendSMS(notification);
            }
            break;

          case 'in_app':
            results.in_app = await this.sendInAppNotification(notification);
            break;
        }
      }

      // Update notification status
      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.deliveryResults = results;

      // Store in history
      this.notificationHistory.set(notification.id, notification);

      logger.info('Notification sent successfully', {
        notificationId: notification.id,
        templateName: notification.templateName,
        recipient: notification.recipient.email,
        channels: notification.channels,
        results
      });

      return results;

    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      
      logger.error('Error sending notification', {
        notificationId: notification.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification) {
    try {
      const emailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gacp.go.th',
        to: notification.recipient.email,
        subject: notification.subject,
        html: this.formatEmailHTML(notification.emailContent),
        text: notification.emailContent
      };

      const result = await this.emailTransporter.sendMail(emailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SMS notification (mock implementation)
   */
  async sendSMS(notification) {
    try {
      // Mock SMS service - replace with real SMS gateway
      logger.info('SMS sent (mock)', {
        to: notification.recipient.phone,
        message: notification.smsContent
      });

      return {
        success: true,
        provider: 'mock',
        messageId: `sms_${Date.now()}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(notification) {
    try {
      // Store in-app notification in database or push to real-time service
      const inAppNotification = {
        userId: notification.recipient.userId,
        title: notification.subject,
        message: notification.emailContent.substring(0, 200) + '...',
        type: notification.templateName,
        priority: notification.priority,
        isRead: false,
        createdAt: new Date()
      };

      // Mock storage - replace with real database
      logger.info('In-app notification created', inAppNotification);

      return {
        success: true,
        notificationId: `app_${Date.now()}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format email content as HTML
   */
  formatEmailHTML(content) {
    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>การแจ้งเตือนระบบ GACP</title>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${process.env.FRONTEND_URL}/images/logo-gacp.png" alt="GACP Logo" style="height: 60px;">
                <h2 style="color: #2c5530; margin: 10px 0;">ระบบใบรับรองมาตรฐาน GACP</h2>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
                <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                <p>© 2024 กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Utility functions for data formatting
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRejectionReasons(reviews) {
    if (!reviews) return '';
    
    return reviews
      .filter(review => review.status === 'rejected')
      .map(review => `- ${review.comments || 'ไม่มีความเห็นเพิ่มเติม'}`)
      .join('\n');
  }

  getNextActionsText(application) {
    const rejectionCount = application.rejectionCount || 0;
    
    if (rejectionCount < 2) {
      return 'ปรับปรุงเอกสารและส่งใหม่ (ฟรี)';
    } else if (rejectionCount === 2) {
      return 'ปรับปรุงเอกสารและชำระค่าธรรมเนียม 5,000 บาท ก่อนส่งครั้งที่ 3';
    } else {
      return 'ติดต่อเจ้าหน้าที่เพื่อขอคำปรึกษา';
    }
  }

  formatAuditFindings(audit) {
    if (!audit?.findings) return '';
    
    return audit.findings
      .map(finding => `- ${finding.description}`)
      .join('\n');
  }

  formatRecommendations(audit) {
    if (!audit?.recommendations) return '';
    
    return audit.recommendations
      .map(rec => `- ${rec}`)
      .join('\n');
  }

  calculateOverdueDays(dueDate) {
    if (!dueDate) return 0;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  calculateFinalDeadline(dueDate) {
    if (!dueDate) return null;
    
    const finalDeadline = new Date(dueDate);
    finalDeadline.setDate(finalDeadline.getDate() + 30);
    
    return finalDeadline;
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Schedule notification reminders
   */
  async schedulePaymentReminders(application) {
    const paymentDueDate = application.paymentHistory?.find(p => p.status === 'pending')?.dueDate;
    
    if (!paymentDueDate) return;

    for (const daysBeforeSchedule of this.NOTIFICATION_RULES.PAYMENT_REMINDERS.schedules) {
      const reminderDate = new Date(paymentDueDate);
      reminderDate.setDate(reminderDate.getDate() + daysBeforeSchedule);

      if (reminderDate > new Date()) {
        // Schedule reminder (this would integrate with a job scheduler)
        logger.info('Payment reminder scheduled', {
          applicationId: application._id,
          reminderDate,
          daysBeforeSchedule
        });
      }
    }
  }

  /**
   * Get notification history for application
   */
  getNotificationHistory(applicationId) {
    const history = Array.from(this.notificationHistory.values())
      .filter(notif => notif.applicationId === applicationId)
      .sort((a, b) => b.scheduledAt - a.scheduledAt);

    return history;
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const notifications = Array.from(this.notificationHistory.values());
    
    return {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      byTemplate: this.groupByTemplate(notifications),
      byChannel: this.groupByChannel(notifications)
    };
  }

  groupByTemplate(notifications) {
    const groups = {};
    
    for (const notif of notifications) {
      groups[notif.templateName] = (groups[notif.templateName] || 0) + 1;
    }
    
    return groups;
  }

  groupByChannel(notifications) {
    const groups = { email: 0, sms: 0, in_app: 0 };
    
    for (const notif of notifications) {
      for (const channel of notif.channels) {
        groups[channel] = (groups[channel] || 0) + 1;
      }
    }
    
    return groups;
  }
}

module.exports = GACPNotificationService;