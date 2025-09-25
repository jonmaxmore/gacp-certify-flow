import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  Smartphone,
  CheckCircle,
  Clock,
  ArrowLeft,
  Copy,
  Download,
  Receipt,
  AlertCircle,
  Banknote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  type: 'qr' | 'card' | 'banking' | 'promptpay';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  processingTime: string;
  fee: number;
  popular?: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  description: string;
  due_date: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE';
}

interface ModernPaymentFlowProps {
  invoice: Invoice;
  onPaymentSuccess: () => void;
  milestone?: number; // 1: Document Review (5,000), 2: Assessment (25,000), 3: Certificate (if needed)
}

export const ModernPaymentFlow = ({ invoice, onPaymentSuccess, milestone }: ModernPaymentFlowProps) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'promptpay',
      type: 'promptpay',
      name: 'PromptPay QR',
      description: 'สแกน QR ผ่านแอปธนาคาร',
      icon: QrCode,
      processingTime: 'ทันที',
      fee: 0,
      popular: true
    },
    {
      id: 'mobile_banking',
      type: 'banking',
      name: 'Mobile Banking',
      description: 'โอนผ่านแอปธนาคาร',
      icon: Smartphone,
      processingTime: 'ทันที',
      fee: 0
    },
    {
      id: 'credit_card',
      type: 'card',
      name: 'บัตรเครดิต/เดบิต',
      description: 'ชำระด้วยบัตร Visa, MasterCard',
      icon: CreditCard,
      processingTime: '1-2 นาที',
      fee: 10
    },
    {
      id: 'bank_transfer',
      type: 'banking',
      name: 'โอนธนาคาร',
      description: 'โอนเงินผ่านตู้ ATM หรือสาขา',
      icon: Building2,
      processingTime: '1-3 วันทำการ',
      fee: 25
    }
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method.type === 'promptpay' || method.type === 'qr') {
      setShowQRCode(true);
    } else {
      handlePayment(method);
    }
  };

  const handlePayment = async (method: PaymentMethod) => {
    setProcessing(true);
    
    try {
      // Simulate payment processing with different workflows based on milestone
      const processingTime = milestone === 1 ? 2000 : milestone === 2 ? 3000 : 2500;
      
      setTimeout(async () => {
        setProcessing(false);
        setPaymentSuccess(true);
        
        const milestoneText = milestone === 1 ? 'ค่าตรวจเอกสาร' : 
                             milestone === 2 ? 'ค่าประเมิน' : 'ค่าธรรมเนียม';
        
        toast({
          title: "ชำระเงินสำเร็จ",
          description: `ชำระ${milestoneText} ${invoice.amount.toLocaleString()} บาท ด้วย ${method.name}`,
          variant: "default",
        });
        
        // Trigger workflow progression based on milestone
        if (milestone === 1) {
          // Document review payment - trigger review process
          console.log('Document review payment completed - triggering review workflow');
          // In a real implementation, you would call the workflow hook
          // const { processPaymentCompletion } = useWorkflowIntegration();
          // await processPaymentCompletion(invoice.id, milestone, invoice.applicationId);
        } else if (milestone === 2) {
          // Assessment payment - trigger assessment scheduling
          console.log('Assessment payment completed - triggering assessment scheduling');
          // Similar workflow integration call
        }
        
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }, processingTime);
    } catch (error) {
      setProcessing(false);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('0123456789');
    toast({
      title: "คัดลอกแล้ว",
      description: "เลขที่บัญชีถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    });
  };

  if (paymentSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">ชำระเงินสำเร็จ</h3>
          <p className="text-muted-foreground mb-4">
            ขอบคุณสำหรับการชำระเงิน ระบบจะประมวลผลภายใน 5-10 นาที
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Receipt className="h-3 w-3 mr-1" />
            {invoice.invoice_number}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (showQRCode && selectedMethod) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowQRCode(false)}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>ชำระผ่าน {selectedMethod.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* QR Code Placeholder */}
          <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <QrCode className="h-24 w-24 text-gray-400" />
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold text-lg">จำนวนเงิน: {invoice.amount.toLocaleString()} บาท</p>
            <p className="text-sm text-muted-foreground">
              สแกน QR Code ด้วยแอปธนาคารของคุณ
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">หรือโอนเงินด้วยตนเอง</h4>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">เลขที่บัญชี</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">0123456789</span>
                  <Button size="sm" variant="ghost" onClick={copyAccountNumber}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ชื่อบัญชี</span>
                <span className="font-medium">องค์การมาตรฐาน GACP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ธนาคาร</span>
                <span className="font-medium">ไทยพาณิชย์</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => handlePayment(selectedMethod)} 
            className="w-full"
            disabled={processing}
          >
            {processing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                กำลังตรวจสอบ...
              </>
            ) : (
              'ฉันได้โอนเงินแล้ว'
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            การชำระเงินจะได้รับการยืนยันภายใน 5-10 นาที หลังจากโอนเงิน
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          เลือกวิธีการชำระเงิน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">เลขที่ใบแจ้งหนี้</span>
            <span className="font-mono text-sm">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">รายการ</span>
            <span>{invoice.description}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">จำนวนเงินรวม</span>
            <span className="font-bold text-lg text-primary">
              {invoice.amount.toLocaleString()} บาท
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="font-medium">วิธีการชำระเงิน</h3>
          <div className="grid gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method)}
                  className="w-full p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-lg border">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {method.popular && (
                            <Badge variant="secondary" className="text-xs">
                              แนะนำ
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{method.processingTime}</p>
                      {method.fee > 0 ? (
                        <p className="text-orange-600">ค่าธรรมเนียม {method.fee} บาท</p>
                      ) : (
                        <p className="text-green-600">ฟรี</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">การชำระเงินปลอดภัย</p>
              <p className="text-blue-600">
                ข้อมูลการชำระเงินของคุณได้รับการเข้ารหัสและป้องกันด้วยมาตรฐาน SSL
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};