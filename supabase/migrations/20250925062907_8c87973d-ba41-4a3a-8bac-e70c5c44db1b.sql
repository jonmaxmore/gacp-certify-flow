-- Add crop types and update certificate generation
-- Update the auto_issue_certificate function to properly map application data to certificate
CREATE OR REPLACE FUNCTION public.auto_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    cert_number TEXT;
    cert_id UUID;
    app_data RECORD;
    applicant_profile RECORD;
BEGIN
    -- Only proceed if workflow_status changed to CERTIFIED
    IF NEW.workflow_status = 'CERTIFIED' AND (OLD.workflow_status IS NULL OR OLD.workflow_status != 'CERTIFIED') THEN
        
        -- Get application data
        SELECT * INTO app_data FROM applications WHERE id = NEW.id;
        
        -- Get applicant profile data
        SELECT * INTO applicant_profile FROM profiles WHERE id = app_data.applicant_id;
        
        -- Generate certificate number
        cert_number := public.generate_certificate_number();
        
        -- Create certificate record with correct data mapping
        INSERT INTO public.certificates (
            id,
            certificate_number,
            application_id,
            applicant_name,
            organization_name,
            farm_name,
            farm_address,
            crop_types,
            valid_from,
            expires_at,
            verification_code,
            verification_url,
            qr_code_data
        ) VALUES (
            gen_random_uuid(),
            cert_number,
            NEW.id,
            COALESCE(app_data.applicant_name, applicant_profile.full_name), -- Use application name or profile name
            COALESCE(app_data.organization_name, applicant_profile.organization_name), -- Use application org or profile org
            app_data.farm_name, -- Use farm name from application
            app_data.farm_address, -- Use farm address from application
            app_data.crop_types, -- Use crop types from application
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '36 months',
            UPPER(SUBSTRING(MD5(cert_number || NEW.id::text) FROM 1 FOR 8)),
            'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number,
            jsonb_build_object(
                'certificate_number', cert_number,
                'issued_date', CURRENT_DATE,
                'expires_date', CURRENT_DATE + INTERVAL '36 months',
                'verification_url', 'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number,
                'applicant_name', COALESCE(app_data.applicant_name, applicant_profile.full_name),
                'organization_name', COALESCE(app_data.organization_name, applicant_profile.organization_name),
                'farm_name', app_data.farm_name,
                'farm_address', app_data.farm_address,
                'crop_types', app_data.crop_types
            )
        ) RETURNING id INTO cert_id;
        
        -- Log the certificate issuance (skip if user doesn't exist to avoid security function issues)
        IF app_data.applicant_id IS NOT NULL THEN
            PERFORM log_audit_event(
                app_data.applicant_id,
                'certificate_issued',
                'certificate',
                cert_id,
                NULL,
                jsonb_build_object(
                    'certificate_number', cert_number,
                    'application_id', NEW.id,
                    'application_number', NEW.application_number
                ),
                jsonb_build_object('auto_issued', true)
            );
        END IF;
        
        -- Create notification for applicant
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            priority,
            action_url,
            action_label,
            related_id
        ) VALUES (
            app_data.applicant_id,
            'certificate_issued',
            'ใบรับรอง GACP ออกแล้ว',
            'ใบรับรองหมายเลข ' || cert_number || ' ได้รับการออกให้เรียบร้อยแล้ว สำหรับพืช: ' || 
            CASE 
                WHEN app_data.crop_types IS NOT NULL THEN array_to_string(app_data.crop_types, ', ')
                ELSE 'ไม่ระบุ'
            END || ' สามารถดาวน์โหลดและตรวจสอบได้',
            'high',
            '/applicant/certificates',
            'ดูใบรับรอง',
            cert_id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the trigger to use workflow_status instead of status
DROP TRIGGER IF EXISTS auto_issue_certificate_trigger ON applications;
CREATE TRIGGER auto_issue_certificate_trigger
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION auto_issue_certificate();

-- Insert common crop types for Thailand GACP certification
INSERT INTO system_config (key, value, description) 
VALUES (
    'supported_crop_types',
    jsonb_build_array(
        'กัญชา',
        'มะม่วง', 
        'ลำไย',
        'ลิ้นจี่',
        'ส้มโอ',
        'มะละกอ',
        'กล้วย',
        'รำบุตัน',
        'เงาะ',
        'ทุเรียน',
        'มังคุด',
        'ขิง',
        'ข่า',
        'ตะไคร้',
        'ใบแมงลัก',
        'โหระพา',
        'กะเพรา',
        'พริก',
        'มะเขือเทศ',
        'แตงกวา'
    ),
    'List of supported crop types for GACP certification in Thailand'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();