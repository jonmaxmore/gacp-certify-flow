import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplicationData {
  id: string;
  application_number: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_address: string;
  organization_name?: string;
  farm_name: string;
  farm_address: string;
  farm_area_rai: number;
  farm_area_ngan: number;
  farm_area_wah: number;
  crop_types: string[];
  cultivation_methods: string[];
  expected_yield?: string;
  responsible_person?: string;
  workflow_status: string;
  revision_count_current: number;
  max_free_revisions: number;
  reviewer_comments?: string;
  created_at: string;
  submitted_at?: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    organization_name: string;
    email: string;
    phone: string;
  };
  documents?: Array<{
    id: string;
    file_name: string;
    document_type: string;
    s3_url?: string;
    mime_type?: string;
    file_size?: number;
    verified: boolean;
    reviewer_notes?: string;
    uploaded_at: string;
  }>;
  payments?: Array<{
    milestone: number;
    amount: number;
    status: string;
  }>;
}

const getDocumentTypeLabel = (documentType: string): string => {
  const typeMap: { [key: string]: string } = {
    'identity_card': 'บัตรประชาชน',
    'farm_certificate': 'ใบรับรองแปลง',
    'water_certificate': 'ใบรับรองน้ำ',
    'soil_certificate': 'ใบรับรองดิน',
    'production_plan': 'แผนการผลิต',
    'farm_map': 'แผนที่แปลง',
    'other': 'เอกสารอื่นๆ'
  };
  return typeMap[documentType] || documentType;
};

const getWorkflowStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    SUBMITTED: 'ส่งแล้ว',
    UNDER_REVIEW: 'กำลังตรวจสอบ',
    PAYMENT_CONFIRMED_REVIEW: 'ชำระเงินแล้ว',
    REVIEW_APPROVED: 'อนุมัติเอกสาร',
    REVISION_REQUESTED: 'ต้องแก้ไข',
    REJECTED_PAYMENT_REQUIRED: 'ต้องชำระเพื่อแก้ไข',
    REJECTED: 'ปฏิเสธ'
  };
  return statusMap[status] || status;
};

