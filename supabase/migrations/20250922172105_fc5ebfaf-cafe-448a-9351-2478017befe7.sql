-- GACP Payment & Workflow System Enhancement
-- Creating comprehensive payment, status tracking, and notification infrastructure

-- 1. Enhanced payment milestones for GACP workflow
CREATE TYPE payment_milestone AS ENUM (
  'DOCUMENT_REVIEW',      -- 5,000 THB for document review
  'ASSESSMENT',           -- 25,000 THB for assessment
  'CERTIFICATION',        -- Additional certification fees if needed
  'REINSPECTION'          -- For failed assessments requiring reinspection
);

-- 2. Comprehensive application status tracking
CREATE TYPE application_workflow_status AS ENUM (
  'DRAFT',                    -- Initial state
  'SUBMITTED',               -- Application submitted
  'PAYMENT_PENDING_REVIEW',  -- Awaiting 5,000 THB payment
  'PAYMENT_CONFIRMED_REVIEW', -- Review payment confirmed
  'UNDER_REVIEW',            -- Document review in progress
  'REVISION_REQUESTED',      -- Reviewer requested changes
  'REVIEW_APPROVED',         -- Documents approved
  'PAYMENT_PENDING_ASSESSMENT', -- Awaiting 25,000 THB payment
  'PAYMENT_CONFIRMED_ASSESSMENT', -- Assessment payment confirmed
  'ONLINE_ASSESSMENT_SCHEDULED', -- Online assessment scheduled
  'ONLINE_ASSESSMENT_IN_PROGRESS', -- Online assessment active
  'ONLINE_ASSESSMENT_COMPLETED', -- Online assessment done
  'ONSITE_ASSESSMENT_SCHEDULED', -- Onsite assessment scheduled
  'ONSITE_ASSESSMENT_IN_PROGRESS', -- Onsite assessment active
  'ONSITE_ASSESSMENT_COMPLETED', -- Onsite assessment done
  'CERTIFIED',               -- Certificate issued
  'REJECTED',                -- Application rejected
  'EXPIRED',                 -- Application expired
  'REVOKED'                  -- Certificate revoked
);

-- 3. Enhanced payments table with milestone tracking
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS milestone payment_milestone NOT NULL DEFAULT 'DOCUMENT_REVIEW',
ADD COLUMN IF NOT EXISTS workflow_status application_workflow_status,
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS bank_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT '{}';

-- 4. Add workflow status to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS workflow_status application_workflow_status DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS payment_review_id UUID REFERENCES public.payments(id),
ADD COLUMN IF NOT EXISTS payment_assessment_id UUID REFERENCES public.payments(id),
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_revisions INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS workflow_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS next_action_required TEXT,
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;

-- 5. Comprehensive notification system
CREATE TABLE IF NOT EXISTS public.workflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'payment_due', 'status_change', 'reminder', 'deadline'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'archived'
  channels JSONB DEFAULT '["web"]', -- 'web', 'email', 'sms'
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on workflow notifications
ALTER TABLE public.workflow_notifications ENABLE ROW LEVEL SECURITY;

-- 6. Payment tracking and workflow automation functions
CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_application_id UUID,
  p_milestone payment_milestone,
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
  applicant_id UUID;
BEGIN
  -- Get applicant ID
  SELECT applications.applicant_id INTO applicant_id
  FROM applications
  WHERE id = p_application_id;
  
  -- Create payment record
  INSERT INTO payments (
    application_id,
    milestone,
    amount,
    currency,
    status,
    payment_due_date,
    created_at
  ) VALUES (
    p_application_id,
    p_milestone,
    p_amount,
    'THB',
    'PENDING',
    COALESCE(p_due_date, NOW() + INTERVAL '7 days'),
    NOW()
  ) RETURNING id INTO payment_id;
  
  -- Create notification for payment due
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
    'payment_due',
    CASE p_milestone
      WHEN 'DOCUMENT_REVIEW' THEN 'ชำระค่าตรวจเอกสาร 5,000 บาท'
      WHEN 'ASSESSMENT' THEN 'ชำระค่าประเมิน 25,000 บาท'
      ELSE 'ชำระค่าธรรมเนียม'
    END,
    CASE p_milestone
      WHEN 'DOCUMENT_REVIEW' THEN 'กรุณาชำระค่าตรวจเอกสาร 5,000 บาท เพื่อดำเนินการตรวจสอบเอกสารของท่าน'
      WHEN 'ASSESSMENT' THEN 'กรุณาชำระค่าประเมิน 25,000 บาท เพื่อเริ่มกระบวนการประเมินออนไลน์และตรวจสอบในพื้นที่'
      ELSE 'กรุณาชำระค่าธรรมเนียมเพื่อดำเนินการต่อ'
    END,
    'high',
    '/applicant/payments',
    'ชำระเงิน',
    jsonb_build_object('payment_id', payment_id, 'amount', p_amount, 'milestone', p_milestone)
  );
  
  RETURN payment_id;
