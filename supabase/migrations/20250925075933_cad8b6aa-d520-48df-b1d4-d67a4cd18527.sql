-- SECURITY ENHANCEMENT: Fix database function search paths and improve security
-- Phase 1: Critical Database Function Security Fixes

-- Fix search path vulnerabilities in existing functions
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    app_number TEXT;
BEGIN
    year_suffix := (EXTRACT(YEAR FROM NOW()) + 543)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 'GACP-(\d+)-' || year_suffix) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM applications
    WHERE application_number LIKE 'GACP-%-' || year_suffix;
    
    app_number := 'GACP-' || LPAD(sequence_num::TEXT, 4, '0') || '-' || year_suffix;
    
    RETURN app_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    cert_number TEXT;
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 'CERT-(\d+)-' || year_suffix) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM certificates
    WHERE certificate_number LIKE 'CERT-%-' || year_suffix;
    
    cert_number := 'CERT-' || LPAD(sequence_num::TEXT, 6, '0') || '-' || year_suffix;
    
    RETURN cert_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    date_suffix TEXT;
    sequence_num INTEGER;
    invoice_number TEXT;
BEGIN
    date_suffix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || date_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || date_suffix || '-%';
    
    invoice_number := 'INV-' || date_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    date_suffix TEXT;
    sequence_num INTEGER;
    receipt_number TEXT;
BEGIN
    date_suffix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'REC-' || date_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE receipt_number LIKE 'REC-' || date_suffix || '-%';
    
    receipt_number := 'REC-' || date_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN receipt_number;
END;
$$;

-- SECURITY ENHANCEMENT: Advanced Rate Limiting with Progressive Delays
CREATE OR REPLACE FUNCTION public.check_rate_limit_with_progressive_delay(
  identifier_val text, 
  action_type_val text, 
  max_attempts integer DEFAULT 5, 
  window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_attempts INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN DEFAULT FALSE;
    block_duration INTEGER;
    result jsonb;
BEGIN
    -- Clean up old rate limit records
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Check if identifier is currently blocked
    SELECT 
        blocked_until IS NOT NULL AND blocked_until > NOW(),
        attempt_count
    INTO is_blocked, current_attempts
    FROM rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF is_blocked THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'attempts_remaining', 0,
            'blocked_until', (SELECT blocked_until FROM rate_limits 
                             WHERE identifier = identifier_val 
                             AND action_type = action_type_val
                             ORDER BY created_at DESC LIMIT 1)
        );
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
        
        RETURN jsonb_build_object(
            'allowed', true,
            'attempts_remaining', max_attempts - 1,
            'attempt_count', 1
        );
    ELSIF current_attempts < max_attempts THEN
        -- Update attempt count
        UPDATE rate_limits
        SET attempt_count = attempt_count + 1
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        
        RETURN jsonb_build_object(
            'allowed', true,
            'attempts_remaining', max_attempts - (current_attempts + 1),
            'attempt_count', current_attempts + 1
        );
    ELSE
        -- Progressive blocking: longer blocks for repeated violations
        block_duration := CASE 
            WHEN current_attempts <= max_attempts + 2 THEN window_minutes
            WHEN current_attempts <= max_attempts + 5 THEN window_minutes * 2
            WHEN current_attempts <= max_attempts + 10 THEN window_minutes * 4
            ELSE window_minutes * 8
        END;
        
        -- Block the identifier with progressive delay
        UPDATE rate_limits
        SET 
            blocked_until = NOW() + (block_duration || ' minutes')::INTERVAL,
            attempt_count = attempt_count + 1
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        
        -- Log security event
        PERFORM log_security_event(
            CASE WHEN identifier_val ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                 THEN identifier_val::uuid 
                 ELSE NULL END,
            'rate_limit_exceeded',
            CASE WHEN current_attempts > max_attempts + 5 THEN 'high' ELSE 'medium' END,
            jsonb_build_object(
                'action_type', action_type_val,
                'attempt_count', current_attempts + 1,
                'block_duration_minutes', block_duration
            )
        );
        
        RETURN jsonb_build_object(
            'allowed', false,
            'attempts_remaining', 0,
            'blocked_until', NOW() + (block_duration || ' minutes')::INTERVAL,
            'block_duration_minutes', block_duration
        );
    END IF;
END;
$$;

