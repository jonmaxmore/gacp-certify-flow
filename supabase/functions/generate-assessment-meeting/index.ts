import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MeetingRequest {
  applicationId: string;
  assessmentType: 'online' | 'onsite';
  scheduledDate: string;
  auditorId?: string;
}

interface MeetingResponse {
  meetingUrl?: string;
  meetingId: string;
  passcode?: string;
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { applicationId, assessmentType, scheduledDate, auditorId }: MeetingRequest = await req.json()

    if (!applicationId || !assessmentType || !scheduledDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      throw new Error('Application not found')
    }

    let meetingResponse: MeetingResponse

    if (assessmentType === 'online') {
      // Generate online meeting URL (Google Meet style)
      const meetingId = `gacp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const passcode = Math.random().toString(36).substr(2, 8).toUpperCase()
      
      meetingResponse = {
        meetingUrl: `https://meet.google.com/${meetingId}`,
        meetingId,
        passcode
      }

      // In a real implementation, you would integrate with Google Meet, Zoom, or Teams API
      
    } else {
      // For onsite assessment, generate location details
      meetingResponse = {
        meetingId: `onsite-${Date.now()}`,
        location: application.farm_address || 'ที่อยู่ฟาร์มตามใบสมัคร'
      }
    }

    // Create or update assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .upsert({
        application_id: applicationId,
        type: assessmentType,
        status: 'SCHEDULED',
        scheduled_at: scheduledDate,
        auditor_id: auditorId,
        meeting_url: meetingResponse.meetingUrl,
        meeting_token: meetingResponse.passcode,
        onsite_address: meetingResponse.location
      })
      .select()
      .single()

    if (assessmentError) {
      throw new Error(`Failed to create assessment: ${assessmentError.message}`)
    }

    // Create notification for applicant
    const notificationTitle = assessmentType === 'online' 
      ? 'การประเมินออนไลน์ได้รับการจัดตาราง'
      : 'การประเมินในพื้นที่ได้รับการจัดตาราง'

    const notificationMessage = assessmentType === 'online'
      ? `การประเมินออนไลน์ได้รับการจัดตารางแล้ว วันที่ ${new Date(scheduledDate).toLocaleDateString('th-TH')} เวลา ${new Date(scheduledDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
      : `การประเมินในพื้นที่ได้รับการจัดตารางแล้ว วันที่ ${new Date(scheduledDate).toLocaleDateString('th-TH')} เวลา ${new Date(scheduledDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`

    // Background task to create notification
    const notificationPromise = supabase
      .from('notifications')
      .insert({
        user_id: application.applicant_id,
        type: 'assessment_scheduled',
        title: notificationTitle,
        message: notificationMessage,
        priority: 'high',
        action_url: '/applicant/schedule',
        action_label: assessmentType === 'online' ? 'เข้าร่วมการประเมิน' : 'ดูรายละเอียด',
        related_id: assessment.id
      })

    // Update application workflow status
    const newWorkflowStatus = assessmentType === 'online' 
      ? 'ONLINE_ASSESSMENT_SCHEDULED' 
      : 'ONSITE_ASSESSMENT_SCHEDULED'

    const statusUpdatePromise = supabase
      .from('applications')
      .update({ workflow_status: newWorkflowStatus })
      .eq('id', applicationId)

    // Execute background tasks
    Promise.all([notificationPromise, statusUpdatePromise]).catch(error => {
      console.error('Background task errors:', error)
    })

    return new Response(
      JSON.stringify({
        success: true,
        assessment,
        meeting: meetingResponse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error generating meeting:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Failed to generate meeting' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

serve(handler)