-- sql/security-rls-policies.sql

-- Enable RLS on all sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacp_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID 
LANGUAGE SQL 
STABLE
AS $
  SELECT 
    CASE 
      WHEN current_setting('request.jwt.claims', true)::json->>'sub' IS NULL 
      THEN NULL
      ELSE (current_setting('request.jwt.claims', true)::json->>'sub')::UUID
    END
$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS TEXT 
LANGUAGE SQL 
STABLE
AS $
  SELECT current_setting('request.jwt.claims', true)::json->>'role'
$;

-- Policy 1: Users can only see their own profile
CREATE POLICY user_profile_select_policy ON user_profiles
  FOR SELECT
  USING (
    id = auth.uid() 
    OR 
    auth.role() IN ('admin', 'super_admin', 'customer_service')
  );

-- Policy 2: Users can only update their own profile
CREATE POLICY user_profile_update_policy ON user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 3: Application access control
CREATE POLICY application_select_policy ON gacp_applications
  FOR SELECT
  USING (
    CASE auth.role()
      WHEN 'farmer' THEN user_id = auth.uid()
      WHEN 'document_reviewer' THEN status IN ('pending_review', 'resubmission_required')
      WHEN 'auditor' THEN status IN ('pending_audit_payment', 'pending_audit_visit', 'audit_scheduled')
      WHEN 'finance' THEN status IN ('pending_initial_payment', 'pending_audit_payment', 'pending_certificate_payment')
      WHEN 'manager' THEN true
      WHEN 'admin' THEN true
      WHEN 'super_admin' THEN true
      ELSE false
    END
  );

-- Policy 4: Payment visibility
CREATE POLICY payment_select_policy ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gacp_applications a
      WHERE a.id = payments.application_id
      AND (
        a.user_id = auth.uid()
        OR auth.role() IN ('finance', 'manager', 'admin', 'super_admin')
      )
    )
  );

-- Policy 5: Audit log access (read-only for most)
CREATE POLICY audit_log_select_policy ON audit_logs
  FOR SELECT
  USING (auth.role() IN ('admin', 'super_admin', 'auditor'));

-- Policy 6: Document access control
CREATE POLICY document_access_policy ON documents
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM gacp_applications a
      WHERE a.id = documents.application_id
      AND (
        a.user_id = auth.uid()
        OR auth.role() IN ('document_reviewer', 'auditor', 'manager', 'admin', 'super_admin')
      )
    )
  );

-- Create security-definer functions for privileged operations
CREATE OR REPLACE FUNCTION approve_application(
  p_application_id UUID,
  p_comments TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_result JSONB;
  v_current_status TEXT;
BEGIN
  -- Only managers can approve
  IF auth.role() NOT IN ('manager', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  -- Get current status
  SELECT status INTO v_current_status
  FROM gacp_applications
  WHERE id = p_application_id;
  
  -- Validate status transition
  IF v_current_status != 'pending_final_approval' THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;
  
  -- Update application
  UPDATE gacp_applications
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = auth.uid(),
    approval_comments = p_comments
  WHERE id = p_application_id;
  
  -- Log the action
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'APPROVE_APPLICATION',
    'application',
    p_application_id,
    jsonb_build_object('comments', p_comments)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'new_status', 'approved'
  );
  
  RETURN v_result;
END;
$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_application TO manager_role;
GRANT EXECUTE ON FUNCTION approve_application TO super_admin_role;