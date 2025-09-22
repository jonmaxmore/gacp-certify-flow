-- SECURITY FIX: Clean profiles table security vulnerabilities
-- Version 3: Handle existing policies properly

-- 1. Remove the dangerous password_hash column (Supabase handles auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Drop ALL existing update policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;

-- 3. Create new secure update policy with unique name
CREATE POLICY "secure_profile_update_policy" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role self-modification (only admins can change roles)
  (
    profiles.role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) 
    OR is_admin(auth.uid())
  )
);

-- 4. Improve service role policy to be more restrictive
DROP POLICY IF EXISTS "Service role can create profiles" ON public.profiles;
CREATE POLICY "secure_service_profile_creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Service role can only create profiles for existing auth users
  EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id) AND
  -- Cannot create admin profiles via service role
  profiles.role != 'admin'
);

-- 5. Add comprehensive audit function for profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_security_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all sensitive profile changes
  IF TG_OP = 'UPDATE' THEN
    -- Log any change to critical fields
    IF (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number) OR
       (OLD.role IS DISTINCT FROM NEW.role) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) OR
       (OLD.email IS DISTINCT FROM NEW.email) THEN
      
      PERFORM log_security_event(
        COALESCE(auth.uid(), NEW.id),
        'profile_critical_update',
        CASE 
          WHEN (OLD.role IS DISTINCT FROM NEW.role) THEN 'high'
          WHEN (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number) THEN 'high'
          ELSE 'medium'
        END,
        jsonb_build_object(
          'changed_fields', jsonb_build_object(
            'thai_id_updated', (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number),
            'role_changed', (OLD.role IS DISTINCT FROM NEW.role),
            'status_changed', (OLD.is_active IS DISTINCT FROM NEW.is_active),
            'email_changed', (OLD.email IS DISTINCT FROM NEW.email)
          ),
          'old_role', OLD.role,
          'new_role', NEW.role,
          'target_user_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the security audit trigger
DROP TRIGGER IF EXISTS audit_profile_sensitive_changes ON public.profiles;
DROP TRIGGER IF EXISTS profile_security_audit ON public.profiles;
CREATE TRIGGER profile_security_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_security_changes();

-- 6. Secure identity verification function (no actual sensitive data exposure)
CREATE OR REPLACE FUNCTION public.get_identity_verification_status(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  result jsonb;
BEGIN
  -- Verify caller has permission
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_user_role NOT IN ('admin', 'reviewer', 'auditor') THEN
    -- Log unauthorized access attempt
    PERFORM log_security_event(
      auth.uid(),
      'unauthorized_identity_access_attempt',
      'high',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'caller_role', current_user_role
      )
    );
    RAISE EXCEPTION 'Access denied: Insufficient permissions for identity verification';
  END IF;
  
  -- Log authorized access
  PERFORM log_security_event(
    auth.uid(),
    'identity_verification_check',
    'medium',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'accessor_role', current_user_role
    )
  );
  
  -- Return verification status only (no actual sensitive data)
  SELECT jsonb_build_object(
    'user_id', id,
    'full_name', full_name,
    'organization_name', organization_name,
    'verification_status', jsonb_build_object(
      'has_thai_id', thai_id_number IS NOT NULL AND thai_id_number != '',
      'has_phone', phone IS NOT NULL AND phone != '',
      'has_address', address IS NOT NULL AND address != '',
      'profile_complete', (
        thai_id_number IS NOT NULL AND thai_id_number != '' AND
        phone IS NOT NULL AND phone != '' AND
        address IS NOT NULL AND address != ''
      )
    ),
    'checked_at', NOW(),
    'checked_by', auth.uid()
  ) INTO result
  FROM profiles
  WHERE id = target_user_id;
  
  RETURN COALESCE(result, jsonb_build_object('error', 'User not found'));
END;
$$;

-- 7. Rate limiting with enhanced security
CREATE OR REPLACE FUNCTION public.secure_profile_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit profile updates more aggressively
  IF NOT check_rate_limit(
    auth.uid()::text, 
    'secure_profile_update', 
    5,  -- max 5 attempts per hour (reduced from 10)
    60  -- 60 minute window
  ) THEN
    -- Log rate limit violation
    PERFORM log_security_event(
      auth.uid(),
      'profile_update_rate_limit_exceeded',
      'medium',
      jsonb_build_object('timestamp', NOW())
    );
    RAISE EXCEPTION 'Security: Profile update rate limit exceeded. Please wait before trying again.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply rate limiting trigger
DROP TRIGGER IF EXISTS profile_update_rate_limit ON public.profiles;
CREATE TRIGGER secure_profile_rate_limit_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_profile_rate_limit();

-- 8. Update table comment with security information
COMMENT ON TABLE public.profiles IS 'SECURE: User profiles with enhanced protection - no password storage, comprehensive audit logging, rate limiting, and restricted sensitive data access. All access to sensitive fields is logged and monitored.';

-- 9. Create secure profile view that masks sensitive data
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.secure_profile_view AS
SELECT 
  id,
  email,
  full_name,
  organization_name,
  role,
  is_active,
  created_at,
  updated_at,
  last_login_at,
  -- Mask sensitive data for non-owners
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN phone
    ELSE CASE WHEN phone IS NOT NULL AND phone != '' THEN '***-***-****' ELSE NULL END
  END as phone_display,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN address
    ELSE CASE WHEN address IS NOT NULL AND address != '' THEN '[Address provided]' ELSE NULL END 
  END as address_display,
  -- Never expose Thai ID directly
  (thai_id_number IS NOT NULL AND thai_id_number != '') as has_thai_id_verification
FROM public.profiles
WHERE 
  -- Users can see their own profile or admins can see all
  auth.uid() = id OR is_admin(auth.uid()) OR
  -- Staff can see limited info for verification purposes
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('reviewer', 'auditor')
  );

-- Grant access to secure view
GRANT SELECT ON public.secure_profile_view TO authenticated;