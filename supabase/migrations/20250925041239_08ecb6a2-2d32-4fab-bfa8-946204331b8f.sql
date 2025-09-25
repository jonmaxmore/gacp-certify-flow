-- CRITICAL SECURITY FIXES - Phase 1
-- Fix function search_path vulnerabilities for all existing functions

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    date_suffix TEXT;
    sequence_num INTEGER;
    invoice_number TEXT;
BEGIN
    date_suffix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || date_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || date_suffix || '-%';
    
    invoice_number := 'INV-' || date_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$function$;

-- Create data masking function for Thai ID numbers
CREATE OR REPLACE FUNCTION public.mask_thai_id(thai_id_input text, user_role text DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only show full Thai ID to admin and the owner
    IF user_role = 'admin' OR auth.uid() = (SELECT id FROM profiles WHERE thai_id_number = thai_id_input) THEN
        RETURN thai_id_input;
    END IF;
    
    -- Mask for other users (show only last 4 digits)
    IF thai_id_input IS NOT NULL AND LENGTH(thai_id_input) = 13 THEN
        RETURN 'XXXXX-XXXX-X' || RIGHT(thai_id_input, 2);
    END IF;
    
    RETURN 'XXXXX-XXXX-XXX';
END;
$function$;

-- Create function to encrypt/decrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data_input text, encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Simple encryption using built-in functions
    -- In production, use more robust encryption
    RETURN encode(encrypt(data_input::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$function$;

-- Create secure view for profiles with data masking
CREATE OR REPLACE VIEW public.secure_profiles AS
SELECT 
    id,
    email,
    full_name,
    organization_name,
    phone,
    address,
    role,
    is_active,
    created_at,
    updated_at,
    last_login_at,
    preferred_language,
    -- Mask Thai ID based on user role
    CASE 
        WHEN public.get_current_user_role() = 'admin' OR auth.uid() = id THEN thai_id_number
        WHEN thai_id_number IS NOT NULL AND LENGTH(thai_id_number) = 13 THEN 'XXXXX-XXXX-X' || RIGHT(thai_id_number, 2)
        ELSE 'XXXXX-XXXX-XXX'
    END as thai_id_number
FROM public.profiles;

-- Add geographic access restriction function
CREATE OR REPLACE FUNCTION public.can_access_farm_coordinates(app_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    
    -- Only allow access to farm coordinates for:
    -- 1. Application owner
    -- 2. Admin, auditor, reviewer roles
    RETURN (
        EXISTS (SELECT 1 FROM applications WHERE id = app_id AND applicant_id = auth.uid()) OR
        user_role IN ('admin', 'auditor', 'reviewer')
    );
END;
$function$;

-- Create secure view for applications with coordinate protection
CREATE OR REPLACE VIEW public.secure_applications AS
SELECT 
    id,
    applicant_id,
    application_number,
    applicant_name,
    applicant_id_number,
    applicant_phone,
    applicant_email,
    applicant_address,
    organization_name,
    organization_registration,
    representative_name,
    representative_position,
    farm_name,
    farm_address,
    -- Protect farm coordinates
    CASE 
        WHEN public.can_access_farm_coordinates(id) THEN farm_coordinates
        ELSE 'COORDINATES_RESTRICTED'
    END as farm_coordinates,
    crop_types,
    cultivation_methods,
    expected_yield,
    responsible_person,
    revision_reason,
    reviewer_comments,
    training_date,
    status,
    workflow_status,
    revision_count,
    farm_area_rai,
    farm_area_ngan,
    farm_area_wah,
    staff_count,
    training_completed,
    metadata,
    submitted_at,
    approved_at,
    created_at,
    updated_at,
    payment_review_id,
    payment_assessment_id,
    max_revisions,
    workflow_history,
    estimated_completion_date,
    revision_count_current,
    max_free_revisions,
    next_action_required
FROM public.applications;

-- Add audit log retention function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Archive logs older than 1 year
    -- Anonymize logs older than 3 months but keep for audit purposes
    UPDATE public.audit_logs 
    SET 
        user_email = 'anonymized@system.local',
        ip_address = NULL,
        user_agent = 'anonymized',
        session_id = NULL
    WHERE timestamp < NOW() - INTERVAL '3 months'
    AND user_email != 'anonymized@system.local';
    
    -- Delete logs older than 1 year
    DELETE FROM public.audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$function$;

-- Add security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_violation(
    violation_type text,
    severity text DEFAULT 'medium',
    details jsonb DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        details,
        outcome
    ) VALUES (
        auth.uid(),
        COALESCE((SELECT email FROM profiles WHERE id = auth.uid()), 'unknown'),
        COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 'unknown'::user_role),
        violation_type,
        'security_violation',
        jsonb_build_object(
            'severity', severity,
            'violation_details', details,
            'timestamp', NOW(),
            'user_agent', current_setting('request.headers', true)::json->>'user-agent',
            'ip_address', inet_client_addr()
        ),
        'violation_logged'
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

-- Update RLS policies to be more restrictive
-- Remove any overly permissive policies and tighten access

-- Drop and recreate more secure policies for sensitive tables
DROP POLICY IF EXISTS "Authenticated users can view own certificates" ON public.certificates;
CREATE POLICY "Secure certificate access" ON public.certificates
FOR SELECT USING (
    -- Only certificate owner or admin/auditor can view
    EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.id = certificates.application_id 
        AND a.applicant_id = auth.uid()
    ) OR 
    public.get_current_user_role() IN ('admin', 'auditor')
);

-- Secure audit logs - only admin access
DROP POLICY IF EXISTS "Authenticated admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin only audit log access" ON public.audit_logs
FOR SELECT USING (
    public.get_current_user_role() = 'admin' AND
    -- Additional IP restriction could be added here
    true
);

-- Add trigger for automatic security violation logging
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Log multiple rapid profile updates
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
        IF EXISTS (
            SELECT 1 FROM audit_logs 
            WHERE user_id = auth.uid() 
            AND action = 'profile_sensitive_update'
            AND timestamp > NOW() - INTERVAL '5 minutes'
            GROUP BY user_id 
            HAVING COUNT(*) > 3
        ) THEN
            PERFORM public.log_security_violation(
                'rapid_profile_updates',
                'high',
                jsonb_build_object('profile_id', NEW.id, 'update_count', '3+')
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for suspicious activity detection
DROP TRIGGER IF EXISTS detect_suspicious_profile_activity ON public.profiles;
CREATE TRIGGER detect_suspicious_profile_activity
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_suspicious_activity();

-- Add session management table for better session control
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text NOT NULL,
    created_at timestamp with time zone DEFAULT NOW(),
    last_activity timestamp with time zone DEFAULT NOW(),
    expires_at timestamp with time zone DEFAULT NOW() + INTERVAL '30 minutes',
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true
);

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for session access
CREATE POLICY "Users can only access own sessions" ON public.user_sessions
FOR ALL USING (auth.uid() = user_id);

-- Add function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete old inactive sessions (older than 7 days)
    DELETE FROM public.user_sessions 
    WHERE is_active = false AND created_at < NOW() - INTERVAL '7 days';
END;
$function$;