-- Add language preference support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_language TEXT DEFAULT 'th' CHECK (preferred_language IN ('th', 'en'));