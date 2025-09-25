import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ModernPaymentFlow } from '@/components/payments/ModernPaymentFlow';
import { WorkflowProgressStepper } from '@/components/workflow/WorkflowProgressStepper';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Eye, 
  RefreshCw,
  FileText,
  Calendar,
  Award,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface ApplicationData {
  id: string;
  application_number: string;
  workflow_status: string;
  status: string;
  created_at: string;
  submitted_at: string;
  applicant_name: string;
  farm_name: string;
  organization_name: string;
  revision_count_current: number;
  max_free_revisions: number;
  reviewer_comments: string;
  next_action_required: string;
}

interface PaymentData {
  id: string;
  milestone: number;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

const ApplicationStatusPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchApplicationStatus();
    }
  }, [user, id]);

  const fetchApplicationStatus = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);

      // Fetch application details
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .eq('applicant_id', user.id)
        .single();

      if (appError) throw appError;

      setApplication(appData);

      // Fetch payments for this application
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true });

      if (paymentError) throw paymentError;

      setPayments(paymentData || []);

    } catch (error) {
      console.error('Error fetching application status:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสถานะได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'แบบร่าง', color: 'bg-gray-500', icon: FileText };
      case 'SUBMITTED':
        return { label: 'ส่งเอกสารแล้ว', color: 'bg-blue-500', icon: CheckCircle };
      case 'PAYMENT_PENDING_REVIEW':
        return { label: 'รอชำระค่าตรวจเอกสาร', color: 'bg-orange-500', icon: CreditCard };
      case 'UNDER_REVIEW':
        return { label: 'กำลังตรวจสอบเอกสาร', color: 'bg-yellow-500', icon: Eye };
      case 'REVISION_REQUESTED':
        return { label: 'ต้องแก้ไขเอกสาร', color: 'bg-red-500', icon: AlertCircle };
      case 'REVIEW_APPROVED':
        return { label: 'เอกสารผ่านการตรวจสอบ', color: 'bg-green-500', icon: CheckCircle };
      case 'PAYMENT_PENDING_ASSESSMENT':
        return { label: 'รอชำระค่าประเมิน', color: 'bg-orange-500', icon: CreditCard };
      case 'CERTIFIED':
        return { label: 'ได้รับใบรับรอง', color: 'bg-green-500', icon: Award };
      default:
        return { label: status, color: 'bg-gray-500', icon: Clock };
    }
  };

  const getMilestoneLabel = (milestone: number) => {
    switch (milestone) {
      case 1: return 'ค่าตรวจสอบเอกสาร';
      case 2: return 'ค่าประเมิน';
      case 3: return 'ค่าออกใบรับรอง';
      default: return `ขั้นตอนที่ ${milestone}`;
    }
  };

  const handlePayment = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setShowPaymentFlow(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentFlow(false);
    setSelectedPayment(null);
    
    toast({
      title: "ชำระเงินสำเร็จ",
      description: "การชำระเงินเสร็จสิ้นแล้ว ระบบจะอัปเดตสถานะภายใน 5-10 นาที",
    });

    // Refresh data
    await fetchApplicationStatus();
  };

  const getWorkflowProgress = (status: string) => {
    const statusOrder = [
      'DRAFT', 'SUBMITTED', 'PAYMENT_PENDING_REVIEW', 'UNDER_REVIEW', 
      'REVIEW_APPROVED', 'PAYMENT_PENDING_ASSESSMENT', 'CERTIFIED'
    ];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">ไม่พบข้อมูลใบสมัคร</h2>
              <p className="text-gray-600 mb-4">ไม่สามารถค้นหาใบสมัครที่ต้องการได้</p>
              <Button onClick={() => navigate('/applicant/applications')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปหน้ารายการใบสมัคร
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.workflow_status);
  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const completedPayments = payments.filter(p => p.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/applicant/applications')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สถานะใบสมัคร</h1>
            <p className="text-gray-600">
              เลขที่ใบสมัคร: {application.application_number || 'ไม่ระบุ'}
            </p>
          </div>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <statusInfo.icon className="h-6 w-6" />
              สถานะปัจจุบัน
              <Badge className={`${statusInfo.color} text-white`}>
                {statusInfo.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">ความคืบหน้า</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(getWorkflowProgress(application.workflow_status))}%
                  </span>
                </div>
                <Progress value={getWorkflowProgress(application.workflow_status)} className="h-3" />
              </div>

              {application.next_action_required && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">การดำเนินการต่อไป</h4>
                  <p className="text-blue-800">{application.next_action_required}</p>
                </div>
              )}

              {application.reviewer_comments && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">ข้อเสนอแนะจากผู้ตรวจสอบ</h4>
                  <p className="text-amber-800">{application.reviewer_comments}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle>ขั้นตอนการรับรอง</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowProgressStepper
              currentStatus={application.workflow_status}
              revisionCount={application.revision_count_current}
              maxFreeRevisions={application.max_free_revisions}
            />
          </CardContent>
        </Card>

        {/* Payment Status */}
        {(pendingPayments.length > 0 || completedPayments.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                สถานะการชำระเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pending Payments */}
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-orange-900">
                          {getMilestoneLabel(payment.milestone)}
                        </h4>
                        <p className="text-sm text-orange-700">
                          จำนวน: ฿{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-orange-600">
                          กำหนดชำระ: {new Date(payment.due_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handlePayment(payment)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        ชำระเงิน
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Completed Payments */}
                {completedPayments.map((payment) => (
                  <div key={payment.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">
                          {getMilestoneLabel(payment.milestone)}
                        </h4>
                        <p className="text-sm text-green-700">
                          จำนวน: ฿{payment.amount.toLocaleString()}
                        </p>
                        <Badge className="bg-green-500 text-white mt-1">
                          ชำระเรียบร้อยแล้ว
                        </Badge>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดใบสมัคร</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ผู้สมัคร</label>
                <p className="text-gray-900">{application.applicant_name || 'ไม่ระบุ'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ชื่อฟาร์ม</label>
                <p className="text-gray-900">{application.farm_name || 'ไม่ระบุ'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">วันที่สมัคร</label>
                <p className="text-gray-900">
                  {new Date(application.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">วันที่ส่งเอกสาร</label>
                <p className="text-gray-900">
                  {application.submitted_at 
                    ? new Date(application.submitted_at).toLocaleDateString('th-TH')
                    : 'ยังไม่ได้ส่ง'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>การดำเนินการ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={fetchApplicationStatus}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเฟรชข้อมูล
              </Button>
              
              {application.workflow_status === 'DRAFT' && (
                <Button onClick={() => navigate(`/applicant/application/${application.id}/edit`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  แก้ไขใบสมัคร
                </Button>
              )}
              
              {application.workflow_status === 'CERTIFIED' && (
                <Button onClick={() => navigate('/applicant/certificates')}>
                  <Award className="h-4 w-4 mr-2" />
                  ดาวน์โหลดใบรับรอง
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Flow Dialog */}
      {showPaymentFlow && selectedPayment && (
        <Dialog open={showPaymentFlow} onOpenChange={setShowPaymentFlow}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ชำระเงิน - {getMilestoneLabel(selectedPayment.milestone)}</DialogTitle>
            </DialogHeader>
            <ModernPaymentFlow
              invoice={{
                id: selectedPayment.id,
                amount: selectedPayment.amount,
                description: getMilestoneLabel(selectedPayment.milestone),
                due_date: selectedPayment.due_date,
                invoice_number: `PAY-${selectedPayment.id.slice(0, 8)}`,
                status: 'UNPAID' as const
              }}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ApplicationStatusPage;