-- Phase 1: Critical Role Protection Fixes (Fixed Version)

-- Update profiles RLS policy to prevent role self-modification
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (
    -- Allow if role is not changing
    (SELECT role FROM profiles WHERE id = auth.uid()) = 
    (SELECT role FROM profiles WHERE id = auth.uid()) OR
    -- Or if user is admin
    is_admin(auth.uid())
  )
);

-- Enhanced role modification prevention function
CREATE OR REPLACE FUNCTION public.prevent_role_self_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow role changes only if user is admin or role is not being changed
    IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Users cannot modify their own role. Only administrators can change user roles.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for role modification prevention
DROP TRIGGER IF EXISTS prevent_role_self_modification_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_modification_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_self_modification();

-- Phase 2: Business Data Protection - Restrict public access to sensitive business data
DROP POLICY IF EXISTS "Anyone can view active pricing tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;

-- Create authenticated-only policies for business data
CREATE POLICY "Authenticated users can view pricing tiers" 
ON public.pricing_tiers 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can view products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can view categories" 
ON public.product_categories 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Phase 3: Enhanced Database Function Security with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'applicant'),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Phase 4: Enhanced Audit Logging for Security Events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id uuid,
    p_event_type text,
    p_severity text DEFAULT 'medium',
    p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    log_id UUID;
    user_info RECORD;
BEGIN
    -- Get user information
    SELECT email, role INTO user_info
    FROM public.profiles
    WHERE id = p_user_id;
    
    INSERT INTO public.audit_logs (
        user_id, user_email, user_role, action, resource_type,
        details, outcome
    ) VALUES (
        p_user_id, 
        COALESCE(user_info.email, 'unknown'), 
        COALESCE(user_info.role, 'unknown'::user_role), 
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

-- Create function to detect and log privilege escalation attempts
CREATE OR REPLACE FUNCTION public.detect_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log any attempt to escalate privileges to admin
    IF OLD.role IS DISTINCT FROM NEW.role AND NEW.role = 'admin' AND OLD.role != 'admin' THEN
        PERFORM public.log_security_event(
            auth.uid(),
            'privilege_escalation_attempt',
            'critical',
            jsonb_build_object(
                'target_user', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add trigger for privilege escalation detection
DROP TRIGGER IF EXISTS detect_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER detect_privilege_escalation_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_privilege_escalation();