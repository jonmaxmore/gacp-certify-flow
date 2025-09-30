// Complete Workflow Engine for GACP License Application
// Handles all scenarios, alternative flows, and error cases

const logger = require('../services/logger');

class WorkflowEngine {
  constructor() {
    this.EnhancedApplication = require('../models/EnhancedApplication');
  }

  // Main workflow state machine
  static WORKFLOW_STATES = {
    // Initial States
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    
    // Payment States
    PAYMENT_PENDING_1: 'payment_pending_1',      // Initial 5,000 THB
    PAYMENT_PENDING_2: 'payment_pending_2',      // 3rd review 5,000 THB  
    PAYMENT_PENDING_3: 'payment_pending_3',      // Audit 25,000 THB
    
    // Review States
    REVIEWING: 'reviewing',
    REJECTED: 'rejected',
    
    // Audit States
    AUDITING: 'auditing',
    AUDIT_FAILED: 'audit_failed',
    AUDIT_DOUBT: 'audit_doubt',
    RE_AUDITING: 're_auditing',
    FIELD_AUDITING: 'field_auditing',
    
    // Approval States
    APPROVAL_PENDING: 'approval_pending',
    APPROVED: 'approved',
    CERTIFICATE_ISSUED: 'certificate_issued',
    
    // Terminal States
    REJECTED_FINAL: 'rejected_final',
    CANCELLED: 'cancelled'
  };

