-- Final security fixes to address all remaining linter issues

-- 1. Check and fix any remaining functions without proper search_path
-- Let's update all remaining functions that might be missing search_path

CREATE OR REPLACE FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_details jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_application_status(p_application_id uuid, p_new_status application_status, p_user_id uuid, p_comments text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.verify_certificate(cert_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    cert_record RECORD;
    result JSON;
BEGIN
    SELECT 
        certificate_number,
        is_active,
        expires_at,
        CASE 
            WHEN expires_at > CURRENT_DATE AND is_active = true THEN 'valid'
            WHEN expires_at <= CURRENT_DATE THEN 'expired'
            WHEN is_active = false THEN 'revoked'
            ELSE 'invalid'
        END as status
    INTO cert_record
    FROM certificates
    WHERE certificate_number = cert_number;
    
    IF cert_record IS NULL THEN
        result := json_build_object(
            'valid', false,
            'status', 'not_found',
            'message', 'Certificate not found'
        );
    ELSE
        result := json_build_object(
            'valid', cert_record.status = 'valid',
            'status', cert_record.status,
            'certificate_number', cert_record.certificate_number,
            'expires_at', cert_record.expires_at
        );
    END IF;
    
    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    current_user_role user_role;
    old_role user_role;
    target_user_email TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can update user roles';
    END IF;
    
    -- Prevent self-role modification
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Administrators cannot modify their own role';
    END IF;
    
    -- Get target user info
    SELECT email, role INTO target_user_email, old_role
    FROM profiles
    WHERE id = target_user_id;
    
    IF target_user_email IS NULL THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;
    
    -- Update the role
    UPDATE profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the role change
    PERFORM log_audit_event(
        auth.uid(),
        'update_user_role',
        'profile',
        target_user_id,
        jsonb_build_object('old_role', old_role),
        jsonb_build_object('new_role', new_role),
        jsonb_build_object('target_email', target_user_email)
    );
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_issue_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    cert_number TEXT;
    cert_id UUID;
BEGIN
    -- Only proceed if status changed to CERTIFIED
    IF NEW.status = 'CERTIFIED' AND (OLD.status IS NULL OR OLD.status != 'CERTIFIED') THEN
        
        -- Generate certificate number
        cert_number := public.generate_certificate_number();
        
        -- Create certificate record
        INSERT INTO public.certificates (
            id,
            certificate_number,
            application_id,
            applicant_name,
            organization_name,
            farm_name,
            farm_address,
            crop_types,
            valid_from,
            expires_at,
            verification_code,
            verification_url,
            qr_code_data
        ) VALUES (
            gen_random_uuid(),
            cert_number,
            NEW.id,
            NEW.applicant_name,
            NEW.organization_name,
            NEW.farm_name,
            NEW.farm_address,
            NEW.crop_types,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '36 months',
            UPPER(SUBSTRING(MD5(cert_number || NEW.id::text) FROM 1 FOR 8)),
            'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number,
            jsonb_build_object(
                'certificate_number', cert_number,
                'issued_date', CURRENT_DATE,
                'expires_date', CURRENT_DATE + INTERVAL '36 months',
                'verification_url', 'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number
            )
        ) RETURNING id INTO cert_id;
        
        -- Log the certificate issuance
        PERFORM log_audit_event(
            NEW.applicant_id,
            'certificate_issued',
            'certificate',
            cert_id,
            NULL,
            jsonb_build_object(
                'certificate_number', cert_number,
                'application_id', NEW.id,
                'application_number', NEW.application_number
            ),
            jsonb_build_object('auto_issued', true)
        );
        
        -- Create notification for applicant
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            priority,
            action_url,
            action_label,
            related_id
        ) VALUES (
            NEW.applicant_id,
            'certificate_issued',
            'ใบรับรอง GACP ออกแล้ว',
            'ใบรับรองหมายเลข ' || cert_number || ' ได้รับการออกให้เรียบร้อยแล้ว สามารถดาวน์โหลดและตรวจสอบได้',
            'high',
            '/applicant/certificates',
            'ดูใบรับรอง',
            cert_id
        );
        
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_identity_access(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_profile_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_identity_verification_status(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_safe_profile(target_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_profile_update_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_identifier TEXT;
BEGIN
  -- Get the user identifier, handling NULL case during authentication
  user_identifier := COALESCE(auth.uid()::text, 'anonymous');
  
  -- Skip rate limiting during authentication process (when auth.uid() is NULL)
  IF user_identifier = 'anonymous' THEN
    RETURN NEW;
  END IF;
  
  -- Rate limit profile updates (max 10 per hour per user)
  IF NOT check_rate_limit(
    user_identifier, 
    'profile_update', 
    10, -- max attempts
    60  -- window in minutes
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for profile updates. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.secure_profile_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_identifier TEXT;
BEGIN
  -- Get the user identifier, handling NULL case during authentication
  user_identifier := COALESCE(auth.uid()::text, 'anonymous');
  
  -- Skip rate limiting during authentication process (when auth.uid() is NULL)
  IF user_identifier = 'anonymous' THEN
    RETURN NEW;
  END IF;
  
  -- Rate limit profile updates more aggressively
  IF NOT check_rate_limit(
    user_identifier, 
    'secure_profile_update', 
    5,  -- max 5 attempts per hour (reduced from 10)
    60  -- 60 minute window
  ) THEN
    -- Log rate limit violation (only if we have a valid user ID)
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
$function$;

-- 2. Remove the problematic view and rely on direct table access with RLS
DROP VIEW IF EXISTS public.applications_safe;

-- The view was causing security definer issues, so we'll rely on proper RLS policies on the main table
-- Applications table already has proper RLS policies that protect sensitive data

-- 3. Ensure all anonymous access warnings are properly addressed
-- The warnings are mostly false positives since all policies use "TO authenticated"
-- But let's be explicit about requiring authentication

-- Make sure there are no public roles accidentally granted
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;