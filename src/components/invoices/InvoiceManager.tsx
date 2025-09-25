import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, FileText, Download, Eye, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceView } from './InvoiceView';
import { PaymentDialog } from './PaymentDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Invoice {
  id: string;
  invoice_number: string;
  application_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  issued_at: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  receipt_number?: string;
  qr_code_data?: string;
  applications?: {
    application_number?: string;
    applicant_name?: string;
    farm_name?: string;
  };
}

interface InvoiceManagerProps {
  applicationId?: string;
  className?: string;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  applicationId,
  className
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceView, setShowInvoiceView] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [applicationId]);

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          applications!inner(
            application_number,
            applicant_name,
            farm_name
          )
        `)
        .order('created_at', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceView(true);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    fetchInvoices();
    setShowPaymentDialog(false);
    setSelectedInvoice(null);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "กำลังดาวน์โหลด",
      description: "กำลังสร้างไฟล์ PDF...",
    });
    // Implement PDF download functionality here
  };

  const handlePrintInvoice = (invoiceId: string) => {
    toast({
      title: "กำลังพิมพ์",
      description: "กำลังเตรียมเอกสารสำหรับพิมพ์...",
    });
    // Implement print functionality here
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      UNPAID: { variant: 'destructive' as const, label: 'ยังไม่ชำระ' },
      PAID: { variant: 'default' as const, label: 'ชำระแล้ว' },
      CANCELLED: { variant: 'secondary' as const, label: 'ยกเลิก' },
      OVERDUE: { variant: 'destructive' as const, label: 'เกินกำหนด' }
    };
    
    const config = variants[status] || variants.UNPAID;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
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

  const pendingInvoices = invoices.filter(i => i.status === 'UNPAID');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');

  return (
    <>
      <div className={className}>
        {/* Pending Invoices */}
        {pendingInvoices.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                ใบแจ้งหนี้ที่ต้องชำระ
              </CardTitle>
              <CardDescription>
                รายการใบแจ้งหนี้ที่ยังไม่ได้ชำระเงิน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingInvoices.map((invoice) => {
                const isOverdue = new Date(invoice.due_date) < new Date();
                
                return (
                  <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{invoice.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          เลขที่: {invoice.invoice_number}
                        </p>
                        {invoice.applications && (
                          <p className="text-sm text-muted-foreground">
                            {invoice.applications.application_number} - {invoice.applications.farm_name}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </div>
                        <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue ? 'เกินกำหนด: ' : 'กำหนดชำระ: '}
                          {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดู
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handlePayInvoice(invoice)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          ชำระเงิน
                        </Button>
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                        <p className="text-red-700 text-sm">
                          ⚠️ ใบแจ้งหนี้นี้เกินกำหนดชำระแล้ว กรุณาชำระเงินให้เร็วที่สุด
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Paid Invoices */}
        {paidInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-500" />
                ประวัติการชำระเงิน
              </CardTitle>
              <CardDescription>
                รายการใบเสร็จที่ชำระเงินแล้ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paidInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{invoice.description}</p>
                      <p className="text-xs text-muted-foreground">
                        ใบเสร็จ: {invoice.receipt_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ชำระเมื่อ: {invoice.paid_at && formatDate(invoice.paid_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {invoices.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ยังไม่มีใบแจ้งหนี้</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice View Dialog */}
      <Dialog open={showInvoiceView} onOpenChange={setShowInvoiceView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <InvoiceView
              invoice={{
                ...selectedInvoice,
                status: selectedInvoice.status as 'UNPAID' | 'PAID' | 'CANCELLED' | 'OVERDUE'
              }}
              onPay={(invoiceId) => {
                setShowInvoiceView(false);
                handlePayInvoice(selectedInvoice);
              }}
              onDownload={handleDownloadInvoice}
              onPrint={handlePrintInvoice}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};