import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, LogOut, Search, Filter, Eye, MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ReviewerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    returned: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:applicant_id(full_name, organization_name)
        `)
        .in('status', ['SUBMITTED', 'UNDER_REVIEW'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status');

      if (error) throw error;

      const stats = {
        pending: data.filter(app => ['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)).length,
        approved: data.filter(app => app.status === 'DOCS_APPROVED').length,
        returned: data.filter(app => app.status === 'RETURNED').length,
        total: data.length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: 'ส่งแล้ว', variant: 'secondary' },
      UNDER_REVIEW: { label: 'กำลังตรวจสอบ', variant: 'default' },
      DOCS_APPROVED: { label: 'อนุมัติเอกสาร', variant: 'success' },
      RETURNED: { label: 'ส่งกลับแก้ไข', variant: 'destructive' },
      PAYMENT_PENDING: { label: 'รอชำระเงิน', variant: 'warning' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
            <p className="text-muted-foreground">ยินดีต้อนรับ, {user?.profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รอตรวจสอบ</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">อนุมัติแล้ว</p>
                  <p className="text-3xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ส่งกลับแก้ไข</p>
                  <p className="text-3xl font-bold">{stats.returned}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => console.log('Search applications')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">ค้นหาใบสมัคร</h3>
                  <p className="text-sm text-muted-foreground">ค้นหาด้วยหมายเลขใบสมัคร</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => console.log('Filter by status')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Filter className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">กรองตามสถานะ</h3>
                  <p className="text-sm text-muted-foreground">กรองใบสมัครตามสถานะ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => console.log('Message templates')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">เทมเพลตข้อความ</h3>
                  <p className="text-sm text-muted-foreground">จัดการข้อความมาตรฐาน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Queue */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ใบสมัครรอตรวจสอบ
                  </CardTitle>
                  <CardDescription>
                    รายการใบสมัครที่ต้องการการตรวจสอบเอกสาร
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  กรอง
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีใบสมัครรอตรวจสอบ
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{app.application_number}</h4>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {app.profiles?.full_name} - {app.profiles?.organization_name || app.farm_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ส่งเมื่อ: {new Date(app.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => console.log('Review application', app.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            ตรวจสอบ
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => console.log('Application details', app.id)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {applications.length > 0 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">ดูรายการทั้งหมด</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReviewerDashboard;