import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, CreditCard, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  type: 'qr_code' | 'credit_card' | 'bank_transfer';
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

interface InvoiceForPayment {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceForPayment | null;
  onPaymentSuccess?: (invoiceId: string, method: string) => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method.type === 'qr_code') {
      setShowQRCode(true);
    } else {
      processPayment(method);
    }
  };

  const processPayment = async (method: PaymentMethod) => {
    if (!invoice) return;

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark invoice as paid in database
      const { error } = await supabase.rpc('mark_invoice_paid', {
        p_invoice_id: invoice.id,
        p_payment_method: method.name
      });

      if (error) throw error;

      toast({
        title: "ชำระเงินสำเร็จ",
        description: `การชำระเงิน ${invoice.description} จำนวน ${invoice.amount.toLocaleString()} ${invoice.currency} สำเร็จแล้ว`,
      });

      onPaymentSuccess?.(invoice.id, method.name);
      onOpenChange(false);
      setShowQRCode(false);
      setSelectedMethod(null);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ชำระเงิน</DialogTitle>
        </DialogHeader>

        {!showQRCode ? (
          <div className="space-y-4">
            {/* Invoice Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-1">{invoice.description}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                เลขที่ใบแจ้งหนี้: {invoice.invoice_number}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(invoice.amount, invoice.currency)}
              </p>
            </div>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="font-medium">เลือกวิธีการชำระเงิน</h4>
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method)}
                    disabled={processing}
                    className="w-full p-4 border rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {method.fee && (
                          <div>ค่าธรรมเนียม {method.fee}%</div>
                        )}
                        <div>{method.processing_time}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* QR Code Payment */
          <div className="space-y-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-1">{invoice.description}</h3>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(invoice.amount, invoice.currency)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
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

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowQRCode(false)}
                className="flex-1"
                disabled={processing}
              >
                ย้อนกลับ
              </Button>
              <Button 
                onClick={() => selectedMethod && processPayment(selectedMethod)}
                className="flex-1"
                disabled={processing}
              >
                {processing ? (
                  "กำลังดำเนินการ..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ยืนยันการชำระเงิน
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};