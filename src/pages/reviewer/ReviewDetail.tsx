import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, User, MapPin, Check, X, MessageSquare, AlertCircle, DollarSign, Printer, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewer } from '@/components/reviewer/DocumentViewer';
import { RejectionCountBadge } from '@/components/dashboard/RejectionCountBadge';

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationDetail();
    }
  }, [id]);

  const fetchApplicationDetail = async () => {
    try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:applicant_id(full_name, organization_name, email, phone),
        documents(*),
        payments!payments_application_id_fkey(id, milestone, amount, status)
      `)
      .eq('id', id)
      .single();

      if (error) throw error;
      setApplication(data);
      setReviewComments(data.reviewer_comments || '');
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลใบสมัครได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!application) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('handle_document_approval', {
        p_application_id: application.id,
        p_reviewer_id: (await supabase.auth.getUser()).data.user?.id, // Current user ID
        p_comments: reviewComments
      });

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "อนุมัติเอกสารเรียบร้อยแล้ว ระบบจะสร้างใบแจ้งหนี้ค่าประเมิน 25,000 บาท",
      });

      navigate('/reviewer/queue');
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอนุมัติเอกสารได้",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejection = async () => {
    if (!application) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('handle_document_rejection', {
        p_application_id: application.id,
        p_reviewer_id: (await supabase.auth.getUser()).data.user?.id, // Current user ID
        p_comments: reviewComments
      });

      if (error) throw error;

      const result = data as any;
      
      toast({
        title: "ส่งกลับแก้ไขเรียบร้อย",
        description: result.payment_required 
          ? `เอกสารถูกปฏิเสธครั้งที่ ${result.revision_count} ผู้สมัครต้องชำระ 5,000 บาท เพื่อส่งเอกสารใหม่`
          : `เอกสารถูกปฏิเสธครั้งที่ ${result.revision_count} ผู้สมัครสามารถแก้ไขฟรีได้อีก ${result.max_free_revisions - result.revision_count + 1} ครั้ง`,
      });

      navigate('/reviewer/queue');
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถปฏิเสธเอกสารได้",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getWorkflowStatusText = (status) => {
    const statusMap = {
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

  const getWorkflowStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: 'ส่งแล้ว', variant: 'secondary' },
      UNDER_REVIEW: { label: 'กำลังตรวจสอบ', variant: 'default' },
      PAYMENT_CONFIRMED_REVIEW: { label: 'ชำระเงินแล้ว', variant: 'default' },
      REVIEW_APPROVED: { label: 'อนุมัติเอกสาร', variant: 'default' },
      REVISION_REQUESTED: { label: 'ต้องแก้ไข', variant: 'destructive' },
      REJECTED_PAYMENT_REQUIRED: { label: 'ต้องชำระเพื่อแก้ไข', variant: 'destructive' },
      REJECTED: { label: 'ปฏิเสธ', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant as "default" | "destructive" | "secondary" | "outline"}>{config.label}</Badge>;
  };

  const getPaymentStatus = (application) => {
    const reviewPayment = application.payments?.find(p => p.milestone === 1);
    if (!reviewPayment) return { status: 'pending', label: 'รอชำระ', amount: 5000 };
    
    return {
      status: reviewPayment.status === 'COMPLETED' ? 'paid' : 'pending',
      label: reviewPayment.status === 'COMPLETED' ? 'ชำระแล้ว' : 'รอชำระ',
      amount: reviewPayment.amount
    };
  };

  const handleGeneratePDF = async () => {
    if (!application) return;

    try {
      setSubmitting(true);
      
      // Call the edge function to get HTML content
      const response = await fetch(
        `https://mpxebbqxqyzalctgsyxm.supabase.co/functions/v1/generate-application-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ applicationId: application.id })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const { html } = await response.json();

      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups for this site');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto print after content loads
      setTimeout(() => {
        printWindow.print();
      }, 1000);

      toast({
        title: "สำเร็จ",
        description: "เปิดหน้าต่างสำหรับพิมพ์ PDF รายงานใบสมัครแล้ว",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ไม่พบใบสมัคร</h2>
          <Button onClick={() => navigate('/reviewer/queue')}>กลับไปหน้ารายการ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/reviewer/queue')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">{application.application_number}</h1>
              {getWorkflowStatusBadge(application.workflow_status)}
            </div>
            <p className="text-muted-foreground">รายละเอียดใบสมัครและการตรวจสอบ</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGeneratePDF} disabled={submitting}>
              <Download className="h-4 w-4 mr-2" />
              {submitting ? 'กำลังสร้างรายงาน...' : 'สร้างรายงาน PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลผู้สมัคร
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">ชื่อผู้สมัคร</Label>
                    <p className="text-sm">{application.profiles?.full_name || application.applicant_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">องค์กร</Label>
                    <p className="text-sm">{application.profiles?.organization_name || application.organization_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">อีเมล</Label>
                    <p className="text-sm">{application.profiles?.email || application.applicant_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">เบอร์โทร</Label>
                    <p className="text-sm">{application.profiles?.phone || application.applicant_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farm Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ข้อมูลฟาร์ม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">ชื่อฟาร์ม</Label>
                    <p className="text-sm">{application.farm_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">พื้นที่ (ไร่-งาน-วา)</Label>
                    <p className="text-sm">{application.farm_area_rai}-{application.farm_area_ngan}-{application.farm_area_wah}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ประเภทพืช</Label>
                    <p className="text-sm">{application.crop_types?.join(', ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">วิธีการเพาะปลูก</Label>
                    <p className="text-sm">{application.cultivation_methods?.join(', ')}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">ที่อยู่ฟาร์ม</Label>
                  <p className="text-sm">{application.farm_address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Document Viewer */}
            <DocumentViewer 
              documents={application.documents || []}
            />
          </div>

          {/* Review Panel */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  สถานะการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">ค่าตรวจสอบเอกสาร</span>
                      <Badge variant={getPaymentStatus(application).status === 'paid' ? 'default' : 'destructive'}>
                        {getPaymentStatus(application).label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      จำนวน: {getPaymentStatus(application).amount?.toLocaleString()} บาท
                    </p>
                  </div>
                  
                  {getPaymentStatus(application).status !== 'paid' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">รอการชำระเงิน</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        ผู้สมัครต้องชำระค่าตรวจสอบเอกสารก่อนที่จะสามารถดำเนินการตรวจสอบได้
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rejection Count */}
            {application.revision_count_current > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>ประวัติการแก้ไข</CardTitle>
                </CardHeader>
                <CardContent>
                  <RejectionCountBadge
                    revisionCount={application.revision_count_current}
                    maxFreeRevisions={application.max_free_revisions}
                    workflowStatus={application.workflow_status}
                  />
                </CardContent>
              </Card>
            )}

            {/* Review Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  การตรวจสอบ
                </CardTitle>
                <CardDescription>
                  ให้ความเห็นและตัดสินใจสถานะใบสมัคร
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comments">ความเห็นผู้ตรวจสอบ</Label>
                  <Textarea
                    id="comments"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="ระบุความเห็นเกี่ยวกับใบสมัครนี้..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handleApproval}
                    disabled={submitting || getPaymentStatus(application).status !== 'paid'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    อนุมัติเอกสาร
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleRejection}
                    disabled={submitting || getPaymentStatus(application).status !== 'paid'}
                  >
                    <X className="h-4 w-4 mr-2" />
                    ส่งกลับแก้ไข
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>ประวัติการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>สร้างใบสมัคร</span>
                    <span>{new Date(application.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                  {application.submitted_at && (
                    <div className="flex justify-between">
                      <span>ส่งใบสมัคร</span>
                      <span>{new Date(application.submitted_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>อัพเดทล่าสุด</span>
                    <span>{new Date(application.updated_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewDetail;