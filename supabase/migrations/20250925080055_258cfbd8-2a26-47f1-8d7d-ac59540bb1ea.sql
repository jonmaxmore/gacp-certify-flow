-- SECURITY FIX: Complete the remaining function search path security fixes

-- Fix remaining functions that need explicit search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- SECURITY ENHANCEMENT: Improve RLS policies to require authentication where appropriate
-- Update policies that should require authenticated users

-- Fix pricing_tiers policy to require authentication
DROP POLICY IF EXISTS "pricing_tiers_authenticated_select" ON pricing_tiers;
CREATE POLICY "pricing_tiers_authenticated_select" 
ON pricing_tiers 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Fix product_categories policy to require authentication
DROP POLICY IF EXISTS "categories_authenticated_select" ON product_categories;
CREATE POLICY "categories_authenticated_select" 
ON product_categories 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Fix products policy to require authentication
DROP POLICY IF EXISTS "products_authenticated_select" ON products;
CREATE POLICY "products_authenticated_select" 
ON products 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- SECURITY ENHANCEMENT: Strengthen authentication requirements for sensitive operations
-- Update several policies to explicitly require authentication

-- Update profiles policies to be more explicit about authentication
DROP POLICY IF EXISTS "profiles_own_select" ON profiles;
CREATE POLICY "profiles_own_select" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id) AND 
  (
    role = (SELECT role FROM profiles WHERE id = auth.uid()) OR 
    get_current_user_role() = 'admin'
  )
);

DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Update payments policies to require authentication
DROP POLICY IF EXISTS "payments_own_select" ON payments;
CREATE POLICY "payments_own_select" 
ON payments 
FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM applications 
  WHERE applications.id = payments.application_id 
  AND applications.applicant_id = auth.uid()
));

DROP POLICY IF EXISTS "payments_staff_select" ON payments;
CREATE POLICY "payments_staff_select" 
ON payments 
FOR SELECT 
TO authenticated 
USING (get_current_user_role() = ANY (ARRAY['admin', 'reviewer']));

-- Update workflow_notifications policies
DROP POLICY IF EXISTS "workflow_notifications_own_select" ON workflow_notifications;
CREATE POLICY "workflow_notifications_own_select" 
ON workflow_notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "workflow_notifications_own_update" ON workflow_notifications;
CREATE POLICY "workflow_notifications_own_update" 
ON workflow_notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "workflow_notifications_admin_select" ON workflow_notifications;
CREATE POLICY "workflow_notifications_admin_select" 
ON workflow_notifications 
FOR SELECT 
TO authenticated 
USING (get_current_user_role() = 'admin');

-- SECURITY ENHANCEMENT: Add explicit authentication checks to system_config
DROP POLICY IF EXISTS "system_config_admin_only" ON system_config;
CREATE POLICY "system_config_admin_only" 
ON system_config 
FOR ALL 
TO authenticated 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');