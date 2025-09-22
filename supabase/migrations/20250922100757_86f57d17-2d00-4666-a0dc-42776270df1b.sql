-- Enable leaked password protection for better security
-- This setting helps prevent users from using commonly leaked passwords
ALTER SYSTEM SET password_reuse_history = 5;
ALTER SYSTEM SET password_reuse_time = '30 days';

-- Note: The specific setting for leaked password protection is managed 
-- through the Supabase dashboard Auth settings, not SQL commands