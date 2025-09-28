-- Create pdpa_consents table for PDPA compliance
CREATE TABLE IF NOT EXISTS public.pdpa_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('registration', 'data_processing', 'marketing', 'cookies')),
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_text TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pdpa_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own consents" ON public.pdpa_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON public.pdpa_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON public.pdpa_consents
    FOR SELECT USING (is_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_pdpa_consents_updated_at
    BEFORE UPDATE ON public.pdpa_consents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_pdpa_consents_user_id ON public.pdpa_consents(user_id);
CREATE INDEX idx_pdpa_consents_consent_type ON public.pdpa_consents(consent_type);