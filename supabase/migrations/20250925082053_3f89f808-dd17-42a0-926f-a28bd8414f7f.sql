-- Fix function search path security issues
-- This addresses the "Function Search Path Mutable" warnings from the linter

-- Fix the auth helper function
CREATE OR REPLACE FUNCTION public.get_auth_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, extensions
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- Fix the audit log creation function
CREATE OR REPLACE FUNCTION public.create_audit_log_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
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

-- Fix the main user creation trigger function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
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
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'applicant'::public.user_role),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;