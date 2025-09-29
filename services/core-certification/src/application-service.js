// services/core-certification/src/application-service.js
/**
 * Application Service - Core business logic for GACP applications
 * Demonstrates hybrid database usage patterns
 */

const databaseService = require('../../../services/database/database-service');
const Application = require('../../../models/mongodb/application.model');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class ApplicationService {
  constructor() {
    this.db = databaseService;
  }

  /**
   * Create new GACP application using hybrid approach
   */
  async createApplication(userId, productId, formData) {
    const transactionId = uuidv4();
    
    try {
      console.log(`🔄 Creating application for user ${userId}`);
      
      // Generate unique application code
      const applicationCode = this.generateApplicationCode();
      
      // Prepare distributed transaction operations
      const operations = [
        {
          database: 'postgresql',
          query: `
            INSERT INTO applications (
              id, application_code, user_id, product_id, 
              status, mongodb_doc_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, application_code, created_at
          `,
          params: [transactionId, applicationCode, userId, productId, 'draft', transactionId],
          rollbackQuery: 'DELETE FROM applications WHERE id = $1',
          rollbackParams: [transactionId]
        },
        {
          database: 'mongodb',
          collection: 'gacp_applications',
          operation: 'insertOne',
          query: {
            _id: transactionId,
            applicationCode,
            userId,
            productId,
            status: 'draft',
            formData: {
              ...formData,
              applicantType: formData.applicantType || 'individual',
              contactPerson: formData.contactPerson || {},
              cultivationSites: formData.cultivationSites || [],
              herbalProducts: formData.herbalProducts || []
            },
            scores: {
              completeness: 0,
              documentation: 0,
              compliance: 0,
              overall: 0
            },
            metadata: {
              source: 'web',
              version: '2.0',
              language: 'th',
              submissionMethod: 'online'
            }
          },
          rollbackOperation: 'deleteOne',
          rollbackQuery: { _id: transactionId }
        }
      ];

      // Execute distributed transaction
      await this.db.executeDistributedTransaction(operations);

      // Cache the new application for quick access
      const cacheKey = `application:${applicationCode}`;
      await this.db.cacheSet(cacheKey, {
        id: transactionId,
        applicationCode,
        userId,
        productId,
        status: 'draft'
      }, 1800); // 30 minutes

      console.log(`✅ Application created successfully: ${applicationCode}`);
      
      return {
        id: transactionId,
        applicationCode,
        status: 'draft',
        mongoDocId: transactionId
      };

    } catch (error) {
      console.error('❌ Failed to create application:', error);
      throw new Error(`Application creation failed: ${error.message}`);
    }
  }

  /**
   * Get application details using hybrid approach
   */
  async getApplication(applicationId, userId = null) {
    try {
      // Try cache first
      const cacheKey = `application:${applicationId}`;
      let cachedData = await this.db.cacheGet(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Application retrieved from cache: ${applicationId}`);
        return cachedData;
      }

      // Get basic data from PostgreSQL
      const pgQuery = `
        SELECT 
          a.id, a.application_code, a.user_id, a.product_id,
          a.status, a.current_step, a.submitted_at, a.approved_at,
          a.reviewer_id, a.auditor_id, a.mongodb_doc_id,
          a.completeness_score, a.compliance_score, a.overall_score,
          a.created_at, a.updated_at,
          p.name as product_name, p.category as product_category,
          u.full_name as applicant_name, u.email as applicant_email
        FROM applications a
        JOIN products p ON a.product_id = p.id
        JOIN users u ON a.user_id = u.id
        WHERE a.id = $1 OR a.application_code = $1
      `;
      
      const pgResult = await this.db.executePostgreSQLQuery(pgQuery, [applicationId]);
      
      if (pgResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const pgData = pgResult.rows[0];

      // Get detailed form data from MongoDB
      const mongoData = await this.db.executeMongoDBOperation(
        'gacp_applications',
        'findOne',
        { _id: pgData.mongodb_doc_id }
      );

      if (!mongoData) {
        console.warn(`⚠️ MongoDB document not found for application: ${applicationId}`);
      }

      // Combine data from both databases
      const combinedData = {
        // PostgreSQL data (authoritative)
        id: pgData.id,
        applicationCode: pgData.application_code,
        userId: pgData.user_id,
        productId: pgData.product_id,
        status: pgData.status,
        currentStep: pgData.current_step,
        submittedAt: pgData.submitted_at,
        approvedAt: pgData.approved_at,
        reviewerId: pgData.reviewer_id,
        auditorId: pgData.auditor_id,
        
        // Scores (cached in PostgreSQL for performance)
        scores: {
          completeness: pgData.completeness_score,
          compliance: pgData.compliance_score,
          overall: pgData.overall_score
        },
        
        // Related data
        product: {
          name: pgData.product_name,
          category: pgData.product_category
        },
        applicant: {
          name: pgData.applicant_name,
          email: pgData.applicant_email
        },
        
        // MongoDB data (detailed form data)
        formData: mongoData?.formData || {},
        attachments: mongoData?.attachments || [],
        comments: mongoData?.comments || {},
        metadata: mongoData?.metadata || {},
        
        // Timestamps
        createdAt: pgData.created_at,
        updatedAt: pgData.updated_at
      };

      // Cache the combined data
      await this.db.cacheSet(cacheKey, combinedData, 900); // 15 minutes

      console.log(`✅ Application retrieved: ${pgData.application_code}`);
      return combinedData;

    } catch (error) {
      console.error('❌ Failed to get application:', error);
      throw error;
    }
  }

  /**
   * Update application using hybrid approach
   */
  async updateApplication(applicationId, updates, userId) {
    try {
      console.log(`🔄 Updating application: ${applicationId}`);

      // Get current application data
      const currentApp = await this.getApplication(applicationId);
      
      if (!currentApp) {
        throw new Error('Application not found');
      }

      // Check permissions
      if (currentApp.userId !== userId && !this.hasStaffRole(userId)) {
        throw new Error('Insufficient permissions');
      }

      const operations = [];

      // Update PostgreSQL if status or core fields changed
      if (updates.status || updates.scores || updates.assignments) {
        const pgUpdates = [];
        const pgParams = [];
        let paramIndex = 1;

        if (updates.status) {
          pgUpdates.push(`status = $${paramIndex++}`);
          pgParams.push(updates.status);
        }

        if (updates.scores) {
          if (updates.scores.completeness !== undefined) {
            pgUpdates.push(`completeness_score = $${paramIndex++}`);
            pgParams.push(updates.scores.completeness);
          }
          if (updates.scores.compliance !== undefined) {
            pgUpdates.push(`compliance_score = $${paramIndex++}`);
            pgParams.push(updates.scores.compliance);
          }
          if (updates.scores.overall !== undefined) {
            pgUpdates.push(`overall_score = $${paramIndex++}`);
            pgParams.push(updates.scores.overall);
          }
        }

        if (updates.assignments) {
          if (updates.assignments.reviewerId) {
            pgUpdates.push(`reviewer_id = $${paramIndex++}`);
            pgParams.push(updates.assignments.reviewerId);
          }
          if (updates.assignments.auditorId) {
            pgUpdates.push(`auditor_id = $${paramIndex++}`);
            pgParams.push(updates.assignments.auditorId);
          }
        }

        if (pgUpdates.length > 0) {
          pgUpdates.push(`updated_at = NOW()`);
          pgParams.push(applicationId);

          operations.push({
            database: 'postgresql',
            query: `
              UPDATE applications 
              SET ${pgUpdates.join(', ')} 
              WHERE id = $${paramIndex}
            `,
            params: pgParams
          });
        }
      }

      // Update MongoDB for form data changes
      if (updates.formData || updates.comments || updates.attachments) {
        const mongoUpdate = { $set: {} };

        if (updates.formData) {
          mongoUpdate.$set['formData'] = {
            ...currentApp.formData,
            ...updates.formData
          };
        }

        if (updates.comments) {
          mongoUpdate.$set['comments'] = {
            ...currentApp.comments,
            ...updates.comments
          };
        }

        if (updates.attachments) {
          mongoUpdate.$set['attachments'] = updates.attachments;
        }

        mongoUpdate.$set['updatedAt'] = new Date();

        operations.push({
          database: 'mongodb',
          collection: 'gacp_applications',
          operation: 'updateOne',
          query: {
            filter: { _id: currentApp.id },
            update: mongoUpdate
          }
        });
      }

      // Log status change if applicable
      if (updates.status && updates.status !== currentApp.status) {
        operations.push({
          database: 'postgresql',
          query: `
            INSERT INTO application_status_history 
            (application_id, from_status, to_status, changed_by, reason, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          params: [
            currentApp.id,
            currentApp.status,
            updates.status,
            userId,
            updates.statusReason || 'Status updated',
            updates.statusNotes || ''
          ]
        });
      }

      // Execute all updates in a distributed transaction
      if (operations.length > 0) {
        await this.db.executeDistributedTransaction(operations);
      }

      // Clear cache to force fresh data on next access
      const cacheKey = `application:${applicationId}`;
      await this.db.cacheDelete(cacheKey);

      console.log(`✅ Application updated successfully: ${currentApp.applicationCode}`);
      
      return {
        success: true,
        applicationCode: currentApp.applicationCode,
        updatedFields: Object.keys(updates)
      };

    } catch (error) {
      console.error('❌ Failed to update application:', error);
      throw error;
    }
  }

  /**
   * Submit application for review
   */
  async submitApplication(applicationId, userId) {
    try {
      console.log(`🔄 Submitting application: ${applicationId}`);

      const application = await this.getApplication(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      if (application.userId !== userId) {
        throw new Error('Insufficient permissions');
      }

      if (application.status !== 'draft') {
        throw new Error('Application cannot be submitted in current status');
      }

      // Validate completeness
      const completeness = this.calculateCompleteness(application.formData);
      
      if (completeness < 70) {
        throw new Error('Application must be at least 70% complete before submission');
      }

      // Update status and timestamps
      await this.updateApplication(applicationId, {
        status: 'pending_initial_payment',
        scores: { completeness },
        submittedAt: new Date()
      }, userId);

      // Create payment record
      await this.createPaymentRecord(application.id, 'application_fee');

      console.log(`✅ Application submitted: ${application.applicationCode}`);
      
      return {
        success: true,
        applicationCode: application.applicationCode,
        status: 'pending_initial_payment',
        nextSteps: ['Complete initial payment to proceed with review']
      };

    } catch (error) {
      console.error('❌ Failed to submit application:', error);
      throw error;
    }
  }

  /**
   * Search applications with hybrid query optimization
   */
  async searchApplications(filters, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * limit;

      // Build PostgreSQL query for filtering and pagination
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.status) {
        whereClause += ` AND a.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.userId) {
        whereClause += ` AND a.user_id = $${paramIndex++}`;
        params.push(filters.userId);
      }

      if (filters.productId) {
        whereClause += ` AND a.product_id = $${paramIndex++}`;
        params.push(filters.productId);
      }

      if (filters.dateFrom) {
        whereClause += ` AND a.created_at >= $${paramIndex++}`;
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ` AND a.created_at <= $${paramIndex++}`;
        params.push(filters.dateTo);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM applications a
        ${whereClause}
      `;
      
      const countResult = await this.db.executePostgreSQLQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT 
          a.id, a.application_code, a.user_id, a.product_id,
          a.status, a.submitted_at, a.approved_at,
          a.completeness_score, a.overall_score,
          a.created_at, a.updated_at,
          p.name as product_name, p.category as product_category,
          u.full_name as applicant_name, u.email as applicant_email
        FROM applications a
        JOIN products p ON a.product_id = p.id
        JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);
      
      const dataResult = await this.db.executePostgreSQLQuery(dataQuery, params);

      // If text search is needed, also query MongoDB
      let mongoResults = [];
      if (filters.searchText) {
        mongoResults = await this.db.executeMongoDBOperation(
          'gacp_applications',
          'find',
          {
            $text: { $search: filters.searchText }
          },
          {
            projection: { _id: 1, applicationCode: 1, score: { $meta: 'textScore' } },
            sort: { score: { $meta: 'textScore' } }
          }
        );
      }

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        },
        mongoMatches: mongoResults.length,
        filters: filters
      };

    } catch (error) {
      console.error('❌ Failed to search applications:', error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters = {}) {
    try {
      // Cache key for stats
      const cacheKey = `application_stats:${JSON.stringify(filters)}`;
      let cachedStats = await this.db.cacheGet(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }

      // PostgreSQL aggregation for core stats
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.dateTo);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN status IN ('draft', 'pending_review') THEN 1 END) as pending_count,
          AVG(completeness_score) as avg_completeness,
          AVG(overall_score) as avg_overall_score
        FROM applications
        ${whereClause}
      `;

      const statsResult = await this.db.executePostgreSQLQuery(statsQuery, params);

      // MongoDB aggregation for detailed analysis
      const mongoAggregation = [
        {
          $group: {
            _id: '$formData.cultivationSites.address.province',
            count: { $sum: 1 },
            avgArea: { $avg: '$formData.cultivationSites.totalAreaRai' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ];

      const provinceStats = await this.db.executeMongoDBOperation(
        'gacp_applications',
        'aggregate',
        mongoAggregation
      );

      const stats = {
        ...statsResult.rows[0],
        byProvince: provinceStats,
        generatedAt: new Date()
      };

      // Cache for 1 hour
      await this.db.cacheSet(cacheKey, stats, 3600);

      return stats;

    } catch (error) {
      console.error('❌ Failed to get application stats:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  generateApplicationCode() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `GACP-${timestamp}-${random}`;
  }

  calculateCompleteness(formData) {
    const requiredFields = [
      'applicantType',
      'contactPerson.fullName',
      'contactPerson.phoneNumber',
      'contactPerson.email',
      'cultivationSites.0.address.province',
      'cultivationSites.0.totalAreaRai',
      'waterSources.0.type',
      'herbalProducts.0.scientificName',
      'herbalProducts.0.commonName'
    ];

    let completed = 0;
    
    for (const field of requiredFields) {
      const value = this.getNestedValue(formData, field);
      if (value !== undefined && value !== null && value !== '') {
        completed++;
      }
    }

    return Math.round((completed / requiredFields.length) * 100);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return key.match(/^\d+$/) ? current[parseInt(key)] : current[key];
      }
      return undefined;
    }, obj);
  }

  async hasStaffRole(userId) {
    try {
      const result = await this.db.executePostgreSQLQuery(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) return false;
      
      const role = result.rows[0].role;
      return ['reviewer', 'auditor', 'admin', 'super_admin'].includes(role);
    } catch (error) {
      console.error('❌ Failed to check user role:', error);
      return false;
    }
  }

  async createPaymentRecord(applicationId, paymentType) {
    // This would integrate with payment gateway
    // For now, just create a record
    const paymentId = uuidv4();
    
    await this.db.executePostgreSQLQuery(`
      INSERT INTO payments (id, application_id, amount, payment_type, status)
      VALUES ($1, $2, $3, $4, $5)
    `, [paymentId, applicationId, 1000.00, paymentType, 'pending']);
    
    return paymentId;
  }
}

module.exports = ApplicationService;