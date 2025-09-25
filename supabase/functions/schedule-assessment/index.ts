import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRequest {
  application_id: string;
  assessment_type: 'ONLINE' | 'ONSITE';
  preferred_date: string;
  preferred_time: string;
  scheduled_at: string;
  notes?: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      application_id, 
      assessment_type, 
      scheduled_at, 
      notes,
      user_id 
    }: ScheduleRequest = await req.json();

    console.log('Received schedule request:', { application_id, assessment_type, scheduled_at, user_id });

    // Verify that the application belongs to the requesting user
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('id, applicant_id, application_number, status')
      .eq('id', application_id)
      .eq('applicant_id', user_id)
      .single();

    if (appError || !application) {
      console.error('Application verification failed:', appError);
      return new Response(
        JSON.stringify({ error: 'Application not found or access denied' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Check if application is eligible for scheduling
    const eligibleStatuses = ['DOCS_APPROVED', 'PAYMENT_PENDING', 'ONLINE_SCHEDULED', 'ONSITE_SCHEDULED'];
    if (!eligibleStatuses.includes(application.status)) {
      return new Response(
        JSON.stringify({ error: 'Application is not eligible for scheduling' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Check if there's already a scheduled assessment for this application
    const { data: existingAssessment, error: existingError } = await supabaseClient
      .from('assessments')
      .select('id, status')
      .eq('application_id', application_id)
      .in('status', ['SCHEDULED', 'IN_PROGRESS'])
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing assessments:', existingError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    let assessmentId: string;

    if (existingAssessment) {
      // Update existing assessment
      const { error: updateError } = await supabaseClient
        .from('assessments')
        .update({
          type: assessment_type,
          scheduled_at,
          notes,
          status: 'SCHEDULED'
        })
        .eq('id', existingAssessment.id);

      if (updateError) {
        console.error('Error updating assessment:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update assessment' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      assessmentId = existingAssessment.id;
      console.log('Updated existing assessment:', assessmentId);
    } else {
      // Create new assessment
      const { data: newAssessment, error: createError } = await supabaseClient
        .from('assessments')
        .insert({
          application_id,
          type: assessment_type,
          scheduled_at,
          notes,
          status: 'SCHEDULED'
        })
        .select('id')
        .single();

      if (createError || !newAssessment) {
        console.error('Error creating assessment:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create assessment' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      assessmentId = newAssessment.id;
      console.log('Created new assessment:', assessmentId);
    }

    // Update application status
    const newStatus = assessment_type === 'ONLINE' ? 'ONLINE_ASSESSMENT_SCHEDULED' : 'ONSITE_ASSESSMENT_SCHEDULED';
    const { error: statusError } = await supabaseClient
      .from('applications')
      .update({ 
        workflow_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', application_id);

    if (statusError) {
      console.error('Error updating application status:', statusError);
      // Don't fail the request if status update fails, just log it
    }

    // Log the scheduling request for audit
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id,
        action: 'schedule_assessment_request',
        resource_type: 'assessment',
        resource_id: assessmentId,
        details: {
          application_id,
          assessment_type,
          scheduled_at,
          notes,
          application_number: application.application_number
        },
        outcome: 'success'
      });

    console.log('Schedule request processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        assessment_id: assessmentId,
        message: 'Assessment scheduled successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in schedule-assessment function:', error);
    
    // Return more specific error message
    const errorMessage = (error as Error)?.message || 'เกิดข้อผิดพลาดไม่สามารถประเมินได้';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: (error as Error)?.message || 'Unknown error'
      }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);