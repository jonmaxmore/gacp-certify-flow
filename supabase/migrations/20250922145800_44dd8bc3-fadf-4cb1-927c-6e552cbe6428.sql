-- Create certificate issuance trigger
CREATE OR REPLACE FUNCTION public.auto_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    cert_number TEXT;
    cert_id UUID;
BEGIN
    -- Only proceed if status changed to CERTIFIED
    IF NEW.status = 'CERTIFIED' AND (OLD.status IS NULL OR OLD.status != 'CERTIFIED') THEN
        
        -- Generate certificate number
        cert_number := public.generate_certificate_number();
        
        -- Create certificate record
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
            NEW.applicant_name,
            NEW.organization_name,
            NEW.farm_name,
            NEW.farm_address,
            NEW.crop_types,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '36 months',
            UPPER(SUBSTRING(MD5(cert_number || NEW.id::text) FROM 1 FOR 8)),
            'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number,
            jsonb_build_object(
                'certificate_number', cert_number,
                'issued_date', CURRENT_DATE,
                'expires_date', CURRENT_DATE + INTERVAL '36 months',
                'verification_url', 'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number
            )
        ) RETURNING id INTO cert_id;
        
        -- Log the certificate issuance
        PERFORM log_audit_event(
            NEW.applicant_id,
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
            NEW.applicant_id,
            'certificate_issued',
            'ใบรับรอง GACP ออกแล้ว',
            'ใบรับรองหมายเลข ' || cert_number || ' ได้รับการออกให้เรียบร้อยแล้ว สามารถดาวน์โหลดและตรวจสอบได้',
            'high',
            '/applicant/certificates',
            'ดูใบรับรอง',
            cert_id
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;