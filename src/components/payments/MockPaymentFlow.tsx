import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  Smartphone,
  CheckCircle,
  Clock,
  ArrowLeft,
  Copy,
  Receipt,
  Banknote,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface MockPaymentFlowProps {
  applicationId: string;
  milestone: number;
  amount: number;
  description: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const MockPaymentFlow = ({ 
  applicationId, 
  milestone, 
  amount, 
  description, 
  onPaymentSuccess, 
  onCancel 
}: MockPaymentFlowProps) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [currentStep, setCurrentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'promptpay',
      type: 'promptpay',
      name: 'PromptPay QR',
      description: 'สแกน QR ผ่านแอปธนาคาร - รวดเร็วที่สุด',
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
      fee: Math.round(amount * 0.025) // 2.5% fee
    }
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep('details');
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    setCurrentStep('processing');
    setPaymentProgress(0);

    // Simulate processing steps
    const steps = [
      { progress: 20, message: 'กำลังตรวจสอบข้อมูล...' },
      { progress: 50, message: 'กำลังประมวลผลการชำระเงิน...' },
      { progress: 80, message: 'กำลังยืนยันการชำระเงิน...' },
      { progress: 100, message: 'ชำระเงินสำเร็จ!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setPaymentProgress(step.progress);
      
      if (step.progress === 100) {
        // Create mock payment record
        try {
          const { error } = await supabase.rpc('create_payment_record', {
            p_application_id: applicationId,
            p_milestone: milestone, // Use the integer milestone directly
            p_amount: amount,
            p_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });

          if (error) throw error;

          // Mark payment as completed immediately (mock)
          const { error: updateError } = await supabase
            .from('payments')
            .update({ 
              status: 'COMPLETED',
              paid_at: new Date().toISOString()
            })
            .eq('application_id', applicationId)
            .eq('milestone', milestone);

          if (updateError) throw updateError;

          // Update application workflow status based on milestone
          let newStatus: 'PAYMENT_CONFIRMED_REVIEW' | 'PAYMENT_CONFIRMED_ASSESSMENT' | null = null;
          if (milestone === 1) {
            newStatus = 'PAYMENT_CONFIRMED_REVIEW';
          } else if (milestone === 2) {
            newStatus = 'PAYMENT_CONFIRMED_ASSESSMENT';
          }

          if (newStatus) {
            await supabase.rpc('update_workflow_status_v2', {
              p_application_id: applicationId,
              p_new_status: newStatus,
              p_updated_by: (await supabase.auth.getUser()).data.user?.id,
              p_notes: `Mock payment completed for ${description}`
            });
          }

          setCurrentStep('success');
          
          toast({
            title: "ชำระเงินสำเร็จ",
            description: `ชำระ${description} ${amount.toLocaleString()} บาท ด้วย ${selectedMethod.name}`,
            variant: "default",
          });

          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);

        } catch (error) {
          console.error('Error processing payment:', error);
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          });
          setCurrentStep('method');
        }
      }
    }
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('0123456789');
    toast({
      title: "คัดลอกแล้ว",
      description: "เลขที่บัญชีถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Success Screen
  if (currentStep === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-green-800">ชำระเงินสำเร็จ!</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            ขอบคุณสำหรับการชำระเงิน<br/>
            ระบบได้รับการชำระเงินแล้ว<br/>
            กระบวนการจะดำเนินต่อไปโดยอัตโนมัติ
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">จำนวนเงิน</span>
              <span className="font-bold text-green-800">{amount.toLocaleString()} บาท</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-green-700">รายการ</span>
              <span className="text-green-800">{description}</span>
            </div>
          </div>

          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Receipt className="h-3 w-3 mr-1" />
            สถานะ: ชำระเงินสำเร็จ
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Processing Screen
  if (currentStep === 'processing') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-4">กำลังประมวลผลการชำระเงิน</h3>
          <Progress value={paymentProgress} className="mb-4" />
          <p className="text-muted-foreground text-sm">
            กรุณารอสักครู่ ระบบกำลังตรวจสอบการชำระเงิน...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Payment Details Screen
  if (currentStep === 'details' && selectedMethod) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentStep('method')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>ชำระผ่าน {selectedMethod.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">รายการ</span>
              <span className="font-medium">{description}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">จำนวนเงิน</span>
              <span className="font-semibold">{amount.toLocaleString()} บาท</span>
            </div>
            {selectedMethod.fee > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">ค่าธรรมเนียม</span>
                <span className="text-orange-600">{selectedMethod.fee.toLocaleString()} บาท</span>
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-bold">
              <span>ยอดรวมทั้งสิ้น</span>
              <span className="text-lg text-primary">
                {(amount + selectedMethod.fee).toLocaleString()} บาท
              </span>
            </div>
          </div>

          {/* QR Code or Card Form */}
          {selectedMethod.type === 'promptpay' && (
            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                สแกน QR Code ด้วยแอปธนาคารของคุณ
              </p>
              
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
                </div>
              </div>
            </div>
          )}

          {selectedMethod.type === 'card' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">หมายเลขบัตร</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">วันหมดอายุ</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardName">ชื่อบนบัตร</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                />
              </div>
            </div>
          )}

          {selectedMethod.type === 'banking' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">ข้อมูลการโอนเงิน</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ธนาคาร</span>
                  <span className="font-medium">ไทยพาณิชย์</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">เลขที่บัญชี</span>
                  <span className="font-mono">0123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ชื่อบัญชี</span>
                  <span className="font-medium">องค์การมาตรฐาน GACP</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Info */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">การชำระเงินปลอดภัย</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              ข้อมูลของคุณได้รับการเข้ารหัสและป้องกันด้วยมาตรฐาน SSL
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              ยกเลิก
            </Button>
            <Button onClick={handlePaymentSubmit} className="flex-1">
              {selectedMethod.type === 'card' ? 'ชำระเงิน' : 'ฉันได้โอนเงินแล้ว'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            การชำระเงินจะได้รับการยืนยันภายใน {selectedMethod.processingTime}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Method Selection Screen
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          เลือกวิธีการชำระเงิน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">รายการ</span>
            <span className="font-medium">{description}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">จำนวนเงิน</span>
            <span className="font-bold text-lg text-primary">
              {amount.toLocaleString()} บาท
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
                        <p className="text-orange-600">ค่าธรรมเนียม {method.fee.toLocaleString()} บาท</p>
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
      </CardContent>
    </Card>
  );
};