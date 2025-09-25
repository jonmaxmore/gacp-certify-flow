import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, LogOut, Search, Filter, Eye, MessageSquare, ArrowRight, ArrowLeft, User, Upload, ThumbsUp, ThumbsDown } from 'lucide-react';
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">3 pending notifications</span>
              </div>
            </div>
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
            onClick={() => navigate('/reviewer/queue')}
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
            onClick={() => navigate('/reviewer/queue')}
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
            onClick={() => navigate('/reviewer/queue')}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Queue */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "John Doe", status: "Payment pending", avatar: "👨", action: "💳" },
                    { name: "Jane Smith", status: "Document submitted", avatar: "👩", action: "📄" },
                    { name: "Bob Johnson", status: "Payment paid", avatar: "👨", action: "🗂️" },
                    { name: "Alice Davis", status: "Documents rejected", avatar: "👩", action: "📋" }
                  ].map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl">{app.avatar}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-muted-foreground">{app.status}</p>
                        </div>
                      </div>
                      <div className="text-xl">{app.action}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Review */}
            <Card>
              <CardHeader>
                <CardTitle>Document Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">👨</span>
                    </div>
                    <div>
                      <h4 className="font-medium">John Doe</h4>
                      <p className="text-sm text-muted-foreground">(in part sec)</p>
                    </div>
                  </div>

                  {/* Document Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[1, 2, 3, 4].map((doc) => (
                      <div key={doc} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button variant="outline" className="flex-1">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button className="flex-1">
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {/* Notification */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">ℹ️</span>
                      </div>
                      <div className="text-sm">
                        <strong>Applicant: John Doe, with Application #123 has been approved</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewerDashboard;