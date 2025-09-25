-- Create function to create payment records with proper workflow integration
CREATE OR REPLACE FUNCTION create_payment_record(
    p_application_id UUID,
    p_milestone INTEGER,
    p_amount NUMERIC,
    p_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_id UUID;
    invoice_id UUID;
BEGIN
    -- Create payment record
    INSERT INTO payments (
        application_id,
        milestone,
        amount,
        currency,
        status,
        payment_due_date
    ) VALUES (
        p_application_id,
        p_milestone,
        p_amount,
        'THB',
        'PENDING',
        COALESCE(p_due_date, NOW() + INTERVAL '7 days')
    ) RETURNING id INTO payment_id;
    
    -- Create corresponding invoice
    SELECT create_invoice_from_payment(payment_id) INTO invoice_id;
    
    RETURN payment_id;
END;
$$;