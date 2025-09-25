import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowProgressStepper } from '@/components/workflow/WorkflowProgressStepper';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ApplicationData {
  id: string;
  application_number: string;
  workflow_status: string;
  revision_count_current: number;
  max_free_revisions: number;
  applicant_name: string;
  farm_name: string;
  next_action_required: string;
}

interface PaymentData {
  id: string;
  milestone: number;
  amount: number;
  status: string;
  due_date: string;
}

const LiveApplicationStepper = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's applications
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1); // Get most recent application

      if (appError) throw appError;

      setApplications(appData || []);

      if (appData && appData.length > 0) {
        // Fetch payments for the most recent application
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('application_id', appData[0].id)
          .order('created_at', { ascending: true });

        if (paymentError) throw paymentError;

        setPayments(paymentData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'แบบร่าง', color: 'bg-gray-500', icon: Clock };
      case 'SUBMITTED':
        return { label: 'ส่งเอกสารแล้ว', color: 'bg-blue-500', icon: CheckCircle };
      case 'PAYMENT_PENDING_REVIEW':
        return { label: 'รอชำระค่าตรวจเอกสาร', color: 'bg-orange-500', icon: CreditCard };
      case 'UNDER_REVIEW':
        return { label: 'กำลังตรวจสอบ', color: 'bg-yellow-500', icon: Eye };
      case 'REVISION_REQUESTED':
        return { label: 'ต้องแก้ไข', color: 'bg-red-500', icon: AlertCircle };
      case 'PAYMENT_PENDING_ASSESSMENT':
        return { label: 'รอชำระค่าประเมิน', color: 'bg-orange-500', icon: CreditCard };
      default:
        return { label: status, color: 'bg-gray-500', icon: Clock };
    }
  };

  const getCurrentApplication = () => applications[0];
  const getPendingPayments = () => payments.filter(p => p.status === 'PENDING');

  const handleViewStatus = (applicationId: string) => {
    navigate(`/applicant/application/${applicationId}/status`);
  };

  const handlePayNow = () => {
    navigate('/applicant/payments');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentApp = getCurrentApplication();
  const pendingPayments = getPendingPayments();

  if (!currentApp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>เริ่มต้นใบสมัครของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">คุณยังไม่มีใบสมัคร เริ่มต้นการสมัครรับรองเลย!</p>
            <Button onClick={() => navigate('/applicant/application/new')}>
              สร้างใบสมัครใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(currentApp.workflow_status);

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <statusInfo.icon className="h-6 w-6" />
              สถานะใบสมัครปัจจุบัน
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">เลขที่ใบสมัคร</label>
                <p className="font-medium">{currentApp.application_number || 'รอการกำหนด'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ชื่อฟาร์ม</label>
                <p className="font-medium">{currentApp.farm_name || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={() => handleViewStatus(currentApp.id)} className="gap-2">
                <Eye className="h-4 w-4" />
                ดูสถานะรายละเอียด
              </Button>

              {pendingPayments.length > 0 && (
                <Button onClick={handlePayNow} variant="outline" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  ชำระเงิน ({pendingPayments.length} รายการ)
                </Button>
              )}

              <Button 
                onClick={fetchData} 
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                รีเฟรช
              </Button>
            </div>

            {currentApp.next_action_required && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-900 mb-2">การดำเนินการต่อไป</h4>
                <p className="text-blue-800">{currentApp.next_action_required}</p>
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
            currentStatus={currentApp.workflow_status}
            revisionCount={currentApp.revision_count_current}
            maxFreeRevisions={currentApp.max_free_revisions}
          />
        </CardContent>
      </Card>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              รอการชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-900">
                      {payment.milestone === 1 ? 'ค่าตรวจสอบเอกสาร' : 
                       payment.milestone === 2 ? 'ค่าประเมิน' : 
                       `ขั้นตอนที่ ${payment.milestone}`}
                    </p>
                    <p className="text-sm text-orange-700">
                      จำนวน: ฿{payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    รอชำระ
                  </Badge>
                </div>
              ))}
              <Button onClick={handlePayNow} className="w-full bg-orange-600 hover:bg-orange-700">
                ชำระเงินทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveApplicationStepper;