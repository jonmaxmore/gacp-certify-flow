/**
 * Traditional Audit System (No Crypto/Blockchain)
 * แทนที่ระบบ Blockchain ด้วย Database Audit Trail แบบมาตรฐาน
 * 
 * Features:
 * - Simple audit logs using database
 * - Basic hash for record integrity (no cryptographic security)
 * - Complete audit trail for all transactions
 * - Role-based access control
 * - Compliance with regulatory requirements
 */

const { Pool } = require('pg');

class TraditionalAuditSystem {
    constructor(dbConfig) {
        this.pool = new Pool(dbConfig);
        this.signingKey = process.env.AUDIT_SIGNING_KEY || 'audit-key-for-development';
        this.initializeTables();
    }

    /**
     * สร้างตาราง audit log
     */
    async initializeTables() {
        const auditTableSQL = `
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(100) NOT NULL,
                entity_id VARCHAR(100) NOT NULL,
                operation VARCHAR(50) NOT NULL,
                user_id VARCHAR(100) NOT NULL,
                user_role VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW(),
                old_values JSONB,
                new_values JSONB,
                ip_address INET,
                user_agent TEXT,
                session_id VARCHAR(255),
                basic_signature TEXT NOT NULL,
                simple_hash VARCHAR(255),
                is_verified BOOLEAN DEFAULT true,
                CONSTRAINT valid_operation CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'READ'))
            );

            CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
        `;

        try {
            await this.pool.query(auditTableSQL);
            console.log('✅ Audit tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize audit tables:', error);
        }
    }

    /**
     * บันทึก audit log
     */
    async logAuditEvent(params) {
        const {
            entityType,
            entityId,
            operation,
            userId,
            userRole,
            oldValues = null,
            newValues = null,
            ipAddress = null,
            userAgent = null,
            sessionId = null
        } = params;

        try {
            // สร้าง basic signature
            const dataToSign = JSON.stringify({
                entityType,
                entityId,
                operation,
                userId,
                timestamp: new Date().toISOString(),
                oldValues,
                newValues
            });

            const signature = this.createBasicSignature(dataToSign);
            
            // ดึง hash ของ record ล่าสุดเพื่อสร้าง chain
            const lastRecord = await this.pool.query(
                'SELECT basic_signature FROM audit_log ORDER BY id DESC LIMIT 1'
            );
            
            const simpleHash = lastRecord.rows.length > 0 
                ? this.createSimpleHash(lastRecord.rows[0].basic_signature + signature)
                : this.createSimpleHash(signature);

            // บันทึกลง database
            const insertSQL = `
                INSERT INTO audit_log (
                    entity_type, entity_id, operation, user_id, user_role,
                    old_values, new_values, ip_address, user_agent, session_id,
                    basic_signature, simple_hash
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, timestamp
            `;

            const result = await this.pool.query(insertSQL, [
                entityType, entityId, operation, userId, userRole,
                oldValues, newValues, ipAddress, userAgent, sessionId,
                signature, hashChain
            ]);

            return {
                success: true,
                auditId: result.rows[0].id,
                timestamp: result.rows[0].timestamp,
                signature: signature
            };

        } catch (error) {
            console.error('❌ Audit logging failed:', error);
            throw new Error('Failed to create audit log');
        }
    }

    /**
     * ตรวจสอบความถูกต้องของ audit chain
     */
    async verifyAuditChain(startId = 1, endId = null) {
        try {
            let query = 'SELECT id, basic_signature, simple_hash FROM audit_log WHERE id >= $1';
            let params = [startId];

            if (endId) {
                query += ' AND id <= $2';
                params.push(endId);
            }

            query += ' ORDER BY id';

            const result = await this.pool.query(query, params);
            const records = result.rows;

            if (records.length === 0) {
                return { valid: true, message: 'No records to verify' };
            }

            for (let i = 0; i < records.length; i++) {
                const current = records[i];
                
                if (i === 0) {
                    // ตรวจสอบ record แรก
                    const expectedHash = this.createSimpleHash(current.basic_signature);
                    if (current.simple_hash !== expectedHash) {
                        return {
                            valid: false,
                            message: `Chain verification failed at record ${current.id}`,
                            recordId: current.id
                        };
                    }
                } else {
                    // ตรวจสอบ chain ต่อเนื่อง
                    const previous = records[i - 1];
                    const expectedHash = this.createSimpleHash(previous.basic_signature + current.basic_signature);
                    
                    if (current.simple_hash !== expectedHash) {
                        return {
                            valid: false,
                            message: `Chain verification failed at record ${current.id}`,
                            recordId: current.id
                        };
                    }
                }
            }

            return {
                valid: true,
                message: `Verified ${records.length} records successfully`,
                recordsVerified: records.length
            };

        } catch (error) {
            console.error('❌ Audit verification failed:', error);
            return {
                valid: false,
                message: 'Verification process failed',
                error: error.message
            };
        }
    }

    /**
     * ดึง audit trail สำหรับ entity ใดๆ
     */
    async getAuditTrail(entityType, entityId, options = {}) {
        const { startDate, endDate, operation, userId, limit = 100 } = options;

        let query = `
            SELECT 
                id, operation, user_id, user_role, timestamp,
                old_values, new_values, ip_address, user_agent,
                basic_signature, is_verified
            FROM audit_log 
            WHERE entity_type = $1 AND entity_id = $2
        `;
        
        let params = [entityType, entityId];
        let paramCount = 2;

        if (startDate) {
            query += ` AND timestamp >= $${++paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND timestamp <= $${++paramCount}`;
            params.push(endDate);
        }

        if (operation) {
            query += ` AND operation = $${++paramCount}`;
            params.push(operation);
        }

        if (userId) {
            query += ` AND user_id = $${++paramCount}`;
            params.push(userId);
        }

        query += ` ORDER BY timestamp DESC LIMIT $${++paramCount}`;
        params.push(limit);

        try {
            const result = await this.pool.query(query, params);
            return {
                success: true,
                records: result.rows,
                total: result.rows.length
            };
        } catch (error) {
            console.error('❌ Failed to get audit trail:', error);
            throw new Error('Failed to retrieve audit trail');
        }
    }

    /**
     * สร้าง basic signature (ไม่ใช้ crypto)
     */
    createBasicSignature(data) {
        const timestamp = Date.now().toString();
        return Buffer.from(data + this.signingKey + timestamp).toString('base64');
    }

    /**
     * สร้าง simple hash (ไม่ใช้ crypto)
     */
    createSimpleHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * ตรวจสอบ basic signature
     */
    verifyBasicSignature(data, signature) {
        // Simple verification by recreating signature
        const expectedSignature = this.createBasicSignature(data);
        return expectedSignature === signature;
    }

    /**
     * ปิดการเชื่อมต่อ database
     */
    async close() {
        await this.pool.end();
    }
}

module.exports = TraditionalAuditSystem;