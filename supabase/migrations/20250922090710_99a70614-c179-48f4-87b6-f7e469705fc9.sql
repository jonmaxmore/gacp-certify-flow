-- Reset Database: Drop all existing tables and recreate clean schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.self_certification CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.cultivation_areas CASCADE;
DROP TABLE IF EXISTS public.applicant_info CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS public.generate_application_number() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('applicant', 'reviewer', 'auditor', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    thai_id_number TEXT,
    position TEXT,
    organization_name TEXT,
    role public.user_role NOT NULL DEFAULT 'applicant',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_number TEXT UNIQUE NOT NULL,
    applicant_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applicant_info table
CREATE TABLE public.applicant_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    individual_name TEXT,
    individual_email TEXT,
    individual_phone TEXT,
    individual_address TEXT,
    individual_id_number TEXT,
    enterprise_name TEXT,
    enterprise_email TEXT,
    enterprise_phone TEXT,
    enterprise_address TEXT,
    entity_name TEXT,
    entity_email TEXT,
    entity_phone TEXT,
    entity_address TEXT,
    entity_registration_number TEXT,
    entity_representative_name TEXT,
    entity_representative_position TEXT,
    representative_name TEXT,
    representative_email TEXT,
    representative_phone TEXT,
    representative_position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cultivation_areas table
CREATE TABLE public.cultivation_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    location TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    cultivation_method TEXT,
    size_rai NUMERIC,
    size_ngan NUMERIC,
    size_wah NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create self_certification table
CREATE TABLE public.self_certification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    certifier_name TEXT NOT NULL,
    certifier_position TEXT NOT NULL,
    certification_date DATE NOT NULL,
    declaration_accepted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultivation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_certification ENABLE ROW LEVEL SECURITY;

-- Create utility functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = user_id 
        AND role = 'admin'::user_role
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Create application number generator
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    app_number TEXT;
BEGIN
    year_suffix := (EXTRACT(YEAR FROM NOW()) + 543)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 'GACP-(\d+)-' || year_suffix) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.applications
    WHERE application_number LIKE 'GACP-%-' || year_suffix;
    
    app_number := 'GACP-' || LPAD(sequence_num::TEXT, 3, '0') || '-' || year_suffix;
    
    RETURN app_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create user management functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'applicant')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login_at = NOW() 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_applications', (SELECT COUNT(*) FROM applications),
        'pending_applications', (SELECT COUNT(*) FROM applications WHERE status IN ('submitted', 'under_review')),
        'approved_applications', (SELECT COUNT(*) FROM applications WHERE status = 'approved'),
        'total_users', (SELECT COUNT(*) FROM profiles),
        'monthly_applications', (
            SELECT COUNT(*) FROM applications 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'monthly_users', (
            SELECT COUNT(*) FROM profiles 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'approval_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM applications WHERE status IN ('approved', 'rejected')) > 0
                THEN ROUND(
                    (SELECT COUNT(*) FROM applications WHERE status = 'approved') * 100.0 / 
                    (SELECT COUNT(*) FROM applications WHERE status IN ('approved', 'rejected'))
                )
                ELSE 0
            END
        ),
        'avg_review_time', (
            SELECT COALESCE(AVG(EXTRACT(days FROM updated_at - created_at)), 0)
            FROM applications 
            WHERE status IN ('approved', 'rejected')
        ),
        'active_users', (
            SELECT COUNT(DISTINCT user_id) FROM applications 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'usage_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM profiles) > 0
                THEN ROUND(
                    (SELECT COUNT(DISTINCT user_id) FROM applications WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') * 100.0 / 
                    (SELECT COUNT(*) FROM profiles)
                )
                ELSE 0
            END
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.update_last_login();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Create RLS policies for applications
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON public.applications
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for applicant_info
CREATE POLICY "Users can access own applicant info" ON public.applicant_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.applications 
            WHERE applications.id = applicant_info.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Create RLS policies for cultivation_areas
CREATE POLICY "Users can access own cultivation areas" ON public.cultivation_areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.applications 
            WHERE applications.id = cultivation_areas.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Create RLS policies for documents
CREATE POLICY "Users can access own documents" ON public.documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.applications 
            WHERE applications.id = documents.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Create RLS policies for self_certification
CREATE POLICY "Users can access own certification" ON public.self_certification
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.applications 
            WHERE applications.id = self_certification.application_id 
            AND applications.user_id = auth.uid()
        )
    );