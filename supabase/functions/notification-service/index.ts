import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  type: 'assessment_scheduled' | 'assessment_reminder' | 'document_approved' | 'payment_due' | 'certificate_issued';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  action_label?: string;
  related_id?: string;
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

    if (req.method === 'POST') {
      // Send notification
      const notificationData: NotificationRequest = await req.json();
      
      console.log('Sending notification:', notificationData);

      // Store notification in database (you'll need to create a notifications table)
      const { data: notification, error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority,
          action_url: notificationData.action_url,
          action_label: notificationData.action_label,
          related_id: notificationData.related_id,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        return new Response(
          JSON.stringify({ error: 'Failed to create notification' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      // In a real system, you would also send push notifications, emails, SMS, etc.
      // For now, we'll just store in database for the UI to display

      return new Response(
        JSON.stringify({ 
          success: true, 
          notification_id: notification.id,
          message: 'Notification sent successfully' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );

    } else if (req.method === 'GET') {
      // Get notifications for user
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const unreadOnly = url.searchParams.get('unread_only') === 'true';

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      let query = supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data: notifications, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching notifications:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch notifications' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      return new Response(
        JSON.stringify({ notifications }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in notification-service function:', error);
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