-- Manually create the missing certificate for the CERTIFIED application
DO $$
DECLARE
    cert_number TEXT;
    cert_id UUID;
    app_record RECORD;
BEGIN
    -- Get the application details
    SELECT * INTO app_record
    FROM applications 
    WHERE id = '53a086e8-f48f-46d7-b0c8-a75def0427a9' 
    AND status = 'CERTIFIED';
    
    IF app_record.id IS NOT NULL THEN
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
            app_record.id,
            app_record.applicant_name,
            app_record.organization_name,
            app_record.farm_name,
            app_record.farm_address,
            app_record.crop_types,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '36 months',
            UPPER(SUBSTRING(MD5(cert_number || app_record.id::text) FROM 1 FOR 8)),
            'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number,
            jsonb_build_object(
                'certificate_number', cert_number,
                'issued_date', CURRENT_DATE,
                'expires_date', CURRENT_DATE + INTERVAL '36 months',
                'verification_url', 'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=' || cert_number
            )
        ) RETURNING id INTO cert_id;
        
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
            app_record.applicant_id,
            'certificate_issued',
            'ใบรับรอง GACP ออกแล้ว',
            'ใบรับรองหมายเลข ' || cert_number || ' ได้รับการออกให้เรียบร้อยแล้ว สามารถดาวน์โหลดและตรวจสอบได้',
            'high',
            '/applicant/certificates',
            'ดูใบรับรอง',
            cert_id
        );
        
        RAISE NOTICE 'Certificate % created successfully for application %', cert_number, app_record.id;
    ELSE
        RAISE NOTICE 'No CERTIFIED application found with ID 53a086e8-f48f-46d7-b0c8-a75def0427a9';
    END IF;
END $$;