import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, AlertCircle, ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceManager } from '@/components/invoices/InvoiceManager';

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

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          applications!inner(
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/applicant/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">การชำระเงิน</h1>
            <p className="text-muted-foreground">ติดตามสถานะการชำระค่าธรรมเนียมทั้งหมด</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <InvoiceManager />
      </main>
    </div>
  );
};

export default PaymentsPage;