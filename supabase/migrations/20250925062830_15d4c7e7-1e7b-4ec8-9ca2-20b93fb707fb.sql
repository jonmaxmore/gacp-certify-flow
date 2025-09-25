-- Fix the log_security_event function to handle null user role properly
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_severity text DEFAULT 'medium'::text, p_details jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    user_info RECORD;
    safe_user_role user_role;
BEGIN
    -- Get user information with safe defaults
    SELECT email, role INTO user_info
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Set safe default for role if user not found or role is null
    safe_user_role := COALESCE(user_info.role, 'applicant'::user_role);
    
    INSERT INTO public.audit_logs (
        user_id, user_email, user_role, action, resource_type,
        details, outcome
    ) VALUES (
        p_user_id, 
        COALESCE(user_info.email, 'unknown'), 
        safe_user_role, 
        p_event_type, 
        'security',
        jsonb_build_object(
            'severity', p_severity,
            'timestamp', NOW(),
            'event_details', p_details
        ),
        CASE WHEN p_severity = 'critical' THEN 'blocked' ELSE 'logged' END
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;