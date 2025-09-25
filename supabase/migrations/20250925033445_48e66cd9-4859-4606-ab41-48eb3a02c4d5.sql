-- Add rejection count tracking to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS revision_count_current INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS max_free_revisions INTEGER DEFAULT 2;

-- Update workflow status type to handle new statuses
ALTER TYPE application_workflow_status ADD VALUE IF NOT EXISTS 'REJECTED_PAYMENT_REQUIRED';

-- Create function to handle document rejection with count tracking
CREATE OR REPLACE FUNCTION public.handle_document_rejection(
  p_application_id UUID,
  p_reviewer_id UUID,
  p_comments TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_revisions INTEGER;
  max_free_revisions INTEGER;
  applicant_id UUID;
  result JSON;
BEGIN
  -- Get current application data
  SELECT revision_count_current, max_free_revisions, applicant_id
  INTO current_revisions, max_free_revisions, applicant_id
  FROM applications
  WHERE id = p_application_id;
  
  -- Increment revision count
  current_revisions := current_revisions + 1;
  
  -- Update application
  UPDATE applications 
  SET 
    revision_count_current = current_revisions,
    reviewer_comments = p_comments,
    updated_at = NOW(),
    workflow_status = CASE 
      WHEN current_revisions > max_free_revisions THEN 'REJECTED_PAYMENT_REQUIRED'::application_workflow_status
      ELSE 'REVISION_REQUESTED'::application_workflow_status
    END
  WHERE id = p_application_id;
  
  -- Create notification
  INSERT INTO workflow_notifications (
    user_id,
    application_id,
    notification_type,
    title,
    message,
    priority,
    action_url,
    action_label,
    metadata
  ) VALUES (
    applicant_id,
    p_application_id,
    'document_rejected',
    CASE 
      WHEN current_revisions > max_free_revisions THEN 'ต้องชำระเงินเพื่อแก้ไขเอกสาร'
      ELSE 'เอกสารต้องแก้ไข (ครั้งที่ ' || current_revisions || ')'
    END,
    CASE 
      WHEN current_revisions > max_free_revisions THEN 'เอกสารถูกปฏิเสธครั้งที่ ' || current_revisions || ' กรุณาชำระค่าธรรมเนียม 5,000 บาท เพื่อส่งเอกสารใหม่'
      ELSE 'เอกสารต้องแก้ไขตามข้อเสนอแนะ (แก้ไขฟรี ' || (max_free_revisions - current_revisions + 1) || ' ครั้ง)'
    END,
    CASE 
      WHEN current_revisions > max_free_revisions THEN 'urgent'
      ELSE 'high'
    END,
    CASE 
      WHEN current_revisions > max_free_revisions THEN '/applicant/payments'
      ELSE '/applicant/applications'
    END,
    CASE 
      WHEN current_revisions > max_free_revisions THEN 'ชำระเงิน'
      ELSE 'แก้ไขเอกสาร'
    END,
    jsonb_build_object(
      'revision_count', current_revisions,
      'max_free_revisions', max_free_revisions,
      'payment_required', current_revisions > max_free_revisions,
      'reviewer_comments', p_comments
    )
  );
  
  -- If payment required, create payment record
  IF current_revisions > max_free_revisions THEN
    PERFORM create_payment_record(
      p_application_id,
      1, -- Document review milestone
      5000,
      NOW() + INTERVAL '7 days'
    );
  END IF;
  
  -- Log the action
  PERFORM log_audit_event(
    p_reviewer_id,
    'document_rejected',
    'application',
    p_application_id,
    NULL,
    jsonb_build_object(
      'revision_count', current_revisions,
      'payment_required', current_revisions > max_free_revisions,
      'comments', p_comments
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'revision_count', current_revisions,
    'max_free_revisions', max_free_revisions,
    'payment_required', current_revisions > max_free_revisions,
    'next_action', CASE 
      WHEN current_revisions > max_free_revisions THEN 'payment'
      ELSE 'revision'
    END
  );
  
  RETURN result;
END;
$$;

-- Create function to handle document approval
CREATE OR REPLACE FUNCTION public.handle_document_approval(
  p_application_id UUID,
  p_reviewer_id UUID,
  p_comments TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  applicant_id UUID;
  result JSON;
BEGIN
  -- Get applicant ID
  SELECT applicant_id INTO applicant_id
  FROM applications
  WHERE id = p_application_id;
  
  -- Update application
  UPDATE applications 
  SET 
    workflow_status = 'REVIEW_APPROVED'::application_workflow_status,
    reviewer_comments = p_comments,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Create notification for assessment fee payment
  INSERT INTO workflow_notifications (
    user_id,
    application_id,
    notification_type,
    title,
    message,
    priority,
    action_url,
    action_label,
    metadata
  ) VALUES (
    applicant_id,
    p_application_id,
    'document_approved',
    'เอกสารได้รับการอนุมัติ',
    'เอกสารของท่านผ่านการตรวจสอบแล้ว กรุณาชำระค่าประเมิน 25,000 บาท เพื่อเข้าสู่ขั้นตอนการประเมิน',
    'high',
    '/applicant/payments',
    'ชำระค่าประเมิน',
    jsonb_build_object(
      'approved_at', NOW(),
      'reviewer_comments', p_comments
    )
  );
  
  -- Create payment record for assessment
  PERFORM create_payment_record(
    p_application_id,
    2, -- Assessment milestone
    25000,
    NOW() + INTERVAL '7 days'
  );
  
  -- Log the action
  PERFORM log_audit_event(
    p_reviewer_id,
    'document_approved',
    'application',
    p_application_id,
    NULL,
    jsonb_build_object(
      'approved_at', NOW(),
      'comments', p_comments
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'next_action', 'assessment_payment',
    'payment_amount', 25000
  );
  
  RETURN result;
END;
$$;

-- Update existing workflow status function to handle new logic
CREATE OR REPLACE FUNCTION public.update_workflow_status_v2(
  p_application_id UUID,
  p_new_status application_workflow_status,
  p_updated_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_status application_workflow_status;
  applicant_id UUID;
  result JSON;
BEGIN
  -- Get current status and applicant
  SELECT workflow_status, applicant_id 
  INTO old_status, applicant_id
  FROM applications 
  WHERE id = p_application_id;
  
  -- Update workflow status and history
  UPDATE applications 
  SET 
    workflow_status = p_new_status,
    workflow_history = workflow_history || jsonb_build_object(
      'timestamp', NOW(),
      'from_status', old_status,
      'to_status', p_new_status,
      'updated_by', p_updated_by,
      'notes', p_notes
    ),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Handle status-specific logic
  CASE p_new_status
    WHEN 'ONLINE_ASSESSMENT_SCHEDULED' THEN
      -- Auto-generate meeting link would go here
      NULL;
    WHEN 'CERTIFIED' THEN
      -- Certificate generation is handled by existing trigger
      NULL;
    ELSE
      NULL;
  END CASE;
  
  result := jsonb_build_object(
    'success', true,
    'old_status', old_status,
    'new_status', p_new_status
  );
  
  RETURN result;
END;
$$;