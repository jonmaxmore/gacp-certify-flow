-- Phase 1: Critical Role Protection Fixes

-- Update profiles RLS policy to prevent role self-modification
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (OLD.role = NEW.role OR is_admin(auth.uid()))
);

-- Add trigger to prevent role self-modification at database level
CREATE OR REPLACE FUNCTION public.prevent_role_self_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow role changes only if user is admin or role is not being changed
    IF OLD.role != NEW.role AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Users cannot modify their own role. Only administrators can change user roles.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Phase 3: Enhanced Database Function Security
-- Update all functions to have proper search_path protection

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

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login_at = NOW() 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
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
    -- Log any attempt to escalate privileges
    IF OLD.role != NEW.role AND OLD.role != 'admin' AND NEW.role = 'admin' THEN
        PERFORM public.log_security_event(
            auth.uid(),
            'privilege_escalation_attempt',
            'critical',
            jsonb_build_object(
                'target_user', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'ip_address', inet_client_addr()
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

-- Phase 5: Rate Limiting Enhancement
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
    identifier_val text, 
    action_type_val text, 
    max_attempts integer DEFAULT 5, 
    window_minutes integer DEFAULT 15,
    escalation_factor numeric DEFAULT 2.0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_attempts INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN DEFAULT FALSE;
    consecutive_violations INTEGER DEFAULT 0;
BEGIN
    -- Clean up old rate limit records
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Check consecutive violations for escalating blocks
    SELECT COUNT(*) INTO consecutive_violations
    FROM rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    AND blocked_until IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours';
    
    -- Apply escalating block duration based on violations
    IF consecutive_violations > 3 THEN
        max_attempts := GREATEST(max_attempts - consecutive_violations, 1);
        window_minutes := LEAST(window_minutes * (escalation_factor ^ consecutive_violations), 480); -- Max 8 hours
    END IF;
    
    -- Check if identifier is currently blocked
    SELECT blocked_until IS NOT NULL AND blocked_until > NOW()
    INTO is_blocked
    FROM rate_limits
    WHERE identifier = identifier_val 
    AND action_type = action_type_val
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF is_blocked THEN
        -- Log security event for persistent attacks
        IF consecutive_violations > 5 THEN
            PERFORM public.log_security_event(
                NULL,
                'persistent_rate_limit_violation',
                'critical',
                jsonb_build_object(
                    'identifier', identifier_val,
                    'action_type', action_type_val,
                    'consecutive_violations', consecutive_violations
                )
            );
        END IF;
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
        -- Block the identifier with escalating duration
        UPDATE rate_limits
        SET blocked_until = NOW() + (window_minutes || ' minutes')::INTERVAL
        WHERE identifier = identifier_val 
        AND action_type = action_type_val
        AND window_start = window_start_time;
        
        -- Log security event
        PERFORM public.log_security_event(
            NULL,
            'rate_limit_exceeded',
            'high',
            jsonb_build_object(
                'identifier', identifier_val,
                'action_type', action_type_val,
                'block_duration_minutes', window_minutes
            )
        );
        
        RETURN FALSE;
    END IF;
END;
$$;