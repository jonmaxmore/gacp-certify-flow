-- sql/database-schema.sql

-- Create custom types
CREATE TYPE user_role_enum AS ENUM (
  'farmer', 
  'document_reviewer', 
  'auditor', 
  'manager', 
  'finance', 
  'admin', 
  'super_admin', 
  'customer_service', 
  'cms'
);

CREATE TYPE application_status_enum AS ENUM (
  'draft',
  'pending_initial_payment',
  'pending_review',
  'review_passed',
  'resubmission_required',
  'pending_audit_payment',
  'pending_audit_visit',
  'audit_scheduled',
  'audit_completed',
  'pending_final_approval',
  'pending_certificate_payment',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'suspended',
  'revoked'
);

CREATE TYPE payment_type_enum AS ENUM (
  'initial_review',
  'audit_visit',
  'certificate_issuance',
  'renewal',
  'resubmission'
);

CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'processing',
  'confirmed',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE product_type_enum AS ENUM (
  'cannabis',
  'hemp',
  'herb',
  'medicinal_plant'
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_email TEXT, -- Encrypted version for PII protection
  phone VARCHAR(20),
  encrypted_phone TEXT,
  national_id VARCHAR(13),
  encrypted_national_id TEXT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role_enum NOT NULL DEFAULT 'farmer',
  has_completed_elearning BOOLEAN DEFAULT FALSE,
  elearning_score DECIMAL(5,2),
  elearning_completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  password_hash TEXT NOT NULL,
  password_changed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active) WHERE is_active = TRUE;

-- Products master table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) UNIQUE NOT NULL,
  product_name_th VARCHAR(200) NOT NULL,
  product_name_en VARCHAR(200),
  product_type product_type_enum NOT NULL,
  scientific_name VARCHAR(200),
  family_name VARCHAR(100),
  thc_limit DECIMAL(5,2),
  cbd_range_min DECIMAL(5,2),
  cbd_range_max DECIMAL(5,2),
  target_market TEXT[],
  export_countries TEXT[],
  common_uses TEXT[],
  medicinal_properties JSONB,
  cultivation_period_days INTEGER,
  ideal_climate VARCHAR(100),
  ideal_soil_ph_min DECIMAL(3,1),
  ideal_soil_ph_max DECIMAL(3,1),
  water_requirement VARCHAR(50),
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  requires_special_license BOOLEAN DEFAULT FALSE,
  regulatory_notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GACP Applications table
CREATE TABLE gacp_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code VARCHAR(30) UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  status application_status_enum NOT NULL DEFAULT 'draft',
  
  -- Form data (JSONB for flexibility)
  form_data JSONB NOT NULL,
  
  -- Validation scores
  completeness_score DECIMAL(5,2),
  document_score DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  
  -- Important dates
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  audit_scheduled_at TIMESTAMP,
  audit_completed_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Staff assignments
  reviewer_id UUID REFERENCES user_profiles(id),
  auditor_id UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  
  -- Comments and notes
  reviewer_comments TEXT,
  auditor_comments TEXT,
  approval_comments TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  source VARCHAR(50), -- 'web', 'mobile', 'api'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_applications_user_id ON gacp_applications(user_id);
CREATE INDEX idx_applications_status ON gacp_applications(status);
CREATE INDEX idx_applications_submitted_at ON gacp_applications(submitted_at);
CREATE INDEX idx_applications_code ON gacp_applications(application_code);

-- Application status history (audit trail)
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES gacp_applications(id) ON DELETE CASCADE,
  from_status application_status_enum,
  to_status application_status_enum NOT NULL,
  changed_by UUID REFERENCES user_profiles(id),
  reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_status_history_application ON application_status_history(application_id);
CREATE INDEX idx_status_history_changed_at ON application_status_history(changed_at);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_code VARCHAR(30) UNIQUE NOT NULL,
  application_id UUID REFERENCES gacp_applications(id) ON DELETE RESTRICT,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'THB',
  payment_type payment_type_enum NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  
  -- Invoice information
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  invoice_generated_at TIMESTAMP,
  
  -- Payment details
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50), -- 'omise', 'bank_transfer'
  transaction_id VARCHAR(100),
  reference_number VARCHAR(100),
  
  -- Receipt information
  receipt_number VARCHAR(50),
  receipt_url TEXT,
  receipt_generated_at TIMESTAMP,
  
  -- Important dates
  due_date DATE,
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  -- Refund information
  refund_amount DECIMAL(12,2),
  refund_reason TEXT,
  refund_transaction_id VARCHAR(100),
  
  -- Metadata
  omise_charge_id VARCHAR(100),
  omise_customer_id VARCHAR(100),
  payment_metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_application ON payments(application_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES gacp_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(100),
  url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMP,
  uploaded_by UUID REFERENCES user_profiles(id),
  upload_ip INET,
  checksum VARCHAR(64), -- SHA-256 hash
  metadata JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_application ON documents(application_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_no VARCHAR(50) UNIQUE NOT NULL,
  application_id UUID REFERENCES gacp_applications(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES user_profiles(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Certificate details
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  certification_level VARCHAR(50),
  certification_scope TEXT,
  certified_area_rai DECIMAL(10,2),
  
  -- Files
  pdf_url TEXT NOT NULL,
  qr_code_url TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active',
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  revoked_by UUID REFERENCES user_profiles(id),
  
  -- Renewal information
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  renewal_application_id UUID REFERENCES gacp_applications(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_expiry ON certificates(expiry_date);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  user_role user_role_enum,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  details JSONB,
  session_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW mv_dashboard_statistics AS
SELECT 
  -- Application statistics
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'approved') as approved_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'rejected') as rejected_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('pending_review', 'pending_audit_payment', 'pending_audit_visit')) as pending_applications,
  
  -- User statistics
  COUNT(DISTINCT u.id) as total_farmers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.has_completed_elearning = TRUE) as farmers_completed_elearning,
  
  -- Payment statistics
  SUM(p.amount) FILTER (WHERE p.status = 'confirmed') as total_revenue,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'pending') as pending_payments,
  
  -- Certificate statistics
  COUNT(DISTINCT c.id) as active_certificates,
  COUNT(DISTINCT c.id) FILTER (WHERE c.expiry_date < CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
  
  -- Time metrics
  AVG(EXTRACT(EPOCH FROM (a.approved_at - a.submitted_at)) / 86400) as avg_approval_days,
  
  NOW() as last_updated
FROM gacp_applications a
LEFT JOIN user_profiles u ON a.user_id = u.id
LEFT JOIN payments p ON p.application_id = a.id
LEFT JOIN certificates c ON c.application_id = a.id AND c.status = 'active'
WHERE a.created_at >= NOW() - INTERVAL '1 year';

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_statistics()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_statistics;
END;
$ LANGUAGE plpgsql;