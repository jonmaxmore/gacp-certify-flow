-- COMPLETE DATABASE CLEANUP - Remove all user data and related records
-- This will make the project completely clean like a fresh start

-- 1. Delete all application-related data
DELETE FROM certificates;
DELETE FROM assessments;
DELETE FROM documents;
DELETE FROM reviews;
DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM applications;

-- 2. Delete all user-related data
DELETE FROM workflow_notifications;
DELETE FROM notifications;
DELETE FROM user_sessions;
DELETE FROM audit_logs;
DELETE FROM rate_limits;

-- 3. Delete all profiles (this will not delete auth.users, only our custom profiles)
DELETE FROM profiles;

-- 4. Reset all sequences and counters
-- Reset any auto-incrementing values
UPDATE system_config SET value = '"0"'::jsonb WHERE key LIKE '%counter%' OR key LIKE '%sequence%';

-- 5. Clean up any remaining orphaned data
DELETE FROM pricing_tiers WHERE id NOT IN (
    SELECT DISTINCT unnest(ARRAY[]::uuid[])
);
DELETE FROM products WHERE id NOT IN (
    SELECT DISTINCT unnest(ARRAY[]::uuid[])
);
DELETE FROM product_categories WHERE id NOT IN (
    SELECT DISTINCT unnest(ARRAY[]::uuid[])
);

-- Note: This migration only cleans the public schema tables
-- auth.users table is managed by Supabase and will need to be cleaned manually
-- through the Supabase dashboard if needed