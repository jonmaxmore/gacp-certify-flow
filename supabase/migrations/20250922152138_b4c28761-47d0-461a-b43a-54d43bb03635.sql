-- Fix security vulnerability: Update profiles table RLS policies to restrict anonymous access
-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create secure RLS policies that restrict access to authenticated users only
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can create profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also fix other critical tables with similar anonymous access issues

-- Fix applications table policies
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants can update own draft applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants can create own applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view relevant applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can update applications in their workflow" ON public.applications;

CREATE POLICY "Authenticated applicants can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (auth.uid() = applicant_id);

CREATE POLICY "Authenticated applicants can update own draft applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = applicant_id AND status = ANY (ARRAY['DRAFT'::application_status, 'RETURNED'::application_status]));

CREATE POLICY "Authenticated applicants can create own applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Authenticated staff can view relevant applications"
ON public.applications
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['reviewer'::user_role, 'auditor'::user_role, 'admin'::user_role])
));

CREATE POLICY "Authenticated staff can update applications in their workflow"
ON public.applications
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['reviewer'::user_role, 'auditor'::user_role, 'admin'::user_role])
));

-- Fix payments table policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can view all payments" ON public.payments;
DROP POLICY IF EXISTS "System can manage payments" ON public.payments;

CREATE POLICY "Authenticated users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM applications 
  WHERE applications.id = payments.application_id 
  AND applications.applicant_id = auth.uid()
));

CREATE POLICY "Authenticated staff can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'reviewer'::user_role])
));

CREATE POLICY "Authenticated admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));