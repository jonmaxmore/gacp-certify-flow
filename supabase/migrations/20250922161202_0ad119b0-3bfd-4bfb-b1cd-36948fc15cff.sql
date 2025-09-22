-- Fix remaining security warnings

-- Fix function search path issues for remaining functions
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login_at = NOW() 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_details jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_application_status(p_application_id uuid, p_new_status application_status, p_user_id uuid, p_comments text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_auth_failure(email_attempt text, failure_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, user_email, action, resource_type, 
        details, outcome, user_agent, ip_address
    ) VALUES (
        NULL, email_attempt, 'authentication_failure', 'auth',
        jsonb_build_object('reason', failure_reason, 'timestamp', NOW()),
        'failure',
        current_setting('request.headers', true)::json->>'user-agent',
        inet_client_addr()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(identifier_val text, action_type_val text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_attempts INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN DEFAULT FALSE;
BEGIN
    -- Clean up old rate limit records
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Check if identifier is currently blocked
    SELECT blocked_until IS NOT NULL AND blocked_until > NOW()
    INTO is_blocked
    FROM rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF is_blocked THEN
        RETURN FALSE;
    END IF;
    
    -- Get current attempt count within window
    SELECT attempt_count, window_start
    INTO current_attempts, window_start_time
    FROM rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    AND window_start > NOW() - (window_minutes || ' minutes')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF current_attempts IS NULL THEN
        -- First attempt in this window
        INSERT INTO rate_limits (identifier, action_type, attempt_count, window_start)
        VALUES (identifier_val, action_type_val, 1, NOW());
        RETURN TRUE;
    ELSIF current_attempts < max_attempts THEN
        -- Update attempt count
        UPDATE rate_limits
        SET attempt_count = attempt_count + 1
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        RETURN TRUE;
    ELSE
        -- Block the identifier
        UPDATE rate_limits
        SET blocked_until = NOW() + (window_minutes || ' minutes')::INTERVAL
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        RETURN FALSE;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_certificate(cert_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.auto_issue_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_applications', (SELECT COUNT(*) FROM applications),
        'pending_applications', (SELECT COUNT(*) FROM applications WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')),
        'approved_applications', (SELECT COUNT(*) FROM applications WHERE status = 'CERTIFIED'),
        'total_users', (SELECT COUNT(*) FROM profiles),
        'monthly_applications', (
            SELECT COUNT(*) FROM applications 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'monthly_users', (
            SELECT COUNT(*) FROM profiles 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'approval_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM applications WHERE status IN ('CERTIFIED', 'REVOKED')) > 0
                THEN ROUND(
                    (SELECT COUNT(*) FROM applications WHERE status = 'CERTIFIED') * 100.0 / 
                    (SELECT COUNT(*) FROM applications WHERE status IN ('CERTIFIED', 'REVOKED'))
                )
                ELSE 0
            END
        ),
        'avg_review_time', (
            SELECT COALESCE(AVG(EXTRACT(days FROM updated_at - created_at)), 0)
            FROM applications 
            WHERE status IN ('CERTIFIED', 'REVOKED')
        ),
        'active_users', (
            SELECT COUNT(DISTINCT applicant_id) FROM applications 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'usage_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM profiles) > 0
                THEN ROUND(
                    (SELECT COUNT(DISTINCT applicant_id) FROM applications WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') * 100.0 / 
                    (SELECT COUNT(*) FROM profiles)
                )
                ELSE 0
            END
        )
    ) INTO result;
    
    RETURN result;
END;
$$;