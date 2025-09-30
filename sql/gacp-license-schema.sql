-- GACP License Application Database Schema
-- Supports complete workflow with payment logic and rejection tracking
-- Date: September 30, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends existing auth system)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    organization_type VARCHAR(50), -- 'farmer', 'reviewer', 'auditor', 'approver', 'finance'
    role VARCHAR(20) DEFAULT 'farmer', -- Primary role
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_data JSONB, -- Additional profile information
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications table (core GACP applications)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    farmer_id UUID NOT NULL REFERENCES users(id),
    application_number VARCHAR(20) UNIQUE, -- Auto-generated: GACP-2025-000001
    
    -- Application Data (กทล.1 form)
    applicant_info JSONB NOT NULL, -- Personal/Organization details
    farm_info JSONB NOT NULL, -- Farm location, size, etc.
    crop_info JSONB NOT NULL, -- Crops being certified
    
    -- Workflow Status
    current_status VARCHAR(50) DEFAULT 'draft', -- See status enum below
    current_stage VARCHAR(50) DEFAULT 'document_submission',
    rejection_count INTEGER DEFAULT 0, -- Track document rejections
    total_payments DECIMAL(10,2) DEFAULT 0, -- Total amount paid
    
    -- Assignments
    assigned_reviewer_id UUID REFERENCES users(id),
    assigned_auditor_id UUID REFERENCES users(id),
    assigned_approver_id UUID REFERENCES users(id),
    
    -- Timeline
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    certificate_issued_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Application Status enum values:
-- 'draft', 'submitted', 'payment_pending_1', 'reviewing', 'rejected', 
-- 'payment_pending_2', 'auditing', 'audit_failed', 'audit_doubt', 
-- 'payment_pending_3', 're_auditing', 'field_auditing', 
-- 'approval_pending', 'approved', 'certificate_issued', 'cancelled'

-- Documents table (SOP, COA, Land documents, certificates)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    -- Document Info
    document_type VARCHAR(50) NOT NULL, -- 'sop', 'coa', 'land_rights', 'certificate', 'audit_report'
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Storage path
    file_size INTEGER, -- Bytes
    mime_type VARCHAR(100),
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1, -- For document versioning
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table (Track all payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(30) NOT NULL, -- 'document_review', 'audit_fee'
    payment_reason VARCHAR(50) NOT NULL, -- 'initial', '3rd_review', 'audit_fail', 'field_audit'
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Payment Gateway
    gateway_transaction_id VARCHAR(100),
    gateway_reference VARCHAR(100),
    gateway_response JSONB, -- Full gateway response
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    paid_at TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow States (Complete audit trail)
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    -- State Transition
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50),
    
    -- Actor Info
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject', 'pay', 'audit'
    
    -- Details
    comments TEXT,
    metadata JSONB, -- Additional context
    
    -- Timeline
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews table (Document review results)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    
    -- Review Details
    review_type VARCHAR(30) DEFAULT 'document', -- 'document', 'technical'
    review_round INTEGER DEFAULT 1, -- 1st, 2nd, 3rd review
    
    -- Results
    status VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'pending'
    checklist_results JSONB, -- Detailed checklist scores
    comments TEXT,
    
    -- Timeline
    reviewed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audits table (Audit results and scheduling)
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    auditor_id UUID NOT NULL REFERENCES users(id),
    
    -- Audit Info
    audit_type VARCHAR(30) NOT NULL, -- 'online', 'onsite', 'field'
    audit_round INTEGER DEFAULT 1, -- 1st audit, re-audit
    
    -- Scheduling
    scheduled_date TIMESTAMP,
    scheduled_location TEXT,
    
    -- Results
    status VARCHAR(20), -- 'scheduled', 'completed', 'cancelled'
    result VARCHAR(20), -- 'pass', 'fail', 'doubt'
    score DECIMAL(5,2), -- Overall audit score
    
    -- Findings
    findings JSONB, -- Detailed audit findings
    recommendations TEXT,
    photos JSONB, -- Array of photo paths
    
    -- Timeline
    conducted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Approvals table (Final approval decisions)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    approver_id UUID NOT NULL REFERENCES users(id),
    
    -- Decision
    decision VARCHAR(20) NOT NULL, -- 'approved', 'rejected'
    decision_reason TEXT,
    
    -- Certificate Info (if approved)
    certificate_number VARCHAR(50),
    certificate_path VARCHAR(500), -- PDF file path
    digital_signature JSONB, -- Signature metadata
    qr_code_data TEXT, -- QR code content
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    -- Timeline
    approved_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table (System notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    application_id UUID REFERENCES applications(id),
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL, -- 'payment', 'status', 'deadline', 'approval'
    
    -- Delivery
    channels JSONB, -- ['email', 'sms', 'push', 'line']
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs (Complete system audit trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    user_id UUID REFERENCES users(id),
    application_id UUID REFERENCES applications(id),
    
    -- Action
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
    resource_type VARCHAR(50) NOT NULL, -- 'application', 'payment', 'document'
    resource_id UUID NOT NULL,
    
    -- Details
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    changes JSONB, -- Specific changes made
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Timeline
    created_at TIMESTAMP DEFAULT NOW()
);

-- Configuration table (System settings)
CREATE TABLE configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Setting
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(30) DEFAULT 'general', -- 'payment', 'workflow', 'notification'
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO configurations (setting_key, setting_value, setting_type, description) VALUES
('payment.document_review_fee', '5000', 'payment', 'Document review fee in THB'),
('payment.audit_fee', '25000', 'payment', 'Audit fee in THB'),
('payment.max_rejections_free', '2', 'workflow', 'Maximum free document rejections'),
('workflow.auto_assign_reviewers', 'true', 'workflow', 'Auto-assign available reviewers'),
('notification.email_enabled', 'true', 'notification', 'Enable email notifications'),
('notification.sms_enabled', 'true', 'notification', 'Enable SMS notifications');

-- Indexes for performance
CREATE INDEX idx_applications_farmer_id ON applications(farmer_id);
CREATE INDEX idx_applications_status ON applications(current_status);
CREATE INDEX idx_applications_stage ON applications(current_stage);
CREATE INDEX idx_applications_number ON applications(application_number);

CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_type ON documents(document_type);

CREATE INDEX idx_payments_application_id ON payments(application_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);

CREATE INDEX idx_workflow_states_application_id ON workflow_states(application_id);
CREATE INDEX idx_workflow_states_actor ON workflow_states(actor_id);

CREATE INDEX idx_reviews_application_id ON reviews(application_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

CREATE INDEX idx_audits_application_id ON audits(application_id);
CREATE INDEX idx_audits_auditor_id ON audits(auditor_id);

CREATE INDEX idx_approvals_application_id ON approvals(application_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_application_id ON audit_logs(application_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Views for common queries

-- Active Applications View
CREATE VIEW v_active_applications AS
SELECT 
    a.*,
    u.first_name || ' ' || u.last_name AS farmer_name,
    u.email AS farmer_email,
    u.phone_number AS farmer_phone,
    reviewer.first_name || ' ' || reviewer.last_name AS reviewer_name,
    auditor.first_name || ' ' || auditor.last_name AS auditor_name,
    approver.first_name || ' ' || approver.last_name AS approver_name
FROM applications a
LEFT JOIN users u ON a.farmer_id = u.id
LEFT JOIN users reviewer ON a.assigned_reviewer_id = reviewer.id
LEFT JOIN users auditor ON a.assigned_auditor_id = auditor.id
LEFT JOIN users approver ON a.assigned_approver_id = approver.id
WHERE a.current_status != 'cancelled';

-- Payment Summary View
CREATE VIEW v_payment_summary AS
SELECT 
    application_id,
    COUNT(*) AS total_payments,
    SUM(amount) AS total_amount,
    SUM(CASE WHEN payment_type = 'document_review' THEN amount ELSE 0 END) AS review_fees,
    SUM(CASE WHEN payment_type = 'audit_fee' THEN amount ELSE 0 END) AS audit_fees,
    MAX(paid_at) AS last_payment_date
FROM payments 
WHERE status = 'completed'
GROUP BY application_id;

-- Workflow Progress View
CREATE VIEW v_workflow_progress AS
SELECT 
    application_id,
    COUNT(*) AS total_transitions,
    MAX(created_at) AS last_transition,
    array_agg(to_status ORDER BY created_at) AS status_history
FROM workflow_states
GROUP BY application_id;

-- Functions for workflow transitions

-- Function to update application status
CREATE OR REPLACE FUNCTION update_application_status(
    p_application_id UUID,
    p_new_status VARCHAR(50),
    p_new_stage VARCHAR(50),
    p_actor_id UUID,
    p_actor_role VARCHAR(20),
    p_action VARCHAR(50),
    p_comments TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(50);
    current_stage VARCHAR(50);
BEGIN
    -- Get current status
    SELECT current_status, current_stage 
    INTO current_status, current_stage
    FROM applications 
    WHERE id = p_application_id;
    
    -- Update application
    UPDATE applications 
    SET 
        current_status = p_new_status,
        current_stage = p_new_stage,
        updated_at = NOW()
    WHERE id = p_application_id;
    
    -- Log workflow transition
    INSERT INTO workflow_states (
        application_id, from_status, to_status, from_stage, to_stage,
        actor_id, actor_role, action, comments
    ) VALUES (
        p_application_id, current_status, p_new_status, current_stage, p_new_stage,
        p_actor_id, p_actor_role, p_action, p_comments
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check payment requirements
CREATE OR REPLACE FUNCTION check_payment_required(
    p_application_id UUID
) RETURNS JSONB AS $$
DECLARE
    app_record RECORD;
    payment_required JSONB;
BEGIN
    SELECT rejection_count, current_status, current_stage
    INTO app_record
    FROM applications
    WHERE id = p_application_id;
    
    payment_required := '{}'::jsonb;
    
    -- Check for 3rd review payment
    IF app_record.rejection_count >= 2 AND app_record.current_status = 'rejected' THEN
        payment_required := payment_required || '{"third_review": {"amount": 5000, "reason": "3rd document review"}}'::jsonb;
    END IF;
    
    -- Check for audit payment
    IF app_record.current_status IN ('audit_failed', 'audit_doubt') THEN
        payment_required := payment_required || '{"audit": {"amount": 25000, "reason": "audit fee"}}'::jsonb;
    END IF;
    
    RETURN payment_required;
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, application_id, action, resource_type, resource_id,
        old_values, new_values, created_at
    ) VALUES (
        COALESCE(NEW.updated_by, NEW.created_by), -- Use appropriate user field
        NEW.id,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        NOW()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_applications 
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments 
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_approvals 
    AFTER INSERT OR UPDATE OR DELETE ON approvals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Comments for documentation
COMMENT ON TABLE applications IS 'Core GACP license applications with workflow tracking';
COMMENT ON TABLE payments IS 'All payments including document review fees and audit fees';
COMMENT ON TABLE workflow_states IS 'Complete audit trail of application status changes';
COMMENT ON TABLE reviews IS 'Document review results from reviewers';
COMMENT ON TABLE audits IS 'Audit scheduling and results';
COMMENT ON TABLE approvals IS 'Final approval decisions and certificate generation';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE audit_logs IS 'Complete system audit trail for compliance';