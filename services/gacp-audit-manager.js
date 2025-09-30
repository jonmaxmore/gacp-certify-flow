/**
 * GACP Audit Integration
 * Integration ระบบ audit กับ GACP certification process
 */

const TraditionalAuditSystem = require('./audit-system');

class GACPAuditManager {
    constructor(dbConfig) {
        this.auditSystem = new TraditionalAuditSystem(dbConfig);
    }

    /**
     * บันทึก audit เมื่อมีการสร้าง application
     */
    async logApplicationCreated(applicationId, applicationData, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'APPLICATION',
            entityId: applicationId,
            operation: 'CREATE',
            userId: userId,
            userRole: userRole,
            oldValues: null,
            newValues: applicationData,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการอัพเดท application
     */
    async logApplicationUpdated(applicationId, oldData, newData, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'APPLICATION',
            entityId: applicationId,
            operation: 'UPDATE',
            userId: userId,
            userRole: userRole,
            oldValues: oldData,
            newValues: newData,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการอัพโหลดเอกสาร
     */
    async logDocumentUploaded(documentId, documentData, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'DOCUMENT',
            entityId: documentId,
            operation: 'CREATE',
            userId: userId,
            userRole: userRole,
            oldValues: null,
            newValues: documentData,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการชำระเงิน
     */
    async logPaymentProcessed(paymentId, paymentData, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'PAYMENT',
            entityId: paymentId,
            operation: 'CREATE',
            userId: userId,
            userRole: userRole,
            oldValues: null,
            newValues: paymentData,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการเปลี่ยนสถานะ workflow
     */
    async logWorkflowStateChanged(applicationId, oldState, newState, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'WORKFLOW',
            entityId: applicationId,
            operation: 'UPDATE',
            userId: userId,
            userRole: userRole,
            oldValues: { state: oldState },
            newValues: { state: newState },
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการออกใบรับรอง
     */
    async logCertificateIssued(certificateId, certificateData, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'CERTIFICATE',
            entityId: certificateId,
            operation: 'CREATE',
            userId: userId,
            userRole: userRole,
            oldValues: null,
            newValues: certificateData,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * บันทึก audit เมื่อมีการเข้าถึงข้อมูลส่วนบุคคล (PDPA)
     */
    async logPersonalDataAccessed(dataType, entityId, accessReason, userId, userRole, metadata = {}) {
        return await this.auditSystem.logAuditEvent({
            entityType: 'PERSONAL_DATA_ACCESS',
            entityId: `${dataType}_${entityId}`,
            operation: 'READ',
            userId: userId,
            userRole: userRole,
            oldValues: null,
            newValues: { 
                dataType: dataType,
                accessReason: accessReason,
                timestamp: new Date().toISOString()
            },
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            sessionId: metadata.sessionId
        });
    }

    /**
     * ดึง audit trail สำหรับ application
     */
    async getApplicationAuditTrail(applicationId, options = {}) {
        return await this.auditSystem.getAuditTrail('APPLICATION', applicationId, options);
    }

    /**
     * ดึง audit trail สำหรับเอกสาร
     */
    async getDocumentAuditTrail(documentId, options = {}) {
        return await this.auditSystem.getAuditTrail('DOCUMENT', documentId, options);
    }

    /**
     * ดึง audit trail สำหรับการชำระเงิน
     */
    async getPaymentAuditTrail(paymentId, options = {}) {
        return await this.auditSystem.getAuditTrail('PAYMENT', paymentId, options);
    }

    /**
     * ตรวจสอบความถูกต้องของ audit chain
     */
    async verifyAuditIntegrity(startId = 1, endId = null) {
        return await this.auditSystem.verifyAuditChain(startId, endId);
    }

    /**
     * สร้างรายงาน audit สำหรับการ compliance
     */
    async generateComplianceReport(startDate, endDate, entityTypes = []) {
        const client = await this.auditSystem.pool.connect();
        
        try {
            let query = `
                SELECT 
                    entity_type,
                    operation,
                    COUNT(*) as operation_count,
                    DATE_TRUNC('day', timestamp) as date
                FROM audit_log 
                WHERE timestamp >= $1 AND timestamp <= $2
            `;
            
            let params = [startDate, endDate];
            
            if (entityTypes.length > 0) {
                query += ` AND entity_type = ANY($3)`;
                params.push(entityTypes);
            }
            
            query += `
                GROUP BY entity_type, operation, DATE_TRUNC('day', timestamp)
                ORDER BY date DESC, entity_type, operation
            `;
            
            const result = await client.query(query, params);
            
            return {
                success: true,
                reportPeriod: { startDate, endDate },
                data: result.rows,
                totalRecords: result.rows.reduce((sum, row) => sum + parseInt(row.operation_count), 0)
            };
            
        } catch (error) {
            console.error('❌ Failed to generate compliance report:', error);
            throw new Error('Failed to generate compliance report');
        } finally {
            client.release();
        }
    }

    /**
     * ปิดการเชื่อมต่อ
     */
    async close() {
        await this.auditSystem.close();
    }
}

module.exports = GACPAuditManager;