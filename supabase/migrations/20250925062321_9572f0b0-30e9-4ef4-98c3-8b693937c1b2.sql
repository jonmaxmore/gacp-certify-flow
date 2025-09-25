-- Fix the payments table milestone column to use the enum type
-- First, check what we have
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'milestone';

-- If it's integer, we need to convert it to the enum type
-- But first let's change the approach - let's update the function to use integer instead
-- and map it correctly

-- Update the function to accept integer milestone and work with the existing schema
CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_application_id uuid,
  p_milestone integer,
  p_amount numeric,
  p_due_date timestamp with time zone DEFAULT (now() + interval '30 days')
) RETURNS uuid AS $$
DECLARE
  payment_id uuid;
BEGIN
  INSERT INTO public.payments (
    application_id,
    milestone,
    amount,
    due_date,
    status
  ) VALUES (
    p_application_id,
    p_milestone,
    p_amount,
    p_due_date,
    'PENDING'
  ) RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the trigger to use integer milestones
CREATE OR REPLACE FUNCTION public.trigger_payment_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new submissions (status changes to SUBMITTED)
  IF OLD.workflow_status != 'SUBMITTED' AND NEW.workflow_status = 'SUBMITTED' THEN
    -- Create initial document review payment
    PERFORM public.create_payment_record(
      NEW.id,
      1, -- 1 = DOCUMENT_REVIEW
      5000,
      now() + interval '7 days'
    );
  END IF;
  
  -- Trigger assessment payment when approved for assessment
  IF OLD.workflow_status != 'REVIEW_APPROVED' AND NEW.workflow_status = 'REVIEW_APPROVED' THEN
    PERFORM public.create_payment_record(
      NEW.id,
      2, -- 2 = ASSESSMENT
      25000,
      now() + interval '14 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;