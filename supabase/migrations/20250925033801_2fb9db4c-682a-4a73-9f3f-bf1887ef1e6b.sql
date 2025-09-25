-- Fix RLS policy for assessments to allow reviewers to create assessments
DROP POLICY IF EXISTS "Authenticated auditors can manage assessments" ON public.assessments;

-- Create more specific policies for assessments
CREATE POLICY "Authenticated auditors can view all assessments" 
ON public.assessments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('auditor', 'admin')
  )
);

CREATE POLICY "Authenticated auditors can create assessments" 
ON public.assessments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('auditor', 'admin', 'reviewer')
  )
);

CREATE POLICY "Authenticated auditors can update assessments" 
ON public.assessments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('auditor', 'admin')
  ) OR auditor_id = auth.uid()
);

CREATE POLICY "Authenticated auditors can delete assessments" 
ON public.assessments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin')
  )
);

-- Update the status badge function to handle new statuses
CREATE OR REPLACE FUNCTION public.get_status_display_text(status_value text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE status_value
    WHEN 'DRAFT' THEN
      RETURN jsonb_build_object('label', 'แบบร่าง', 'variant', 'secondary', 'color', 'gray');
    WHEN 'SUBMITTED' THEN
      RETURN jsonb_build_object('label', 'ส่งแล้ว', 'variant', 'default', 'color', 'blue');
    WHEN 'PAYMENT_PENDING_REVIEW' THEN
      RETURN jsonb_build_object('label', 'รอชำระค่าตรวจเอกสาร', 'variant', 'destructive', 'color', 'red');
    WHEN 'PAYMENT_CONFIRMED_REVIEW' THEN
      RETURN jsonb_build_object('label', 'ชำระค่าตรวจเอกสารแล้ว', 'variant', 'default', 'color', 'green');
    WHEN 'UNDER_REVIEW' THEN
      RETURN jsonb_build_object('label', 'กำลังตรวจสอบ', 'variant', 'default', 'color', 'blue');
    WHEN 'REVISION_REQUESTED' THEN
      RETURN jsonb_build_object('label', 'ต้องแก้ไขเอกสาร', 'variant', 'destructive', 'color', 'orange');
    WHEN 'REJECTED_PAYMENT_REQUIRED' THEN
      RETURN jsonb_build_object('label', 'ต้องชำระเงินเพื่อแก้ไข', 'variant', 'destructive', 'color', 'red');
    WHEN 'REVIEW_APPROVED' THEN
      RETURN jsonb_build_object('label', 'เอกสารผ่านการตรวจสอบ', 'variant', 'default', 'color', 'green');
    WHEN 'PAYMENT_PENDING_ASSESSMENT' THEN
      RETURN jsonb_build_object('label', 'รอชำระค่าประเมิน', 'variant', 'destructive', 'color', 'red');
    WHEN 'PAYMENT_CONFIRMED_ASSESSMENT' THEN
      RETURN jsonb_build_object('label', 'ชำระค่าประเมินแล้ว', 'variant', 'default', 'color', 'green');
    WHEN 'ONLINE_ASSESSMENT_SCHEDULED' THEN
      RETURN jsonb_build_object('label', 'นัดประเมินออนไลน์', 'variant', 'default', 'color', 'blue');
    WHEN 'ONLINE_ASSESSMENT_IN_PROGRESS' THEN
      RETURN jsonb_build_object('label', 'กำลังประเมินออนไลน์', 'variant', 'default', 'color', 'yellow');
    WHEN 'ONLINE_ASSESSMENT_COMPLETED' THEN
      RETURN jsonb_build_object('label', 'ประเมินออนไลน์เสร็จสิ้น', 'variant', 'default', 'color', 'green');
    WHEN 'ONSITE_ASSESSMENT_SCHEDULED' THEN
      RETURN jsonb_build_object('label', 'นัดประเมินในพื้นที่', 'variant', 'default', 'color', 'blue');
    WHEN 'ONSITE_ASSESSMENT_IN_PROGRESS' THEN
      RETURN jsonb_build_object('label', 'กำลังประเมินในพื้นที่', 'variant', 'default', 'color', 'yellow');
    WHEN 'ONSITE_ASSESSMENT_COMPLETED' THEN
      RETURN jsonb_build_object('label', 'ประเมินในพื้นที่เสร็จสิ้น', 'variant', 'default', 'color', 'green');
    WHEN 'CERTIFIED' THEN
      RETURN jsonb_build_object('label', 'ได้รับใบรับรอง', 'variant', 'default', 'color', 'green');
    WHEN 'REJECTED' THEN
      RETURN jsonb_build_object('label', 'ถูกปฏิเสธ', 'variant', 'destructive', 'color', 'red');
    WHEN 'EXPIRED' THEN
      RETURN jsonb_build_object('label', 'หมดอายุ', 'variant', 'secondary', 'color', 'gray');
    WHEN 'REVOKED' THEN
      RETURN jsonb_build_object('label', 'ถูกเพิกถอน', 'variant', 'destructive', 'color', 'red');
    ELSE
      RETURN jsonb_build_object('label', status_value, 'variant', 'secondary', 'color', 'gray');
  END CASE;
END;
$$;