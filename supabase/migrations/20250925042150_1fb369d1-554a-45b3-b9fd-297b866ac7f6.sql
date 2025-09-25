-- Fix the get_user_workflow_tasks function to resolve ambiguous user_id column reference
CREATE OR REPLACE FUNCTION get_user_workflow_tasks()
RETURNS TABLE (
  pending_applications bigint,
  pending_payments bigint,
  unread_notifications bigint,
  next_assessments bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM applications a WHERE a.applicant_id = auth.uid() AND a.workflow_status NOT IN ('CERTIFIED', 'REJECTED', 'EXPIRED'))::bigint as pending_applications,
    (SELECT COUNT(*) FROM payments p JOIN applications a ON p.application_id = a.id WHERE a.applicant_id = auth.uid() AND p.status = 'PENDING')::bigint as pending_payments,
    (SELECT COUNT(*) FROM notifications n WHERE n.user_id = auth.uid() AND n.read_at IS NULL)::bigint as unread_notifications,
    (SELECT COUNT(*) FROM assessments ass JOIN applications a ON ass.application_id = a.id WHERE a.applicant_id = auth.uid() AND ass.status = 'SCHEDULED' AND ass.scheduled_date >= NOW())::bigint as next_assessments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;