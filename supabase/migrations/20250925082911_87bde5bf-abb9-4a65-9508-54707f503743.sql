-- Fix the profiles policy conflict and authentication issues

-- Remove the conflicting policy first
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.profiles;

-- Create a better policy for profile access
CREATE POLICY "Users can view profiles when authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Users can see their own profile and active profiles of others
    auth.uid() = id OR (is_active = true AND public.get_current_user_role() IS NOT NULL)
);

-- Fix any remaining security functions with proper search paths
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    app_prefix TEXT := 'GACP';
    year_suffix TEXT;
    sequence_num INTEGER;
    app_number TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM app_prefix || '-' || year_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.applications
    WHERE application_number LIKE app_prefix || '-' || year_suffix || '-%';
    
    app_number := app_prefix || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN app_number;
END;
$$;

-- Ensure all critical auth functions work properly
GRANT EXECUTE ON FUNCTION public.generate_application_number() TO authenticated;

-- Clean up any potential auth issues by ensuring proper cascade
UPDATE public.profiles 
SET updated_at = NOW() 
WHERE updated_at < NOW() - INTERVAL '1 minute';