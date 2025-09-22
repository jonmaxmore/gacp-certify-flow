-- SECURITY FIX: Remove password_hash column and strengthen profiles table security
-- Fixed version with correct trigger syntax

-- 1. Remove the dangerous password_hash column (Supabase handles auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Drop existing update policies to recreate with better security
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

-- 3. Create improved update policy without recursive queries
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Users cannot change their own role unless they are admin
  (profiles.role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR is_admin(auth.uid()))
);

-- 4. Add audit trigger for sensitive profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to sensitive fields (only for UPDATE operations)
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number) OR
       (OLD.role IS DISTINCT FROM NEW.role) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      
      PERFORM log_audit_event(
        COALESCE(auth.uid(), NEW.id),
        'profile_sensitive_update',
        'profile',
        NEW.id,
        jsonb_build_object(
          'thai_id_number_changed', (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number),
          'role', OLD.role,
          'is_active', OLD.is_active
        ),
        jsonb_build_object(
          'thai_id_number_changed', (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number),
          'role', NEW.role,
          'is_active', NEW.is_active
        ),
        jsonb_build_object('operation', TG_OP)
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the audit trigger
DROP TRIGGER IF EXISTS audit_profile_sensitive_changes ON public.profiles;
CREATE TRIGGER audit_profile_sensitive_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 5. Add function for staff to safely access identity verification data
CREATE OR REPLACE FUNCTION public.verify_identity_access(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  result jsonb;
BEGIN
  -- Check if current user has permission to verify identities
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'reviewer', 'auditor') THEN
    RAISE EXCEPTION 'Insufficient permissions to access identity verification data';
  END IF;
  
  -- Log the access attempt
  PERFORM log_security_event(
    auth.uid(),
    'identity_verification_access',
    'medium',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'accessor_role', current_user_role
    )
  );
  
  -- Return limited identity verification data (no actual sensitive data)
  SELECT jsonb_build_object(
    'user_id', id,
    'full_name', full_name,
    'organization_name', organization_name,
    'has_thai_id', thai_id_number IS NOT NULL AND thai_id_number != '',
    'phone_verified', phone IS NOT NULL AND phone != '',
    'address_provided', address IS NOT NULL AND address != '',
    'verification_timestamp', NOW()
  ) INTO result
  FROM profiles
  WHERE id = target_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 6. Add rate limiting function for profile updates
CREATE OR REPLACE FUNCTION public.check_profile_update_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit profile updates (max 10 per hour per user)
  IF NOT check_rate_limit(
    auth.uid()::text, 
    'profile_update', 
    10, -- max attempts
    60  -- window in minutes
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for profile updates. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting trigger
DROP TRIGGER IF EXISTS profile_update_rate_limit ON public.profiles;
CREATE TRIGGER profile_update_rate_limit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update_rate_limit();

-- 7. Add security comment to document protections
COMMENT ON TABLE public.profiles IS 'User profile data with enhanced security: RLS policies, audit logging, rate limiting, and no password storage. Sensitive data access is logged and restricted.';

-- 8. Create view for safe profile data access (excludes sensitive fields for non-privileged users)
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  email,
  full_name,
  organization_name,
  role,
  is_active,
  created_at,
  updated_at,
  -- Conditionally show sensitive data only to authorized users
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN phone
    ELSE NULL 
  END as phone,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN address
    ELSE NULL 
  END as address,
  -- Never show Thai ID directly, only indicate if present
  (thai_id_number IS NOT NULL AND thai_id_number != '') as has_identification
FROM public.profiles;

-- Grant appropriate access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;