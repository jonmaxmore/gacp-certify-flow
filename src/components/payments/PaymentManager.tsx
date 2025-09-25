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
import { InvoiceManager } from '@/components/invoices/InvoiceManager';

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
      <InvoiceManager applicationId={applicationId} />
    </div>
  );
};