-- Fix remaining RLS security vulnerabilities for anonymous access

-- Fix assessments table policies
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Auditors can manage assessments" ON public.assessments;

CREATE POLICY "Authenticated users can view own assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = assessments.application_id 
    AND applications.applicant_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['auditor'::user_role, 'admin'::user_role])
  )) OR 
  (auth.uid() = auditor_id)
);

CREATE POLICY "Authenticated auditors can manage assessments"
ON public.assessments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['auditor'::user_role, 'admin'::user_role])
));

-- Fix certificates table policies
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;

CREATE POLICY "Authenticated users can view own certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM applications 
  WHERE applications.id = certificates.application_id 
  AND applications.applicant_id = auth.uid()
));

CREATE POLICY "Authenticated admins can manage certificates"
ON public.certificates
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix documents table policies
DROP POLICY IF EXISTS "Users can access own application documents" ON public.documents;

CREATE POLICY "Authenticated users can access own application documents"
ON public.documents
FOR ALL
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = documents.application_id 
    AND applications.applicant_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['reviewer'::user_role, 'auditor'::user_role, 'admin'::user_role])
  ))
);

-- Fix notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Authenticated users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));