END;
$$;

-- 7. Workflow status update function
CREATE OR REPLACE FUNCTION public.update_workflow_status(
  p_application_id UUID,
  p_new_status application_workflow_status,
  p_updated_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status application_workflow_status;
  applicant_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  action_url TEXT;
  action_label TEXT;
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
  
  -- Determine notification content based on status change
  CASE p_new_status
    WHEN 'PAYMENT_PENDING_REVIEW' THEN
      notification_title := 'ชำระค่าตรวจเอกสาร';
      notification_message := 'กรุณาชำระค่าตรวจเอกสาร 5,000 บาท เพื่อเริ่มกระบวนการตรวจสอบ';
      action_url := '/applicant/payments';
      action_label := 'ชำระเงิน';
      
    WHEN 'UNDER_REVIEW' THEN
      notification_title := 'เอกสารอยู่ระหว่างการตรวจสอบ';
      notification_message := 'เอกสารของท่านอยู่ระหว่างการตรวจสอบโดยผู้ทบทวน คาดว่าจะแล้วเสร็จภายใน 3-5 วันทำการ';
      action_url := '/applicant/applications';
      action_label := 'ดูสถานะ';
      
    WHEN 'REVISION_REQUESTED' THEN
      notification_title := 'ต้องแก้ไขเอกสาร';
      notification_message := 'ผู้ทบทวนได้ส่งข้อเสนอแนะให้แก้ไขเอกสาร กรุณาตรวจสอบและแก้ไข';
      action_url := '/applicant/applications';
      action_label := 'แก้ไขเอกสาร';
      
    WHEN 'REVIEW_APPROVED' THEN
      notification_title := 'เอกสารได้รับการอนุมัติ';
      notification_message := 'เอกสารของท่านผ่านการตรวจสอบแล้ว กรุณาชำระค่าประเมิน 25,000 บาท';
      action_url := '/applicant/payments';
      action_label := 'ชำระค่าประเมิน';
      
    WHEN 'ONLINE_ASSESSMENT_SCHEDULED' THEN
      notification_title := 'กำหนดการประเมินออนไลน์';
      notification_message := 'การประเมินออนไลน์ของท่านได้รับการจัดตารางเวลาแล้ว';
      action_url := '/applicant/assessments';
      action_label := 'ดูรายละเอียด';
      
    WHEN 'CERTIFIED' THEN
      notification_title := 'ได้รับใบรับรอง GACP แล้ว!';
      notification_message := 'ยินดีด้วย! ท่านได้รับใบรับรอง GACP เรียบร้อยแล้ว';
      action_url := '/applicant/certificates';
      action_label := 'ดาวน์โหลดใบรับรอง';
      
    ELSE
      notification_title := 'สถานะใบสมัครเปลี่ยนแปลง';
      notification_message := 'สถานะใบสมัครของท่านได้รับการอัปเดต';
      action_url := '/applicant/dashboard';
      action_label := 'ดูรายละเอียด';
  END CASE;
  
  -- Create notification for applicant
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
    'status_change',
    notification_title,
    notification_message,
    CASE p_new_status
      WHEN 'CERTIFIED' THEN 'urgent'
      WHEN 'REVISION_REQUESTED' THEN 'high'
      WHEN 'PAYMENT_PENDING_REVIEW' THEN 'high'
      WHEN 'PAYMENT_PENDING_ASSESSMENT' THEN 'high'
      ELSE 'medium'
    END,
    action_url,
    action_label,
    jsonb_build_object(
      'old_status', old_status,
      'new_status', p_new_status,
      'updated_by', p_updated_by
    )
  );
  
  -- Log the workflow change
  PERFORM log_audit_event(
    p_updated_by,
    'workflow_status_change',
    'application',
    p_application_id,
    jsonb_build_object('old_status', old_status),
    jsonb_build_object('new_status', p_new_status),
    jsonb_build_object('notes', p_notes)
  );
  
  RETURN TRUE;
END;
$$;

