import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertificateData {
  certificate_number: string
  applicant_name: string
  organization_name?: string
  farm_name?: string
  farm_address?: string
  crop_types?: string[]
  issued_at: string
  valid_from: string
  expires_at: string
  verification_code?: string
  verification_url?: string
  qr_code_data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { certificate_id } = await req.json()

    if (!certificate_id) {
      return new Response(
        JSON.stringify({ error: 'Certificate ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get certificate data
    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('id', certificate_id)
      .single()

    if (certError || !certificate) {
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Generate HTML for the certificate
    const certificateHtml = generateCertificateHtml(certificate)

    // For now, return the HTML (in a real implementation, you'd convert this to PDF)
    // You could use puppeteer or similar library to convert HTML to PDF
    const pdfBuffer = await generatePdfFromHtml(certificateHtml)

    // Store the PDF URL in the database
    const pdfUrl = `https://mpxebbqxqyzalctgsyxm.supabase.co/storage/v1/object/public/certificates/${certificate.certificate_number}.pdf`
    
    await supabaseClient
      .from('certificates')
      .update({ pdf_url: pdfUrl })
      .eq('id', certificate_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        pdf_url: pdfUrl,
        html: certificateHtml
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Certificate PDF generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generateCertificateHtml(certificate: CertificateData): string {
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const expiryDate = new Date(certificate.expires_at).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ใบรับรอง GACP - ${certificate.certificate_number}</title>
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }
            
            body {
                font-family: 'Sarabun', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            
            .certificate {
                max-width: 800px;
                margin: 0 auto;
                border: 8px solid #2563eb;
                border-radius: 20px;
                padding: 40px;
                position: relative;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .logo {
                width: 100px;
                height: 100px;
                margin: 0 auto 20px;
                background: #2563eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 48px;
                font-weight: bold;
            }
            
            .title {
                font-size: 36px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 18px;
                color: #64748b;
                margin-bottom: 30px;
            }
            
            .cert-number {
                font-size: 24px;
                font-weight: bold;
                color: #dc2626;
                background: #fef2f2;
                padding: 10px 20px;
                border-radius: 10px;
                display: inline-block;
                margin-bottom: 30px;
            }
            
            .recipient {
                text-align: center;
                margin: 40px 0;
                padding: 30px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .recipient-label {
                font-size: 18px;
                color: #64748b;
                margin-bottom: 10px;
            }
            
            .recipient-name {
                font-size: 32px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .organization {
                font-size: 20px;
                color: #475569;
                margin-bottom: 20px;
            }
            
            .details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 40px 0;
            }
            
            .detail-section {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .detail-label {
                font-size: 14px;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }
            
            .detail-value {
                font-size: 16px;
                color: #1e293b;
                font-weight: 500;
            }
            
            .crops {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            
            .crop-tag {
                background: #dbeafe;
                color: #1e40af;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .validity {
                text-align: center;
                margin: 40px 0;
                padding: 25px;
                background: #f0fdf4;
                border: 2px solid #22c55e;
                border-radius: 15px;
            }
            
            .validity-title {
                font-size: 20px;
                font-weight: bold;
                color: #15803d;
                margin-bottom: 15px;
            }
            
            .dates {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .date-item {
                text-align: center;
            }
            
            .date-label {
                font-size: 14px;
                color: #16a34a;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .date-value {
                font-size: 18px;
                font-weight: bold;
                color: #15803d;
            }
            
            .verification {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
            }
            
            .qr-code {
                width: 120px;
                height: 120px;
                margin: 0 auto 15px;
                background: #e5e7eb;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-size: 12px;
            }
            
            .verification-code {
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 10px;
            }
            
            .verification-url {
                font-size: 12px;
                color: #6b7280;
                word-break: break-all;
            }
            
            .footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
            }
            
            .authority {
                font-size: 16px;
                color: #374151;
                margin-bottom: 10px;
            }
            
            .signature-line {
                width: 200px;
                height: 1px;
                background: #9ca3af;
                margin: 30px auto 10px;
            }
            
            .signature-title {
                font-size: 14px;
                color: #6b7280;
            }
            
            @media print {
                body { margin: 0; }
                .certificate { border: 5px solid #2563eb; }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="header">
                <div class="logo">GACP</div>
                <div class="title">ใบรับรองมาตรฐาน</div>
                <div class="subtitle">Good Agricultural and Collection Practices</div>
                <div class="cert-number">หมายเลข: ${certificate.certificate_number}</div>
            </div>
            
            <div class="recipient">
                <div class="recipient-label">ขอให้การรับรองแก่</div>
                <div class="recipient-name">${certificate.applicant_name}</div>
                ${certificate.organization_name ? `<div class="organization">${certificate.organization_name}</div>` : ''}
            </div>
            
            <div class="details">
                <div class="detail-section">
                    <div class="detail-label">ชื่อฟาร์ม</div>
                    <div class="detail-value">${certificate.farm_name || 'ไม่ระบุ'}</div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-label">ที่อยู่ฟาร์ม</div>
                    <div class="detail-value">${certificate.farm_address || 'ไม่ระบุ'}</div>
                </div>
            </div>
            
            ${certificate.crop_types && certificate.crop_types.length > 0 ? `
            <div class="detail-section" style="grid-column: 1 / -1; margin-bottom: 30px;">
                <div class="detail-label">พืชที่ได้รับการรับรอง</div>
                <div class="crops">
                    ${certificate.crop_types.map(crop => `<span class="crop-tag">${crop}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="validity">
                <div class="validity-title">ระยะเวลาการใช้งาน</div>
                <div class="dates">
                    <div class="date-item">
                        <div class="date-label">วันที่ออกใบรับรอง</div>
                        <div class="date-value">${issuedDate}</div>
                    </div>
                    <div class="date-item">
                        <div class="date-label">วันที่หมดอายุ</div>
                        <div class="date-value">${expiryDate}</div>
                    </div>
                </div>
            </div>
            
            <div class="verification">
                <div class="qr-code">QR Code<br>(จะสร้างภายหลัง)</div>
                ${certificate.verification_code ? `
                <div class="verification-code">รหัสตรวจสอบ: ${certificate.verification_code}</div>
                ` : ''}
                ${certificate.verification_url ? `
                <div class="verification-url">${certificate.verification_url}</div>
                ` : ''}
            </div>
            
            <div class="footer">
                <div class="authority">
                    กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์<br>
                    Department of Agriculture, Ministry of Agriculture and Cooperatives
                </div>
                <div class="signature-line"></div>
                <div class="signature-title">ผู้อำนวยการกรมวิชาการเกษตร</div>
            </div>
        </div>
    </body>
    </html>
  `
}

// Placeholder function for PDF generation
// In a real implementation, you would use a library like puppeteer
async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  // This is a placeholder - in reality you'd use puppeteer or similar
  // For now, just return the HTML as bytes
  return new TextEncoder().encode(html)
}