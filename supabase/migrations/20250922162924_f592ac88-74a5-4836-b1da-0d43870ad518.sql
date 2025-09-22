-- SECURITY FIX: Remove password_hash column and strengthen profiles table security

-- 1. Remove the dangerous password_hash column (Supabase handles auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON public.profiles;

-- 3. Create improved update policy without recursive queries
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent self role modification unless user is admin
  (NOT (OLD.role IS DISTINCT FROM NEW.role) OR is_admin(auth.uid()))
);

-- 4. Restrict service role profile creation
CREATE POLICY "Service role can create profiles during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Only allow if the profile ID matches a user in auth.users
  EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id)
);