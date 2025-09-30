const mongoose = require('mongoose');

/**
 * In-App Notification Schema for GACP System
 * Stores notifications that appear in user dashboard
 */
const NotificationSchema = new mongoose.Schema({
  // Unique notification identifier
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // User who receives this notification
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Event type that triggered this notification
  eventType: {
    type: String,
    required: true,
    enum: [
      'application_submitted',
      'application_accepted', 
      'application_rejected',
      'payment_required',
      'payment_completed',
      'payment_failed',
      'review_assigned',
      'review_completed',
      'audit_scheduled',
      'audit_completed',
      'certificate_issued',
      'document_uploaded',
      'documents_incomplete',
      'deadline_reminder',
      'custom'
    ]
  },

  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },

  message: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  readAt: {
    type: Date
  },

  // Associated data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Application reference (if applicable)
  applicationId: {
    type: String,
    index: true
  },

  applicationNumber: {
    type: String,
    index: true
  },

  // Notification metadata
  metadata: {
    // Action URL for user to take action
    actionUrl: String,
    
    // Icon or type for UI display
    icon: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'document', 'payment', 'certificate'],
      default: 'info'
    },
    
    // Color scheme for UI
    color: {
      type: String,
      enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
      default: 'blue'
    },
    
    // Auto-dismiss timer (in seconds)
    autoDismiss: Number,
    
    // Whether notification requires action
    requiresAction: {
      type: Boolean,
      default: false
    }
  },

  // Expiry date for the notification
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ applicationId: 1, eventType: 1 });

// Virtual for notification age
NotificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for time since read
NotificationSchema.virtual('readAge').get(function() {
  if (!this.readAt) return null;
  return Date.now() - this.readAt.getTime();
});

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return Date.now() > this.expiresAt.getTime();
};

NotificationSchema.methods.getDisplayData = function() {
  return {
    id: this.notificationId,
    title: this.title,
    message: this.message,
    priority: this.priority,
    isRead: this.isRead,
    createdAt: this.createdAt,
    readAt: this.readAt,
    actionUrl: this.metadata?.actionUrl,
    icon: this.metadata?.icon || 'info',
    color: this.metadata?.color || 'blue',
    requiresAction: this.metadata?.requiresAction || false,
    applicationId: this.applicationId,
    applicationNumber: this.applicationNumber
  };
};

// Static methods
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

NotificationSchema.statics.getByPriority = function(userId, priority) {
  return this.find({ userId, priority, isRead: false })
    .sort({ createdAt: -1 });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

NotificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

NotificationSchema.statics.getUserNotificationStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        byPriority: {
          $push: {
            priority: '$priority',
            isRead: '$isRead'
          }
        },
        byEventType: {
          $push: {
            eventType: '$eventType',
            isRead: '$isRead'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        unread: 1,
        read: { $subtract: ['$total', '$unread'] },
        priorityStats: {
          urgent: {
            $size: {
              $filter: {
                input: '$byPriority',
                cond: { $eq: ['$$this.priority', 'urgent'] }
              }
            }
          },
          high: {
            $size: {
              $filter: {
                input: '$byPriority',
                cond: { $eq: ['$$this.priority', 'high'] }
              }
            }
          },
          medium: {
            $size: {
              $filter: {
                input: '$byPriority',
                cond: { $eq: ['$$this.priority', 'medium'] }
              }
            }
          },
          low: {
            $size: {
              $filter: {
                input: '$byPriority',
                cond: { $eq: ['$$this.priority', 'low'] }
              }
            }
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set default expiry (30 days for normal notifications, 7 days for low priority)
  if (!this.expiresAt) {
    const days = this.priority === 'low' ? 7 : 30;
    this.expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  }
  
  // Set default icon based on event type
  if (!this.metadata?.icon) {
    this.metadata = this.metadata || {};
    
    const iconMapping = {
      'payment_required': 'payment',
      'payment_completed': 'success',
      'payment_failed': 'error',
      'certificate_issued': 'certificate',
      'document_uploaded': 'document',
      'documents_incomplete': 'warning',
      'application_submitted': 'info',
      'application_accepted': 'success',
      'application_rejected': 'error',
      'review_assigned': 'info',
      'review_completed': 'success',
      'audit_scheduled': 'warning',
      'audit_completed': 'success',
      'deadline_reminder': 'warning'
    };
    
    this.metadata.icon = iconMapping[this.eventType] || 'info';
  }
  
  // Set default color based on priority
  if (!this.metadata?.color) {
    this.metadata = this.metadata || {};
    
    const colorMapping = {
      'urgent': 'red',
      'high': 'red',
      'medium': 'blue',
      'low': 'gray'
    };
    
    this.metadata.color = colorMapping[this.priority] || 'blue';
  }
  
  next();
});

// Post-save middleware for logging
NotificationSchema.post('save', function() {
  const logger = require('../services/logger');
  logger.info('Notification saved', {
    notificationId: this.notificationId,
    userId: this.userId,
    eventType: this.eventType,
    priority: this.priority
  });
});

module.exports = mongoose.model('Notification', NotificationSchema);