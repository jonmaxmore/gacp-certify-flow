const mongoose = require('mongoose');

// Enhanced Application Schema with Complete Payment Logic and Workflow
const enhancedApplicationSchema = new mongoose.Schema({
  // Basic Application Info
  applicationNumber: {
    type: String,
    unique: true,
    // Auto-generated: GACP-2025-000001
  },
  
  // Farmer Information (Reference to auth service)
  farmerId: {
    type: String, // Reference to auth service user ID
    required: true,
    index: true
  },
  
  // Enhanced Workflow Status with Payment Logic
  currentStatus: {
    type: String,
    enum: [
      'draft',              // Initial state
      'submitted',          // Farmer submitted application
      'payment_pending_1',  // Waiting for initial 5,000 THB payment
      'reviewing',          // Under document review
      'rejected',           // Document rejected (can happen 1-2 times free)
      'payment_pending_2',  // Waiting for 3rd review payment (5,000 THB)
      'auditing',           // Under audit process
      'audit_failed',       // Audit failed - need re-audit payment
      'audit_doubt',        // Audit result doubtful - need field audit
      'payment_pending_3',  // Waiting for audit/re-audit payment (25,000 THB)
      're_auditing',        // Re-audit after failure
      'field_auditing',     // Field audit after doubt
      'approval_pending',   // Waiting for final approval
      'approved',           // Application approved
      'certificate_issued', // Certificate generated and issued
      'rejected_final',     // Final rejection by approver
      'cancelled'           // Application cancelled
    ],
    default: 'draft',
    index: true
  },
  
  currentStage: {
    type: String,
    enum: [
      'document_submission',
      'payment_processing',
      'document_review',
      'audit_scheduling',
      'audit_execution',
      'final_approval',
      'certificate_generation',
      'completed',
      'cancelled'
    ],
    default: 'document_submission',
    index: true
  },
  
  // Rejection and Payment Tracking
  rejectionCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 10 // Reasonable upper limit
  },
  
  totalPayments: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Payment History with Enhanced Logic
  paymentHistory: [{
    amount: { type: Number, required: true },
    paymentType: {
      type: String,
      enum: ['document_review', 'audit_fee'],
      required: true
    },
    paymentReason: {
      type: String,
      enum: ['initial', '3rd_review', 'audit_fail', 'field_audit'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    gatewayTransactionId: String,
    gatewayReference: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    paidAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Application Data (กทล.1 form)
  applicantInfo: {
    organizationName: { type: String, required: true },
    ownerName: { type: String, required: true },
    address: {
      street: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: 'Thailand' }
    },
    contactInfo: {
      phoneNumber: String,
      email: String,
      lineId: String
    },
    taxId: String,
    organizationType: {
      type: String,
      enum: ['individual', 'company', 'cooperative', 'group'],
      required: true
    }
  },
  
  farmInfo: {
    farmName: { type: String, required: true },
    farmLocation: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: {
        street: String,
        district: String,
        province: String,
        postalCode: String
      }
    },
    farmArea: { 
      type: Number, 
      required: true,
      min: 0.1 // minimum 0.1 rai
    },
    farmType: {
      type: String,
      enum: ['organic', 'conventional', 'mixed'],
      required: true
    },
    waterSource: {
      type: String,
      enum: ['well', 'river', 'canal', 'rainwater', 'mixed']
    },
    soilType: String
  },
  
  cropInfo: {
    crops: [{
      scientificName: { type: String, required: true },
      commonName: { type: String, required: true },
      englishName: String,
      cropCategory: {
        type: String,
        enum: ['herb', 'spice', 'medicinal', 'aromatic', 'food'],
        required: true
      },
      usedFor: {
        type: String,
        enum: ['medicine', 'food', 'cosmetic', 'industrial', 'export'],
        required: true
      },
      cultivationArea: Number, // area in rai for this crop
      expectedYield: Number, // kg per year
      harvestSeason: [{
        type: String,
        enum: ['spring', 'summer', 'rainy', 'winter', 'year-round']
      }]
    }],
    totalCropArea: Number, // sum of all crop areas
    primaryCrop: String, // main crop for certification
    secondaryCrops: [String]
  },
  
  // Staff Assignments
  assignedReviewer: {
    userId: String, // Reference to auth service user
    assignedAt: Date,
    assignedBy: String
  },
  
  assignedAuditor: {
    userId: String,
    assignedAt: Date,
    assignedBy: String
  },
  
  assignedApprover: {
    userId: String,
    assignedAt: Date,
    assignedBy: String
  },
  
  // Document References
  documents: [{
    documentType: {
      type: String,
      enum: ['sop', 'coa', 'land_rights', 'farm_map', 'organic_certificate', 'other'],
      required: true
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: Number, // bytes
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  }],
  
  // Review History with Enhanced Tracking
  reviews: [{
    reviewerId: { type: String, required: true },
    reviewRound: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      required: true
    },
    checklist: {
      documentCompleteness: { type: Number, min: 0, max: 100 },
      sopCompliance: { type: Number, min: 0, max: 100 },
      coaValidity: { type: Number, min: 0, max: 100 },
      landRightsValid: { type: Number, min: 0, max: 100 },
      overallScore: { type: Number, min: 0, max: 100 }
    },
    comments: String,
    feedback: [{
      section: String, // Which part of application
      issue: String,   // What needs to be fixed
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    reviewedAt: { type: Date, default: Date.now }
  }],
  
  // Audit History with Field Audit Support
  audits: [{
    auditorId: { type: String, required: true },
    auditType: {
      type: String,
      enum: ['online', 'onsite', 'field'],
      required: true
    },
    auditRound: { type: Number, default: 1 },
    
    // Scheduling
    scheduledDate: Date,
    scheduledLocation: String,
    
    // Results
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled']
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'doubt']
    },
    
    // Detailed Findings
    auditChecklist: {
      gmpCompliance: { type: Number, min: 0, max: 100 },
      facilityStandards: { type: Number, min: 0, max: 100 },
      documentationAccuracy: { type: Number, min: 0, max: 100 },
      staffCompetency: { type: Number, min: 0, max: 100 },
      qualityControl: { type: Number, min: 0, max: 100 },
      overallScore: { type: Number, min: 0, max: 100 }
    },
    
    findings: [{
      category: String, // e.g., "Documentation", "Facility", "Process"
      finding: String,  // Description of finding
      severity: {
        type: String,
        enum: ['observation', 'minor', 'major', 'critical']
      },
      recommendation: String,
      photosPath: [String] // Array of photo file paths
    }],
    
    recommendations: String,
    auditReport: String, // Path to generated audit report
    conductedAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Approval Information
  approval: {
    approverId: String,
    decision: {
      type: String,
      enum: ['approved', 'rejected']
    },
    decisionReason: String,
    
    // Certificate Details (if approved)
    certificateNumber: String,
    certificateData: {
      issueDate: Date,
      expiryDate: Date,
      certificateType: {
        type: String,
        enum: ['gacp', 'organic', 'gap'],
        default: 'gacp'
      },
      scope: String, // What crops/activities are covered
      conditions: [String], // Any special conditions
      restrictions: [String] // Any restrictions
    },
    
    // Digital Certificate
    certificatePath: String, // PDF file path
    qrCodeData: String,      // QR code content for verification
    digitalSignature: {
      algorithm: String,
      signature: String,
      timestamp: Date,
      signerInfo: String
    },
    
    approvedAt: Date
  },
  
  // Complete Workflow History (Audit Trail)
  workflowHistory: [{
    fromStatus: String,
    toStatus: { type: String, required: true },
    fromStage: String,
    toStage: String,
    
    // Actor Info
    actorId: String,
    actorRole: {
      type: String,
      enum: ['farmer', 'reviewer', 'auditor', 'approver', 'system']
    },
    action: {
      type: String,
      enum: ['submit', 'pay', 'review', 'approve', 'reject', 'audit', 'cancel', 'auto']
    },
    
    // Context
    comments: String,
    metadata: mongoose.Schema.Types.Mixed, // Additional context data
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Timeline Tracking for Performance Metrics
  timeline: {
    submittedAt: Date,
    firstPaymentAt: Date,
    reviewStartedAt: Date,
    reviewCompletedAt: Date,
    auditScheduledAt: Date,
    auditCompletedAt: Date,
    approvalDecisionAt: Date,
    certificateIssuedAt: Date,
    
    // Calculated durations (in days)
    reviewDuration: Number,
    auditDuration: Number,
    totalProcessingTime: Number
  },
  
  // Metadata
  applicationVersion: { type: String, default: '1.0' },
  lastModifiedBy: String,
  isActive: { type: Boolean, default: true },
  
  // Auto-managed timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for payment requirements check
enhancedApplicationSchema.virtual('paymentRequired').get(function() {
  const result = {
    required: false,
    amount: 0,
    reason: '',
    type: ''
  };
  
  // Check for 3rd review payment (after 2 rejections)
  if (this.rejectionCount >= 2 && this.currentStatus === 'rejected') {
    result.required = true;
    result.amount = 5000;
    result.reason = '3rd_review';
    result.type = 'document_review';
  }
  
  // Check for audit payment
  if (['audit_failed', 'audit_doubt'].includes(this.currentStatus)) {
    result.required = true;
    result.amount = 25000;
    result.reason = this.currentStatus === 'audit_failed' ? 'audit_fail' : 'field_audit';
    result.type = 'audit_fee';
  }
  
  return result;
});

// Virtual for processing time calculation
enhancedApplicationSchema.virtual('processingTime').get(function() {
  if (!this.timeline.submittedAt) return 0;
  
  const endDate = this.timeline.certificateIssuedAt || new Date();
  const startDate = this.timeline.submittedAt;
  
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for current review status
enhancedApplicationSchema.virtual('currentReview').get(function() {
  if (this.reviews && this.reviews.length > 0) {
    return this.reviews[this.reviews.length - 1];
  }
  return null;
});

// Virtual for current audit status
enhancedApplicationSchema.virtual('currentAudit').get(function() {
  if (this.audits && this.audits.length > 0) {
    return this.audits[this.audits.length - 1];
  }
  return null;
});

// Pre-save middleware to generate application number
enhancedApplicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      applicationNumber: { $regex: `^GACP-${year}-` }
    });
    this.applicationNumber = `GACP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Update timeline when status changes
  if (this.isModified('currentStatus')) {
    const now = new Date();
    switch (this.currentStatus) {
      case 'submitted':
        if (!this.timeline.submittedAt) this.timeline.submittedAt = now;
        break;
      case 'reviewing':
        if (!this.timeline.reviewStartedAt) this.timeline.reviewStartedAt = now;
        break;
      case 'auditing':
        if (!this.timeline.auditScheduledAt) this.timeline.auditScheduledAt = now;
        break;
      case 'approved':
        this.timeline.approvalDecisionAt = now;
        break;
      case 'certificate_issued':
        this.timeline.certificateIssuedAt = now;
        // Calculate total processing time
        if (this.timeline.submittedAt) {
          this.timeline.totalProcessingTime = Math.ceil(
            (now - this.timeline.submittedAt) / (1000 * 60 * 60 * 24)
          );
        }
        break;
    }
  }
  
  next();
});

// Static methods for workflow management
enhancedApplicationSchema.statics.updateStatusWithHistory = async function(
  applicationId, 
  newStatus, 
  newStage, 
  actorInfo
) {
  const application = await this.findById(applicationId);
  if (!application) throw new Error('Application not found');
  
  const oldStatus = application.currentStatus;
  const oldStage = application.currentStage;
  
  // Update status
  application.currentStatus = newStatus;
  if (newStage) application.currentStage = newStage;
  
  // Add to workflow history
  application.workflowHistory.push({
    fromStatus: oldStatus,
    toStatus: newStatus,
    fromStage: oldStage,
    toStage: newStage || oldStage,
    ...actorInfo,
    timestamp: new Date()
  });
  
  return await application.save();
};

// Static method to get applications by role
enhancedApplicationSchema.statics.getByRole = function(userId, role) {
  const filter = { isActive: true };
  
  switch (role) {
    case 'farmer':
      filter.farmerId = userId;
      break;
    case 'reviewer':
      filter['assignedReviewer.userId'] = userId;
      filter.currentStatus = { $in: ['reviewing', 'rejected'] };
      break;
    case 'auditor':
      filter['assignedAuditor.userId'] = userId;
      filter.currentStatus = { $in: ['auditing', 'audit_failed', 'audit_doubt', 're_auditing', 'field_auditing'] };
      break;
    case 'approver':
      filter['assignedApprover.userId'] = userId;
      filter.currentStatus = 'approval_pending';
      break;
    default:
      return this.find({ _id: null }); // Return empty result
  }
  
  return this.find(filter).sort({ updatedAt: -1 });
};

// Instance methods
enhancedApplicationSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push(paymentData);
  if (paymentData.status === 'completed') {
    this.totalPayments += paymentData.amount;
    
    // Update timeline for first payment
    if (!this.timeline.firstPaymentAt) {
      this.timeline.firstPaymentAt = paymentData.paidAt || new Date();
    }
  }
  return this.save();
};

enhancedApplicationSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  if (reviewData.status === 'rejected') {
    this.rejectionCount += 1;
  }
  
  // Update timeline
  if (reviewData.status !== 'pending') {
    this.timeline.reviewCompletedAt = reviewData.reviewedAt;
    
    if (this.timeline.reviewStartedAt) {
      this.timeline.reviewDuration = Math.ceil(
        (reviewData.reviewedAt - this.timeline.reviewStartedAt) / (1000 * 60 * 60 * 24)
      );
    }
  }
  
  return this.save();
};

enhancedApplicationSchema.methods.addAudit = function(auditData) {
  this.audits.push(auditData);
  
  // Update timeline
  if (auditData.status === 'completed') {
    this.timeline.auditCompletedAt = auditData.conductedAt;
    
    if (this.timeline.auditScheduledAt) {
      this.timeline.auditDuration = Math.ceil(
        (auditData.conductedAt - this.timeline.auditScheduledAt) / (1000 * 60 * 60 * 24)
      );
    }
  }
  
  return this.save();
};

enhancedApplicationSchema.methods.canProceedToNextStage = function() {
  const paymentReq = this.paymentRequired;
  
  // If payment is required and not completed, cannot proceed
  if (paymentReq.required) {
    const lastPayment = this.paymentHistory
      .filter(p => p.paymentReason === paymentReq.reason)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    return lastPayment && lastPayment.status === 'completed';
  }
  
  return true;
};

enhancedApplicationSchema.methods.getNextStageInfo = function() {
  const statusFlows = {
    'draft': { next: 'submitted', stage: 'payment_processing', requiresPayment: true, amount: 5000 },
    'submitted': { next: 'payment_pending_1', stage: 'payment_processing', requiresPayment: true, amount: 5000 },
    'payment_pending_1': { next: 'reviewing', stage: 'document_review' },
    'reviewing': { next: 'auditing', stage: 'audit_scheduling' },
    'rejected': { 
      next: this.rejectionCount >= 2 ? 'payment_pending_2' : 'reviewing', 
      stage: this.rejectionCount >= 2 ? 'payment_processing' : 'document_review',
      requiresPayment: this.rejectionCount >= 2,
      amount: this.rejectionCount >= 2 ? 5000 : 0
    },
    'payment_pending_2': { next: 'reviewing', stage: 'document_review' },
    'auditing': { next: 'approval_pending', stage: 'final_approval' },
    'audit_failed': { next: 'payment_pending_3', stage: 'payment_processing', requiresPayment: true, amount: 25000 },
    'audit_doubt': { next: 'payment_pending_3', stage: 'payment_processing', requiresPayment: true, amount: 25000 },
    'payment_pending_3': { next: 're_auditing', stage: 'audit_execution' },
    're_auditing': { next: 'approval_pending', stage: 'final_approval' },
    'field_auditing': { next: 'approval_pending', stage: 'final_approval' },
    'approval_pending': { next: 'approved', stage: 'certificate_generation' },
    'approved': { next: 'certificate_issued', stage: 'completed' }
  };
  
  return statusFlows[this.currentStatus] || { next: null, stage: this.currentStage };
};

// Indexes for performance
enhancedApplicationSchema.index({ farmerId: 1, currentStatus: 1 });
enhancedApplicationSchema.index({ applicationNumber: 1 }, { unique: true });
enhancedApplicationSchema.index({ 'assignedReviewer.userId': 1, currentStatus: 1 });
enhancedApplicationSchema.index({ 'assignedAuditor.userId': 1, currentStatus: 1 });
enhancedApplicationSchema.index({ 'assignedApprover.userId': 1, currentStatus: 1 });
enhancedApplicationSchema.index({ currentStage: 1, currentStatus: 1 });
enhancedApplicationSchema.index({ rejectionCount: 1, currentStatus: 1 });
enhancedApplicationSchema.index({ totalPayments: 1 });
enhancedApplicationSchema.index({ createdAt: -1 });
enhancedApplicationSchema.index({ 'timeline.submittedAt': -1 });

module.exports = mongoose.model('EnhancedApplication', enhancedApplicationSchema);