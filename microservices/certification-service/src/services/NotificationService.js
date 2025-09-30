const EventEmitter = require('events');
const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Enhanced GACP Notification Service
 * Complete notification system with multiple channels and comprehensive event handling
 */
class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.setupEmailTransporter();
    
    // Notification channels
    this.channels = {
      email: true,     // Email notifications
      sms: false,      // SMS service integration (placeholder)
      line: false,     // LINE Notify integration (placeholder)
      push: false,     // Push notification service (placeholder)
      database: true   // In-app notifications
    };
    
    // Define comprehensive notification templates
    this.templates = this.initializeTemplates();
    
    // Notification queue and processing
    this.notificationQueue = [];
    this.isProcessing = false;
    this.subscriptions = new Map(); // User notification preferences
    
    this.initializeEventHandlers();
  }

  /**
   * Setup email transporter
   */
  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
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
   * Initialize comprehensive notification templates
   */
  initializeTemplates() {
    return {
      // Application Events
      'application_submitted': {
        title: 'คำขอถูกส่งแล้ว',
        email: {
          subject: 'แจ้งเตือน: ได้รับคำขอใบอนุญาต GACP',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>ระบบได้รับคำขอใบอนุญาต GACP หมายเลข <strong>{{applicationNumber}}</strong> เรียบร้อยแล้ว</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 10px 0;">
              <h4>รายละเอียด:</h4>
              <ul>
                <li>หมายเลขคำขอ: {{applicationNumber}}</li>
                <li>วันที่ยื่นสมัคร: {{submissionDate}}</li>
                <li>สถานะปัจจุบัน: รอชำระค่าธรรมเนียม</li>
                <li>ค่าธรรมเนียมเบื้องต้น: 5,000 บาท</li>
              </ul>
            </div>
            <p>กรุณาชำระค่าธรรมเนียมภายใน 7 วัน เพื่อให้ระบบดำเนินการตรวจสอบเอกสารต่อไป</p>
            <p><a href="{{dashboardUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;">ติดตามสถานะ</a></p>
            <hr>
            <p><small>กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์</small></p>
          `
        },
        sms: 'แจ้งเตือน: ได้รับคำขอ GACP เลขที่ {{applicationNumber}} แล้ว กรุณาชำระค่าธรรมเนียม 5,000 บาท ภายใน 7 วัน',
        recipients: ['farmer'],
        priority: 'medium',
        channels: ['email', 'database']
      },
      
      'payment_required': {
        title: 'ต้องชำระค่าธรรมเนียม',
        email: {
          subject: 'แจ้งเตือน: กรุณาชำระค่าธรรมเนียม GACP',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>กรุณาชำระค่าธรรมเนียมสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong></p>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0;">
              <h4>รายการชำระเงิน:</h4>
              <ul>
                <li>ค่าธรรมเนียม: {{amount}} บาท</li>
                <li>ประเภท: {{paymentType}}</li>
                <li>กำหนดชำระ: ภายใน {{dueDate}}</li>
              </ul>
            </div>
            <p style="color: #d63031;"><strong>หมายเหตุ:</strong> หากไม่ชำระภายในกำหนด คำขอจะถูกยกเลิกอัตโนมัติ</p>
            <p><a href="{{paymentUrl}}" style="background-color: #00b894; color: white; padding: 10px 20px; text-decoration: none;">ชำระเงินทันที</a></p>
          `
        },
        sms: 'แจ้งเตือน: กรุณาชำระค่าธรรมเนียม {{amount}} บาท สำหรับ {{paymentType}} ภายใน {{dueDate}}',
        recipients: ['farmer'],
        priority: 'high',
        channels: ['email', 'sms', 'database']
      },

      'payment_completed': {
        title: 'ชำระเงินสำเร็จ',
        email: {
          subject: 'แจ้งเตือน: การชำระเงินสำเร็จ',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>การชำระเงินสำเร็จแล้ว</p>
            <div style="background-color: #d1ecf1; border: 1px solid #74b9ff; padding: 15px; margin: 10px 0;">
              <h4>รายละเอียดการชำระเงิน:</h4>
              <ul>
                <li>จำนวนเงิน: {{amount}} บาท</li>
                <li>เลขที่อ้างอิง: {{transactionId}}</li>
                <li>วันที่ชำระ: {{paymentDate}}</li>
                <li>สถานะ: ชำระเงินสำเร็จ</li>
              </ul>
            </div>
            <p>ระบบจะดำเนินการขั้นตอนต่อไปในวันทำการถัดไป</p>
          `
        },
        sms: 'ชำระเงิน {{amount}} บาท สำเร็จแล้ว อ้างอิง: {{transactionId}}',
        recipients: ['farmer', 'finance'],
        priority: 'medium',
        channels: ['email', 'database']
      },

      'review_assigned': {
        title: 'มีงานตรวจสอบใหม่',
        email: {
          subject: 'แจ้งเตือน: มีงานตรวจสอบเอกสารใหม่',
          html: `
            <h3>เรียน คุณ {{reviewerName}}</h3>
            <p>คุณได้รับมอบหมายให้ตรวจสอบเอกสารสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 10px 0;">
              <h4>รายละเอียดงาน:</h4>
              <ul>
                <li>หมายเลขคำขอ: {{applicationNumber}}</li>
                <li>ชื่อผู้สมัคร: {{farmerName}}</li>
                <li>วันที่มอบหมาย: {{assignedDate}}</li>
                <li>กำหนดเสร็จ: {{dueDate}}</li>
              </ul>
            </div>
            <p><a href="{{reviewUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;">เริ่มตรวจสอบ</a></p>
          `
        },
        recipients: ['reviewer'],
        priority: 'medium',
        channels: ['email', 'database']
      },

      'review_completed': {
        title: 'การตรวจสอบเสร็จสิ้น',
        email: {
          subject: 'แจ้งเตือน: การตรวจสอบเอกสารเสร็จสิ้น',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>การตรวจสอบเอกสารสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong> เสร็จสิ้นแล้ว</p>
            <div style="background-color: {{statusColor}}; padding: 15px; margin: 10px 0;">
              <h4>ผลการตรวจสอบ:</h4>
              <ul>
                <li>ผลการตรวจสอบ: {{result}}</li>
                <li>คะแนน: {{score}}/100</li>
                <li>วันที่ตรวจสอบ: {{reviewDate}}</li>
              </ul>
            </div>
            {{#if comments}}
            <div style="background-color: #fff3cd; padding: 15px; margin: 10px 0;">
              <h4>ข้อเสนอแนะ:</h4>
              <p>{{comments}}</p>
            </div>
            {{/if}}
            <p>ขั้นตอนต่อไป: {{nextStep}}</p>
          `
        },
        recipients: ['farmer'],
        priority: 'high',
        channels: ['email', 'database']
      },

      'audit_scheduled': {
        title: 'นัดหมายการตรวจสอบ',
        email: {
          subject: 'แจ้งเตือน: นัดหมายการตรวจสอบ GACP',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>การตรวจสอบสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong> ได้รับการนัดหมายแล้ว</p>
            <div style="background-color: #ffeaa7; border: 2px solid #fdcb6e; padding: 15px; margin: 10px 0;">
              <h4>รายละเอียดการนัดหมาย:</h4>
              <ul>
                <li>วันที่: {{auditDate}}</li>
                <li>เวลา: {{auditTime}}</li>
                <li>ประเภท: {{auditType}}</li>
                <li>ผู้ตรวจสอบ: {{auditorName}}</li>
                <li>สถานที่: {{location}}</li>
              </ul>
            </div>
            <div style="background-color: #ff7675; color: white; padding: 10px; margin: 10px 0;">
              <strong>สำคัญ:</strong> กรุณาเตรียมความพร้อมและเอกสารประกอบการตรวจสอบ
            </div>
            <p>หากมีข้อสงสัย กรุณาติดต่อ: {{contactInfo}}</p>
          `
        },
        sms: 'นัดหมายตรวจสอบ GACP วันที่ {{auditDate}} เวลา {{auditTime}} กรุณาเตรียมความพร้อม',
        recipients: ['farmer', 'auditor'],
        priority: 'high',
        channels: ['email', 'sms', 'database']
      },

      'audit_completed': {
        title: 'การตรวจสอบเสร็จสิ้น',
        email: {
          subject: 'แจ้งเตือน: ผลการตรวจสอบ GACP',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>การตรวจสอบสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong> เสร็จสิ้นแล้ว</p>
            <div style="background-color: {{resultColor}}; padding: 15px; margin: 10px 0; border-radius: 5px;">
              <h4>ผลการตรวจสอบ:</h4>
              <ul>
                <li>ผลการตรวจสอบ: <strong>{{result}}</strong></li>
                <li>คะแนนรวม: {{score}}/100</li>
                <li>วันที่ตรวจสอบ: {{auditDate}}</li>
                <li>ผู้ตรวจสอบ: {{auditorName}}</li>
              </ul>
            </div>
            {{#if passed}}
            <p style="color: #00b894;">🎉 ยินดีด้วย! คำขอของคุณผ่านการตรวจสอบ กำลังส่งต่อไปยังผู้อนุมัติ</p>
            {{else}}
            <div style="background-color: #fab1a0; padding: 15px; margin: 10px 0;">
              <h4>จุดที่ต้องปรับปรุง:</h4>
              <p>{{recommendations}}</p>
            </div>
            {{/if}}
          `
        },
        recipients: ['farmer'],
        priority: 'high',
        channels: ['email', 'sms', 'database']
      },

      'certificate_issued': {
        title: 'ใบอนุญาตออกแล้ว',
        email: {
          subject: 'ยินดีด้วย! ใบอนุญาต GACP ออกแล้ว',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <div style="background-color: #00b894; color: white; padding: 20px; text-align: center; margin: 20px 0;">
              <h2>🎉 ยินดีด้วย! 🎉</h2>
              <p>ใบอนุญาต GACP ของคุณออกแล้ว</p>
            </div>
            <div style="background-color: #dfe6e9; padding: 15px; margin: 10px 0;">
              <h4>รายละเอียดใบอนุญาต:</h4>
              <ul>
                <li>หมายเลขใบอนุญาต: <strong>{{certificateNumber}}</strong></li>
                <li>วันที่ออก: {{issueDate}}</li>
                <li>วันที่หมดอายุ: {{expiryDate}}</li>
                <li>ขอบเขตการอนุญาต: {{scope}}</li>
              </ul>
            </div>
            <p><a href="{{downloadUrl}}" style="background-color: #e17055; color: white; padding: 15px 25px; text-decoration: none; font-size: 16px;">📥 ดาวน์โหลดใบอนุญาต</a></p>
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p><strong>หมายเหตุ:</strong> กรุณาเก็บรักษาใบอนุญาตนี้ไว้เป็นหลักฐาน และต่ออายุก่อนวันหมดอายุ</p>
            </div>
          `
        },
        sms: 'ยินดีด้วย! ใบอนุญาต GACP หมายเลข {{certificateNumber}} ออกแล้ว กรุณาดาวน์โหลด',
        recipients: ['farmer'],
        priority: 'high',
        channels: ['email', 'sms', 'line', 'database']
      },

      'document_uploaded': {
        title: 'อัพโหลดเอกสารสำเร็จ',
        message: 'เอกสาร {{documentType}} อัพโหลดสำเร็จแล้ว',
        recipients: ['farmer'],
        priority: 'low',
        channels: ['database']
      },

      'documents_incomplete': {
        title: 'เอกสารไม่ครบถ้วน',
        email: {
          subject: 'แจ้งเตือน: เอกสารไม่ครบถ้วน',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <p>เอกสารสำหรับคำขอหมายเลข <strong>{{applicationNumber}}</strong> ยังไม่ครบถ้วน</p>
            <div style="background-color: #fab1a0; padding: 15px; margin: 10px 0;">
              <h4>เอกสารที่ขาดหายไป:</h4>
              <ul>
                {{#each missingDocuments}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            <p>กรุณาอัพโหลดเอกสารที่ขาดหายไปเพื่อดำเนินการต่อ</p>
            <p><a href="{{uploadUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;">อัพโหลดเอกสาร</a></p>
          `
        },
        recipients: ['farmer'],
        priority: 'medium',
        channels: ['email', 'database']
      },

      'deadline_reminder': {
        title: 'แจ้งเตือนกำหนดเวลา',
        email: {
          subject: 'แจ้งเตือน: กำหนดเวลาใกล้ครบ',
          html: `
            <h3>เรียน คุณ {{farmerName}}</h3>
            <div style="background-color: #fdcb6e; color: #2d3436; padding: 15px; margin: 10px 0; border-radius: 5px;">
              <h4>⏰ แจ้งเตือนกำหนดเวลา</h4>
              <p>{{deadline}} ใกล้ครบแล้ว เหลือเวลาอีก <strong>{{daysLeft}} วัน</strong></p>
            </div>
            <p>กรุณาดำเนินการให้เสร็จสิ้นภายในกำหนดเพื่อป้องกันการยกเลิกคำขอ</p>
            <p><a href="{{actionUrl}}" style="background-color: #e17055; color: white; padding: 10px 20px; text-decoration: none;">ดำเนินการทันที</a></p>
          `
        },
        sms: 'แจ้งเตือน: {{deadline}} ใกล้ครบแล้ว เหลือ {{daysLeft}} วัน กรุณาดำเนินการ',
        recipients: ['farmer'],
        priority: 'medium',
        channels: ['email', 'sms', 'database']
      }
    };
  }

  /**
   * Initialize event handlers for automatic notifications
   */
  initializeEventHandlers() {
    // Start notification queue processor
    setInterval(() => {
      this.processNotificationQueue();
    }, 5000); // Process every 5 seconds

    logger.info('Notification service initialized');
  }

  /**
   * Main notification method
   */
  async notify(eventType, data, options = {}) {
    try {
      const template = this.templates[eventType];
      if (!template) {
        throw new Error(`Unknown notification event: ${eventType}`);
      }

      const notification = await this.buildNotification(eventType, data, options);
      
      // Add to queue for processing
      this.notificationQueue.push(notification);
      
      // Process immediately if high priority
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        await this.processNotificationQueue();
      }

      logger.info('Notification queued', {
        eventType,
        recipients: notification.recipients,
        priority: notification.priority
      });

      return {
        success: true,
        notificationId: notification.id,
        eventType,
        recipients: notification.recipients.length
      };

    } catch (error) {
      logger.error('Notification failed', {
        eventType,
        error: error.message,
        data
      });
      throw error;
    }
  }

  /**
   * Build notification object
   */
  async buildNotification(eventType, data, options) {
    const template = this.templates[eventType];
    const notification = {
      id: this.generateNotificationId(),
      eventType,
      title: this.renderTemplate(template.title, data),
      priority: options.priority || template.priority,
      channels: options.channels || template.channels,
      recipients: await this.resolveRecipients(template.recipients, data),
      data: data,
      template: template,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending'
    };

    return notification;
  }

  /**
   * Resolve recipients based on template and data
   */
  async resolveRecipients(templateRecipients, data) {
    const recipients = [];

    for (const recipientType of templateRecipients) {
      switch (recipientType) {
        case 'farmer':
          if (data.applicantInfo?.userId) {
            recipients.push({
              userId: data.applicantInfo.userId,
              role: 'farmer',
              name: data.applicantInfo.name || data.farmerName,
              email: data.applicantInfo.email,
              phone: data.applicantInfo.phone,
              lineId: data.applicantInfo.lineId
            });
          }
          break;

        case 'reviewer':
          if (data.reviewerInfo?.userId) {
            recipients.push({
              userId: data.reviewerInfo.userId,
              role: 'reviewer',
              name: data.reviewerInfo.name,
              email: data.reviewerInfo.email,
              phone: data.reviewerInfo.phone
            });
          }
          break;

        case 'auditor':
          if (data.auditorInfo?.userId) {
            recipients.push({
              userId: data.auditorInfo.userId,
              role: 'auditor',
              name: data.auditorInfo.name,
              email: data.auditorInfo.email,
              phone: data.auditorInfo.phone
            });
          }
          break;

        case 'finance':
          recipients.push({
            userId: 'finance_team',
            role: 'finance',
            name: 'ทีมการเงิน',
            email: 'finance@gacp.go.th',
            phone: '+66800000001'
          });
          break;
      }
    }

    return recipients;
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      this.notificationQueue.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      // Process notifications
      const batchSize = 10;
      const batch = this.notificationQueue.splice(0, batchSize);

      for (const notification of batch) {
        try {
          await this.sendNotification(notification);
          notification.status = 'sent';
          
          // Save to database
          await this.saveNotificationToDatabase(notification);
          
        } catch (error) {
          notification.attempts++;
          notification.lastError = error.message;
          
          if (notification.attempts < notification.maxAttempts) {
            notification.status = 'retry';
            this.notificationQueue.push(notification);
          } else {
            notification.status = 'failed';
            await this.saveNotificationToDatabase(notification);
          }

          logger.error('Notification sending failed', {
            notificationId: notification.id,
            attempts: notification.attempts,
            error: error.message
          });
        }
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send notification through all channels
   */
  async sendNotification(notification) {
    const results = [];

    for (const channel of notification.channels) {
      if (!this.channels[channel]) continue;

      for (const recipient of notification.recipients) {
        try {
          let result;
          
          switch (channel) {
            case 'email':
              result = await this.sendEmail(notification, recipient);
              break;
            case 'sms':
              result = await this.sendSMS(notification, recipient);
              break;
            case 'line':
              result = await this.sendLineNotify(notification, recipient);
              break;
            case 'database':
              result = await this.saveInAppNotification(notification, recipient);
              break;
          }

          results.push({ channel, recipient: recipient.userId, success: true, result });

        } catch (error) {
          results.push({ 
            channel, 
            recipient: recipient.userId, 
            success: false, 
            error: error.message 
          });
        }
      }
    }

    notification.results = results;
    return results;
  }

  /**
   * Send email notification
   */
  async sendEmail(notification, recipient) {
    if (!recipient.email) {
      throw new Error('No email address available');
    }

    const template = notification.template;
    const emailContent = template.email || {
      subject: notification.title,
      html: `<h3>${notification.title}</h3><p>${this.renderTemplate(template.message || '', notification.data)}</p>`
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@gacp.go.th',
      to: recipient.email,
      subject: this.renderTemplate(emailContent.subject, { ...notification.data, ...recipient }),
      html: this.renderTemplate(emailContent.html, { ...notification.data, ...recipient })
    };

    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      logger.info('Email sent (development mode)', {
        to: recipient.email,
        subject: mailOptions.subject,
        notificationId: notification.id
      });
    } else {
      await this.emailTransporter.sendMail(mailOptions);
    }

    return {
      channel: 'email',
      to: recipient.email,
      messageId: `email_${notification.id}_${Date.now()}`,
      sentAt: new Date()
    };
  }

  /**
   * Send SMS notification (placeholder)
   */
  async sendSMS(notification, recipient) {
    if (!recipient.phone) {
      throw new Error('No phone number available');
    }

    const template = notification.template;
    const smsMessage = this.renderTemplate(
      template.sms || template.message || notification.title, 
      { ...notification.data, ...recipient }
    );

    logger.info('SMS sent (mock)', {
      to: recipient.phone,
      message: smsMessage.substring(0, 160),
      notificationId: notification.id
    });

    return {
      channel: 'sms',
      to: recipient.phone,
      messageId: `sms_${notification.id}_${Date.now()}`,
      sentAt: new Date()
    };
  }

  /**
   * Send LINE notification (placeholder)
   */
  async sendLineNotify(notification, recipient) {
    if (!recipient.lineId) {
      throw new Error('No LINE ID available');
    }

    logger.info('LINE notification sent (mock)', {
      to: recipient.lineId,
      message: `${notification.title}\n${this.renderTemplate(notification.template.message || '', notification.data)}`,
      notificationId: notification.id
    });

    return {
      channel: 'line',
      to: recipient.lineId,
      messageId: `line_${notification.id}_${Date.now()}`,
      sentAt: new Date()
    };
  }

  /**
   * Save in-app notification
   */
  async saveInAppNotification(notification, recipient) {
    // In production, this would save to MongoDB
    logger.info('In-app notification saved', {
      userId: recipient.userId,
      title: notification.title,
      notificationId: notification.id
    });

    return {
      channel: 'database',
      to: recipient.userId,
      savedAt: new Date()
    };
  }

  /**
   * Template rendering with variable substitution
   */
  renderTemplate(template, data) {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const keys = key.split('.');
      let value = data;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || match;
    });
  }

  /**
   * Generate unique notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save notification to database (placeholder)
   */
  async saveNotificationToDatabase(notification) {
    logger.info('Notification saved to database', {
      notificationId: notification.id,
      status: notification.status,
      attempts: notification.attempts
    });
  }

  /**
   * Public API methods
   */

  // Get notifications for user
  async getUserNotifications(userId, options = {}) {
    // Placeholder - in production would query MongoDB
    return {
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    logger.info('Notification marked as read', { notificationId, userId });
    return true;
  }

  // Send custom notification
  async sendCustomNotification(recipients, title, message, options = {}) {
    const notification = {
      id: this.generateNotificationId(),
      eventType: 'custom',
      title,
      template: {
        message: message,
        email: {
          subject: title,
          html: `<h3>${title}</h3><p>${message}</p>`
        }
      },
      priority: options.priority || 'medium',
      channels: options.channels || ['email', 'database'],
      recipients: recipients,
      data: options.data || {},
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending'
    };

    this.notificationQueue.push(notification);
    await this.processNotificationQueue();

    return notification.id;
  }
}

module.exports = NotificationService;