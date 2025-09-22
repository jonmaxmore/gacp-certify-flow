import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, QrCode, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Payment {
  id: string;
  application_id: string;
  milestone: number;
  milestone_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  receipt_url?: string;
}

interface PaymentMethod {
  id: string;
  type: 'qr_code' | 'credit_card' | 'bank_transfer' | 'e_wallet';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fee?: number;
  processing_time: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'qr_code',
    type: 'qr_code',
    name: 'QR Code',
    description: 'สแกน QR Code เพื่อชำระผ่านธนาคารหรือ E-Wallet',
    icon: QrCode,
    processing_time: 'ทันที'
  },
  {
    id: 'credit_card',
    type: 'credit_card',
    name: 'บัตรเครดิต/เดบิต',
    description: 'ชำระผ่านบัตรเครดิตหรือบัตรเดบิต',
    icon: CreditCard,
    fee: 2.9,
    processing_time: 'ทันที'
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'โอนเงินผ่านธนาคาร',
    description: 'โอนเงินผ่านระบบธนาคาร',
    icon: Building2,
    processing_time: '1-3 วันทำการ'
  }
];

interface PaymentModuleProps {
  applicationId: string;
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({ applicationId }) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [applicationId]);

  const loadPayments = () => {
    // Mock payment data - in real app, fetch from API
    const mockPayments: Payment[] = [
      {
        id: '1',
        application_id: applicationId,
        milestone: 1,
        milestone_name: 'ค่าธรรมเนียมการสมัคร',
        amount: 1500,
        currency: 'THB',
        status: 'pending',
        due_date: '2024-01-15',
      },
      {
        id: '2',
        application_id: applicationId,
        milestone: 2,
        milestone_name: 'ค่าธรรมเนียมการตรวจประเมิน',
        amount: 3500,
        currency: 'THB',
        status: 'pending',
        due_date: '2024-02-01',
      },
      {
        id: '3',
        application_id: applicationId,
        milestone: 3,
        milestone_name: 'ค่าธรรมเนียมใบรับรอง',
        amount: 2000,
        currency: 'THB',
        status: 'pending',
        due_date: '2024-02-15',
      }
    ];
    setPayments(mockPayments);
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'THB') {
      return `${amount.toLocaleString()} THB`;
    }
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'รอชำระ' },
      paid: { variant: 'default' as const, label: 'ชำระแล้ว' },
      failed: { variant: 'destructive' as const, label: 'ชำระไม่สำเร็จ' },
      expired: { variant: 'secondary' as const, label: 'หมดอายุ' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePayment = (payment: Payment, method: PaymentMethod) => {
    setSelectedPayment(payment);
    setSelectedMethod(method);
    
    if (method.type === 'qr_code') {
      setShowQRCode(true);
    } else {
      // Simulate payment processing
      processPayment(payment, method);
    }
  };

  const processPayment = async (payment: Payment, method: PaymentMethod) => {
    toast({
      title: "กำลังดำเนินการชำระเงิน",
      description: `กรุณารอสักครู่...`,
    });

    // Simulate payment processing
    setTimeout(() => {
      const updatedPayments = payments.map(p => 
        p.id === payment.id 
          ? { ...p, status: 'paid' as const, paid_at: new Date().toISOString(), payment_method: method.name }
          : p
      );
      setPayments(updatedPayments);
      setShowPaymentDialog(false);
      
      toast({
        title: "ชำระเงินสำเร็จ",
        description: `ชำระ ${payment.milestone_name} เป็นจำนวน ${formatAmount(payment.amount, payment.currency)} สำเร็จ`,
      });
    }, 2000);
  };

  const renderPaymentList = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">การชำระเงิน</h2>
        <p className="text-muted-foreground">
          ตรวจสอบและดำเนินการชำระเงินตามขั้นตอนการสมัคร
        </p>
      </div>

      <div className="space-y-4">
        {payments.map((payment, index) => (
          <Card key={payment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {payment.milestone}
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.milestone_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ครั้งที่ {payment.milestone} - กำหนดชำระ: {new Date(payment.due_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatAmount(payment.amount, payment.currency)}
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              </div>

              {payment.status === 'pending' && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowPaymentDialog(true);
                    }}
                    className="w-full"
                  >
                    ชำระเงิน
                  </Button>
                </div>
              )}

              {payment.status === 'paid' && payment.paid_at && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>ชำระเมื่อ {new Date(payment.paid_at).toLocaleDateString('th-TH')}</span>
                    {payment.payment_method && <span>ผ่าน {payment.payment_method}</span>}
                  </div>
                  <Button variant="outline" size="sm">
                    ดาวน์โหลดใบเสร็จ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPaymentDialog = () => (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เลือกวิธีการชำระเงิน</DialogTitle>
        </DialogHeader>
        
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold">{selectedPayment.milestone_name}</h3>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(selectedPayment.amount, selectedPayment.currency)}
              </p>
            </div>

            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handlePayment(selectedPayment, method)}
                    className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">{method.description}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {method.fee && <div>ค่าธรรมเนียม {method.fee}%</div>}
                        <div>{method.processing_time}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const renderQRCodeDialog = () => (
    <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ชำระเงินผ่าน QR Code</DialogTitle>
        </DialogHeader>
        
        {selectedPayment && (
          <div className="space-y-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold">{selectedPayment.milestone_name}</h3>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(selectedPayment.amount, selectedPayment.currency)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-32 w-32 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                สแกน QR Code นี้เพื่อชำระเงินผ่านแอพธนาคารหรือ E-Wallet
              </p>
            </div>

            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">QR Code จะหมดอายุใน 15 นาที</span>
            </div>

            <Button 
              onClick={() => {
                setShowQRCode(false);
                if (selectedPayment && selectedMethod) {
                  processPayment(selectedPayment, selectedMethod);
                }
              }}
              className="w-full"
            >
              ยืนยันการชำระเงิน
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      {renderPaymentList()}
      {renderPaymentDialog()}
      {renderQRCodeDialog()}
    </div>
  );
};