-- Clean up duplicate policies and finalize security fixes

-- 1. Remove any duplicate policies that may exist
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;

-- 2. Create the final secure update policy
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role self-modification unless user is admin
  (NOT (role IS DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())) OR is_admin(auth.uid()))
);