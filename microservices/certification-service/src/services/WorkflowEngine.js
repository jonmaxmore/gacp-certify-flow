const logger = require('../services/logger');

/**
 * GACP License Application - Complete Workflow Engine
 * Handles all scenarios, payment rules, and alternative flows
 */

class GACPWorkflowEngine {
  constructor() {
    // Define all possible application states
    this.STATES = {
      // Initial states
      DRAFT: 'draft',
      DRAFT_INCOMPLETE: 'draft_incomplete',
      DRAFT_SAVED: 'draft_saved',
      
      // Submission states
      SUBMITTED: 'submitted',
      PAYMENT_PENDING_1: 'payment_pending_1',
      PAYMENT_RETRY: 'payment_retry',
      PAYMENT_FAILED: 'payment_failed',
      
      // Review states
      REVIEWING: 'reviewing',
      REJECTED_1: 'rejected_1',
      REJECTED_2: 'rejected_2',
      PAYMENT_PENDING_2: 'payment_pending_2', // 3rd review payment
      
      // Audit states
      AUDITING: 'auditing',
      AUDIT_SCHEDULED: 'audit_scheduled',
      AUDIT_PAYMENT_PENDING: 'audit_payment_pending',
      AUDIT_IN_PROGRESS: 'audit_in_progress',
      AUDIT_PASSED: 'audit_passed',
      AUDIT_FAILED: 'audit_failed',
      AUDIT_DOUBT: 'audit_doubt',
      
      // Re-audit states
      RE_AUDIT_PAYMENT: 're_audit_payment',
      FIELD_AUDIT_SCHEDULED: 'field_audit_scheduled',
      
      // Approval states
      APPROVAL_PENDING: 'approval_pending',
      APPROVED: 'approved',
      APPROVER_REJECTED: 'approver_rejected',
      
      // Final states
      CERTIFICATE_ISSUED: 'certificate_issued',
      CANCELLED: 'cancelled',
      
      // Error states
      PAYMENT_RECONCILING: 'payment_reconciling',
      SYSTEM_ERROR: 'system_error'
    };

    // Define payment types and amounts
    this.PAYMENT_RULES = {
      INITIAL_REVIEW: {
        amount: 5000,
        type: 'document_review',
        reason: 'initial',
        description: 'Initial document review fee'
      },
      THIRD_REVIEW: {
        amount: 5000,
        type: 'document_review', 
        reason: '3rd_review',
        description: 'Third review fee after 2 rejections'
      },
      AUDIT_FEE: {
        amount: 25000,
        type: 'audit_fee',
        reason: 'audit',
        description: 'Audit fee for onsite/online inspection'
      },
      RE_AUDIT_FEE: {
        amount: 25000,
        type: 'audit_fee',
        reason: 'audit_fail',
        description: 'Re-audit fee after failed audit'
      }
    };

    // Define valid state transitions
    this.TRANSITIONS = this.defineStateTransitions();
    
    // Define business rules
    this.BUSINESS_RULES = this.defineBusinessRules();
  }

  /**
   * Define all valid state transitions
   */
  defineStateTransitions() {
    return {
      [this.STATES.DRAFT]: {
        [this.STATES.DRAFT_INCOMPLETE]: { 
          trigger: 'validation_failed',
          conditions: ['missing_documents'],
          actor: 'system'
        },
        [this.STATES.SUBMITTED]: { 
          trigger: 'submit',
          conditions: ['documents_complete', 'farmer_action'],
          actor: 'farmer'
        },
        [this.STATES.DRAFT_SAVED]: {
          trigger: 'system_downtime',
          conditions: ['system_unavailable'],
          actor: 'system'
        }
      },

      [this.STATES.DRAFT_INCOMPLETE]: {
        [this.STATES.DRAFT]: {
          trigger: 'complete_documents',
          conditions: ['all_documents_uploaded'],
          actor: 'farmer'
        }
      },

      [this.STATES.DRAFT_SAVED]: {
        [this.STATES.DRAFT]: {
          trigger: 'system_recovery',
          conditions: ['system_available'],
          actor: 'system'
        }
      },

      [this.STATES.SUBMITTED]: {
        [this.STATES.PAYMENT_PENDING_1]: {
          trigger: 'auto_transition',
          conditions: ['submission_validated'],
          actor: 'system',
          payment_required: this.PAYMENT_RULES.INITIAL_REVIEW
        }
      },

      [this.STATES.PAYMENT_PENDING_1]: {
        [this.STATES.REVIEWING]: {
          trigger: 'payment_completed',
          conditions: ['initial_payment_verified'],
          actor: 'farmer'
        },
        [this.STATES.PAYMENT_RETRY]: {
          trigger: 'payment_failed',
          conditions: ['gateway_error'],
          actor: 'system'
        },
        [this.STATES.PAYMENT_FAILED]: {
          trigger: 'payment_timeout',
          conditions: ['payment_expired'],
          actor: 'system'
        }
      },

      [this.STATES.PAYMENT_RETRY]: {
        [this.STATES.REVIEWING]: {
          trigger: 'payment_completed',
          conditions: ['payment_successful'],
          actor: 'farmer'
        },
        [this.STATES.PAYMENT_FAILED]: {
          trigger: 'max_retries_exceeded',
          conditions: ['retry_limit_reached'],
          actor: 'system'
        }
      },

      [this.STATES.REVIEWING]: {
        [this.STATES.REJECTED_1]: {
          trigger: 'reviewer_reject',
          conditions: ['rejection_count_0', 'documents_insufficient'],
          actor: 'reviewer'
        },
        [this.STATES.REJECTED_2]: {
          trigger: 'reviewer_reject',
          conditions: ['rejection_count_1', 'documents_insufficient'],
          actor: 'reviewer'
        },
        [this.STATES.PAYMENT_PENDING_2]: {
          trigger: 'reviewer_reject',
          conditions: ['rejection_count_2', 'documents_insufficient'],
          actor: 'reviewer',
          payment_required: this.PAYMENT_RULES.THIRD_REVIEW
        },
        [this.STATES.AUDITING]: {
          trigger: 'reviewer_approve',
          conditions: ['documents_approved', 'standards_met'],
          actor: 'reviewer'
        }
      },

      [this.STATES.REJECTED_1]: {
        [this.STATES.REVIEWING]: {
          trigger: 'farmer_resubmit',
          conditions: ['documents_updated', 'farmer_action'],
          actor: 'farmer'
        }
      },

      [this.STATES.REJECTED_2]: {
        [this.STATES.REVIEWING]: {
          trigger: 'farmer_resubmit',
          conditions: ['documents_updated', 'farmer_action'],
          actor: 'farmer'
        }
      },

      [this.STATES.PAYMENT_PENDING_2]: {
        [this.STATES.REVIEWING]: {
          trigger: 'payment_completed_resubmit',
          conditions: ['third_review_payment_verified', 'documents_updated'],
          actor: 'farmer'
        }
      },

      [this.STATES.AUDITING]: {
        [this.STATES.AUDIT_SCHEDULED]: {
          trigger: 'auditor_schedule',
          conditions: ['auditor_assigned', 'schedule_available'],
          actor: 'auditor'
        }
      },

      [this.STATES.AUDIT_SCHEDULED]: {
        [this.STATES.AUDIT_PAYMENT_PENDING]: {
          trigger: 'auto_transition',
          conditions: ['audit_scheduled'],
          actor: 'system',
          payment_required: this.PAYMENT_RULES.AUDIT_FEE
        }
      },

      [this.STATES.AUDIT_PAYMENT_PENDING]: {
        [this.STATES.AUDIT_IN_PROGRESS]: {
          trigger: 'payment_completed',
          conditions: ['audit_payment_verified', 'documents_reviewer_approved'],
          actor: 'farmer'
        }
      },

      [this.STATES.AUDIT_IN_PROGRESS]: {
        [this.STATES.AUDIT_PASSED]: {
          trigger: 'audit_result',
          conditions: ['audit_completed', 'result_pass'],
          actor: 'auditor'
        },
        [this.STATES.AUDIT_FAILED]: {
          trigger: 'audit_result',
          conditions: ['audit_completed', 'result_fail'],
          actor: 'auditor'
        },
        [this.STATES.AUDIT_DOUBT]: {
          trigger: 'audit_result',
          conditions: ['audit_completed', 'result_doubt'],
          actor: 'auditor'
        }
      },

      [this.STATES.AUDIT_PASSED]: {
        [this.STATES.APPROVAL_PENDING]: {
          trigger: 'forward_to_approver',
          conditions: ['audit_report_complete'],
          actor: 'reviewer'
        }
      },

      [this.STATES.AUDIT_FAILED]: {
        [this.STATES.RE_AUDIT_PAYMENT]: {
          trigger: 'auto_transition',
          conditions: ['audit_failed'],
          actor: 'system',
          payment_required: this.PAYMENT_RULES.RE_AUDIT_FEE
        }
      },

      [this.STATES.AUDIT_DOUBT]: {
        [this.STATES.FIELD_AUDIT_SCHEDULED]: {
          trigger: 'schedule_field_audit',
          conditions: ['field_audit_required'],
          actor: 'auditor'
        }
      },

      [this.STATES.RE_AUDIT_PAYMENT]: {
        [this.STATES.AUDIT_IN_PROGRESS]: {
          trigger: 'payment_completed',
          conditions: ['re_audit_payment_verified'],
          actor: 'farmer'
        }
      },

      [this.STATES.FIELD_AUDIT_SCHEDULED]: {
        [this.STATES.AUDIT_IN_PROGRESS]: {
          trigger: 'conduct_field_audit',
          conditions: ['field_audit_date_reached'],
          actor: 'auditor'
        }
      },

      [this.STATES.APPROVAL_PENDING]: {
        [this.STATES.APPROVED]: {
          trigger: 'approver_approve',
          conditions: ['final_approval_granted'],
          actor: 'approver'
        },
        [this.STATES.APPROVER_REJECTED]: {
          trigger: 'approver_reject',
          conditions: ['issues_found_by_approver'],
          actor: 'approver'
        }
      },

      [this.STATES.APPROVER_REJECTED]: {
        [this.STATES.REVIEWING]: {
          trigger: 'return_to_reviewer',
          conditions: ['approver_feedback_provided'],
          actor: 'system'
        }
      },

      [this.STATES.APPROVED]: {
        [this.STATES.CERTIFICATE_ISSUED]: {
          trigger: 'generate_certificate',
          conditions: ['certificate_generated', 'digital_signature_applied'],
          actor: 'approver'
        }
      }
    };
  }

  /**
   * Define business rules and validations
   */
  defineBusinessRules() {
    return {
      // Payment rules
      CANNOT_PAY_AUDIT_WITHOUT_REVIEW_APPROVAL: {
        description: 'Cannot pay 25,000 THB audit fee if documents not approved by reviewer',
        validation: (application) => {
          const hasReviewerApproval = application.reviews?.some(review => 
            review.status === 'approved'
          );
          return hasReviewerApproval;
        }
      },

      CANNOT_AUDIT_WITHOUT_PAYMENT: {
        description: 'Cannot conduct audit without 25,000 THB payment',
        validation: (application) => {
          const hasAuditPayment = application.paymentHistory?.some(payment =>
            payment.paymentType === 'audit_fee' && 
            payment.status === 'completed'
          );
          return hasAuditPayment;
        }
      },

      CANNOT_THIRD_REVIEW_WITHOUT_PAYMENT: {
        description: 'Cannot submit for 3rd review without 5,000 THB payment after 2nd rejection',
        validation: (application) => {
          if (application.rejectionCount < 2) return true;
          
          const hasThirdReviewPayment = application.paymentHistory?.some(payment =>
            payment.paymentReason === '3rd_review' && 
            payment.status === 'completed'
          );
          return hasThirdReviewPayment;
        }
      },

      CANNOT_FORWARD_WITHOUT_INITIAL_PAYMENT: {
        description: 'Cannot forward to reviewer without initial 5,000 THB payment',
        validation: (application) => {
          const hasInitialPayment = application.paymentHistory?.some(payment =>
            payment.paymentReason === 'initial' && 
            payment.status === 'completed'
          );
          return hasInitialPayment;
        }
      },

      // Document rules
      DOCUMENTS_MUST_BE_COMPLETE: {
        description: 'All required documents must be uploaded before submission',
        validation: (application) => {
          const requiredDocs = ['sop', 'coa', 'land_rights'];
          const uploadedDocs = application.documents?.filter(doc => doc.isActive)
            .map(doc => doc.documentType) || [];
          
          return requiredDocs.every(type => uploadedDocs.includes(type));
        }
      },

      // Rejection rules
      MAX_FREE_REJECTIONS: {
        description: 'Maximum 2 free rejections, 3rd rejection requires payment',
        validation: (application) => {
          return application.rejectionCount <= 3;
        }
      }
    };
  }

