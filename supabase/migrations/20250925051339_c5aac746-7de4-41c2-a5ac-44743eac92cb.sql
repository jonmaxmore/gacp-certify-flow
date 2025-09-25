-- Check the auto_issue_certificate trigger exists and fix certificate generation
-- First, let's see if there's an issue with the trigger
UPDATE applications 
SET status = 'CERTIFIED', 
    workflow_status = 'CERTIFIED',
    updated_at = NOW()
WHERE id = '53a086e8-f48f-46d7-b0c8-a75def0427a9' 
  AND status = 'CERTIFIED';