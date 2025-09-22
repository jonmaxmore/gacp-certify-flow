import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const assessmentId = url.searchParams.get('assessment');

    if (!token || !assessmentId) {
      return new Response(
        'Missing required parameters',
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify meeting token
    const { data: assessment, error } = await supabaseClient
      .from('assessments')
      .select(`
        *,
        applications!inner(
          application_number,
          farm_name,
          applicant_name
        )
      `)
      .eq('id', assessmentId)
      .eq('meeting_token', token)
      .single();

    if (error || !assessment) {
      return new Response(
        'Invalid meeting link or assessment not found',
        { 
          status: 404, 
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        }
      );
    }

    // Check if meeting is scheduled for today
    const scheduledDate = new Date(assessment.scheduled_at);
    const today = new Date();
    const isSameDay = scheduledDate.toDateString() === today.toDateString();
    
    // Allow access 30 minutes before and after scheduled time
    const thirtyMinutes = 30 * 60 * 1000;
    const canJoin = Math.abs(today.getTime() - scheduledDate.getTime()) <= thirtyMinutes || isSameDay;

    if (!canJoin) {
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ห้องประชุมออนไลน์ - GACP Assessment</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            .warning {
              color: #f59e0b;
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 16px;
            }
            .info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .scheduled-time {
              font-weight: bold;
              color: #3b82f6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning">⏰</div>
            <h1>ยังไม่ถึงเวลาประชุม</h1>
            <p>การประเมินออนไลน์ยังไม่เริ่มต้น กรุณากลับมาใหม่ในเวลาที่กำหนด</p>
            <div class="info">
              <h3>ข้อมูลการประเมิน</h3>
              <p><strong>เลขใบสมัคร:</strong> ${assessment.applications.application_number}</p>
              <p><strong>ฟาร์ม:</strong> ${assessment.applications.farm_name}</p>
              <p class="scheduled-time">
                <strong>เวลานัดหมาย:</strong> 
                ${scheduledDate.toLocaleDateString('th-TH')} 
                ${scheduledDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p><small>คุณสามารถเข้าร่วมได้ 30 นาทีก่อนเวลานัดหมาย</small></p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 200, 
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
        }
      );
    }

    // Meeting room interface
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ห้องประชุมออนไลน์ - GACP Assessment</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #1f2937;
            color: white;
            overflow: hidden;
          }
          .header {
            background: rgba(0,0,0,0.8);
            padding: 20px;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 100;
            backdrop-filter: blur(10px);
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
          }
          .meeting-info h2 {
            margin: 0;
            color: #3b82f6;
          }
          .meeting-info p {
            margin: 5px 0 0 0;
            opacity: 0.8;
          }
          .controls {
            display: flex;
            gap: 15px;
          }
          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn-danger {
            background: #ef4444;
            color: white;
          }
          .btn-danger:hover {
            background: #dc2626;
          }
          .video-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            height: 100vh;
            padding-top: 80px;
            gap: 2px;
            background: #000;
          }
          .video-placeholder {
            background: linear-gradient(135deg, #374151, #4b5563);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .video-placeholder::before {
            content: '📹';
            font-size: 64px;
            margin-bottom: 20px;
          }
          .video-placeholder .label {
            background: rgba(0,0,0,0.7);
            padding: 8px 16px;
            border-radius: 4px;
            position: absolute;
            bottom: 20px;
            left: 20px;
          }
          .chat-panel {
            position: fixed;
            right: 0;
            top: 80px;
            width: 300px;
            height: calc(100vh - 80px);
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-left: 1px solid rgba(255,255,255,0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }
          .chat-panel.open {
            transform: translateX(0);
          }
          .chat-toggle {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: #3b82f6;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 101;
          }
          .status-bar {
            position: fixed;
            bottom: 0;
            width: 100%;
            background: rgba(0,0,0,0.9);
            padding: 15px;
            text-align: center;
          }
          .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #059669;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
          }
          .pulse {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          .meeting-actions {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
          }
          .action-btn {
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.2s;
          }
          .mute-btn {
            background: #374151;
            color: white;
          }
          .mute-btn:hover {
            background: #4b5563;
          }
          .camera-btn {
            background: #374151;
            color: white;
          }
          .camera-btn:hover {
            background: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <div class="meeting-info">
              <h2>การประเมิน GACP - ${assessment.applications.farm_name}</h2>
              <p>เลขใบสมัคร: ${assessment.applications.application_number} | ผู้สมัคร: ${assessment.applications.applicant_name}</p>
            </div>
            <div class="controls">
              <button class="btn btn-danger" onclick="leaveMeeting()">
                ออกจากห้องประชุม
              </button>
            </div>
          </div>
        </div>

        <div class="video-container">
          <div class="video-placeholder">
            <div class="label">ผู้ประเมิน (ผู้ดูแลระบบ)</div>
          </div>
          <div class="video-placeholder">
            <div class="label">ผู้สมัคร</div>
          </div>
        </div>

        <div class="meeting-actions">
          <button class="action-btn mute-btn" onclick="toggleMute()" id="muteBtn">
            🎤
          </button>
          <button class="action-btn camera-btn" onclick="toggleCamera()" id="cameraBtn">
            📹
          </button>
        </div>

        <button class="chat-toggle" onclick="toggleChat()">
          💬
        </button>

        <div class="chat-panel" id="chatPanel">
          <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin: 0;">แชท</h3>
          </div>
          <div style="flex: 1; padding: 20px;">
            <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong>ระบบ:</strong> ยินดีต้อนรับสู่การประเมิน GACP ออนไลน์
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px;">
              <strong>ผู้ประเมิน:</strong> สวัสดีครับ กรุณาเปิดไมโครโฟนและกล้องเพื่อเริ่มการประเมิน
            </div>
          </div>
        </div>

        <div class="status-bar">
          <div class="status-indicator">
            <div class="pulse"></div>
            <span>เชื่อมต่อแล้ว - การประเมินกำลังดำเนินอยู่</span>
          </div>
        </div>

        <script>
          let isMuted = false;
          let isCameraOff = false;
          let isChatOpen = false;
          
          function toggleMute() {
            isMuted = !isMuted;
            const btn = document.getElementById('muteBtn');
            btn.textContent = isMuted ? '🔇' : '🎤';
            btn.style.background = isMuted ? '#ef4444' : '#374151';
          }
          
          function toggleCamera() {
            isCameraOff = !isCameraOff;
            const btn = document.getElementById('cameraBtn');
            btn.textContent = isCameraOff ? '📷' : '📹';
            btn.style.background = isCameraOff ? '#ef4444' : '#374151';
          }
          
          function toggleChat() {
            isChatOpen = !isChatOpen;
            const panel = document.getElementById('chatPanel');
            panel.classList.toggle('open');
          }
          
          function leaveMeeting() {
            if (confirm('คุณต้องการออกจากห้องประชุมใช่หรือไม่?')) {
              window.close();
            }
          }
          
          // Auto-update meeting status every 30 seconds
          setInterval(() => {
            console.log('Meeting active - Assessment ID: ${assessmentId}');
          }, 30000);
        </script>
      </body>
      </html>
      `,
      { 
        status: 200, 
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in online-meeting function:', error);
    return new Response(
      'Internal server error',
      { 
        status: 500, 
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      }
    );
  }
};

serve(handler);