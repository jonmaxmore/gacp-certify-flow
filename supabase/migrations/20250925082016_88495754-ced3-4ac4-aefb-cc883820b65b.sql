-- Fix the ambiguous user_email column reference in authentication
-- The issue is likely in auth triggers or RLS policies that don't properly qualify column names

-- Create a simple function to get user email safely
CREATE OR REPLACE FUNCTION public.get_auth_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- Update any existing audit trigger to avoid ambiguity
CREATE OR REPLACE FUNCTION public.create_audit_log_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email_val TEXT;
    user_role_val public.user_role;
BEGIN
    -- Get user email from auth.users table explicitly
    SELECT email INTO user_email_val 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Get user role from profiles table
    SELECT role INTO user_role_val 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Insert audit log with explicit values
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        timestamp,
        details
    ) VALUES (
        auth.uid(),
        user_email_val,
        COALESCE(user_role_val, 'applicant'::public.user_role),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        NOW(),
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix the user creation trigger to avoid ambiguity
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into profiles table with explicit column reference
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,  -- This comes from auth.users table (NEW record)
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'applicant'::public.user_role),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Fix any RLS policies that might be causing ambiguity
-- Update profile policies to be explicit about table references
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Ensure application policies use proper table qualification
DROP POLICY IF EXISTS "Authenticated applicants can view own applications" ON public.applications;
CREATE POLICY "Authenticated applicants can view own applications"
ON public.applications
FOR SELECT
USING (
    applicant_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'reviewer', 'auditor')
    )
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_auth_user_email(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_audit_log_entry() TO service_role;