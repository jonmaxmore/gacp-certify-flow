-- Remove the problematic SECURITY DEFINER view
-- This view bypasses RLS policies and poses a security risk

DROP VIEW IF EXISTS public.secure_profile_view;

-- Note: Applications should use direct queries to the profiles table
-- with proper RLS policies instead of relying on SECURITY DEFINER views