-- SECURITY ENHANCEMENT: Real-time Security Alert System
CREATE OR REPLACE FUNCTION public.create_security_alert(
    alert_type text,
    severity text,
    title text,
    message text,
    target_user_id uuid DEFAULT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    alert_id uuid;
    admin_users uuid[];
BEGIN
    -- Log the security event
    PERFORM log_security_event(
        COALESCE(target_user_id, auth.uid()),
        alert_type,
        severity,
        jsonb_build_object(
            'title', title,
            'message', message,
            'metadata', metadata,
            'created_by', auth.uid()
        )
    );
    
    -- Get all admin users for notification
    SELECT array_agg(id) INTO admin_users
    FROM profiles 
    WHERE role = 'admin' AND is_active = true;
    
    -- Create notifications for all admins
    IF admin_users IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority,
            action_url,
            action_label,
            related_id
        )
        SELECT 
            unnest(admin_users),
            'security_alert',
            '[SECURITY] ' || title,
            message,
            CASE severity
                WHEN 'critical' THEN 'urgent'
                WHEN 'high' THEN 'high'
                ELSE 'medium'
            END,
            '/admin/security',
            'View Details',
            target_user_id
        RETURNING id INTO alert_id;
    END IF;
    
    RETURN COALESCE(alert_id, gen_random_uuid());
END;
$$;

-- SECURITY ENHANCEMENT: Enhanced Authentication Monitoring
CREATE OR REPLACE FUNCTION public.monitor_authentication_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    recent_failures INTEGER;
    user_email text;
BEGIN
    -- Only monitor for profile updates (login events)
    IF TG_OP = 'UPDATE' AND OLD.last_login_at IS DISTINCT FROM NEW.last_login_at THEN
        -- Check for recent authentication failures for this user
        SELECT email INTO user_email FROM profiles WHERE id = NEW.id;
        
        SELECT COUNT(*) INTO recent_failures
        FROM audit_logs
        WHERE user_email = user_email
        AND action = 'authentication_failure'
        AND timestamp > NOW() - INTERVAL '1 hour';
        
        -- Alert if user had many recent failures before successful login
        IF recent_failures >= 5 THEN
            PERFORM create_security_alert(
                'suspicious_login_after_failures',
                'high',
                'Successful Login After Multiple Failures',
                'User ' || user_email || ' successfully logged in after ' || recent_failures || ' recent failed attempts.',
                NEW.id,
                jsonb_build_object(
                    'failure_count', recent_failures,
                    'login_time', NEW.last_login_at
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply authentication monitoring trigger
DROP TRIGGER IF EXISTS monitor_auth_events ON profiles;
CREATE TRIGGER monitor_auth_events
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION monitor_authentication_events();

-- SECURITY ENHANCEMENT: Enhanced Privilege Escalation Detection
CREATE OR REPLACE FUNCTION public.enhanced_privilege_escalation_detection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_role user_role;
    is_admin boolean;
BEGIN
    -- Get current user info
    SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
    is_admin := (current_user_role = 'admin');
    
    -- Detect privilege escalation attempts
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Log all role changes
        PERFORM log_security_event(
            auth.uid(),
            'role_change_attempt',
            CASE 
                WHEN NEW.role = 'admin' AND OLD.role != 'admin' THEN 'critical'
                WHEN NEW.role IN ('reviewer', 'auditor') AND OLD.role = 'applicant' THEN 'high'
                ELSE 'medium'
            END,
            jsonb_build_object(
                'target_user', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changer_role', current_user_role,
                'is_self_change', (auth.uid() = NEW.id)
            )
        );
        
        -- Create security alert for admin role escalation
        IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
            PERFORM create_security_alert(
                'admin_privilege_escalation',
                'critical',
                'Admin Privilege Granted',
                'User ' || NEW.full_name || ' (' || NEW.email || ') has been granted admin privileges by ' || 
                COALESCE((SELECT full_name FROM profiles WHERE id = auth.uid()), 'system') || '.',
                NEW.id,
                jsonb_build_object(
                    'previous_role', OLD.role,
                    'granted_by', auth.uid(),
                    'target_user_email', NEW.email
                )
            );
        END IF;
        
        -- Prevent self-privilege escalation (unless already admin)
        IF auth.uid() = NEW.id AND NOT is_admin AND NEW.role IN ('admin', 'reviewer', 'auditor') THEN
            PERFORM create_security_alert(
                'self_privilege_escalation_attempt',
                'critical',
                'Self-Privilege Escalation Blocked',
                'User ' || NEW.email || ' attempted to escalate their own privileges from ' || OLD.role || ' to ' || NEW.role,
                NEW.id
            );
            RAISE EXCEPTION 'Users cannot escalate their own privileges. Contact an administrator.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update privilege escalation trigger
DROP TRIGGER IF EXISTS detect_privilege_escalation ON profiles;
CREATE TRIGGER detect_privilege_escalation
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION enhanced_privilege_escalation_detection();

-- SECURITY ENHANCEMENT: Automated Security Maintenance
CREATE OR REPLACE FUNCTION public.automated_security_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Clean up old security logs
    PERFORM cleanup_security_logs();
    
    -- Clean up expired sessions
    PERFORM cleanup_expired_sessions();
    
    -- Log maintenance completion
    PERFORM log_security_event(
        NULL,
        'security_maintenance_completed',
        'low',
        jsonb_build_object(
            'maintenance_time', NOW(),
            'automated', true
        )
    );
END;
$$;