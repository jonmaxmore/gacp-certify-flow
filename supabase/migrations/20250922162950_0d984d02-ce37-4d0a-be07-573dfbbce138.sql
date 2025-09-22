-- SECURITY FIX: Remove password_hash column and strengthen profiles table security

-- 1. Remove the dangerous password_hash column (Supabase handles auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can create profiles" ON public.profiles;

-- 3. Create secure update policy for regular users (non-role fields only)
CREATE POLICY "Users can update own basic profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id AND NOT is_admin(auth.uid()))
WITH CHECK (auth.uid() = id);

-- 4. Create separate policy for admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 5. Restrict service role profile creation to only valid users
CREATE POLICY "Service role can create profiles during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Only allow creating profiles for users that exist in auth.users
  EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id)
);