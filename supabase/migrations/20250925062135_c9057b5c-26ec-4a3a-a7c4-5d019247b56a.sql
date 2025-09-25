-- Fix payments table structure - add missing due_date column
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone DEFAULT (now() + interval '30 days');

-- Also ensure we have the correct payment_due_date column for compatibility
-- Some existing code might be using this column name
-- Let's check both column names are aligned