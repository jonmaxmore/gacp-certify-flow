-- Fix the policy issue by dropping and recreating properly
DROP POLICY IF EXISTS "Users can update own profile (excluding role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate the policy with role protection
CREATE POLICY "Users can update own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (
        -- Allow update only if role is not being changed, or user is admin
        OLD.role = NEW.role
        OR public.is_admin(auth.uid())
    )
);

-- The rest of the security fixes from previous migration
-- CRITICAL SECURITY FIX 1: Remove public certificate data exposure
DROP POLICY IF EXISTS "Anyone can view valid certificates" ON public.certificates;

-- Create a secure certificate verification function
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

-- CRITICAL SECURITY FIX 2: Role update protection function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Prevent self-role modification for additional security
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Users cannot modify their own role';
    END IF;
    
    -- Get target user info for audit log
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