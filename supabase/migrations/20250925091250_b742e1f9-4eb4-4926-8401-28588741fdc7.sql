-- Fix RLS policies and payment function issues

-- Fix applications table RLS policy to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
CREATE POLICY "Users can create their own applications" 
ON applications FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = applicant_id);

-- Update applications table RLS policy for viewing
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
CREATE POLICY "Users can view their own applications" 
ON applications FOR SELECT 
TO authenticated 
USING (auth.uid() = applicant_id);

-- Update applications table RLS policy for updating
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
CREATE POLICY "Users can update their own applications" 
ON applications FOR UPDATE 
TO authenticated 
USING (auth.uid() = applicant_id);

-- Fix payment function by creating a simplified version
DROP FUNCTION IF EXISTS create_payment_record(uuid, integer, numeric, timestamp with time zone);
DROP FUNCTION IF EXISTS create_payment_record(uuid, payment_milestone, numeric, timestamp with time zone);

CREATE OR REPLACE FUNCTION create_payment_record(
  p_application_id uuid,
  p_milestone integer,
  p_amount numeric,
  p_due_date timestamp with time zone DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  payment_id uuid;
  invoice_id uuid;
BEGIN
  -- Create payment record
  INSERT INTO payments (
    application_id,
    milestone,
    amount,
    status,
    due_date,
    created_at
  ) VALUES (
    p_application_id,
    p_milestone,
    p_amount,
    'PENDING',
    COALESCE(p_due_date, NOW() + INTERVAL '30 days'),
    NOW()
  ) RETURNING id INTO payment_id;

  -- Create associated invoice
  INSERT INTO invoices (
    payment_id,
    amount,
    status,
    due_date,
    created_at
  ) VALUES (
    payment_id,
    p_amount,
    'DRAFT',
    COALESCE(p_due_date, NOW() + INTERVAL '30 days'),
    NOW()
  ) RETURNING id INTO invoice_id;

  RETURN payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get application status with payments
CREATE OR REPLACE FUNCTION get_application_status(app_id uuid)
RETURNS TABLE (
  application_status text,
  current_step text,
  pending_payments jsonb,
  completed_payments jsonb,
  next_action text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.status::text as application_status,
    CASE 
      WHEN a.status = 'DRAFT' THEN 'submit_documents'
      WHEN a.status = 'SUBMITTED' THEN 'payment_review'
      WHEN a.status = 'PAYMENT_PENDING_REVIEW' THEN 'awaiting_payment'
      WHEN a.status = 'UNDER_REVIEW' THEN 'document_review'
      WHEN a.status = 'PAYMENT_PENDING_ASSESSMENT' THEN 'assessment_payment'
      ELSE 'unknown'
    END as current_step,
    
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id,
          'milestone', p.milestone,
          'amount', p.amount,
          'due_date', p.due_date
        )
      ) FILTER (WHERE p.status = 'PENDING'),
      '[]'::json
    )::jsonb as pending_payments,
    
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id,
          'milestone', p.milestone,
          'amount', p.amount,
          'paid_at', p.updated_at
        )
      ) FILTER (WHERE p.status = 'COMPLETED'),
      '[]'::json
    )::jsonb as completed_payments,
    
    CASE 
      WHEN a.status = 'DRAFT' THEN 'กรุณาส่งเอกสารประกอบใบสมัคร'
      WHEN a.status = 'SUBMITTED' THEN 'กรุณาชำระค่าตรวจเอกสาร 5,000 บาท'
      WHEN a.status = 'PAYMENT_PENDING_REVIEW' THEN 'รอการตรวจสอบการชำระเงิน'
      WHEN a.status = 'UNDER_REVIEW' THEN 'เอกสารอยู่ระหว่างการตรวจสอบ'
      WHEN a.status = 'PAYMENT_PENDING_ASSESSMENT' THEN 'กรุณาชำระค่าประเมิน 25,000 บาท'
      ELSE 'ติดต่อเจ้าหน้าที่'
    END as next_action
    
  FROM applications a
  LEFT JOIN payments p ON p.application_id = a.id
  WHERE a.id = app_id
  GROUP BY a.id, a.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;