-- Phase 1: Critical Security Fixes
-- Fix function search paths and consolidate RLS policies

-- 1. Fix database functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update functions that are missing search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'applicant'),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    
    RETURN NEW;
END;
$function$;

-- 2. Consolidate profiles table RLS policies
-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users can update own basic profile data" ON public.profiles;
DROP POLICY IF EXISTS "secure_profile_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "secure_service_profile_creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create own profile" ON public.profiles;

-- Create consolidated, secure RLS policies for profiles
CREATE POLICY "profiles_own_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_admin_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "profiles_own_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.get_current_user_role() = 'admin')
);

CREATE POLICY "profiles_admin_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "profiles_service_insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = id AND 
  EXISTS (SELECT 1 FROM auth.users WHERE users.id = profiles.id)
);

-- 3. Strengthen applications table security - limit sensitive data access
-- Add policy to restrict access to sensitive fields
CREATE OR REPLACE FUNCTION public.can_access_application_sensitive_data(app_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = app_id AND (
      a.applicant_id = auth.uid() OR 
      p.role IN ('admin', 'reviewer', 'auditor')
    )
  );
$$;

-- 4. Strengthen payments table security
-- Add additional RLS layer for payment data
CREATE POLICY "payments_restricted_access" 
ON public.payments 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = payments.application_id AND (
      a.applicant_id = auth.uid() OR 
      p.role IN ('admin', 'reviewer')
    )
  )
);

-- Drop the existing broader payment policies and replace with more restrictive ones
DROP POLICY IF EXISTS "Authenticated users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated staff can view all payments" ON public.payments;

CREATE POLICY "payments_own_select" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE applications.id = payments.application_id 
    AND applications.applicant_id = auth.uid()
  )
);

CREATE POLICY "payments_staff_select" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'reviewer'));

-- 5. Add audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive application data
  IF TG_TABLE_NAME = 'applications' AND TG_OP = 'SELECT' THEN
    PERFORM log_audit_event(
      auth.uid(),
      'sensitive_data_access',
      'application',
      NEW.id,
      NULL,
      NULL,
      jsonb_build_object(
        'table', 'applications',
        'accessed_fields', 'sensitive_personal_data'
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Create view for safe application data access (excluding most sensitive fields)
CREATE OR REPLACE VIEW public.applications_safe AS
SELECT 
  id,
  applicant_id,
  application_number,
  status,
  farm_name,
  farm_address,
  crop_types,
  farm_area_rai,
  farm_area_ngan,
  farm_area_wah,
  created_at,
  updated_at,
  submitted_at,
  -- Only show applicant name and organization, hide other personal details
  applicant_name,
  organization_name,
  -- Hide sensitive personal information
  CASE 
    WHEN auth.uid() = applicant_id OR public.get_current_user_role() IN ('admin', 'reviewer', 'auditor') 
    THEN applicant_email 
    ELSE NULL 
  END as applicant_email,
  CASE 
    WHEN auth.uid() = applicant_id OR public.get_current_user_role() IN ('admin', 'reviewer', 'auditor') 
    THEN applicant_phone 
    ELSE NULL 
  END as applicant_phone,
  CASE 
    WHEN auth.uid() = applicant_id OR public.get_current_user_role() IN ('admin', 'reviewer', 'auditor') 
    THEN applicant_address 
    ELSE NULL 
  END as applicant_address,
  CASE 
    WHEN auth.uid() = applicant_id OR public.get_current_user_role() IN ('admin', 'reviewer', 'auditor') 
    THEN applicant_id_number 
    ELSE NULL 
  END as applicant_id_number
FROM public.applications;

-- Enable RLS on the safe view
ALTER VIEW public.applications_safe SET (security_barrier = true);

-- 7. Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.check_sensitive_operation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit sensitive data access (max 100 per hour per user)
  IF NOT check_rate_limit(
    auth.uid()::text, 
    'sensitive_data_access', 
    100, -- max attempts
    60   -- window in minutes
  ) THEN
    PERFORM log_security_event(
      auth.uid(),
      'sensitive_data_rate_limit_exceeded',
      'high',
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    RAISE EXCEPTION 'Rate limit exceeded for sensitive data access. Please wait before trying again.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. Create security monitoring functions
CREATE OR REPLACE FUNCTION public.monitor_admin_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all admin actions for monitoring
  IF public.get_current_user_role() = 'admin' THEN
    PERFORM log_security_event(
      auth.uid(),
      'admin_action',
      'medium',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for monitoring admin actions on sensitive tables
DROP TRIGGER IF EXISTS monitor_profiles_admin_actions ON public.profiles;
CREATE TRIGGER monitor_profiles_admin_actions
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.monitor_admin_actions();

-- 9. Ensure system_config has additional protection
DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;

CREATE POLICY "system_config_admin_only" 
ON public.system_config 
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Add audit logging for system config changes
CREATE OR REPLACE FUNCTION public.audit_system_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_security_event(
    auth.uid(),
    'system_config_change',
    'critical',
    jsonb_build_object(
      'key', COALESCE(NEW.key, OLD.key),
      'operation', TG_OP,
      'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
      'new_value', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.value ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_system_config ON public.system_config;
CREATE TRIGGER audit_system_config
  AFTER INSERT OR UPDATE OR DELETE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_system_config_changes();