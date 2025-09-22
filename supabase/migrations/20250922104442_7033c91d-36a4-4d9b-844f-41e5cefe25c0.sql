-- CRITICAL SECURITY FIX 1: Remove public certificate data exposure
-- Drop the dangerous "Anyone can view valid certificates" policy
DROP POLICY IF EXISTS "Anyone can view valid certificates" ON public.certificates;

-- Create a secure certificate verification function that only returns validation status
-- without exposing sensitive business information
CREATE OR REPLACE FUNCTION public.verify_certificate(cert_number TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cert_record RECORD;
    result JSON;
BEGIN
    -- Only return basic validation information, not sensitive business data
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
    WHERE certificate_number = cert_number
    AND is_active = true;
    
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

-- CRITICAL SECURITY FIX 2: Role update protection
-- Create a secure function for role updates that only admins can use
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role user_role;
    target_user_email TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can update user roles';
    END IF;
    
    -- Prevent self-role modification for additional security
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Users cannot modify their own role';
    END IF;
    
    -- Get target user email for audit log
    SELECT email INTO target_user_email
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
        jsonb_build_object('old_role', (SELECT role FROM profiles WHERE id = target_user_id)),
        jsonb_build_object('new_role', new_role),
        jsonb_build_object('target_email', target_user_email)
    );
    
    RETURN TRUE;
END;
$$;

-- Add RLS policy to prevent users from updating their own role
-- First drop existing policy and recreate with role protection
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (
        -- Prevent role changes unless user is admin
        COALESCE(role, (SELECT role FROM profiles WHERE id = auth.uid())) = 
        (SELECT role FROM profiles WHERE id = auth.uid())
        OR public.is_admin(auth.uid())
    )
);

-- SECURITY FIX 3: Enhanced audit logging for sensitive operations
-- Update existing functions to include more detailed logging

-- Create function to log failed authentication attempts
CREATE OR REPLACE FUNCTION public.log_auth_failure(email_attempt TEXT, failure_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user ID
    action_type TEXT NOT NULL, -- Type of action being rate limited
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "Admins can view rate limits" 
ON public.rate_limits 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- System can manage rate limits
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    identifier_val TEXT, 
    action_type_val TEXT, 
    max_attempts INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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