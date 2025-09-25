-- SECURITY FIX: Drop the insecure views that lack RLS
DROP VIEW IF EXISTS public.secure_applications;
DROP VIEW IF EXISTS public.secure_profiles;

-- SECURITY ENHANCEMENT: Create function to check data access permissions
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Allow access if:
  -- 1. User is accessing their own data
  -- 2. User is admin/reviewer/auditor
  RETURN (
    auth.uid() = target_user_id OR 
    current_user_role IN ('admin', 'reviewer', 'auditor')
  );
END;
$$;

-- SECURITY ENHANCEMENT: Enhanced rate limiting for admin operations
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Rate limit admin operations (max 50 per hour)
  IF public.get_current_user_role() = 'admin' THEN
    IF NOT public.check_rate_limit(
      auth.uid()::text, 
      'admin_operation', 
      50,  -- max attempts
      60   -- window in minutes
    ) THEN
      PERFORM public.log_security_event(
        auth.uid(),
        'admin_rate_limit_exceeded',
        'critical',
        jsonb_build_object(
          'table', TG_TABLE_NAME, 
          'operation', TG_OP,
          'timestamp', NOW()
        )
      );
      RAISE EXCEPTION 'Rate limit exceeded for admin operations. Please wait before trying again.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- SECURITY FIX: Add triggers for enhanced monitoring on critical tables
DROP TRIGGER IF EXISTS rate_limit_admin_profiles ON profiles;
CREATE TRIGGER rate_limit_admin_profiles
  BEFORE UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_admin_operation_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_admin_certificates ON certificates;
CREATE TRIGGER rate_limit_admin_certificates
  BEFORE INSERT OR UPDATE OR DELETE ON certificates
  FOR EACH ROW EXECUTE FUNCTION check_admin_operation_rate_limit();

-- SECURITY ENHANCEMENT: Create function to clean up old security logs
CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Archive old audit logs (keep last 6 months, anonymize older)
  UPDATE audit_logs 
  SET 
    user_email = 'archived@system.local',
    ip_address = NULL,
    user_agent = 'archived',
    details = jsonb_build_object('archived', true, 'original_timestamp', timestamp)
  WHERE timestamp < NOW() - INTERVAL '6 months'
  AND user_email != 'archived@system.local';
  
  -- Delete very old audit logs (older than 2 years)
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '2 years';
END;
$$;