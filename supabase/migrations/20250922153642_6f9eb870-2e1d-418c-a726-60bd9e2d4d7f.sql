-- Fix the admin stats function to use correct enum values
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_applications', (SELECT COUNT(*) FROM applications),
        'pending_applications', (SELECT COUNT(*) FROM applications WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')),
        'approved_applications', (SELECT COUNT(*) FROM applications WHERE status = 'CERTIFIED'),
        'total_users', (SELECT COUNT(*) FROM profiles),
        'monthly_applications', (
            SELECT COUNT(*) FROM applications 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'monthly_users', (
            SELECT COUNT(*) FROM profiles 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'approval_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM applications WHERE status IN ('CERTIFIED', 'REVOKED')) > 0
                THEN ROUND(
                    (SELECT COUNT(*) FROM applications WHERE status = 'CERTIFIED') * 100.0 / 
                    (SELECT COUNT(*) FROM applications WHERE status IN ('CERTIFIED', 'REVOKED'))
                )
                ELSE 0
            END
        ),
        'avg_review_time', (
            SELECT COALESCE(AVG(EXTRACT(days FROM updated_at - created_at)), 0)
            FROM applications 
            WHERE status IN ('CERTIFIED', 'REVOKED')
        ),
        'active_users', (
            SELECT COUNT(DISTINCT applicant_id) FROM applications 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'usage_rate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM profiles) > 0
                THEN ROUND(
                    (SELECT COUNT(DISTINCT applicant_id) FROM applications WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') * 100.0 / 
                    (SELECT COUNT(*) FROM profiles)
                )
                ELSE 0
            END
        )
    ) INTO result;
    
    RETURN result;
END;
$function$;