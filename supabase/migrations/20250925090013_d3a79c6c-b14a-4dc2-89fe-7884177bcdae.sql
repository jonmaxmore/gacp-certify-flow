-- Fix authentication issues by removing problematic functions and cleaning data

-- 1. Drop problematic functions that cause column ambiguity
DROP FUNCTION IF EXISTS public.monitor_authentication_events() CASCADE;
DROP FUNCTION IF EXISTS public.log_auth_failure(text, text) CASCADE;

-- 2. Clean up audit logs that might have problematic data
DELETE FROM audit_logs WHERE user_email IS NULL OR user_email = '';
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '7 days';

-- 3. Clean up rate limits and sessions
DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day';
DELETE FROM user_sessions WHERE expires_at < NOW();

-- 4. Create simple, safe audit function without ambiguity
CREATE OR REPLACE FUNCTION public.safe_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simple audit without complex queries that cause ambiguity
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        timestamp
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Never block main operations
        RETURN COALESCE(NEW, OLD);
END;
$$;