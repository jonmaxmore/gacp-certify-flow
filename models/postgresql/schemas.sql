// models/postgresql/schemas.sql
/**
 * PostgreSQL Schema Definitions for GACP Platform
 * Critical transactional data with ACID compliance
 */

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Custom types
CREATE TYPE user_role AS ENUM (
    'applicant', 'reviewer', 'auditor', 'regional_officer', 
    'admin', 'super_admin', 'read_only'
);

CREATE TYPE application_status AS ENUM (
    'draft', 'pending_initial_payment', 'pending_review',
    'review_passed', 'resubmission_required', 'pending_audit_payment',
    'pending_audit_visit', 'audit_scheduled', 'audit_completed',
    'pending_final_approval', 'approved', 'rejected', 'expired'
);

CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'confirmed', 'failed', 'refunded'
);

CREATE TYPE notification_type AS ENUM (
    'email', 'sms', 'system', 'push'
);

-- Users table (critical authentication data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'applicant',
    
    -- Personal information (encrypted sensitive data)
    national_id_encrypted BYTEA, -- Encrypted national ID
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Account management
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Two-factor authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],
    
    -- Profile data
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'government', 'regional_office', 'contractor'
    code VARCHAR(20) UNIQUE,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address JSONB,
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization relationships
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, organization_id)
);

-- Products/Standards table (GACP standards and requirements)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    
    -- Certification requirements
    requirements JSONB NOT NULL DEFAULT '{}',
    fee_structure JSONB NOT NULL DEFAULT '{}',
    
    -- Product specifications
    specifications JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Applications table (critical state management)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Foreign keys
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Application status
    status application_status DEFAULT 'draft',
    current_step INTEGER DEFAULT 1,
    
    -- Important dates
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Staff assignments
    reviewer_id UUID REFERENCES users(id),
    auditor_id UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    -- MongoDB reference for flexible data
    mongodb_doc_id VARCHAR(255) UNIQUE,
    
    -- Critical scores (cached from MongoDB)
    completeness_score INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    
    -- Version control
    version INTEGER DEFAULT 1,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Application status history
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
    from_status application_status,
    to_status application_status NOT NULL,
    
    -- Who made the change
    changed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    notes TEXT,
    
    -- Timestamp
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (financial transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_type VARCHAR(50) NOT NULL, -- 'application_fee', 'audit_fee'
    
    -- Payment gateway information
    gateway_provider VARCHAR(50), -- 'omise', 'promptpay', 'bank_transfer'
    gateway_transaction_id VARCHAR(255),
    gateway_reference VARCHAR(255),
    
    -- Status tracking
    status payment_status DEFAULT 'pending',
    
    -- Important timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment method details (encrypted)
    payment_method_encrypted BYTEA,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Notification content
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery details
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    delivered BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs (security and compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who performed the action
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- What action was performed
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Details of the change
    old_values JSONB,
    new_values JSONB,
    
    -- Additional context
    metadata JSONB DEFAULT '{}',
    
    -- When it happened
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (user session management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security flags
    is_active BOOLEAN DEFAULT TRUE,
    is_mobile BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for system integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Key details
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    
    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Indexes for performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Applications table indexes  
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX idx_applications_code ON applications(application_code);
CREATE INDEX idx_applications_product_id ON applications(product_id);
CREATE INDEX idx_applications_mongodb_doc_id ON applications(mongodb_doc_id);

-- Composite indexes
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_applications_status_submitted ON applications(status, submitted_at);

-- Application status history indexes
CREATE INDEX idx_application_status_history_app_id ON application_status_history(application_id);
CREATE INDEX idx_application_status_history_changed_at ON application_status_history(changed_at);

-- Payments table indexes
CREATE INDEX idx_payments_application_id ON payments(application_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Sessions table indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Row Level Security (RLS)

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own profile, admins can see all
CREATE POLICY user_own_profile ON users
    FOR ALL 
    TO authenticated_users
    USING (id = current_user_id() OR has_role('admin') OR has_role('super_admin'));

-- Applications: users see their own, staff see assigned ones
CREATE POLICY application_access ON applications
    FOR ALL
    TO authenticated_users
    USING (
        user_id = current_user_id() OR
        reviewer_id = current_user_id() OR
        auditor_id = current_user_id() OR
        has_role('admin') OR
        has_role('super_admin')
    );

-- Payments: users see their own application payments
CREATE POLICY payment_access ON payments
    FOR ALL
    TO authenticated_users
    USING (
        application_id IN (
            SELECT id FROM applications 
            WHERE user_id = current_user_id()
        ) OR
        has_role('admin') OR
        has_role('super_admin')
    );

-- Notifications: users see only their own
CREATE POLICY notification_access ON notifications
    FOR ALL
    TO authenticated_users
    USING (user_id = current_user_id());

-- Helper functions for RLS

-- Get current user ID from JWT token
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('jwt.claims.user_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has specific role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM users 
        WHERE id = current_user_id() 
        AND role::TEXT = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps

-- Generic function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit logging triggers

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        current_user_id(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_applications_changes
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_payments_changes
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

-- Data seeding

-- Insert default organizations
INSERT INTO organizations (id, name, type, code, contact_email) VALUES
    (uuid_generate_v4(), 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก', 'government', 'DTAM', 'info@dtam.go.th'),
    (uuid_generate_v4(), 'สำนักงานมาตรฐานสินค้าเกษตรและอาหารแห่งชาติ', 'government', 'ACFS', 'info@acfs.go.th');

-- Insert default admin user (password: 'admin123' - should be changed immediately)
INSERT INTO users (id, email, password_hash, role, full_name, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'admin@gacp-platform.go.th', crypt('admin123', gen_salt('bf')), 'super_admin', 'System Administrator', true, true);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with authentication and profile data';
COMMENT ON TABLE applications IS 'GACP certification applications with status tracking';
COMMENT ON TABLE payments IS 'Financial transactions for application and audit fees';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON COLUMN users.national_id_encrypted IS 'Encrypted national ID number for security';
COMMENT ON COLUMN applications.mongodb_doc_id IS 'Reference to detailed form data in MongoDB';
COMMENT ON COLUMN payments.payment_method_encrypted IS 'Encrypted payment method details';