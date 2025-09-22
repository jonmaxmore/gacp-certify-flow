-- Final cleanup of security issues

-- 1. Remove the remaining security definer view
DROP VIEW IF EXISTS public.secure_profile_view;

-- 2. Clean up any duplicate functions and ensure proper search_path
DROP FUNCTION IF EXISTS public.audit_profile_security_changes();
DROP FUNCTION IF EXISTS public.secure_profile_rate_limit();

-- 3. Ensure all remaining functions have proper search_path
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