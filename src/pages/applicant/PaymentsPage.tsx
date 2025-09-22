import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, AlertCircle, ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  id: string;
  milestone: number;
  amount: number;
  status: string;
  created_at: string;
  application_id: string;
  applications?: {
    application_number: string;
    farm_name: string;
  };
}

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          applications!inner(
            application_number,
            farm_name,
            applicant_id
          )
        `)
        .eq('applications.applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'รอชำระ', variant: 'secondary', icon: Clock },
      COMPLETED: { label: 'ชำระแล้ว', variant: 'default', icon: CheckCircle },
      FAILED: { label: 'ล้มเหลว', variant: 'destructive', icon: AlertCircle },
      REFUNDED: { label: 'คืนเงิน', variant: 'outline', icon: Receipt }
    } as const;

    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: Clock 
    };
    
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMilestoneLabel = (milestone: number) => {
    const milestoneMap = {
      1: 'ค่าตรวจสอบเอกสาร',
      2: 'ค่าประเมินออนไลน์',
      3: 'ค่าประเมินออนไซต์',
      4: 'ค่าออกใบรับรอง'
    };
    return milestoneMap[milestone as keyof typeof milestoneMap] || `ขั้นตอนที่ ${milestone}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">การชำระเงิน</h1>
            <p className="text-muted-foreground">ติดตามสถานะการชำระค่าธรรมเนียมทั้งหมด</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายการชำระเงิน</h3>
              <p className="text-muted-foreground mb-4">
                เมื่อคุณส่งใบสมัครแล้ว ระบบจะสร้างรายการชำระเงินให้อัตโนมัติ
              </p>
              <Button onClick={() => navigate('/applicant/application/new')}>
                สร้างใบสมัครใหม่
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ยอดรวมที่ต้องชำระ</p>
                      <p className="text-2xl font-bold">
                        {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} THB
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ชำระแล้ว</p>
                      <p className="text-2xl font-bold text-green-600">
                        {payments
                          .filter(p => p.status === 'COMPLETED')
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toLocaleString()} THB
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">รอชำระ</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {payments
                          .filter(p => p.status === 'PENDING')
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toLocaleString()} THB
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments List */}
            <Card>
              <CardHeader>
                <CardTitle>รายการชำระเงิน</CardTitle>
                <CardDescription>รายละเอียดการชำระเงินทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{getMilestoneLabel(payment.milestone)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {payment.applications?.application_number} - {payment.applications?.farm_name}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-primary">
                          {payment.amount.toLocaleString()} THB
                        </div>
                        <div className="flex gap-2">
                          {payment.status === 'PENDING' && (
                            <Button size="sm">
                              <CreditCard className="h-4 w-4 mr-2" />
                              ชำระเงิน
                            </Button>
                          )}
                          {payment.status === 'COMPLETED' && (
                            <Button variant="outline" size="sm">
                              <Receipt className="h-4 w-4 mr-2" />
                              ใบเสร็จ
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        สร้างเมื่อ: {new Date(payment.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentsPage;