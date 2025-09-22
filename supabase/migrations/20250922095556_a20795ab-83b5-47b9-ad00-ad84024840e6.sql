-- Enhanced GACP Platform Schema
-- Drop existing tables to recreate with enhanced structure
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS assessment_type CASCADE;
DROP TYPE IF EXISTS assessment_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;

-- Create enhanced enums
CREATE TYPE user_role AS ENUM ('applicant', 'reviewer', 'auditor', 'admin');
CREATE TYPE application_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'DOCS_APPROVED', 
  'PAYMENT_PENDING', 'ONLINE_SCHEDULED', 'ONLINE_COMPLETED', 
  'ONSITE_SCHEDULED', 'ONSITE_COMPLETED', 'CERTIFIED', 'REVOKED'
);
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE assessment_type AS ENUM ('ONLINE', 'ONSITE');
CREATE TYPE assessment_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE document_type AS ENUM (
  'GTL1_FORM', 'COA_CERTIFICATE', 'FARM_MAP', 'PHOTOS', 'TRAINING_RECORDS',
  'BUSINESS_LICENSE', 'ID_CARD', 'STAFF_LIST', 'SOP_DOCUMENTS', 'OTHER'
);

-- Enhanced Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'applicant',
  full_name TEXT NOT NULL,
  phone TEXT,
  organization_name TEXT,
  thai_id_number TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Applications table with detailed farm info
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_number TEXT UNIQUE,
  status application_status DEFAULT 'DRAFT',
  revision_count INTEGER DEFAULT 0,
  
  -- Applicant Information
  applicant_name TEXT,
  applicant_id_number TEXT,
  applicant_address TEXT,
  applicant_phone TEXT,
  applicant_email TEXT,
  organization_name TEXT,
  organization_registration TEXT,
  representative_name TEXT,
  representative_position TEXT,
  
  -- Farm/Facility Information
  farm_name TEXT,
  farm_address TEXT,
  farm_coordinates TEXT, -- GPS coordinates
  farm_area_rai DECIMAL(10,2),
  farm_area_ngan DECIMAL(10,2),
  farm_area_wah DECIMAL(10,2),
  crop_types TEXT[], -- Array of crop types
  cultivation_methods TEXT[],
  expected_yield TEXT,
  
  -- Staff and Training
  responsible_person TEXT,
  staff_count INTEGER,
  training_completed BOOLEAN DEFAULT false,
  training_date DATE,
  
  -- Metadata and tracking
  metadata JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  revision_reason TEXT,
  reviewer_comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  s3_key TEXT NOT NULL,
  s3_url TEXT,
  mime_type TEXT,
  verified BOOLEAN DEFAULT false,
  virus_scan_status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Payments table with milestone tracking
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  milestone INTEGER NOT NULL, -- 1 for document review (5,000), 2 for onsite (25,000)
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  
  -- Gateway information
  gateway_name TEXT, -- 'stripe', '2c2p', 'omise', 'manual'
  gateway_payment_id TEXT,
  gateway_session_id TEXT,
  checkout_url TEXT,
  
  status payment_status DEFAULT 'PENDING',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  
  -- Webhook tracking
  webhook_received_at TIMESTAMP WITH TIME ZONE,
  webhook_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  auditor_id UUID REFERENCES public.profiles(id),
  type assessment_type NOT NULL,
  status assessment_status DEFAULT 'SCHEDULED',
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Online assessment specific
  meeting_url TEXT,
  meeting_token TEXT,
  recording_url TEXT,
  recording_duration INTEGER,
  screenshots_urls TEXT[],
  
  -- Onsite assessment specific
  onsite_address TEXT,
  travel_notes TEXT,
  onsite_photos TEXT[],
  
  -- Assessment results
  score INTEGER, -- 0-100
  passed BOOLEAN,
  result_summary TEXT,
  detailed_report TEXT,
  report_pdf_url TEXT,
  evidence_urls TEXT[],
  
  -- Checklist and criteria
  checklist_data JSONB, -- Store checklist responses
  criteria_scores JSONB, -- Store individual criteria scores
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  
  -- Certificate details
  applicant_name TEXT NOT NULL,
  organization_name TEXT,
  farm_name TEXT,
  farm_address TEXT,
  crop_types TEXT[],
  
  -- Validity
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_from DATE NOT NULL,
  expires_at DATE NOT NULL,
  validity_period_months INTEGER DEFAULT 36, -- 3 years
  
  -- Certificate files
  pdf_url TEXT,
  qr_code_data TEXT, -- QR code content
  qr_code_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  revoked_by UUID REFERENCES public.profiles(id),
  
  -- Verification
  verification_url TEXT,
  verification_code TEXT UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Reviews table for reviewer workflow
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Review details
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'return', 'reject')),
  checklist_items JSONB, -- Store checklist with pass/fail for each item
  required_documents JSONB, -- Track which documents are missing/invalid
  
  -- Feedback
  reasons TEXT[],
  comments TEXT,
  internal_notes TEXT,
  
  -- Tracking
  review_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comprehensive Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  user_role user_role,
  
  -- What action was performed
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- When and where
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Details of the change
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  
  -- Additional context
  application_number TEXT,
  outcome TEXT, -- 'success', 'failure', 'partial'
  error_message TEXT
);

-- System Configuration table
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Enhanced RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enhanced RLS Policies for applications
CREATE POLICY "Applicants can view own applications" ON public.applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Applicants can create own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicants can update own draft applications" ON public.applications FOR UPDATE USING (
  auth.uid() = applicant_id AND status IN ('DRAFT', 'RETURNED')
);
CREATE POLICY "Staff can view relevant applications" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'auditor', 'admin'))
);
CREATE POLICY "Staff can update applications in their workflow" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'auditor', 'admin'))
);

-- Enhanced RLS Policies for documents
CREATE POLICY "Users can access own application documents" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND applicant_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'auditor', 'admin'))
);

-- Enhanced RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND applicant_id = auth.uid())
);
CREATE POLICY "Staff can view all payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'reviewer'))
);
CREATE POLICY "System can manage payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enhanced RLS Policies for assessments
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND applicant_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin'))
  OR auth.uid() = auditor_id
);
CREATE POLICY "Auditors can manage assessments" ON public.assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin'))
);

-- Enhanced RLS Policies for certificates
CREATE POLICY "Anyone can view valid certificates" ON public.certificates FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND applicant_id = auth.uid())
);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enhanced RLS Policies for reviews
CREATE POLICY "Reviewers can manage reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
  OR auth.uid() = reviewer_id
);

-- Enhanced RLS Policies for audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for system config
CREATE POLICY "Admins can manage system config" ON public.system_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_applications_applicant_status ON public.applications(applicant_id, status);
CREATE INDEX idx_applications_status_updated ON public.applications(status, updated_at);
CREATE INDEX idx_applications_number ON public.applications(application_number);
CREATE INDEX idx_documents_application_type ON public.documents(application_id, document_type);
CREATE INDEX idx_documents_verified ON public.documents(verified, document_type);
CREATE INDEX idx_payments_application_milestone ON public.payments(application_id, milestone);
CREATE INDEX idx_payments_status_created ON public.payments(status, created_at);
CREATE INDEX idx_assessments_application_type ON public.assessments(application_id, type);
CREATE INDEX idx_assessments_auditor_scheduled ON public.assessments(auditor_id, scheduled_at);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_active_expires ON public.certificates(is_active, expires_at);
CREATE INDEX idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action_timestamp ON public.audit_logs(action, timestamp);

-- Enhanced Functions
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    app_number TEXT;
BEGIN
    year_suffix := (EXTRACT(YEAR FROM NOW()) + 543)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 'GACP-(\d+)-' || year_suffix) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.applications
    WHERE application_number LIKE 'GACP-%-' || year_suffix;
    
    app_number := 'GACP-' || LPAD(sequence_num::TEXT, 4, '0') || '-' || year_suffix;
    
    RETURN app_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    cert_number TEXT;
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 'CERT-(\d+)-' || year_suffix) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.certificates
    WHERE certificate_number LIKE 'CERT-%-' || year_suffix;
    
    cert_number := 'CERT-' || LPAD(sequence_num::TEXT, 6, '0') || '-' || year_suffix;
    
    RETURN cert_number;
END;
$$;

-- Audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    user_info RECORD;
BEGIN
    -- Get user information
    SELECT email, role INTO user_info
    FROM public.profiles
    WHERE id = p_user_id;
    
    INSERT INTO public.audit_logs (
        user_id, user_email, user_role, action, resource_type, resource_id,
        old_values, new_values, details
    ) VALUES (
        p_user_id, user_info.email, user_info.role, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to update application status with audit logging
CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id UUID,
    p_new_status application_status,
    p_user_id UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_status application_status;
    app_number TEXT;
BEGIN
    -- Get current status
    SELECT status, application_number INTO old_status, app_number
    FROM public.applications
    WHERE id = p_application_id;
    
    -- Update status
    UPDATE public.applications
    SET status = p_new_status,
        reviewer_comments = COALESCE(p_comments, reviewer_comments),
        updated_at = NOW()
    WHERE id = p_application_id;
    
    -- Log the change
    PERFORM public.log_audit_event(
        p_user_id,
        'update_application_status',
        'application',
        p_application_id,
        jsonb_build_object('status', old_status),
        jsonb_build_object('status', p_new_status, 'comments', p_comments),
        jsonb_build_object('application_number', app_number)
    );
    
    RETURN TRUE;
END;
$$;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system configuration
INSERT INTO public.system_config (key, value, description) VALUES
('payment_amounts', '{"document_review": 5000, "onsite_assessment": 25000}', 'Payment amounts for different milestones'),
('certificate_validity_months', '36', 'Default certificate validity period in months'),
('assessment_duration_minutes', '{"online": 60, "onsite": 240}', 'Default assessment duration'),
('supported_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx"]', 'Allowed file types for document upload'),
('max_file_size_mb', '10', 'Maximum file size for uploads in MB');