-- Fix critical authentication and function security issues

-- First, ensure the get_current_user_role function is properly defined with secure search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, extensions
AS $$
BEGIN
    RETURN (
        SELECT p.role::text
        FROM public.profiles p
        WHERE p.id = auth.uid()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'applicant';
END;
$$;

-- Fix the check_rate_limit function with proper search path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    identifier_val text, 
    action_type_val text, 
    max_attempts integer DEFAULT 5, 
    window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    current_attempts INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clean up old rate limit records first
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Get current attempt count within window
    SELECT attempt_count, window_start
    INTO current_attempts, window_start_time
    FROM public.rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    AND window_start > NOW() - (window_minutes || ' minutes')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no record exists, create one and allow
    IF current_attempts IS NULL THEN
        INSERT INTO public.rate_limits (identifier, action_type, attempt_count, window_start)
        VALUES (identifier_val, action_type_val, 1, NOW());
        RETURN TRUE;
    END IF;
    
    -- If under limit, increment and allow
    IF current_attempts < max_attempts THEN
        UPDATE public.rate_limits
        SET attempt_count = attempt_count + 1
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        RETURN TRUE;
    END IF;
    
    -- Over limit, deny
    RETURN FALSE;
END;
$$;

-- Fix the generate_certificate_number function with proper search path
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    cert_prefix TEXT := 'GACP';
    year_suffix TEXT;
    sequence_num INTEGER;
    cert_number TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM cert_prefix || '-' || year_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.certificates
    WHERE certificate_number LIKE cert_prefix || '-' || year_suffix || '-%';
    
    cert_number := cert_prefix || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN cert_number;
END;
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_certificate_number() TO service_role;

-- Update RLS policies to use only authenticated role (not anon) for security
-- Fix applications table policies
DROP POLICY IF EXISTS "Authenticated applicants can create own applications" ON public.applications;
CREATE POLICY "Authenticated applicants can create own applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Authenticated applicants can view own applications" ON public.applications;  
CREATE POLICY "Authenticated applicants can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    applicant_id = auth.uid() OR 
    public.get_current_user_role() IN ('admin', 'reviewer', 'auditor')
);

-- Fix profiles access to prevent potential issues
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_active = true);

-- Ensure the handle_new_user trigger is working properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to check auth status safely
CREATE OR REPLACE FUNCTION public.check_auth_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    result jsonb;
    user_id uuid;
    user_profile record;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'profile', null
        );
    END IF;
    
    -- Get user profile
    SELECT * INTO user_profile
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN jsonb_build_object(
        'authenticated', true,
        'user_id', user_id,
        'profile', row_to_json(user_profile)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_auth_status() TO authenticated, anon;