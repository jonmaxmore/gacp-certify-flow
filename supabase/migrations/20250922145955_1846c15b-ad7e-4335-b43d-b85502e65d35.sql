-- Create trigger for automatic certificate issuance
CREATE TRIGGER trigger_auto_issue_certificate
    AFTER UPDATE OF status ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_issue_certificate();

-- Generate test data for 500 application cases with various journeys
INSERT INTO public.profiles (id, email, full_name, role, phone, organization_name, created_at) VALUES
-- Test applicants (200)
(gen_random_uuid(), 'farmer1@example.com', 'สมชาย เกษตรกรรม', 'applicant', '0801234567', 'เกษตรกรรมยั่งยืน จำกัด', NOW() - INTERVAL '90 days'),
(gen_random_uuid(), 'farmer2@example.com', 'สมหญิง ปลอดภัย', 'applicant', '0801234568', 'ฟาร์มออร์แกนิค', NOW() - INTERVAL '85 days'),
(gen_random_uuid(), 'farmer3@example.com', 'วิทยา เกษตรอินทรีย์', 'applicant', '0801234569', 'สวนผักปลอดสาร', NOW() - INTERVAL '80 days'),
(gen_random_uuid(), 'farmer4@example.com', 'มานิต สมุนไพร', 'applicant', '0801234570', 'สวนสมุนไพรไทย', NOW() - INTERVAL '75 days'),
(gen_random_uuid(), 'farmer5@example.com', 'อุมา ข้าวหอมมะลิ', 'applicant', '0801234571', 'เกษตรกรข้าวหอมมะลิ', NOW() - INTERVAL '70 days'),
-- Test reviewers (5)
(gen_random_uuid(), 'reviewer1@gacp.go.th', 'ผศ.ดร.สุรีย์ วิชาการ', 'reviewer', '0891234567', 'กรมวิชาการเกษตร', NOW() - INTERVAL '100 days'),
(gen_random_uuid(), 'reviewer2@gacp.go.th', 'ผศ.ดร.วิไล มาตรฐาน', 'reviewer', '0891234568', 'สำนักมาตรฐานสินค้าเกษตร', NOW() - INTERVAL '95 days'),
-- Test auditors (5)  
(gen_random_uuid(), 'auditor1@gacp.go.th', 'ดร.สมคิด ตรวจสอบ', 'auditor', '0921234567', 'หน่วยตรวจสอบมาตรฐาน', NOW() - INTERVAL '90 days'),
(gen_random_uuid(), 'auditor2@gacp.go.th', 'ดร.วรรณา ประเมิน', 'auditor', '0921234568', 'ศูนย์ประเมินมาตรฐาน', NOW() - INTERVAL '85 days');

