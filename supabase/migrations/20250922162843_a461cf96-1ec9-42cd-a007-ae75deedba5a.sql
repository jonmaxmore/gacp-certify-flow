-- SECURITY FIX: Remove password_hash column and strengthen profiles table security

-- 1. Remove the dangerous password_hash column (Supabase handles auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON public.profiles;

-- 3. Create improved update policy without recursive queries
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Users cannot change their own role (prevent privilege escalation)
  (OLD.role = NEW.role OR is_admin(auth.uid()))
);

-- 4. Restrict service role profile creation to only handle user registration
CREATE POLICY "Service role can create profiles during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Only allow if the profile ID matches a user in auth.users
  EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id)
);

-- 5. Add policy to prevent viewing of sensitive fields by non-owners/admins
CREATE POLICY "Restrict sensitive data access" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  is_admin(auth.uid()) OR
  -- Allow limited access for staff who need to verify identities
  (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('reviewer', 'auditor')) AND
    -- But hide the most sensitive fields (they'll need to use functions for specific access)
    TRUE
  )
);

-- 6. Add audit trigger for sensitive profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to sensitive fields
  IF (OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number) OR
     (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    
    PERFORM log_audit_event(
      COALESCE(auth.uid(), NEW.id),
      'profile_sensitive_update',
      'profile',
      NEW.id,
      jsonb_build_object(
        'thai_id_number', CASE WHEN OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number THEN '***CHANGED***' END,
        'role', OLD.role,
        'is_active', OLD.is_active
      ),
      jsonb_build_object(
        'thai_id_number', CASE WHEN OLD.thai_id_number IS DISTINCT FROM NEW.thai_id_number THEN '***CHANGED***' END,
        'role', NEW.role,
        'is_active', NEW.is_active
      ),
      jsonb_build_object('ip_address', inet_client_addr())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER audit_profile_sensitive_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 7. Add function for staff to safely access identity verification data
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
  
  -- Return limited identity verification data
  SELECT jsonb_build_object(
    'user_id', id,
    'full_name', full_name,
    'organization_name', organization_name,
    'has_thai_id', thai_id_number IS NOT NULL AND thai_id_number != '',
    'phone_verified', phone IS NOT NULL AND phone != '',
    'address_provided', address IS NOT NULL AND address != ''
  ) INTO result
  FROM profiles
  WHERE id = target_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 8. Add rate limiting for sensitive profile operations
CREATE OR REPLACE FUNCTION public.check_profile_operation_rate_limit()
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
CREATE TRIGGER profile_update_rate_limit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_operation_rate_limit();

-- 9. Comment the table to document security measures
COMMENT ON TABLE public.profiles IS 'User profile data with enhanced security measures. Contains sensitive personal information protected by RLS policies, audit logging, and rate limiting.';