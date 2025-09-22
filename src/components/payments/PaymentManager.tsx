import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Alert component not needed - removing unused import
import { Separator } from '@/components/ui/separator';
import { CreditCard, Clock, CheckCircle, AlertCircle, QrCode, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  milestone: number;
  amount: number;
  currency: string;
  status: string;
  payment_due_date: string;
  created_at: string;
  application_id: string;
  payment_method_details?: any;
  bank_reference?: string;
  qr_code_data?: string;
}

interface PaymentManagerProps {
  applicationId: string;
  className?: string;
}

const getMilestoneInfo = (milestone: Payment['milestone']) => {
  const info = {
    DOCUMENT_REVIEW: {
      title: 'ค่าตรวจเอกสาร',
      description: 'ค่าธรรมเนียมการตรวจสอบเอกสารและข้อมูลใบสมัคร',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    ASSESSMENT: {
      title: 'ค่าประเมิน',
      description: 'ค่าธรรมเนียมการประเมินออนไลน์และตรวจสอบในพื้นที่',
      icon: Banknote,
      color: 'text-green-600'
    },
    CERTIFICATION: {
      title: 'ค่าออกใบรับรอง',
      description: 'ค่าธรรมเนียมการออกใบรับรอง GACP',
      icon: CreditCard,
      color: 'text-purple-600'
    },
    REINSPECTION: {
      title: 'ค่าตรวจสอบซ้ำ',
      description: 'ค่าธรรมเนียมการตรวจสอบซ้ำในกรณีที่ไม่ผ่านการประเมิน',
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  };
  return info[milestone];
};

const getStatusBadge = (status: Payment['status']) => {
  const variants = {
    PENDING: { variant: 'secondary' as const, label: 'รอชำระ', icon: Clock },
    COMPLETED: { variant: 'default' as const, label: 'ชำระแล้ว', icon: CheckCircle },
    FAILED: { variant: 'destructive' as const, label: 'ล้มเหลว', icon: AlertCircle },
    CANCELLED: { variant: 'outline' as const, label: 'ยกเลิก', icon: AlertCircle }
  };
  
  const { variant, label, icon: Icon } = variants[status];
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export const PaymentManager: React.FC<PaymentManagerProps> = ({ 
  applicationId, 
  className 
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [applicationId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการชำระเงินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRPayment = async (paymentId: string) => {
    setProcessingPayment(paymentId);
    try {
      // Simulate QR code generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "สร้าง QR Code สำเร็จ",
        description: "กรุณาสแกน QR Code เพื่อชำระเงิน",
      });
      
      // In real implementation, this would call a payment gateway API
      // For demo, we'll just show a success message
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้าง QR Code ได้",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleBankTransfer = async (paymentId: string) => {
    setProcessingPayment(paymentId);
    try {
      // Simulate bank transfer setup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "ข้อมูลการโอนเงิน",
        description: "กรุณาโอนเงินตามรายละเอียดที่แสดง และแจ้งชำระเงิน",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแสดงข้อมูลการโอนเงินได้",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const markPaymentComplete = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'COMPLETED',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "ชำระเงินสำเร็จ",
        description: "การชำระเงินได้รับการยืนยันแล้ว",
      });

      fetchPayments();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะการชำระเงินได้",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const completedPayments = payments.filter(p => p.status === 'COMPLETED');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>รอการชำระเงิน</span>
            </CardTitle>
            <CardDescription>
              รายการค่าธรรมเนียมที่ยังไม่ได้ชำระ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPayments.map((payment) => {
              const milestoneInfo = getMilestoneInfo(payment.milestone);
              const Icon = milestoneInfo.icon;
              const isOverdue = new Date(payment.payment_due_date) < new Date();
              
              return (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("h-5 w-5", milestoneInfo.color)} />
                      <div>
                        <h4 className="font-medium">{milestoneInfo.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {milestoneInfo.description}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-primary">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ครบกำหนด: {new Date(payment.payment_due_date).toLocaleDateString('th-TH')}
                      {isOverdue && (
                        <Badge variant="destructive" className="ml-2">เกินกำหนด</Badge>
                      )}
                    </div>
                  </div>

                  {isOverdue && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">การชำระเงินเกินกำหนดแล้ว กรุณาชำระเงินให้เร็วที่สุด</span>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">เลือกวิธีการชำระเงิน:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => generateQRPayment(payment.id)}
                        disabled={processingPayment === payment.id}
                      >
                        <QrCode className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">QR Code</div>
                          <div className="text-xs text-muted-foreground">
                            สแกนจ่ายผ่าน Mobile Banking
                          </div>
                        </div>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => handleBankTransfer(payment.id)}
                        disabled={processingPayment === payment.id}
                      >
                        <Banknote className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">โอนเงิน</div>
                          <div className="text-xs text-muted-foreground">
                            โอนผ่านธนาคาร
                          </div>
                        </div>
                      </Button>
                    </div>

                    {/* Demo: Mark as paid button */}
                    <div className="pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markPaymentComplete(payment.id)}
                        className="text-xs"
                      >
                        [Demo] ทำเครื่องหมายว่าชำระแล้ว
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Payments */}
      {completedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>ประวัติการชำระเงิน</span>
            </CardTitle>
            <CardDescription>
              รายการค่าธรรมเนียมที่ชำระเงินแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedPayments.map((payment) => {
                const milestoneInfo = getMilestoneInfo(payment.milestone);
                const Icon = milestoneInfo.icon;
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("h-4 w-4", milestoneInfo.color)} />
                      <div>
                        <p className="font-medium text-sm">{milestoneInfo.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ชำระเมื่อ: {new Date(payment.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount.toLocaleString()} {payment.currency}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};