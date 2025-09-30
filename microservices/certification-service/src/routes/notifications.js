const express = require('express');
const NotificationService = require('../services/NotificationService');
const roleAuth = require('../middleware/roleAuth');
const logger = require('../services/logger');

const router = express.Router();
const notificationService = new NotificationService();

// Get user notifications with pagination and filters
router.get('/user/:userId',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, isRead, priority } = req.query;

      // Check authorization - users can only view their own notifications
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        priority
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get user notifications failed', {
        error: error.message,
        userId: req.params.userId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Mark notification as read
router.patch('/:notificationId/read',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      const success = await notificationService.markAsRead(notificationId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

    } catch (error) {
      logger.error('Mark notification as read failed', {
        error: error.message,
        notificationId: req.params.notificationId,
        userId: req.user.userId
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Mark all notifications as read for user
router.patch('/user/:userId/read-all',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const count = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`,
        count
      });

    } catch (error) {
      logger.error('Mark all notifications as read failed', {
        error: error.message,
        userId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get notification statistics for user
router.get('/user/:userId/stats',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const stats = await notificationService.getNotificationStats(userId);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Get notification stats failed', {
        error: error.message,
        userId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Send custom notification (admin only)
router.post('/send',
  roleAuth(['admin']),
  async (req, res) => {
    try {
      const { recipients, title, message, options = {} } = req.body;

      if (!recipients || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Recipients, title, and message are required'
        });
      }

      const notificationId = await notificationService.sendCustomNotification(
        recipients,
        title,
        message,
        options
      );

      res.status(201).json({
        success: true,
        notificationId,
        message: 'Notification sent successfully'
      });

    } catch (error) {
      logger.error('Send custom notification failed', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Broadcast announcement (admin only)
router.post('/broadcast',
  roleAuth(['admin']),
  async (req, res) => {
    try {
      const { title, message, targetRoles = [], priority = 'medium' } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Title and message are required'
        });
      }

      const notificationId = await notificationService.broadcastAnnouncement(
        title,
        message,
        targetRoles,
        priority
      );

      res.status(201).json({
        success: true,
        notificationId,
        message: 'Announcement broadcasted successfully'
      });

    } catch (error) {
      logger.error('Broadcast announcement failed', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Send test notification (development/admin only)
router.post('/test',
  roleAuth(['admin']),
  async (req, res) => {
    try {
      const { eventType, data } = req.body;

      if (!eventType || !data) {
        return res.status(400).json({
          success: false,
          error: 'Event type and data are required'
        });
      }

      const result = await notificationService.notify(eventType, data);

      res.json({
        success: true,
        result,
        message: 'Test notification sent'
      });

    } catch (error) {
      logger.error('Send test notification failed', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update notification preferences
router.put('/user/:userId/preferences',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      // Check authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const success = await notificationService.updateNotificationPreferences(
        userId,
        preferences
      );

      if (success) {
        res.json({
          success: true,
          message: 'Notification preferences updated'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update preferences'
        });
      }

    } catch (error) {
      logger.error('Update notification preferences failed', {
        error: error.message,
        userId: req.params.userId,
        preferences: req.body
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get notification preferences
router.get('/user/:userId/preferences',
  roleAuth(['farmer', 'reviewer', 'auditor', 'approver', 'finance', 'admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const preferences = notificationService.getNotificationPreferences(userId);

      res.json({
        success: true,
        preferences
      });

    } catch (error) {
      logger.error('Get notification preferences failed', {
        error: error.message,
        userId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Webhook endpoint for external notification services
router.post('/webhook/:service',
  async (req, res) => {
    try {
      const { service } = req.params;
      const payload = req.body;

      logger.info('Notification webhook received', {
        service,
        payload
      });

      // Handle webhook based on service
      switch (service) {
        case 'email':
          // Handle email delivery status
          break;
        case 'sms':
          // Handle SMS delivery status
          break;
        case 'line':
          // Handle LINE delivery status
          break;
        default:
          logger.warn('Unknown webhook service', { service });
      }

      res.json({
        success: true,
        message: 'Webhook processed'
      });

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        service: req.params.service,
        payload: req.body
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get notification templates (admin only)
router.get('/templates',
  roleAuth(['admin']),
  async (req, res) => {
    try {
      const templates = notificationService.templates;

      // Return sanitized templates (without sensitive data)
      const sanitizedTemplates = {};
      for (const [key, template] of Object.entries(templates)) {
        sanitizedTemplates[key] = {
          title: template.title,
          recipients: template.recipients,
          priority: template.priority,
          channels: template.channels
        };
      }

      res.json({
        success: true,
        templates: sanitizedTemplates
      });

    } catch (error) {
      logger.error('Get notification templates failed', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;