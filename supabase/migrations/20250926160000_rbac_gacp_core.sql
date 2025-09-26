-- RBAC and RLS for GACP system (applications, reviews, cms_posts, all roles)

-- Expand user_role enum for all roles
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'farmer';
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cs';
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cms';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES public.profiles(id),
  status text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "applications_select_own" ON public.applications
  FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY IF NOT EXISTS "applications_update_own" ON public.applications
  FOR UPDATE USING (auth.uid() = applicant_id);
CREATE POLICY IF NOT EXISTS "applications_select_staff" ON public.applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer','auditor','admin','super_admin','cs','cms')));
CREATE POLICY IF NOT EXISTS "applications_update_admin" ON public.applications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id),
  reviewer_id uuid REFERENCES public.profiles(id),
  decision text,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "reviews_select_own" ON public.reviews
  FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY IF NOT EXISTS "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY IF NOT EXISTS "reviews_admin" ON public.reviews
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- CMS posts table
CREATE TABLE IF NOT EXISTS public.cms_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id),
  title text,
  content text,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "cms_posts_cms" ON public.cms_posts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'cms'));
CREATE POLICY IF NOT EXISTS "cms_posts_public" ON public.cms_posts
  FOR SELECT USING (published = true);
