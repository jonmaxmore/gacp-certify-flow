-- Fix infinite recursion in profiles RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Create a security definer function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
    AND role = 'admin'::user_role
  );
$$;

-- Create non-recursive admin policies using the security definer function
CREATE POLICY "profiles_select_admin" ON public.profiles
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));