-- Store user IDs for generating applications
DO $$
DECLARE
    user_ids UUID[];
    reviewer_ids UUID[];
    auditor_ids UUID[];
    current_user_id UUID;
    current_reviewer_id UUID;
    current_auditor_id UUID;
    app_id UUID;
    cert_id UUID;
    i INTEGER;
    status_options application_status[] := ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'DOCS_APPROVED', 'PAYMENT_PENDING', 'ONLINE_SCHEDULED', 'ONLINE_COMPLETED', 'ONSITE_SCHEDULED', 'ONSITE_COMPLETED', 'CERTIFIED', 'REVOKED'];
    crop_options TEXT[][] := ARRAY[
        ARRAY['ข้าวหอมมะลิ', 'ข้าวขาว'],
        ARRAY['กะหล่ำปลี', 'ผักบุ้ง', 'ผักกาด'],
        ARRAY['มะเขือเทศ', 'แตงกวา', 'พริก'],
        ARRAY['ผักชี', 'โหระพา', 'ใบแมงลัก'],
        ARRAY['ข่า', 'ขิง', 'ตะไคร้', 'กระชาย'],
        ARRAY['มะกรูด', 'มะนาว', 'ส้มโอ'],
        ARRAY['ฟ้าทะลายโจร', 'กรรณิการ์', 'บราหมี']
    ];
    farm_names TEXT[] := ARRAY['ฟาร์มสุขใจ', 'เกษตรเขียว', 'สวนออร์แกนิค', 'ฟาร์มปลอดภัย', 'เกษตรยั่งยืน', 'สวนสมุนไพรไทย', 'ฟาร์มธรรมชาติ'];
    provinces TEXT[] := ARRAY['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'พิษณุโลก', 'สุโขทัย', 'กำแพงเพชร', 'นครสวรรค์', 'อุทัยธานี', 'ชัยนาท', 'สิงห์บุรี'];
BEGIN    
    -- Get user IDs for applicants
    SELECT ARRAY_AGG(id) INTO user_ids FROM profiles WHERE role = 'applicant' AND email LIKE 'farmer%@example.com';
    SELECT ARRAY_AGG(id) INTO reviewer_ids FROM profiles WHERE role = 'reviewer';
    SELECT ARRAY_AGG(id) INTO auditor_ids FROM profiles WHERE role = 'auditor';
    
    -- Generate 500 applications with various statuses and scenarios
    FOR i IN 1..500 LOOP
        current_user_id := user_ids[1 + (i % array_length(user_ids, 1))];
        current_reviewer_id := reviewer_ids[1 + (i % array_length(reviewer_ids, 1))];
        current_auditor_id := auditor_ids[1 + (i % array_length(auditor_ids, 1))];
        
        -- Generate application
        INSERT INTO public.applications (
            id,
            applicant_id,
            application_number,
            applicant_name,
            applicant_email,
            applicant_phone,
            applicant_address,
            organization_name,
            farm_name,
            farm_address,
            farm_area_rai,
            farm_area_ngan,
            farm_area_wah,
            crop_types,
            cultivation_methods,
            expected_yield,
            responsible_person,
            staff_count,
            training_completed,
            training_date,
            status,
            created_at,
            updated_at,
            submitted_at,
            approved_at
        ) VALUES (
            gen_random_uuid(),
            current_user_id,
            'GACP-' || LPAD(i::TEXT, 4, '0') || '-' || (EXTRACT(YEAR FROM NOW()) + 543)::TEXT,
            'เกษตรกร ' || i || ' ' || provinces[1 + (i % array_length(provinces, 1))],
            'farmer' || i || '@example.com',
            '080' || LPAD((1234567 + i)::TEXT, 7, '0'),
            i || '/1 หมู่ ' || (1 + (i % 12)) || ' ตำบลเกษตร อำเภอธรรมชาติ จังหวัด' || provinces[1 + (i % array_length(provinces, 1))] || ' ' || (10000 + (i % 90000)),
            CASE WHEN i % 3 = 0 THEN 'เกษตรกรรมยั่งยืน จำกัด' ELSE NULL END,
            farm_names[1 + (i % array_length(farm_names, 1))] || ' ' || i,
            i || '/2 หมู่ ' || (1 + (i % 15)) || ' ตำบลฟาร์ม อำเภอเกษตร จังหวัด' || provinces[1 + (i % array_length(provinces, 1))],
            5.0 + (i % 50),
            2.0 + (i % 4),
            50.0 + (i % 200),
            crop_options[1 + (i % array_length(crop_options, 1))],
            CASE WHEN i % 2 = 0 THEN ARRAY['เกษตรอินทรีย์', 'ไม่ใช้สารเคมี'] ELSE ARRAY['GAP', 'ใช้สารอนุญาต'] END,
            (1000 + (i % 5000)) || ' กิโลกรัมต่อไร่',
            'เกษตรกร ' || i || ' (เจ้าของฟาร์ม)',
            2 + (i % 8),
            i % 2 = 0,
            CASE WHEN i % 2 = 0 THEN (NOW() - INTERVAL '30 days' + (i || ' days')::INTERVAL) ELSE NULL END,
            status_options[1 + (i % array_length(status_options, 1))],
            NOW() - INTERVAL '60 days' + (i || ' hours')::INTERVAL,
            NOW() - INTERVAL '50 days' + (i || ' hours')::INTERVAL,
            CASE WHEN status_options[1 + (i % array_length(status_options, 1))] != 'DRAFT' 
                 THEN NOW() - INTERVAL '45 days' + (i || ' hours')::INTERVAL 
                 ELSE NULL END,
            CASE WHEN status_options[1 + (i % array_length(status_options, 1))] IN ('CERTIFIED', 'REVOKED') 
                 THEN NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL 
                 ELSE NULL END
        ) RETURNING id INTO app_id;
        
        -- Generate assessments for applications that need them
        IF status_options[1 + (i % array_length(status_options, 1))] IN ('ONLINE_SCHEDULED', 'ONLINE_COMPLETED', 'ONSITE_SCHEDULED', 'ONSITE_COMPLETED', 'CERTIFIED') THEN
            -- Online assessment
            INSERT INTO public.assessments (
                id,
                application_id,
                auditor_id,
                type,
                status,
                scheduled_at,
                started_at,
                completed_at,
                score,
                passed,
                meeting_url,
                result_summary
            ) VALUES (
                gen_random_uuid(),
                app_id,
                current_auditor_id,
                'ONLINE',
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' 
                     THEN 'SCHEDULED'::assessment_status
                     ELSE 'COMPLETED'::assessment_status END,
                NOW() - INTERVAL '20 days' + (i || ' hours')::INTERVAL,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] != 'ONLINE_SCHEDULED' 
                     THEN NOW() - INTERVAL '18 days' + (i || ' hours')::INTERVAL 
                     ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONLINE_SCHEDULED') 
                     THEN NOW() - INTERVAL '17 days' + (i || ' hours')::INTERVAL 
                     ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONLINE_SCHEDULED') 
                     THEN 75 + (i % 25) ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONLINE_SCHEDULED') 
                     THEN (75 + (i % 25)) >= 80 ELSE NULL END,
                'https://meet.gacp.example.com/room-' || app_id,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONLINE_SCHEDULED') 
                     THEN 'ผ่านการประเมินออนไลน์ด้วยคะแนน ' || (75 + (i % 25)) || '%' 
                     ELSE NULL END
            );
        END IF;
        
        -- Generate onsite assessment for applications that reached onsite stage
        IF status_options[1 + (i % array_length(status_options, 1))] IN ('ONSITE_SCHEDULED', 'ONSITE_COMPLETED', 'CERTIFIED') THEN
            INSERT INTO public.assessments (
                id,
                application_id,
                auditor_id,
                type,
                status,
                scheduled_at,
                started_at,
                completed_at,
                score,
                passed,
                onsite_address,
                result_summary
            ) VALUES (
                gen_random_uuid(),
                app_id,
                current_auditor_id,
                'ONSITE',
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONSITE_SCHEDULED' 
                     THEN 'SCHEDULED'::assessment_status
                     ELSE 'COMPLETED'::assessment_status END,
                NOW() - INTERVAL '10 days' + (i || ' hours')::INTERVAL,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] != 'ONSITE_SCHEDULED' 
                     THEN NOW() - INTERVAL '8 days' + (i || ' hours')::INTERVAL 
                     ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONSITE_SCHEDULED') 
                     THEN NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL 
                     ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONSITE_SCHEDULED') 
                     THEN 80 + (i % 20) ELSE NULL END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONSITE_SCHEDULED') 
                     THEN (80 + (i % 20)) >= 85 ELSE NULL END,
                i || '/2 หมู่ ' || (1 + (i % 15)) || ' ตำบลฟาร์ม อำเภอเกษตร จังหวัด' || provinces[1 + (i % array_length(provinces, 1))],
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] NOT IN ('ONSITE_SCHEDULED') 
                     THEN 'ผ่านการประเมินภาคสนามด้วยคะแนน ' || (80 + (i % 20)) || '%' 
                     ELSE NULL END
            );
        END IF;
        
        -- Generate payments for applications that need them
        IF status_options[1 + (i % array_length(status_options, 1))] NOT IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED') THEN
            INSERT INTO public.payments (
                id,
                application_id,
                milestone,
                amount,
                status,
                currency,
                created_at,
                paid_at
            ) VALUES (
                gen_random_uuid(),
                app_id,
                1,
                5000.00,
                'COMPLETED'::payment_status,
                'THB',
                NOW() - INTERVAL '40 days' + (i || ' hours')::INTERVAL,
                NOW() - INTERVAL '38 days' + (i || ' hours')::INTERVAL
            );
            
            -- Assessment fee
            INSERT INTO public.payments (
                id,
                application_id,
                milestone,
                amount,
                status,
                currency,
                created_at,
                paid_at
            ) VALUES (
                gen_random_uuid(),
                app_id,
                2,
                8000.00,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' 
                     THEN 'PENDING'::payment_status
                     ELSE 'COMPLETED'::payment_status END,
                'THB',
                NOW() - INTERVAL '25 days' + (i || ' hours')::INTERVAL,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] != 'PAYMENT_PENDING' 
                     THEN NOW() - INTERVAL '23 days' + (i || ' hours')::INTERVAL 
                     ELSE NULL END
            );
        END IF;
        
        -- Generate reviews for applications under review
        IF status_options[1 + (i % array_length(status_options, 1))] IN ('UNDER_REVIEW', 'RETURNED', 'DOCS_APPROVED', 'PAYMENT_PENDING', 'ONLINE_SCHEDULED', 'ONLINE_COMPLETED', 'ONSITE_SCHEDULED', 'ONSITE_COMPLETED', 'CERTIFIED') THEN
            INSERT INTO public.reviews (
                id,
                application_id,
                reviewer_id,
                decision,
                comments,
                created_at
            ) VALUES (
                gen_random_uuid(),
                app_id,
                current_reviewer_id,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'RETURNED' THEN 'returned'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'UNDER_REVIEW' THEN 'pending'
                     ELSE 'approved' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'RETURNED' 
                     THEN 'กรุณาแก้ไขเอกสารหลักฐานการอบรม GACP และเอกสารทะเบียนการค้า'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'UNDER_REVIEW' 
                     THEN 'กำลังตรวจสอบเอกสารทั้งหมด'
                     ELSE 'เอกสารครบถ้วนและถูกต้อง อนุมัติให้ดำเนินการขั้นตอนต่อไป' END,
                NOW() - INTERVAL '35 days' + (i || ' hours')::INTERVAL
            );
        END IF;
        
        -- Generate certificates for CERTIFIED applications (but don't trigger the auto function)
        IF status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN
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
                issued_at,
                verification_code,
                verification_url,
                qr_code_data,
                is_active
            ) VALUES (
                gen_random_uuid(),
                'CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT,
                app_id,
                'เกษตรกร ' || i || ' ' || provinces[1 + (i % array_length(provinces, 1))],
                CASE WHEN i % 3 = 0 THEN 'เกษตรกรรมยั่งยืน จำกัด' ELSE NULL END,
                farm_names[1 + (i % array_length(farm_names, 1))] || ' ' || i,
                i || '/2 หมู่ ' || (1 + (i % 15)) || ' ตำบลฟาร์ม อำเภอเกษตร จังหวัด' || provinces[1 + (i % array_length(provinces, 1))],
                crop_options[1 + (i % array_length(crop_options, 1))],
                (NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL)::DATE,
                (NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL + INTERVAL '36 months')::DATE,
                NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL,
                UPPER(SUBSTRING(MD5('CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT || app_id::text) FROM 1 FOR 8)),
                'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT,
                jsonb_build_object(
                    'certificate_number', 'CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT,
                    'issued_date', (NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL)::DATE,
                    'expires_date', (NOW() - INTERVAL '7 days' + (i || ' hours')::INTERVAL + INTERVAL '36 months')::DATE,
                    'verification_url', 'https://mpxebbqxqyzalctgsyxm.supabase.co/verify-certificate?cert=CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT
                ),
                CASE WHEN i % 50 = 0 THEN false ELSE true END  -- 2% revoked certificates
            );
        END IF;
        
        -- Generate some notifications
        IF i % 10 = 0 THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                priority,
                action_url,
                action_label,
                related_id,
                read
            ) VALUES (
                current_user_id,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN 'certificate_issued'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' THEN 'payment_due'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' THEN 'assessment_scheduled'
                     ELSE 'system_update' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN 'ใบรับรอง GACP ออกแล้ว'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' THEN 'ค้างชำระค่าธรรมเนียม'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' THEN 'นัดหมายประเมินออนไลน์'
                     ELSE 'ระบบได้รับใบสมัครแล้ว' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN 'ใบรับรองหมายเลข CERT-' || LPAD(i::TEXT, 6, '0') || '-' || EXTRACT(YEAR FROM NOW())::TEXT || ' ได้รับการออกให้เรียบร้อยแล้ว'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' THEN 'กรุณาชำระค่าธรรมเนียมการประเมิน จำนวน 8,000 บาท ภายใน 7 วัน'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' THEN 'การประเมินออนไลน์ได้รับการจัดตารางเวลาแล้ว'
                     ELSE 'ระบบได้รับใบสมัครเลขที่ GACP-' || LPAD(i::TEXT, 4, '0') || '-' || (EXTRACT(YEAR FROM NOW()) + 543)::TEXT || ' เรียบร้อยแล้ว' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] IN ('CERTIFIED', 'PAYMENT_PENDING') THEN 'high' ELSE 'medium' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN '/applicant/certificates'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' THEN '/applicant/payments'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' THEN '/applicant/schedule'
                     ELSE '/applicant/applications' END,
                CASE WHEN status_options[1 + (i % array_length(status_options, 1))] = 'CERTIFIED' THEN 'ดูใบรับรอง'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'PAYMENT_PENDING' THEN 'ชำระเงิน'
                     WHEN status_options[1 + (i % array_length(status_options, 1))] = 'ONLINE_SCHEDULED' THEN 'ดูตารางเวลา'
                     ELSE 'ดูใบสมัคร' END,
                app_id,
                i % 3 = 0  -- 33% read notifications
            );
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Generated 500 test applications with certificates, assessments, payments, reviews, and notifications';
END $$;