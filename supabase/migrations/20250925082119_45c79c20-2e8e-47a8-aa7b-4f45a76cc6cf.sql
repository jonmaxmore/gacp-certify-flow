-- Fix the ambiguous column reference issue in authentication
-- The issue is caused by functions/triggers that don't properly qualify table references

-- Fix the log_user_activity function that may be causing ambiguity
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Use proper table qualification to avoid ambiguity
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        resource_type,
        old_values,
        new_values,
        timestamp
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
        (SELECT au.email FROM auth.users au WHERE au.id = COALESCE(NEW.user_id, OLD.user_id, auth.uid())),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix any auth-related functions with proper table qualification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Use proper table qualification - NEW comes from auth.users
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,  -- This is clearly from auth.users.email
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'applicant'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create a helper function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_user_activity() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;

-- Refresh schema
NOTIFY pgrst, 'reload schema';