  static STAGES = {
    DOCUMENT_SUBMISSION: 'document_submission',
    PAYMENT_PROCESSING: 'payment_processing',
    DOCUMENT_REVIEW: 'document_review',
    AUDIT_SCHEDULING: 'audit_scheduling',
    AUDIT_EXECUTION: 'audit_execution',
    FINAL_APPROVAL: 'final_approval',
    CERTIFICATE_GENERATION: 'certificate_generation',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  // Complete state transition rules with alternative flows
  static STATE_TRANSITIONS = {
    [this.WORKFLOW_STATES.DRAFT]: {
      [this.WORKFLOW_STATES.SUBMITTED]: {
        condition: 'hasRequiredDocuments',
        requiredRole: 'farmer',
        description: 'Submit application with complete documents'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'farmerCancelled',
        requiredRole: 'farmer',
        description: 'Cancel application'
      }
    },
    
    [this.WORKFLOW_STATES.SUBMITTED]: {
      [this.WORKFLOW_STATES.PAYMENT_PENDING_1]: {
        condition: 'documentsValidated',
        requiredRole: 'system',
        description: 'Documents validated, payment required'
      },
      [this.WORKFLOW_STATES.DRAFT]: {
        condition: 'documentsIncomplete',
        requiredRole: 'system',
        description: 'Documents incomplete, return to farmer'
      }
    },
    
    [this.WORKFLOW_STATES.PAYMENT_PENDING_1]: {
      [this.WORKFLOW_STATES.REVIEWING]: {
        condition: 'initialPaymentCompleted',
        requiredRole: 'system',
        description: 'Initial payment completed, start review'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'paymentExpired',
        requiredRole: 'system',
        description: 'Payment expired, cancel application'
      }
    },
    
    [this.WORKFLOW_STATES.REVIEWING]: {
      [this.WORKFLOW_STATES.AUDITING]: {
        condition: 'reviewApproved',
        requiredRole: 'reviewer',
        description: 'Review approved, proceed to audit'
      },
      [this.WORKFLOW_STATES.REJECTED]: {
        condition: 'reviewRejected',
        requiredRole: 'reviewer',
        description: 'Review rejected, return to farmer'
      }
    },
    
    [this.WORKFLOW_STATES.REJECTED]: {
      [this.WORKFLOW_STATES.REVIEWING]: {
        condition: 'rejectionCountLessThan2',
        requiredRole: 'farmer',
        description: 'Resubmit after correction (free retry)'
      },
      [this.WORKFLOW_STATES.PAYMENT_PENDING_2]: {
        condition: 'rejectionCountEquals2',
        requiredRole: 'farmer',
        description: '3rd attempt requires payment'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'farmerCancelled',
        requiredRole: 'farmer',
        description: 'Farmer cancels application'
      }
    },
    
    [this.WORKFLOW_STATES.PAYMENT_PENDING_2]: {
      [this.WORKFLOW_STATES.REVIEWING]: {
        condition: 'thirdReviewPaymentCompleted',
        requiredRole: 'system',
        description: '3rd review payment completed'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'paymentExpired',
        requiredRole: 'system',
        description: '3rd review payment expired'
      }
    },
    
    [this.WORKFLOW_STATES.AUDITING]: {
      [this.WORKFLOW_STATES.APPROVAL_PENDING]: {
        condition: 'auditPassed',
        requiredRole: 'auditor',
        description: 'Audit passed, forward to approver'
      },
      [this.WORKFLOW_STATES.AUDIT_FAILED]: {
        condition: 'auditFailed',
        requiredRole: 'auditor',
        description: 'Audit failed, re-audit required'
      },
      [this.WORKFLOW_STATES.AUDIT_DOUBT]: {
        condition: 'auditDoubt',
        requiredRole: 'auditor',
        description: 'Audit result doubtful, field audit required'
      }
    },
    
    [this.WORKFLOW_STATES.AUDIT_FAILED]: {
      [this.WORKFLOW_STATES.PAYMENT_PENDING_3]: {
        condition: 'auditFailedPaymentRequired',
        requiredRole: 'system',
        description: 'Re-audit payment required'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'farmerCancelled',
        requiredRole: 'farmer',
        description: 'Farmer cancels after audit failure'
      }
    },
    
    [this.WORKFLOW_STATES.AUDIT_DOUBT]: {
      [this.WORKFLOW_STATES.PAYMENT_PENDING_3]: {
        condition: 'fieldAuditPaymentRequired',
        requiredRole: 'system',
        description: 'Field audit payment required'
      }
    },
    
    [this.WORKFLOW_STATES.PAYMENT_PENDING_3]: {
      [this.WORKFLOW_STATES.RE_AUDITING]: {
        condition: 'reAuditPaymentCompleted',
        requiredRole: 'system',
        description: 'Re-audit payment completed'
      },
      [this.WORKFLOW_STATES.FIELD_AUDITING]: {
        condition: 'fieldAuditPaymentCompleted',
        requiredRole: 'system',
        description: 'Field audit payment completed'
      },
      [this.WORKFLOW_STATES.CANCELLED]: {
        condition: 'paymentExpired',
        requiredRole: 'system',
        description: 'Audit payment expired'
      }
    },
    
    [this.WORKFLOW_STATES.RE_AUDITING]: {
      [this.WORKFLOW_STATES.APPROVAL_PENDING]: {
        condition: 'reAuditPassed',
        requiredRole: 'auditor',
        description: 'Re-audit passed, forward to approver'
      },
      [this.WORKFLOW_STATES.AUDIT_FAILED]: {
        condition: 'reAuditFailed',
        requiredRole: 'auditor',
        description: 'Re-audit failed (max attempts reached)'
      }
    },
    
    [this.WORKFLOW_STATES.FIELD_AUDITING]: {
      [this.WORKFLOW_STATES.APPROVAL_PENDING]: {
        condition: 'fieldAuditPassed',
        requiredRole: 'auditor',
        description: 'Field audit passed, forward to approver'
      },
      [this.WORKFLOW_STATES.AUDIT_FAILED]: {
        condition: 'fieldAuditFailed',
        requiredRole: 'auditor',
        description: 'Field audit failed'
      }
    },
    
    [this.WORKFLOW_STATES.APPROVAL_PENDING]: {
      [this.WORKFLOW_STATES.APPROVED]: {
        condition: 'approverApproved',
        requiredRole: 'approver',
        description: 'Application approved by approver'
      },
      [this.WORKFLOW_STATES.REVIEWING]: {
        condition: 'approverRejected',
        requiredRole: 'approver',
        description: 'Approver rejected, return to reviewer'
      }
    },
    
    [this.WORKFLOW_STATES.APPROVED]: {
      [this.WORKFLOW_STATES.CERTIFICATE_ISSUED]: {
        condition: 'certificateGenerated',
        requiredRole: 'system',
        description: 'Certificate generated and issued'
      }
    }
  };

  // Alternative flow handlers for error scenarios
  static ALTERNATIVE_FLOWS = {
    // Document submission issues
    DOCUMENTS_INCOMPLETE: {
      from: [this.WORKFLOW_STATES.SUBMITTED],
      to: this.WORKFLOW_STATES.DRAFT,
      trigger: 'System validation fails',
      action: 'Return to farmer with missing document list'
    },
    
    DOCUMENTS_INVALID_FORMAT: {
      from: [this.WORKFLOW_STATES.SUBMITTED],
      to: this.WORKFLOW_STATES.DRAFT,
      trigger: 'Document format validation fails',
      action: 'Return to farmer with format requirements'
    },
    
    PAYMENT_GATEWAY_FAILURE: {
      from: [
        this.WORKFLOW_STATES.PAYMENT_PENDING_1,
        this.WORKFLOW_STATES.PAYMENT_PENDING_2,
        this.WORKFLOW_STATES.PAYMENT_PENDING_3
      ],
      to: 'SAME_STATE',
      trigger: 'Payment gateway error',
      action: 'Retry payment with different gateway or manual intervention'
    },
    
    // Review process issues
    REVIEWER_UNAVAILABLE: {
      from: [this.WORKFLOW_STATES.REVIEWING],
      to: this.WORKFLOW_STATES.REVIEWING,
      trigger: 'No reviewers available',
      action: 'Queue for next available reviewer'
    },
    
    MAX_REJECTIONS_REACHED: {
      from: [this.WORKFLOW_STATES.REJECTED],
      to: this.WORKFLOW_STATES.REJECTED_FINAL,
      trigger: 'More than 3 rejections',
      action: 'Final rejection, manual review required'
    },
    
    // Audit process issues
    AUDITOR_UNAVAILABLE: {
      from: [this.WORKFLOW_STATES.AUDITING],
      to: this.WORKFLOW_STATES.AUDITING,
      trigger: 'No auditors available',
      action: 'Queue for next available auditor'
    },
    
    AUDIT_CANNOT_PROCEED: {
      from: [this.WORKFLOW_STATES.AUDITING],
      to: this.WORKFLOW_STATES.AUDIT_DOUBT,
      trigger: 'Cannot complete audit remotely',
      action: 'Force field audit requirement'
    },
    
    // System issues
    SYSTEM_DOWNTIME: {
      from: 'ANY_STATE',
      to: 'SAME_STATE',
      trigger: 'System maintenance or downtime',
      action: 'Pause workflow, resume when system returns'
    },
    
    ROLE_MISMATCH: {
      from: 'ANY_STATE',
      to: 'SAME_STATE',
      trigger: 'User role mismatch',
      action: 'Block action, notify administrators'
    }
  };

  // Transition condition validators
  static CONDITIONS = {
    hasRequiredDocuments: (application) => {
      const requiredTypes = ['sop', 'coa', 'land_rights'];
      const uploadedTypes = application.documents
        ?.filter(doc => doc.isActive)
        ?.map(doc => doc.documentType) || [];
      
      return requiredTypes.every(type => uploadedTypes.includes(type));
    },

    documentsValidated: (application) => {
      // System validation: check file formats, sizes, content validation
      const documents = application.documents?.filter(doc => doc.isActive) || [];
      
      // Check if all required documents are present and valid
      const validationResults = documents.map(doc => {
        return {
          type: doc.documentType,
          valid: doc.fileSize > 0 && doc.fileSize < 10 * 1024 * 1024, // Max 10MB
          format: ['pdf', 'jpg', 'png'].includes(doc.mimeType?.split('/')[1])
        };
      });
      
      return validationResults.every(result => result.valid && result.format);
    },

    documentsIncomplete: (application) => {
      return !this.CONDITIONS.hasRequiredDocuments(application) || 
             !this.CONDITIONS.documentsValidated(application);
    },

    initialPaymentCompleted: (application) => {
      return application.paymentHistory?.some(p => 
        p.paymentReason === 'initial' && p.status === 'completed'
      );
    },

    reviewApproved: (application, context) => {
      const lastReview = application.reviews?.[application.reviews.length - 1];
      return lastReview?.status === 'approved' && lastReview?.checklist?.overallScore >= 70;
    },

    reviewRejected: (application, context) => {
      const lastReview = application.reviews?.[application.reviews.length - 1];
      return lastReview?.status === 'rejected';
    },

    rejectionCountLessThan2: (application) => {
      return application.rejectionCount < 2;
    },

    rejectionCountEquals2: (application) => {
      return application.rejectionCount >= 2;
    },

    thirdReviewPaymentCompleted: (application) => {
      return application.paymentHistory?.some(p => 
        p.paymentReason === '3rd_review' && p.status === 'completed'
      );
    },

    auditPassed: (application, context) => {
      const lastAudit = application.audits?.[application.audits.length - 1];
      return lastAudit?.result === 'pass' && lastAudit?.auditChecklist?.overallScore >= 80;
    },

    auditFailed: (application, context) => {
      const lastAudit = application.audits?.[application.audits.length - 1];
      return lastAudit?.result === 'fail' || lastAudit?.auditChecklist?.overallScore < 60;
    },

    auditDoubt: (application, context) => {
      const lastAudit = application.audits?.[application.audits.length - 1];
      return lastAudit?.result === 'doubt' || 
             (lastAudit?.auditChecklist?.overallScore >= 60 && lastAudit?.auditChecklist?.overallScore < 80);
    },

    auditFailedPaymentRequired: (application) => {
      // Check if this is not the first audit failure
      const auditFailures = application.audits?.filter(a => a.result === 'fail').length || 0;
      return auditFailures > 0;
    },

    fieldAuditPaymentRequired: (application) => {
      return true; // Always require payment for field audit
    },

    reAuditPaymentCompleted: (application) => {
      return application.paymentHistory?.some(p => 
        p.paymentReason === 'audit_fail' && p.status === 'completed'
      );
    },

    fieldAuditPaymentCompleted: (application) => {
      return application.paymentHistory?.some(p => 
        p.paymentReason === 'field_audit' && p.status === 'completed'
      );
    },

    reAuditPassed: (application, context) => {
      return this.CONDITIONS.auditPassed(application, context);
    },

    reAuditFailed: (application, context) => {
      return this.CONDITIONS.auditFailed(application, context);
    },

    fieldAuditPassed: (application, context) => {
      return this.CONDITIONS.auditPassed(application, context);
    },

    fieldAuditFailed: (application, context) => {
      return this.CONDITIONS.auditFailed(application, context);
    },

    approverApproved: (application, context) => {
      return application.approval?.decision === 'approved';
    },

    approverRejected: (application, context) => {
      return application.approval?.decision === 'rejected';
    },

    certificateGenerated: (application) => {
      return application.approval?.certificatePath && application.approval?.certificateNumber;
    },

    paymentExpired: (application) => {
      // Check if payment has been pending for too long (7 days)
      const submissionDate = application.timeline?.submittedAt || application.createdAt;
      const daysSinceSubmission = (new Date() - new Date(submissionDate)) / (1000 * 60 * 60 * 24);
      return daysSinceSubmission > 7;
    },

    farmerCancelled: (application, context) => {
      return context?.action === 'cancel' && context?.reason;
    }
  };

  // Execute state transition with full validation and error handling
  async transition(applicationId, toState, actorInfo, context = {}) {
    try {
      const application = await this.EnhancedApplication.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const fromState = application.currentStatus;
      
      // Check if this is a system recovery transition
      if (context.isRecovery) {
        return await this.executeRecoveryTransition(application, toState, actorInfo, context);
      }

      // Validate transition
      const validation = await this.validateTransition(
        application, fromState, toState, actorInfo, context
      );

      if (!validation.valid) {
        // Try alternative flows if main transition fails
        const alternativeFlow = await this.findAlternativeFlow(
          application, fromState, toState, validation.reason
        );
        
        if (alternativeFlow) {
          return await this.executeAlternativeFlow(application, alternativeFlow, actorInfo, context);
        }
        
        throw new Error(`Transition failed: ${validation.reason}`);
      }

      // Execute main transition
      return await this.executeTransition(application, fromState, toState, actorInfo, context);

    } catch (error) {
      logger.error('Workflow transition failed', {
        applicationId,
        error: error.message,
        stack: error.stack
      });

      // Attempt error recovery
      await this.handleTransitionError(applicationId, error, context);
      throw error;
    }
  }

  // Validate transition with comprehensive checks
  async validateTransition(application, fromState, toState, actorInfo, context) {
    // Check if transition exists
    const transitions = WorkflowEngine.STATE_TRANSITIONS[fromState];
    if (!transitions || !transitions[toState]) {
      return {
        valid: false,
        reason: `No valid transition from ${fromState} to ${toState}`,
        code: 'INVALID_TRANSITION'
      };
    }

    const transition = transitions[toState];

    // Check role authorization
    if (transition.requiredRole !== 'system' && 
        transition.requiredRole !== actorInfo.actorRole) {
      return {
        valid: false,
        reason: `Role ${actorInfo.actorRole} not authorized. Required: ${transition.requiredRole}`,
        code: 'UNAUTHORIZED_ROLE'
      };
    }

    // Check condition
    if (transition.condition) {
      const conditionFunction = WorkflowEngine.CONDITIONS[transition.condition];
      if (!conditionFunction) {
        return {
          valid: false,
          reason: `Unknown condition: ${transition.condition}`,
          code: 'UNKNOWN_CONDITION'
        };
      }

      try {
        const conditionMet = conditionFunction(application, context);
        if (!conditionMet) {
          return {
            valid: false,
            reason: `Condition not met: ${transition.condition}`,
            code: 'CONDITION_NOT_MET',
            condition: transition.condition
          };
        }
      } catch (conditionError) {
        return {
          valid: false,
          reason: `Condition evaluation failed: ${conditionError.message}`,
          code: 'CONDITION_ERROR'
        };
      }
    }

    // Additional business rule validations
    const businessValidation = await this.validateBusinessRules(application, fromState, toState, context);
    if (!businessValidation.valid) {
      return businessValidation;
    }

    return { valid: true };
  }

  // Business rule validations
  async validateBusinessRules(application, fromState, toState, context) {
    // Prevent audit without completed review
    if (toState === WorkflowEngine.WORKFLOW_STATES.AUDITING) {
      const hasApprovedReview = application.reviews?.some(r => r.status === 'approved');
      if (!hasApprovedReview) {
        return {
          valid: false,
          reason: 'Cannot proceed to audit without approved review',
          code: 'REVIEW_NOT_APPROVED'
        };
      }
    }

    // Prevent payment for audit if review not passed
    if (toState === WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_3) {
      const reviewPassed = application.reviews?.some(r => r.status === 'approved');
      if (!reviewPassed) {
        return {
          valid: false,
          reason: 'Cannot pay for audit - documents have not passed review',
          code: 'REVIEW_NOT_PASSED'
        };
      }
    }

    // Check maximum rejection limit
    if (fromState === WorkflowEngine.WORKFLOW_STATES.REJECTED && 
        application.rejectionCount >= 3) {
      return {
        valid: false,
        reason: 'Maximum rejection limit reached',
        code: 'MAX_REJECTIONS'
      };
    }

    // Prevent duplicate payments
    if (toState.includes('PAYMENT_PENDING')) {
      const paymentType = this.getPaymentTypeForState(toState);
      const existingPayment = application.paymentHistory?.find(p => 
        p.paymentReason === paymentType.reason && p.status === 'completed'
      );
      
      if (existingPayment) {
        return {
          valid: false,
          reason: 'Payment already completed for this requirement',
          code: 'DUPLICATE_PAYMENT'
        };
      }
    }

    return { valid: true };
  }

  // Execute successful transition
  async executeTransition(application, fromState, toState, actorInfo, context) {
    const newStage = this.getStageForState(toState);

    // Update application with transaction
    const updatedApplication = await this.EnhancedApplication.updateStatusWithHistory(
      application._id,
      toState,
      newStage,
      {
        ...actorInfo,
        metadata: { ...context, transitionType: 'normal' }
      }
    );

    // Execute post-transition actions
    await this.executePostTransitionActions(
      updatedApplication, fromState, toState, actorInfo, context
    );

    logger.info('Workflow transition executed successfully', {
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      fromState,
      toState,
      newStage,
      actor: actorInfo
    });

    return {
      success: true,
      application: updatedApplication,
      transition: { fromState, toState, newStage, type: 'normal' }
    };
  }

  // Find and execute alternative flows
  async findAlternativeFlow(application, fromState, toState, failureReason) {
    const alternativeFlows = Object.values(WorkflowEngine.ALTERNATIVE_FLOWS);
    
    return alternativeFlows.find(flow => {
      return flow.from.includes(fromState) || flow.from.includes('ANY_STATE');
    });
  }

  async executeAlternativeFlow(application, alternativeFlow, actorInfo, context) {
    const newState = alternativeFlow.to === 'SAME_STATE' ? 
      application.currentStatus : alternativeFlow.to;

    logger.warn('Executing alternative workflow', {
      applicationId: application._id,
      trigger: alternativeFlow.trigger,
      action: alternativeFlow.action,
      fromState: application.currentStatus,
      toState: newState
    });

    // Execute alternative action
    await this.executeAlternativeAction(application, alternativeFlow, context);

    // Update state if needed
    if (newState !== application.currentStatus) {
      return await this.executeTransition(application, application.currentStatus, newState, {
        ...actorInfo,
        actorRole: 'system'
      }, {
        ...context,
        alternativeFlow: true,
        trigger: alternativeFlow.trigger
      });
    }

    return {
      success: true,
      application,
      transition: { 
        fromState: application.currentStatus, 
        toState: newState, 
        type: 'alternative',
        trigger: alternativeFlow.trigger 
      }
    };
  }

  // Execute alternative actions
  async executeAlternativeAction(application, alternativeFlow, context) {
    switch (alternativeFlow.trigger) {
      case 'System validation fails':
        await this.notifyFarmerOfMissingDocuments(application);
        break;
        
      case 'Payment gateway error':
        await this.initiateFallbackPaymentMethod(application, context);
        break;
        
      case 'No reviewers available':
        await this.queueForNextAvailableReviewer(application);
        break;
        
      case 'System maintenance or downtime':
        await this.pauseWorkflowForMaintenance(application);
        break;
        
      default:
        logger.warn('Unknown alternative flow trigger', {
          trigger: alternativeFlow.trigger,
          applicationId: application._id
        });
    }
  }

  // Recovery and error handling
  async executeRecoveryTransition(application, toState, actorInfo, context) {
    logger.info('Executing recovery transition', {
      applicationId: application._id,
      toState,
      recoveryReason: context.recoveryReason
    });

    // Skip normal validations for recovery
    const newStage = this.getStageForState(toState);
    
    const updatedApplication = await this.EnhancedApplication.updateStatusWithHistory(
      application._id,
      toState,
      newStage,
      {
        ...actorInfo,
        metadata: { ...context, transitionType: 'recovery' }
      }
    );

    return {
      success: true,
      application: updatedApplication,
      transition: { 
        fromState: application.currentStatus, 
        toState, 
        newStage, 
        type: 'recovery' 
      }
    };
  }

  async handleTransitionError(applicationId, error, context) {
    try {
      logger.error('Handling workflow transition error', {
        applicationId,
        error: error.message,
        context
      });

      // Categorize error and attempt recovery
      if (error.message.includes('Payment')) {
        await this.recoverPaymentError(applicationId, context);
      } else if (error.message.includes('Assignment')) {
        await this.recoverAssignmentError(applicationId, context);
      } else if (error.message.includes('CONDITION_NOT_MET')) {
        await this.recoverConditionError(applicationId, context);
      } else {
        // Generic error - notify administrators
        await this.notifySystemAdministrators(applicationId, error, context);
      }

    } catch (recoveryError) {
      logger.error('Error recovery failed', {
        applicationId,
        originalError: error.message,
        recoveryError: recoveryError.message
      });
    }
  }

  // Utility methods
  getStageForState(state) {
    const stageMapping = {
      [WorkflowEngine.WORKFLOW_STATES.DRAFT]: WorkflowEngine.STAGES.DOCUMENT_SUBMISSION,
      [WorkflowEngine.WORKFLOW_STATES.SUBMITTED]: WorkflowEngine.STAGES.PAYMENT_PROCESSING,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_1]: WorkflowEngine.STAGES.PAYMENT_PROCESSING,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_2]: WorkflowEngine.STAGES.PAYMENT_PROCESSING,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_3]: WorkflowEngine.STAGES.PAYMENT_PROCESSING,
      [WorkflowEngine.WORKFLOW_STATES.REVIEWING]: WorkflowEngine.STAGES.DOCUMENT_REVIEW,
      [WorkflowEngine.WORKFLOW_STATES.REJECTED]: WorkflowEngine.STAGES.DOCUMENT_REVIEW,
      [WorkflowEngine.WORKFLOW_STATES.AUDITING]: WorkflowEngine.STAGES.AUDIT_SCHEDULING,
      [WorkflowEngine.WORKFLOW_STATES.AUDIT_FAILED]: WorkflowEngine.STAGES.AUDIT_EXECUTION,
      [WorkflowEngine.WORKFLOW_STATES.AUDIT_DOUBT]: WorkflowEngine.STAGES.AUDIT_EXECUTION,
      [WorkflowEngine.WORKFLOW_STATES.RE_AUDITING]: WorkflowEngine.STAGES.AUDIT_EXECUTION,
      [WorkflowEngine.WORKFLOW_STATES.FIELD_AUDITING]: WorkflowEngine.STAGES.AUDIT_EXECUTION,
      [WorkflowEngine.WORKFLOW_STATES.APPROVAL_PENDING]: WorkflowEngine.STAGES.FINAL_APPROVAL,
      [WorkflowEngine.WORKFLOW_STATES.APPROVED]: WorkflowEngine.STAGES.CERTIFICATE_GENERATION,
      [WorkflowEngine.WORKFLOW_STATES.CERTIFICATE_ISSUED]: WorkflowEngine.STAGES.COMPLETED,
      [WorkflowEngine.WORKFLOW_STATES.REJECTED_FINAL]: WorkflowEngine.STAGES.CANCELLED,
      [WorkflowEngine.WORKFLOW_STATES.CANCELLED]: WorkflowEngine.STAGES.CANCELLED
    };

    return stageMapping[state] || WorkflowEngine.STAGES.DOCUMENT_SUBMISSION;
  }

  getPaymentTypeForState(state) {
    const paymentMapping = {
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_1]: { 
        amount: 5000, 
        type: 'document_review', 
        reason: 'initial' 
      },
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_2]: { 
        amount: 5000, 
        type: 'document_review', 
        reason: '3rd_review' 
      },
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_3]: { 
        amount: 25000, 
        type: 'audit_fee', 
        reason: 'audit_fail' 
      }
    };

    return paymentMapping[state] || null;
  }

  // Post-transition action execution
  async executePostTransitionActions(application, fromState, toState, actorInfo, context) {
    try {
      // Send notifications
      await this.sendTransitionNotifications(application, fromState, toState, actorInfo);

      // Handle state-specific actions
      switch (toState) {
        case WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_1:
        case WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_2:
        case WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_3:
          await this.handlePaymentRequired(application, toState);
          break;

        case WorkflowEngine.WORKFLOW_STATES.REVIEWING:
          await this.handleReviewAssignment(application);
          break;

        case WorkflowEngine.WORKFLOW_STATES.AUDITING:
        case WorkflowEngine.WORKFLOW_STATES.RE_AUDITING:
        case WorkflowEngine.WORKFLOW_STATES.FIELD_AUDITING:
          await this.handleAuditAssignment(application);
          break;

        case WorkflowEngine.WORKFLOW_STATES.APPROVAL_PENDING:
          await this.handleApprovalAssignment(application);
          break;

        case WorkflowEngine.WORKFLOW_STATES.APPROVED:
          await this.handleApprovalActions(application);
          break;

        case WorkflowEngine.WORKFLOW_STATES.CERTIFICATE_ISSUED:
          await this.handleCertificateIssued(application);
          break;

        case WorkflowEngine.WORKFLOW_STATES.CANCELLED:
          await this.handleCancellation(application);
          break;
      }

    } catch (error) {
      logger.error('Post-transition actions failed', {
        applicationId: application._id,
        fromState,
        toState,
        error: error.message
      });
      // Don't throw - transition already completed
    }
  }

  // Public API methods
  async getWorkflowStatus(applicationId) {
    const application = await this.EnhancedApplication.findById(applicationId);
    if (!application) return null;

    return {
      currentState: application.currentStatus,
      currentStage: application.currentStage,
      paymentRequired: application.paymentRequired,
      canProceed: application.canProceedToNextStage(),
      nextSteps: this.getNextSteps(application),
      alternativeOptions: this.getAlternativeOptions(application),
      workflowProgress: this.calculateWorkflowProgress(application)
    };
  }

  getNextSteps(application) {
    const steps = [];
    const required = application.paymentRequired;

    if (required.required) {
      steps.push({
        action: 'payment',
        description: `Pay ${required.amount.toLocaleString()} THB for ${required.type}`,
        amount: required.amount,
        reason: required.reason,
        priority: 'high'
      });
    }

    // Add state-specific next steps
    switch (application.currentStatus) {
      case WorkflowEngine.WORKFLOW_STATES.DRAFT:
        steps.push({ 
          action: 'submit', 
          description: 'Submit application for review',
          priority: 'medium'
        });
        break;
      case WorkflowEngine.WORKFLOW_STATES.REJECTED:
        steps.push({ 
          action: 'revise', 
          description: 'Revise documents based on feedback',
          priority: 'high'
        });
        break;
      case WorkflowEngine.WORKFLOW_STATES.CERTIFICATE_ISSUED:
        steps.push({ 
          action: 'download', 
          description: 'Download your certificate',
          priority: 'low'
        });
        break;
    }

    return steps;
  }

  getAlternativeOptions(application) {
    const options = [];

    // Add cancellation option if applicable
    if ([
      WorkflowEngine.WORKFLOW_STATES.DRAFT,
      WorkflowEngine.WORKFLOW_STATES.REJECTED,
      WorkflowEngine.WORKFLOW_STATES.AUDIT_FAILED
    ].includes(application.currentStatus)) {
      options.push({
        action: 'cancel',
        description: 'Cancel application',
        consequences: 'All progress will be lost. Payments may be refunded.'
      });
    }

    return options;
  }

  calculateWorkflowProgress(application) {
    const totalSteps = 8; // Total number of main workflow steps
    let completedSteps = 0;

    const progressMapping = {
      [WorkflowEngine.WORKFLOW_STATES.DRAFT]: 0,
      [WorkflowEngine.WORKFLOW_STATES.SUBMITTED]: 1,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_1]: 1,
      [WorkflowEngine.WORKFLOW_STATES.REVIEWING]: 2,
      [WorkflowEngine.WORKFLOW_STATES.REJECTED]: 1.5,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_2]: 1.5,
      [WorkflowEngine.WORKFLOW_STATES.AUDITING]: 4,
      [WorkflowEngine.WORKFLOW_STATES.AUDIT_FAILED]: 3.5,
      [WorkflowEngine.WORKFLOW_STATES.AUDIT_DOUBT]: 3.5,
      [WorkflowEngine.WORKFLOW_STATES.PAYMENT_PENDING_3]: 3.5,
      [WorkflowEngine.WORKFLOW_STATES.RE_AUDITING]: 4,
      [WorkflowEngine.WORKFLOW_STATES.FIELD_AUDITING]: 4,
      [WorkflowEngine.WORKFLOW_STATES.APPROVAL_PENDING]: 6,
      [WorkflowEngine.WORKFLOW_STATES.APPROVED]: 7,
      [WorkflowEngine.WORKFLOW_STATES.CERTIFICATE_ISSUED]: 8,
      [WorkflowEngine.WORKFLOW_STATES.REJECTED_FINAL]: 0,
      [WorkflowEngine.WORKFLOW_STATES.CANCELLED]: 0
    };

    completedSteps = progressMapping[application.currentStatus] || 0;

    return {
      percentage: Math.round((completedSteps / totalSteps) * 100),
      completedSteps,
      totalSteps,
      currentStep: application.currentStage
    };
  }

  // Placeholder methods for integration with other services
  async sendTransitionNotifications(application, fromState, toState, actorInfo) {
    // Implementation depends on notification service
    logger.info('Sending transition notifications', {
      applicationId: application._id,
      fromState,
      toState
    });
  }

  async handlePaymentRequired(application, state) {
    // Implementation depends on payment service
    logger.info('Handling payment requirement', {
      applicationId: application._id,
      state
    });
  }

  async handleReviewAssignment(application) {
    // Implementation depends on assignment service
    logger.info('Handling review assignment', {
      applicationId: application._id
    });
  }

  async handleAuditAssignment(application) {
    // Implementation depends on assignment service
    logger.info('Handling audit assignment', {
      applicationId: application._id
    });
  }

  async handleApprovalAssignment(application) {
    // Implementation depends on assignment service
    logger.info('Handling approval assignment', {
      applicationId: application._id
    });
  }

  async handleApprovalActions(application) {
    // Implementation depends on certificate service
    logger.info('Handling approval actions', {
      applicationId: application._id
    });
  }

  async handleCertificateIssued(application) {
    // Implementation depends on certificate service
    logger.info('Certificate issued', {
      applicationId: application._id
    });
  }

  async handleCancellation(application) {
    // Implementation depends on cancellation service
    logger.info('Handling cancellation', {
      applicationId: application._id
    });
  }

  // Error recovery methods (placeholders)
  async recoverPaymentError(applicationId, context) {
    logger.info('Recovering from payment error', { applicationId });
  }

  async recoverAssignmentError(applicationId, context) {
    logger.info('Recovering from assignment error', { applicationId });
  }

  async recoverConditionError(applicationId, context) {
    logger.info('Recovering from condition error', { applicationId });
  }

  async notifySystemAdministrators(applicationId, error, context) {
    logger.error('Notifying system administrators', {
      applicationId,
      error: error.message,
      context
    });
  }

  // Alternative action methods (placeholders)
  async notifyFarmerOfMissingDocuments(application) {
    logger.info('Notifying farmer of missing documents', {
      applicationId: application._id
    });
  }

  async initiateFallbackPaymentMethod(application, context) {
    logger.info('Initiating fallback payment method', {
      applicationId: application._id
    });
  }

  async queueForNextAvailableReviewer(application) {
    logger.info('Queueing for next available reviewer', {
      applicationId: application._id
    });
  }

  async pauseWorkflowForMaintenance(application) {
    logger.info('Pausing workflow for maintenance', {
      applicationId: application._id
    });
  }
}

module.exports = WorkflowEngine;