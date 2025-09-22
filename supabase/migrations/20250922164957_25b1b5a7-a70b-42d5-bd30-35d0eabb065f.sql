-- Fix rate limiting functions to handle NULL auth.uid() during authentication
-- This prevents the "null value in column identifier" constraint violation

-- Update check_profile_update_rate_limit to handle NULL auth.uid()
CREATE OR REPLACE FUNCTION public.check_profile_update_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_identifier TEXT;
BEGIN
  -- Get the user identifier, handling NULL case during authentication
  user_identifier := COALESCE(auth.uid()::text, 'anonymous');
  
  -- Skip rate limiting during authentication process (when auth.uid() is NULL)
  IF user_identifier = 'anonymous' THEN
    RETURN NEW;
  END IF;
  
  -- Rate limit profile updates (max 10 per hour per user)
  IF NOT check_rate_limit(
    user_identifier, 
    'profile_update', 
    10, -- max attempts
    60  -- window in minutes
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for profile updates. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update secure_profile_rate_limit to handle NULL auth.uid()  
CREATE OR REPLACE FUNCTION public.secure_profile_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_identifier TEXT;
BEGIN
  -- Get the user identifier, handling NULL case during authentication
  user_identifier := COALESCE(auth.uid()::text, 'anonymous');
  
  -- Skip rate limiting during authentication process (when auth.uid() is NULL)
  IF user_identifier = 'anonymous' THEN
    RETURN NEW;
  END IF;
  
  -- Rate limit profile updates more aggressively
  IF NOT check_rate_limit(
    user_identifier, 
    'secure_profile_update', 
    5,  -- max 5 attempts per hour (reduced from 10)
    60  -- 60 minute window
  ) THEN
    -- Log rate limit violation (only if we have a valid user ID)
    PERFORM log_security_event(
      auth.uid(),
      'profile_update_rate_limit_exceeded',
      'medium',
      jsonb_build_object('timestamp', NOW())
    );
    RAISE EXCEPTION 'Security: Profile update rate limit exceeded. Please wait before trying again.';
  END IF;
  
  RETURN NEW;
END;
$$;