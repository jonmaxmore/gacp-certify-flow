-- Fix the duplicate create_payment_record function issue
-- Drop the old function with integer milestone parameter
DROP FUNCTION IF EXISTS public.create_payment_record(p_application_id uuid, p_milestone integer, p_amount numeric, p_due_date timestamp with time zone);

-- Keep only the function with enum parameter
-- Ensure we have the correct function for payment_milestone enum
CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_application_id uuid,
  p_milestone public.payment_milestone,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automatic payment trigger when application is submitted
CREATE OR REPLACE FUNCTION public.trigger_payment_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new submissions (status changes to SUBMITTED)
  IF OLD.workflow_status != 'SUBMITTED' AND NEW.workflow_status = 'SUBMITTED' THEN
    -- Create initial document review payment
    PERFORM public.create_payment_record(
      NEW.id,
      'DOCUMENT_REVIEW'::public.payment_milestone,
      5000,
      now() + interval '7 days'
    );
  END IF;
  
  -- Trigger assessment payment when approved for assessment
  IF OLD.workflow_status != 'REVIEW_APPROVED' AND NEW.workflow_status = 'REVIEW_APPROVED' THEN
    PERFORM public.create_payment_record(
      NEW.id,
      'ASSESSMENT'::public.payment_milestone,
      25000,
      now() + interval '14 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on applications table
DROP TRIGGER IF EXISTS payment_trigger_on_submission ON public.applications;
CREATE TRIGGER payment_trigger_on_submission
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_payment_on_submission();