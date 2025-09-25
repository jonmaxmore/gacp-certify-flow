import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceViewData {
  id: string;
  invoice_number: string;
  application_id: string;
  amount: number;
  currency: string;
  status: 'UNPAID' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  description: string;
  issued_at: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  receipt_number?: string;
  qr_code_data?: string;
  applicant_name?: string;
  application_number?: string;
  farm_name?: string;
}

interface InvoiceViewProps {
  invoice: InvoiceViewData;
  onPay?: (invoiceId: string) => void;
  onDownload?: (invoiceId: string) => void;
  onPrint?: (invoiceId: string) => void;
  className?: string;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoice,
  onPay,
  onDownload,
  onPrint,
  className
}) => {
  const getStatusBadge = (status: InvoiceViewData['status']) => {
    const variants = {
      UNPAID: { variant: 'destructive' as const, label: 'ยังไม่ชำระ' },
      PAID: { variant: 'default' as const, label: 'ชำระแล้ว' },
      CANCELLED: { variant: 'secondary' as const, label: 'ยกเลิก' },
      OVERDUE: { variant: 'destructive' as const, label: 'เกินกำหนด' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'UNPAID';

  return (
    <Card className={cn("max-w-2xl mx-auto", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              {invoice.status === 'PAID' ? 'ใบเสร็จรับเงิน' : 'ใบแจ้งหนี้'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              GACP Certification System
            </p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {invoice.status === 'PAID' ? 'เลขที่ใบเสร็จ:' : 'เลขที่ใบแจ้งหนี้:'}
            </h3>
            <p className="text-2xl font-bold text-primary">
              {invoice.status === 'PAID' && invoice.receipt_number 
                ? invoice.receipt_number 
                : invoice.invoice_number}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              วันที่ออก: {formatDate(invoice.issued_at)}
            </p>
            {invoice.status === 'PAID' && invoice.paid_at && (
              <p className="text-sm text-muted-foreground">
                วันที่ชำระ: {formatDate(invoice.paid_at)}
              </p>
            )}
            {invoice.status === 'UNPAID' && (
              <p className={cn(
                "text-sm font-medium",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                กำหนดชำระ: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Customer Information */}
        <div>
          <h4 className="font-semibold mb-2">ข้อมูลผู้สมัคร</h4>
          <div className="space-y-1">
            <p>{invoice.applicant_name}</p>
            {invoice.application_number && (
              <p className="text-sm text-muted-foreground">
                หมายเลขใบสมัคร: {invoice.application_number}
              </p>
            )}
            {invoice.farm_name && (
              <p className="text-sm text-muted-foreground">
                ฟาร์ม: {invoice.farm_name}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Invoice Items */}
        <div>
          <h4 className="font-semibold mb-4">รายการ</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">รายการ</th>
                  <th className="text-right p-4 font-medium">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-4">{invoice.description}</td>
                  <td className="text-right p-4 font-medium">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">ยอดรวมสุทธิ</span>
            <span className="text-2xl font-bold text-primary">
              {formatAmount(invoice.amount, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Payment Information */}
        {invoice.status === 'PAID' && invoice.payment_method && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">ข้อมูลการชำระเงิน</h4>
            <p className="text-green-700">วิธีการชำระ: {invoice.payment_method}</p>
            {invoice.paid_at && (
              <p className="text-green-700">วันที่ชำระ: {formatDate(invoice.paid_at)}</p>
            )}
          </div>
        )}

        {/* QR Code for Payment */}
        {invoice.status === 'UNPAID' && invoice.qr_code_data && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <h4 className="font-semibold text-blue-800 mb-3">ชำระเงินผ่าน QR Code</h4>
            <div className="bg-white p-4 rounded-lg inline-block border">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="h-32 w-32 text-muted-foreground" />
              </div>
            </div>
            <p className="text-blue-700 text-sm mt-3">
              สแกน QR Code เพื่อชำระเงินผ่านแอพธนาคารหรือ E-Wallet
            </p>
          </div>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ เกินกำหนดชำระ</h4>
            <p className="text-red-700">
              การชำระเงินเกินกำหนดแล้ว กรุณาชำระเงินให้เร็วที่สุด
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4">
          {invoice.status === 'UNPAID' && onPay && (
            <Button 
              onClick={() => onPay(invoice.id)}
              className="flex-1 min-w-32"
            >
              <QrCode className="h-4 w-4 mr-2" />
              ชำระเงิน
            </Button>
          )}
          
          {onDownload && (
            <Button 
              variant="outline"
              onClick={() => onDownload(invoice.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          )}
          
          {onPrint && (
            <Button 
              variant="outline"
              onClick={() => onPrint(invoice.id)}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t text-sm text-muted-foreground">
          <p>GACP Certification System</p>
          <p>ระบบรับรองมาตรฐาน GACP แบบดิจิทัล</p>
        </div>
      </CardContent>
    </Card>
  );
};