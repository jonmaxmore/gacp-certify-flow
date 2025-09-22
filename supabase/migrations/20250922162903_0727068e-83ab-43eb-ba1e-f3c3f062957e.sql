-- Fix remaining security warnings from linter

-- 1. Remove the security definer view and replace with a secure function
DROP VIEW IF EXISTS public.safe_profiles;

-- 2. Create a secure function instead of a view for safe profile access
CREATE OR REPLACE FUNCTION public.get_safe_profile(target_user_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  query_user_id UUID;
BEGIN
  -- Default to current user if no target specified
  query_user_id := COALESCE(target_user_id, auth.uid());
  
  -- Check if user can access this profile
  IF query_user_id != auth.uid() AND NOT is_admin(auth.uid()) THEN
    -- Return minimal public info for other users
    SELECT jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'organization_name', organization_name,
      'role', role
    ) INTO result
    FROM profiles
    WHERE id = query_user_id AND is_active = true;
  ELSE
    -- Return full profile for own profile or admin
    SELECT jsonb_build_object(
      'id', id,
      'email', email,
      'full_name', full_name,
      'organization_name', organization_name,
      'phone', phone,
      'address', address,
      'role', role,
      'is_active', is_active,
      'created_at', created_at,
      'updated_at', updated_at,
      'has_identification', (thai_id_number IS NOT NULL AND thai_id_number != '')
    ) INTO result
    FROM profiles
    WHERE id = query_user_id;
  END IF;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 3. Fix functions with missing search_path (add to all security definer functions)
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_profile_update_rate_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;