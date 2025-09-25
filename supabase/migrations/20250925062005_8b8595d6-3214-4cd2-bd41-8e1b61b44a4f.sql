-- For testing: Manually trigger payments for existing submitted applications that don't have payments
-- This will simulate what happens when applications are submitted

DO $$
DECLARE
    app_record RECORD;
BEGIN
    -- Find submitted applications without payments
    FOR app_record IN 
        SELECT a.id, a.workflow_status 
        FROM applications a 
        LEFT JOIN payments p ON p.application_id = a.id 
        WHERE a.workflow_status = 'SUBMITTED' 
        AND p.id IS NULL
        LIMIT 5
    LOOP
        -- Create payment for document review
        PERFORM public.create_payment_record(
            app_record.id,
            'DOCUMENT_REVIEW'::public.payment_milestone,
            5000,
            now() + interval '7 days'
        );
        
        RAISE NOTICE 'Created payment for application: %', app_record.id;
    END LOOP;
END $$;