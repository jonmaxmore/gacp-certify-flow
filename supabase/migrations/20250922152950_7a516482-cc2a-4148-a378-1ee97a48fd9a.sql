-- Create products/services management system for GACP Platform
-- Based on the project execution plan work packages

-- Create product categories table for GACP services
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table for GACP certification services
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    duration_days INTEGER DEFAULT 365, -- Certificate validity period
    requirements JSONB DEFAULT '[]', -- Required documents/criteria
    features JSONB DEFAULT '[]', -- Service features
    assessment_type TEXT DEFAULT 'onsite', -- onsite, online, hybrid
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pricing tiers table for different service levels
CREATE TABLE public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    assessment_fee DECIMAL(10,2) DEFAULT 0,
    certificate_fee DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '[]',
    max_farm_area DECIMAL(10,2), -- Maximum farm area covered
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product management
CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active categories" ON public.product_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active pricing tiers" ON public.pricing_tiers
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories" ON public.product_categories
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage pricing tiers" ON public.pricing_tiers
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_tiers_updated_at
    BEFORE UPDATE ON public.pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default GACP certification categories and products
INSERT INTO public.product_categories (name, description, sort_order) VALUES
('GACP Certification', 'Good Agricultural and Collection Practices Certification', 1),
('Assessment Services', 'On-site and Online Assessment Services', 2),
('Training Services', 'GACP Training and E-Learning Programs', 3),
('Consulting Services', 'Implementation and Compliance Consulting', 4);

-- Insert default GACP products based on the project plan
INSERT INTO public.products (category_id, name, description, price, duration_days, requirements, features, assessment_type) VALUES
(
    (SELECT id FROM public.product_categories WHERE name = 'GACP Certification'),
    'GACP Standard Certification',
    'Basic GACP certification for small to medium farms',
    15000.00,
    1095, -- 3 years
    '["Farm registration documents", "Land ownership proof", "Cultivation plan", "Water quality certificate", "Soil analysis report"]',
    '["Digital certificate", "QR code verification", "3-year validity", "Basic assessment"]',
    'onsite'
),
(
    (SELECT id FROM public.product_categories WHERE name = 'GACP Certification'),
    'GACP Premium Certification',
    'Premium GACP certification with additional services',
    25000.00,
    1095,
    '["Farm registration documents", "Land ownership proof", "Cultivation plan", "Water quality certificate", "Soil analysis report", "GAP implementation plan"]',
    '["Digital certificate", "QR code verification", "3-year validity", "Comprehensive assessment", "Follow-up inspections", "Technical support"]',
    'hybrid'
),
(
    (SELECT id FROM public.product_categories WHERE name = 'Assessment Services'),
    'On-site Assessment',
    'Physical farm inspection and assessment',
    8000.00,
    30,
    '["Valid application", "Farm accessibility", "Basic documentation"]',
    '["Physical inspection", "Photo documentation", "Detailed report", "Immediate feedback"]',
    'onsite'
),
(
    (SELECT id FROM public.product_categories WHERE name = 'Assessment Services'),
    'Online Assessment',
    'Virtual assessment via video conference',
    3000.00,
    7,
    '["Valid application", "Video equipment", "Digital documentation"]',
    '["Video conference", "Screen sharing", "Digital checklist", "Quick processing"]',
    'online'
);

-- Insert pricing tiers for the standard certification
INSERT INTO public.pricing_tiers (product_id, name, description, price, assessment_fee, certificate_fee, features, max_farm_area, is_default) VALUES
(
    (SELECT id FROM public.products WHERE name = 'GACP Standard Certification'),
    'Small Farm (≤ 5 Rai)',
    'For farms up to 5 rai',
    12000.00,
    5000.00,
    2000.00,
    '["Basic assessment", "Standard certificate", "1-year support"]',
    5.00,
    true
),
(
    (SELECT id FROM public.products WHERE name = 'GACP Standard Certification'),
    'Medium Farm (6-20 Rai)',
    'For farms 6-20 rai',
    18000.00,
    8000.00,
    3000.00,
    '["Extended assessment", "Standard certificate", "1-year support", "Additional inspections"]',
    20.00,
    false
),
(
    (SELECT id FROM public.products WHERE name = 'GACP Standard Certification'),
    'Large Farm (> 20 Rai)',
    'For farms over 20 rai',
    30000.00,
    15000.00,
    5000.00,
    '["Comprehensive assessment", "Standard certificate", "2-year support", "Quarterly inspections"]',
    NULL,
    false
);