import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { MockPaymentFlow } from '@/components/payments/MockPaymentFlow';

interface PaymentPromptProps {
  applicationId: string;
  workflowStatus: string;
  revisionCount?: number;
}

export const PaymentPrompt = ({ applicationId, workflowStatus, revisionCount }: PaymentPromptProps) => {
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const getPaymentDetails = () => {
    switch (workflowStatus) {
      case 'PAYMENT_PENDING_REVIEW':
      case 'SUBMITTED':
        return {
          milestone: 1,
          amount: 5000,
          description: 'ค่าตรวจสอบเอกสาร',
          urgency: 'medium' as const,
          message: 'กรุณาชำระค่าธรรมเนียมการตรวจสอบเอกสารเพื่อดำเนินการต่อ'
        };
      
      case 'REJECTED_PAYMENT_REQUIRED':
        return {
          milestone: 1,
          amount: 5000,
          description: 'ค่าตรวจสอบเอกสาร (แก้ไขครั้งที่ ' + (revisionCount || 3) + ')',
          urgency: 'high' as const,
          message: `เอกสารถูกปฏิเสธครั้งที่ ${revisionCount || 3} กรุณาชำระค่าธรรมเนียมเพื่อส่งเอกสารใหม่`
        };
      
      case 'PAYMENT_PENDING_ASSESSMENT':
      case 'REVIEW_APPROVED':
        return {
          milestone: 2,
          amount: 25000,
          description: 'ค่าประเมิน',
          urgency: 'medium' as const,
          message: 'เอกสารผ่านการตรวจสอบแล้ว กรุณาชำระค่าประเมินเพื่อเข้าสู่ขั้นตอนการประเมิน'
        };
      
      default:
        return null;
    }
  };

  const paymentDetails = getPaymentDetails();

  if (!paymentDetails) {
    return null;
  }

  const handlePaymentSuccess = () => {
    setShowPaymentFlow(false);
    // Refresh the page to update the workflow status
    window.location.reload();
  };

  const getUrgencyIcon = () => {
    switch (paymentDetails.urgency) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getUrgencyBadge = () => {
    switch (paymentDetails.urgency) {
      case 'high':
        return <Badge variant="destructive">ด่วน</Badge>;
      case 'medium':
        return <Badge variant="secondary">ปกติ</Badge>;
      default:
        return <Badge variant="outline">ไม่ด่วน</Badge>;
    }
  };

  const getBorderClass = () => {
    switch (paymentDetails.urgency) {
      case 'high':
        return 'border-red-200 bg-red-50/50';
      case 'medium':
        return 'border-orange-200 bg-orange-50/50';
      default:
        return 'border-blue-200 bg-blue-50/50';
    }
  };

  return (
    <>
      <Card className={`${getBorderClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getUrgencyIcon()}
              จำเป็นต้องชำระเงิน
            </CardTitle>
            {getUrgencyBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {paymentDetails.message}
          </p>
          
          <div className="bg-white p-4 rounded-lg border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">รายการ</span>
              <span className="font-medium">{paymentDetails.description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">จำนวนเงิน</span>
              <span className="font-bold text-lg text-primary">
                {paymentDetails.amount.toLocaleString()} บาท
              </span>
            </div>
          </div>

          <Button 
            onClick={() => setShowPaymentFlow(true)}
            className="w-full"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            ชำระเงินเลย
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            ระบบรองรับการชำระผ่าน PromptPay, Mobile Banking และบัตรเครดิต/เดบิต
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPaymentFlow} onOpenChange={setShowPaymentFlow}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ชำระเงิน - {paymentDetails.description}</DialogTitle>
          </DialogHeader>
          <MockPaymentFlow
            applicationId={applicationId}
            milestone={paymentDetails.milestone}
            amount={paymentDetails.amount}
            description={paymentDetails.description}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setShowPaymentFlow(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};