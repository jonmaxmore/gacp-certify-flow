-- Fix the function overloading issue for get_user_workflow_tasks
DROP FUNCTION IF EXISTS public.get_user_workflow_tasks(uuid);

-- Keep only the parameterless version
CREATE OR REPLACE FUNCTION public.get_user_workflow_tasks()
RETURNS TABLE(pending_applications bigint, pending_payments bigint, unread_notifications bigint, next_assessments bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM applications a WHERE a.applicant_id = auth.uid() AND a.workflow_status NOT IN ('CERTIFIED', 'REJECTED', 'EXPIRED'))::bigint as pending_applications,
    (SELECT COUNT(*) FROM payments p JOIN applications a ON p.application_id = a.id WHERE a.applicant_id = auth.uid() AND p.status = 'PENDING')::bigint as pending_payments,
    (SELECT COUNT(*) FROM notifications n WHERE n.user_id = auth.uid() AND n.read_at IS NULL)::bigint as unread_notifications,
    (SELECT COUNT(*) FROM assessments ass JOIN applications a ON ass.application_id = a.id WHERE a.applicant_id = auth.uid() AND ass.status = 'SCHEDULED' AND ass.scheduled_at >= NOW())::bigint as next_assessments;
END;
$$;