const generateApplicationPDF = async (applicationData: ApplicationData): Promise<string> => {
  // Simple HTML to PDF using browser print
  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รายงานใบสมัครรับรอง GACP - ${applicationData.application_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          line-height: 1.6;
          color: #333;
          font-size: 14px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #1e40af;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .header .subtitle {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .header .meta {
          font-size: 12px;
          color: #6b7280;
        }
        
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: #f8fafc;
          padding: 12px 16px;
          border-left: 4px solid #2563eb;
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #111827;
          font-size: 14px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-approved { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-revision { background: #fff7ed; color: #c2410c; }
        
        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        
        .document-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          page-break-inside: avoid;
        }
        
        .document-header {
          background: #f3f4f6;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .document-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .document-meta {
          font-size: 12px;
          color: #6b7280;
        }
        
        .document-content {
          padding: 15px;
        }
        
        .document-image {
          width: 100%;
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .document-placeholder {
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          margin-bottom: 10px;
        }
        
        .workflow-timeline {
          margin: 20px 0;
        }
        
        .timeline-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .timeline-date {
          font-weight: 600;
          color: #1f2937;
          min-width: 120px;
        }
        
        .timeline-action {
          color: #6b7280;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .signature-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        
        .signature-line {
          border-bottom: 1px solid #374151;
          margin: 30px 0 10px;
          height: 50px;
        }
        
        @media print {
          body { margin: 0; font-size: 12px; }
          .section { page-break-inside: avoid; }
          .document-item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>รายงานใบสมัครรับรอง GACP</h1>
        <div class="subtitle">ระบบรับรองการปฏิบัติทางการเกษตรที่ดี</div>
        <div class="meta">
          หมายเลขใบสมัคร: <strong>${applicationData.application_number}</strong><br>
          สร้างรายงานเมื่อ: ${new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <!-- สถานะใบสมัคร -->
      <div class="section">
        <div class="section-title">สถานะใบสมัคร</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">สถานะปัจจุบัน</div>
            <div class="info-value">
              <span class="status-badge ${
                applicationData.workflow_status === 'REVIEW_APPROVED' ? 'status-approved' :
                applicationData.workflow_status?.includes('REJECTED') ? 'status-rejected' : 
                applicationData.workflow_status?.includes('REVISION') ? 'status-revision' : 'status-pending'
              }">${getWorkflowStatusText(applicationData.workflow_status)}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">จำนวนครั้งที่แก้ไข</div>
            <div class="info-value">${applicationData.revision_count_current || 0} ครั้ง</div>
          </div>
          <div class="info-item">
            <div class="info-label">การแก้ไขฟรีคงเหลือ</div>
            <div class="info-value">${Math.max(0, (applicationData.max_free_revisions || 2) - (applicationData.revision_count_current || 0))} ครั้ง</div>
          </div>
          <div class="info-item">
            <div class="info-label">สถานะการชำระเงิน</div>
            <div class="info-value">
              <span class="status-badge ${applicationData.payments?.find(p => p.milestone === 1)?.status === 'COMPLETED' ? 'status-approved' : 'status-pending'}">
                ${applicationData.payments?.find(p => p.milestone === 1)?.status === 'COMPLETED' ? 'ชำระแล้ว' : 'รอชำระ'}
                (${applicationData.payments?.find(p => p.milestone === 1)?.amount?.toLocaleString() || '5,000'} บาท)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ข้อมูลผู้สมัคร -->
      <div class="section">
        <div class="section-title">ข้อมูลผู้สมัคร</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">ชื่อผู้สมัคร</div>
            <div class="info-value">${applicationData.profiles?.full_name || applicationData.applicant_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">องค์กร</div>
            <div class="info-value">${applicationData.profiles?.organization_name || applicationData.organization_name || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">อีเมล</div>
            <div class="info-value">${applicationData.profiles?.email || applicationData.applicant_email}</div>
          </div>
          <div class="info-item">
            <div class="info-label">เบอร์โทรศัพท์</div>
            <div class="info-value">${applicationData.profiles?.phone || applicationData.applicant_phone}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">ที่อยู่</div>
            <div class="info-value">${applicationData.applicant_address}</div>
          </div>
        </div>
      </div>

      <!-- ข้อมูลฟาร์ม -->
      <div class="section">
        <div class="section-title">ข้อมูลแปลงเพาะปลูก</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">ชื่อฟาร์ม</div>
            <div class="info-value">${applicationData.farm_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">พื้นที่เพาะปลูก</div>
            <div class="info-value">${applicationData.farm_area_rai}-${applicationData.farm_area_ngan}-${applicationData.farm_area_wah} ไร่-งาน-วา</div>
          </div>
          <div class="info-item">
            <div class="info-label">ประเภทพืชที่เพาะปลูก</div>
            <div class="info-value">${applicationData.crop_types?.join(', ') || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">วิธีการเพาะปลูก</div>
            <div class="info-value">${applicationData.cultivation_methods?.join(', ') || '-'}</div>
          </div>
          ${applicationData.expected_yield ? `
          <div class="info-item">
            <div class="info-label">ผลผลิตที่คาดหวัง</div>
            <div class="info-value">${applicationData.expected_yield}</div>
          </div>
          ` : ''}
          ${applicationData.responsible_person ? `
          <div class="info-item">
            <div class="info-label">ผู้รับผิดชอบ</div>
            <div class="info-value">${applicationData.responsible_person}</div>
          </div>
          ` : ''}
          <div class="info-item full-width">
            <div class="info-label">ที่อยู่แปลงเพาะปลูก</div>
            <div class="info-value">${applicationData.farm_address}</div>
          </div>
        </div>
      </div>

      <!-- ประวัติการดำเนินการ -->
      <div class="section">
        <div class="section-title">ประวัติการดำเนินการ</div>
        <div class="workflow-timeline">
          <div class="timeline-item">
            <div class="timeline-date">${new Date(applicationData.created_at).toLocaleDateString('th-TH')}</div>
            <div class="timeline-action">สร้างใบสมัคร</div>
          </div>
          ${applicationData.submitted_at ? `
          <div class="timeline-item">
            <div class="timeline-date">${new Date(applicationData.submitted_at).toLocaleDateString('th-TH')}</div>
            <div class="timeline-action">ส่งใบสมัคร</div>
          </div>
          ` : ''}
          <div class="timeline-item">
            <div class="timeline-date">${new Date(applicationData.updated_at).toLocaleDateString('th-TH')}</div>
            <div class="timeline-action">อัพเดทล่าสุด</div>
          </div>
        </div>
      </div>

      ${applicationData.reviewer_comments ? `
      <!-- ความเห็นผู้ตรวจสอบ -->
      <div class="section">
        <div class="section-title">ความเห็นผู้ตรวจสอบ</div>
        <div class="info-item full-width">
          <div class="info-value">${applicationData.reviewer_comments}</div>
        </div>
      </div>
      ` : ''}

      <!-- เอกสารประกอบ -->
      <div class="section page-break">
        <div class="section-title">เอกสารประกอบ</div>
        <div style="margin-bottom: 15px;">
          <strong>จำนวนเอกสาร:</strong> ${applicationData.documents?.length || 0} ไฟล์<br>
          <strong>เอกสารที่ตรวจสอบแล้ว:</strong> ${applicationData.documents?.filter(d => d.verified).length || 0} ไฟล์
        </div>
        
        ${applicationData.documents && applicationData.documents.length > 0 ? `
        <div class="document-grid">
          ${applicationData.documents.map((doc, index) => `
          <div class="document-item">
            <div class="document-header">
              <div class="document-title">${index + 1}. ${getDocumentTypeLabel(doc.document_type)}</div>
              <div class="document-meta">
                ${doc.file_name}<br>
                ขนาด: ${doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'ไม่ทราบ'} | 
                อัพโหลด: ${new Date(doc.uploaded_at).toLocaleDateString('th-TH')}<br>
                สถานะ: <span class="status-badge ${doc.verified ? 'status-approved' : 'status-pending'}">
                  ${doc.verified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                </span>
              </div>
            </div>
            <div class="document-content">
              ${doc.mime_type?.startsWith('image/') && doc.s3_url ? 
                `<img src="${doc.s3_url}" alt="${doc.file_name}" class="document-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                 <div class="document-placeholder" style="display: none;">
                   <div>ไม่สามารถแสดงรูปภาพได้</div>
                   <div style="font-size: 12px; margin-top: 8px;">${doc.file_name}</div>
                 </div>` : 
                `<div class="document-placeholder">
                   <div>📄 เอกสาร</div>
                   <div style="font-size: 12px; margin-top: 8px;">${doc.file_name}</div>
                   <div style="font-size: 10px; color: #9ca3af;">${doc.mime_type || 'ไม่ทราบประเภทไฟล์'}</div>
                 </div>`
              }
              ${doc.reviewer_notes ? `
              <div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin-top: 10px; font-size: 12px;">
                <strong>หมายเหตุ:</strong> ${doc.reviewer_notes}
              </div>
              ` : ''}
            </div>
          </div>
          `).join('')}
        </div>
        ` : `
        <div class="info-item">
          <div class="info-value">ไม่มีเอกสารประกอบ</div>
        </div>
        `}
      </div>

      <!-- ลายเซ็นและตรายาง -->
      <div class="signature-section">
        <div class="section-title">ลายเซ็นและการรับรอง</div>
        <div class="signature-grid">
          <div class="signature-box">
            <div style="font-weight: 600; margin-bottom: 20px;">ผู้สมัคร</div>
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">
              (${applicationData.profiles?.full_name || applicationData.applicant_name})<br>
              วันที่: ____________________
            </div>
          </div>
          <div class="signature-box">
            <div style="font-weight: 600; margin-bottom: 20px;">เจ้าหน้าที่ตรวจสอบ</div>
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">
              (____________________)<br>
              วันที่: ____________________
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Application ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching application data for ID:', applicationId);

    // Fetch application with all related data
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:applicant_id(full_name, organization_name, email, phone),
        documents(*),
        payments(milestone, amount, status)
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch application data' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Generating HTML for application:', application.application_number);

    // Generate HTML content
    const htmlContent = await generateApplicationPDF(application as ApplicationData);

    console.log('HTML generated successfully');

    // Return HTML content for client-side PDF generation
    return new Response(JSON.stringify({ html: htmlContent }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});