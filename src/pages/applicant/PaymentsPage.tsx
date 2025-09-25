import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, AlertCircle, ArrowLeft, Receipt, CreditCard, Download, Printer, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceManager } from '@/components/invoices/InvoiceManager';
import { ModernPaymentFlow } from '@/components/payments/ModernPaymentFlow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          applications!payments_application_id_fkey(
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

  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentFlow(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentFlow(false);
    setSelectedInvoice(null);
    fetchPayments(); // Refresh data
  };

  const stats = {
    totalInvoices: payments.length,
    pendingPayments: payments.filter(p => p.status === 'PENDING').length,
    completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-background to-blue-50/30">
      <header className="bg-white/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              การชำระเงิน
            </h1>
            <p className="text-muted-foreground">จัดการการชำระเงิน ใบแจ้งหนี้ และใบเสร็จรับเงิน</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Payment Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">ใบแจ้งหนี้ทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">รอชำระ</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.pendingPayments}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">ชำระแล้ว</p>
                  <p className="text-3xl font-bold text-green-900">{stats.completedPayments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">ยอดรวม</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalAmount.toLocaleString()} ฿</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Invoice Manager */}
        <InvoiceManager onPayInvoice={handlePayInvoice} />

        {/* Payment Instructions */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CreditCard className="h-5 w-5" />
              วิธีการชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">ชำระออนไลน์ (แนะนำ)</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• PromptPay QR Code - ทันที</li>
                  <li>• Mobile Banking - ทันที</li>
                  <li>• บัตรเครดิต/เดบิต - 1-2 นาที</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">ชำระแบบดั้งเดิม</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• โอนธนาคาร - 1-3 วันทำการ</li>
                  <li>• เช็ค - 3-5 วันทำการ</li>
                  <li>• เงินสด (ที่สำนักงาน) - ทันที</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modern Payment Flow Dialog */}
      <Dialog open={showPaymentFlow} onOpenChange={setShowPaymentFlow}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ชำระเงิน</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <ModernPaymentFlow
              invoice={selectedInvoice}
              milestone={selectedInvoice.milestone || 1}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;