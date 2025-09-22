import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeetingRequest {
  assessment_id: string;
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

    const { assessment_id }: MeetingRequest = await req.json();

    console.log('Generating meeting link for assessment:', assessment_id);

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .select(`
        *,
        applications!inner(
          id,
          applicant_id,
          application_number,
          farm_name,
          applicant_name
        )
      `)
      .eq('id', assessment_id)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment not found:', assessmentError);
      return new Response(
        JSON.stringify({ error: 'Assessment not found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verify assessment is online type
    if (assessment.type !== 'ONLINE') {
      return new Response(
        JSON.stringify({ error: 'Meeting links are only for online assessments' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Generate meeting token if not exists
    let meetingToken = assessment.meeting_token;
    if (!meetingToken) {
      meetingToken = crypto.randomUUID();
    }

    // Generate meeting URL (in a real system, this would integrate with Zoom, Teams, etc.)
    const meetingUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/online-meeting?token=${meetingToken}&assessment=${assessment_id}`;
    
    // Update assessment with meeting details
    const { error: updateError } = await supabaseClient
      .from('assessments')
      .update({
        meeting_url: meetingUrl,
        meeting_token: meetingToken
      })
      .eq('id', assessment_id);

    if (updateError) {
      console.error('Error updating assessment with meeting details:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update meeting details' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Log meeting link generation
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: assessment.applications.applicant_id,
        action: 'generate_meeting_link',
        resource_type: 'assessment',
        resource_id: assessment_id,
        details: {
          assessment_id,
          application_number: assessment.applications.application_number,
          meeting_token: meetingToken
        },
        outcome: 'success'
      });

    console.log('Meeting link generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        meeting_url: meetingUrl,
        meeting_token: meetingToken,
        assessment: {
          id: assessment.id,
          scheduled_at: assessment.scheduled_at,
          application_number: assessment.applications.application_number,
          farm_name: assessment.applications.farm_name
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in generate-meeting-link function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);