-- 8. Payment confirmation trigger
CREATE OR REPLACE FUNCTION public.handle_payment_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workflow_status application_workflow_status;
BEGIN
  -- Only process when payment status changes to COMPLETED
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    
    -- Determine next workflow status based on milestone
    CASE NEW.milestone
      WHEN 'DOCUMENT_REVIEW' THEN
        new_workflow_status := 'PAYMENT_CONFIRMED_REVIEW';
        
        -- Update application payment reference
        UPDATE applications 
        SET 
          payment_review_id = NEW.id,
          workflow_status = new_workflow_status
        WHERE id = NEW.application_id;
        
      WHEN 'ASSESSMENT' THEN
        new_workflow_status := 'PAYMENT_CONFIRMED_ASSESSMENT';
        
        -- Update application payment reference
        UPDATE applications 
        SET 
          payment_assessment_id = NEW.id,
          workflow_status = new_workflow_status
        WHERE id = NEW.application_id;
    END CASE;
    
    -- Update workflow status with notification
    PERFORM update_workflow_status(
      NEW.application_id,
      new_workflow_status,
      NEW.application_id, -- System update
      'Payment confirmed for ' || NEW.milestone
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment confirmation
DROP TRIGGER IF EXISTS payment_confirmation_trigger ON public.payments;
CREATE TRIGGER payment_confirmation_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_confirmation();

-- 9. RLS policies for workflow notifications
CREATE POLICY "workflow_notifications_own_select"
ON public.workflow_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "workflow_notifications_admin_select"
ON public.workflow_notifications
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "workflow_notifications_own_update"
ON public.workflow_notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workflow_notifications_system_insert"
ON public.workflow_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_user_unread 
ON public.workflow_notifications(user_id, status) WHERE status = 'unread';

CREATE INDEX IF NOT EXISTS idx_workflow_notifications_scheduled
ON public.workflow_notifications(scheduled_for) WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_workflow_status
ON public.applications(workflow_status);

CREATE INDEX IF NOT EXISTS idx_payments_milestone_status
ON public.payments(milestone, status);

-- 11. Function to get user's workflow tasks
CREATE OR REPLACE FUNCTION public.get_user_workflow_tasks(target_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  user_role user_role;
  result JSONB;
BEGIN
  user_id := COALESCE(target_user_id, auth.uid());
  
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Build tasks based on role
  CASE user_role
    WHEN 'applicant' THEN
      SELECT jsonb_build_object(
        'applications', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'application_number', application_number,
              'workflow_status', workflow_status,
              'next_action', next_action_required,
              'created_at', created_at
            )
          )
          FROM applications 
          WHERE applicant_id = user_id 
          AND workflow_status NOT IN ('CERTIFIED', 'REJECTED', 'EXPIRED')
        ),
        'pending_payments', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'milestone', p.milestone,
              'amount', p.amount,
              'due_date', p.payment_due_date,
              'application_number', a.application_number
            )
          )
          FROM payments p
          JOIN applications a ON a.id = p.application_id
          WHERE a.applicant_id = user_id 
          AND p.status = 'PENDING'
        ),
        'unread_notifications', (
          SELECT COUNT(*)
          FROM workflow_notifications
          WHERE user_id = user_id AND status = 'unread'
        )
      ) INTO result;
      
    WHEN 'reviewer' THEN
      SELECT jsonb_build_object(
        'pending_reviews', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'application_number', application_number,
              'applicant_name', applicant_name,
              'workflow_status', workflow_status,
              'submitted_at', submitted_at
            )
          )
          FROM applications 
          WHERE workflow_status IN ('PAYMENT_CONFIRMED_REVIEW', 'REVISION_REQUESTED')
        ),
        'awaiting_payment', (
          SELECT COUNT(*)
          FROM applications
          WHERE workflow_status = 'PAYMENT_PENDING_REVIEW'
        )
      ) INTO result;
      
    WHEN 'auditor' THEN
      SELECT jsonb_build_object(
        'scheduled_assessments', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', a.id,
              'application_number', a.application_number,
              'applicant_name', a.applicant_name,
              'workflow_status', a.workflow_status,
              'assessment_type', CASE 
                WHEN a.workflow_status = 'ONLINE_ASSESSMENT_SCHEDULED' THEN 'online'
                WHEN a.workflow_status = 'ONSITE_ASSESSMENT_SCHEDULED' THEN 'onsite'
                ELSE 'unknown'
              END
            )
          )
          FROM applications a
          WHERE a.workflow_status IN (
            'ONLINE_ASSESSMENT_SCHEDULED', 
            'ONSITE_ASSESSMENT_SCHEDULED',
            'ONLINE_ASSESSMENT_IN_PROGRESS',
            'ONSITE_ASSESSMENT_IN_PROGRESS'
          )
        )
      ) INTO result;
      
    WHEN 'admin' THEN
      SELECT jsonb_build_object(
        'system_stats', (
          SELECT jsonb_build_object(
            'total_applications', (SELECT COUNT(*) FROM applications),
            'pending_payments', (SELECT COUNT(*) FROM payments WHERE status = 'PENDING'),
            'active_assessments', (
              SELECT COUNT(*) FROM applications 
              WHERE workflow_status LIKE '%ASSESSMENT%'
            ),
            'certificates_issued', (
              SELECT COUNT(*) FROM applications 
              WHERE workflow_status = 'CERTIFIED'
            )
          )
        )
      ) INTO result;
      
    ELSE
      result := '{}'::JSONB;
  END CASE;
  
  RETURN result;
END;
$$;