  /**
   * Validate if a state transition is allowed
   */
  canTransition(fromState, toState, application, actor, trigger) {
    try {
      // Check if transition exists
      const transitions = this.TRANSITIONS[fromState];
      if (!transitions || !transitions[toState]) {
        return {
          allowed: false,
          reason: `Invalid transition from ${fromState} to ${toState}`,
          code: 'INVALID_TRANSITION'
        };
      }

      const transition = transitions[toState];

      // Check if actor is authorized
      if (transition.actor !== 'system' && transition.actor !== actor) {
        return {
          allowed: false,
          reason: `Actor ${actor} not authorized for this transition`,
          code: 'UNAUTHORIZED_ACTOR',
          requiredActor: transition.actor
        };
      }

      // Check trigger matches
      if (transition.trigger !== trigger) {
        return {
          allowed: false,
          reason: `Invalid trigger ${trigger} for this transition`,
          code: 'INVALID_TRIGGER',
          requiredTrigger: transition.trigger
        };
      }

      // Validate business rules
      const ruleValidation = this.validateBusinessRules(application, toState);
      if (!ruleValidation.valid) {
        return {
          allowed: false,
          reason: ruleValidation.reason,
          code: 'BUSINESS_RULE_VIOLATION',
          violatedRules: ruleValidation.violatedRules
        };
      }

      // Check specific conditions
      const conditionValidation = this.validateConditions(
        transition.conditions || [], 
        application, 
        { fromState, toState, actor, trigger }
      );
      
      if (!conditionValidation.valid) {
        return {
          allowed: false,
          reason: conditionValidation.reason,
          code: 'CONDITION_NOT_MET',
          unmetConditions: conditionValidation.unmetConditions
        };
      }

      return {
        allowed: true,
        transition,
        paymentRequired: transition.payment_required || null
      };

    } catch (error) {
      logger.error('Error validating transition', {
        fromState,
        toState,
        actor,
        trigger,
        error: error.message
      });

      return {
        allowed: false,
        reason: 'System error during validation',
        code: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(application, targetState) {
    const violatedRules = [];

    // Check critical payment rules
    if (targetState === this.STATES.AUDIT_PAYMENT_PENDING) {
      if (!this.BUSINESS_RULES.CANNOT_PAY_AUDIT_WITHOUT_REVIEW_APPROVAL.validation(application)) {
        violatedRules.push('CANNOT_PAY_AUDIT_WITHOUT_REVIEW_APPROVAL');
      }
    }

    if (targetState === this.STATES.AUDIT_IN_PROGRESS) {
      if (!this.BUSINESS_RULES.CANNOT_AUDIT_WITHOUT_PAYMENT.validation(application)) {
        violatedRules.push('CANNOT_AUDIT_WITHOUT_PAYMENT');
      }
    }

    if (targetState === this.STATES.REVIEWING && application.rejectionCount >= 2) {
      if (!this.BUSINESS_RULES.CANNOT_THIRD_REVIEW_WITHOUT_PAYMENT.validation(application)) {
        violatedRules.push('CANNOT_THIRD_REVIEW_WITHOUT_PAYMENT');
      }
    }

    if (targetState === this.STATES.REVIEWING && application.currentStatus === this.STATES.PAYMENT_PENDING_1) {
      if (!this.BUSINESS_RULES.CANNOT_FORWARD_WITHOUT_INITIAL_PAYMENT.validation(application)) {
        violatedRules.push('CANNOT_FORWARD_WITHOUT_INITIAL_PAYMENT');
      }
    }

    return {
      valid: violatedRules.length === 0,
      violatedRules,
      reason: violatedRules.length > 0 ? 
        `Business rule violations: ${violatedRules.join(', ')}` : 
        null
    };
  }

  /**
   * Validate specific conditions for transitions
   */
  validateConditions(conditions, application, context) {
    const unmetConditions = [];

    for (const condition of conditions) {
      let conditionMet = false;

      switch (condition) {
        case 'missing_documents':
          conditionMet = !this.BUSINESS_RULES.DOCUMENTS_MUST_BE_COMPLETE.validation(application);
          break;

        case 'documents_complete':
          conditionMet = this.BUSINESS_RULES.DOCUMENTS_MUST_BE_COMPLETE.validation(application);
          break;

        case 'farmer_action':
          conditionMet = context.actor === 'farmer';
          break;

        case 'all_documents_uploaded':
          conditionMet = this.BUSINESS_RULES.DOCUMENTS_MUST_BE_COMPLETE.validation(application);
          break;

        case 'submission_validated':
          conditionMet = this.BUSINESS_RULES.DOCUMENTS_MUST_BE_COMPLETE.validation(application);
          break;

        case 'initial_payment_verified':
          conditionMet = application.paymentHistory?.some(p => 
            p.paymentReason === 'initial' && p.status === 'completed'
          );
          break;

        case 'payment_successful':
          conditionMet = true; // Assume payment service validates this
          break;

        case 'rejection_count_0':
          conditionMet = (application.rejectionCount || 0) === 0;
          break;

        case 'rejection_count_1':
          conditionMet = (application.rejectionCount || 0) === 1;
          break;

        case 'rejection_count_2':
          conditionMet = (application.rejectionCount || 0) === 2;
          break;

        case 'documents_insufficient':
          conditionMet = true; // Reviewer decision
          break;

        case 'documents_approved':
          conditionMet = application.reviews?.some(r => r.status === 'approved');
          break;

        case 'standards_met':
          conditionMet = application.reviews?.some(r => 
            r.status === 'approved' && r.checklist?.overallScore >= 70
          );
          break;

        case 'documents_updated':
          conditionMet = true; // Assume farmer has updated documents
          break;

        case 'third_review_payment_verified':
          conditionMet = application.paymentHistory?.some(p => 
            p.paymentReason === '3rd_review' && p.status === 'completed'
          );
          break;

        case 'auditor_assigned':
          conditionMet = !!application.assignedAuditor?.userId;
          break;

        case 'audit_payment_verified':
          conditionMet = application.paymentHistory?.some(p => 
            p.paymentType === 'audit_fee' && p.status === 'completed'
          );
          break;

        case 'documents_reviewer_approved':
          conditionMet = application.reviews?.some(r => r.status === 'approved');
          break;

        case 'audit_completed':
          conditionMet = application.audits?.some(a => 
            a.status === 'completed' && a.result
          );
          break;

        case 'result_pass':
        case 'result_fail':
        case 'result_doubt':
          const expectedResult = condition.split('_')[1];
          conditionMet = application.audits?.some(a => 
            a.status === 'completed' && a.result === expectedResult
          );
          break;

        case 'final_approval_granted':
          conditionMet = context.actor === 'approver';
          break;

        case 'certificate_generated':
          conditionMet = !!application.approval?.certificateNumber;
          break;

        default:
          conditionMet = true; // Unknown conditions default to true
          break;
      }

      if (!conditionMet) {
        unmetConditions.push(condition);
      }
    }

    return {
      valid: unmetConditions.length === 0,
      unmetConditions,
      reason: unmetConditions.length > 0 ? 
        `Unmet conditions: ${unmetConditions.join(', ')}` : 
        null
    };
  }

  /**
   * Execute state transition
   */
  async executeTransition(application, toState, actor, trigger, metadata = {}) {
    try {
      const fromState = application.currentStatus;
      
      // Validate transition
      const validation = this.canTransition(fromState, toState, application, actor, trigger);
      
      if (!validation.allowed) {
        throw new Error(`Transition not allowed: ${validation.reason}`);
      }

      // Update application state
      const oldStatus = application.currentStatus;
      application.currentStatus = toState;
      
      // Update stage based on state
      application.currentStage = this.getStageFromState(toState);

      // Add to workflow history
      application.workflowHistory.push({
        fromStatus: oldStatus,
        toStatus: toState,
        actorId: metadata.actorId,
        actorRole: actor,
        action: trigger,
        comments: metadata.comments || `Transitioned from ${oldStatus} to ${toState}`,
        metadata: {
          ...metadata,
          validationResult: validation,
          timestamp: new Date()
        },
        timestamp: new Date()
      });

      // Handle special state logic
      await this.handleStateSpecificLogic(application, toState, validation, metadata);

      logger.info('State transition executed successfully', {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        fromState: oldStatus,
        toState,
        actor,
        trigger
      });

      return {
        success: true,
        newState: toState,
        paymentRequired: validation.paymentRequired,
        nextActions: this.getNextPossibleActions(toState, application)
      };

    } catch (error) {
      logger.error('Error executing state transition', {
        applicationId: application._id,
        fromState: application.currentStatus,
        toState,
        actor,
        trigger,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Handle state-specific logic
   */
  async handleStateSpecificLogic(application, newState, validation, metadata) {
    switch (newState) {
      case this.STATES.PAYMENT_PENDING_1:
      case this.STATES.PAYMENT_PENDING_2:
      case this.STATES.AUDIT_PAYMENT_PENDING:
      case this.STATES.RE_AUDIT_PAYMENT:
        // Generate payment requirement
        if (validation.paymentRequired) {
          await this.generatePaymentRequirement(application, validation.paymentRequired);
        }
        break;

      case this.STATES.REJECTED_1:
      case this.STATES.REJECTED_2:
        // Increment rejection count
        application.rejectionCount = (application.rejectionCount || 0) + 1;
        break;

      case this.STATES.REVIEWING:
        // Auto-assign reviewer if not assigned
        if (!application.assignedReviewer?.userId) {
          await this.autoAssignReviewer(application);
        }
        break;

      case this.STATES.AUDITING:
        // Auto-assign auditor if not assigned
        if (!application.assignedAuditor?.userId) {
          await this.autoAssignAuditor(application);
        }
        break;

      case this.STATES.APPROVAL_PENDING:
        // Auto-assign approver if not assigned
        if (!application.assignedApprover?.userId) {
          await this.autoAssignApprover(application);
        }
        break;

      case this.STATES.CERTIFICATE_ISSUED:
        // Update timeline
        application.timeline.certificateIssuedAt = new Date();
        if (application.timeline.submittedAt) {
          const processingTime = Math.ceil(
            (new Date() - application.timeline.submittedAt) / (1000 * 60 * 60 * 24)
          );
          application.timeline.totalProcessingTime = processingTime;
        }
        break;
    }
  }

  /**
   * Generate payment requirement
   */
  async generatePaymentRequirement(application, paymentRule) {
    // This would integrate with payment service
    logger.info('Payment requirement generated', {
      applicationId: application._id,
      amount: paymentRule.amount,
      type: paymentRule.type,
      reason: paymentRule.reason
    });
  }

  /**
   * Auto-assign staff based on workload
   */
  async autoAssignReviewer(application) {
    // This would integrate with user service to find available reviewers
    logger.info('Auto-assigning reviewer', {
      applicationId: application._id
    });
  }

  async autoAssignAuditor(application) {
    // This would integrate with user service to find available auditors
    logger.info('Auto-assigning auditor', {
      applicationId: application._id
    });
  }

  async autoAssignApprover(application) {
    // This would integrate with user service to find available approvers
    logger.info('Auto-assigning approver', {
      applicationId: application._id
    });
  }

  /**
   * Get stage from state
   */
  getStageFromState(state) {
    const stageMap = {
      [this.STATES.DRAFT]: 'document_submission',
      [this.STATES.DRAFT_INCOMPLETE]: 'document_submission',
      [this.STATES.SUBMITTED]: 'payment_processing',
      [this.STATES.PAYMENT_PENDING_1]: 'payment_processing',
      [this.STATES.PAYMENT_PENDING_2]: 'payment_processing',
      [this.STATES.REVIEWING]: 'document_review',
      [this.STATES.REJECTED_1]: 'document_review',
      [this.STATES.REJECTED_2]: 'document_review',
      [this.STATES.AUDITING]: 'audit_scheduling',
      [this.STATES.AUDIT_SCHEDULED]: 'audit_scheduling',
      [this.STATES.AUDIT_PAYMENT_PENDING]: 'payment_processing',
      [this.STATES.AUDIT_IN_PROGRESS]: 'audit_execution',
      [this.STATES.AUDIT_PASSED]: 'audit_execution',
      [this.STATES.AUDIT_FAILED]: 'audit_execution',
      [this.STATES.AUDIT_DOUBT]: 'audit_execution',
      [this.STATES.RE_AUDIT_PAYMENT]: 'payment_processing',
      [this.STATES.FIELD_AUDIT_SCHEDULED]: 'audit_execution',
      [this.STATES.APPROVAL_PENDING]: 'final_approval',
      [this.STATES.APPROVED]: 'certificate_generation',
      [this.STATES.CERTIFICATE_ISSUED]: 'completed',
      [this.STATES.CANCELLED]: 'cancelled'
    };

    return stageMap[state] || 'unknown';
  }

  /**
   * Get next possible actions for current state
   */
  getNextPossibleActions(state, application) {
    const actions = [];
    const transitions = this.TRANSITIONS[state] || {};

    for (const [nextState, transition] of Object.entries(transitions)) {
      // Check if transition is currently possible
      const validation = this.canTransition(state, nextState, application, transition.actor, transition.trigger);
      
      if (validation.allowed) {
        actions.push({
          action: transition.trigger,
          nextState,
          actor: transition.actor,
          description: this.getActionDescription(transition.trigger, nextState),
          paymentRequired: transition.payment_required || null
        });
      }
    }

    return actions;
  }

  /**
   * Get human-readable action description
   */
  getActionDescription(trigger, nextState) {
    const descriptions = {
      'submit': 'Submit application for review',
      'payment_completed': 'Complete payment and proceed',
      'reviewer_approve': 'Approve documents and forward to audit',
      'reviewer_reject': 'Reject documents for revision',
      'farmer_resubmit': 'Resubmit updated documents',
      'auditor_schedule': 'Schedule audit appointment',
      'audit_result': 'Submit audit results',
      'approver_approve': 'Give final approval',
      'approver_reject': 'Reject and return for revision',
      'generate_certificate': 'Generate and issue certificate'
    };

    return descriptions[trigger] || `Transition to ${nextState}`;
  }

  /**
   * Get payment requirements for current state
   */
  getPaymentRequirements(application) {
    const currentState = application.currentStatus;
    const transitions = this.TRANSITIONS[currentState] || {};
    
    const paymentRequirements = [];
    
    for (const [nextState, transition] of Object.entries(transitions)) {
      if (transition.payment_required) {
        const validation = this.canTransition(
          currentState, 
          nextState, 
          application, 
          transition.actor, 
          transition.trigger
        );
        
        if (validation.allowed) {
          paymentRequirements.push({
            ...transition.payment_required,
            nextState,
            canProceed: true
          });
        } else {
          paymentRequirements.push({
            ...transition.payment_required,
            nextState,
            canProceed: false,
            blockingReason: validation.reason
          });
        }
      }
    }
    
    return paymentRequirements;
  }
}

module.exports = GACPWorkflowEngine;