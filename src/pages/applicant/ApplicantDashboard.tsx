import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CreditCard, Calendar, Download, LogOut, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ApplicationData {
  id: string;
  application_number: string;
  status: string;
  created_at: string;
  farm_name?: string;
  applicant_name?: string;
}

interface PaymentData {
  id: string;
  milestone: number;
  amount: number;
  status: string;
  created_at: string;
}

interface AssessmentData {
  id: string;
  type: string;
  status: string;
  scheduled_at?: string;
}

const ApplicantDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch applications
      const { data: appsData } = await supabase
        .from('applications')
        .select('id, application_number, status, created_at, farm_name, applicant_name')
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsData) setApplications(appsData);

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, milestone, amount, status, created_at')
        .in('application_id', appsData?.map(app => app.id) || [])
        .order('created_at', { ascending: false });

      if (paymentsData) setPayments(paymentsData);

      // Fetch assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('id, type, status, scheduled_at')
        .in('application_id', appsData?.map(app => app.id) || [])
        .order('scheduled_at', { ascending: false });

      if (assessmentsData) setAssessments(assessmentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { label: 'แบบร่าง', class: 'status-draft' },
      'SUBMITTED': { label: 'ส่งแล้ว', class: 'status-submitted' },
      'UNDER_REVIEW': { label: 'กำลังตรวจสอบ', class: 'status-under-review' },
      'RETURNED': { label: 'ส่งกลับแก้ไข', class: 'status-returned' },
      'DOCS_APPROVED': { label: 'เอกสารผ่าน', class: 'status-docs-approved' },
      'PAYMENT_PENDING': { label: 'รอชำระเงิน', class: 'status-payment-pending' },
      'ONLINE_SCHEDULED': { label: 'นัดประเมินออนไลน์', class: 'status-online-scheduled' },
      'ONSITE_SCHEDULED': { label: 'นัดประเมินออนไซต์', class: 'status-online-scheduled' },
      'CERTIFIED': { label: 'ผ่านการรับรอง', class: 'status-certified' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: 'status-draft' };
    return <Badge className={`status-badge ${config.class}`}>{config.label}</Badge>;
  };

  const getProgressPercentage = (status: string) => {
    const statusProgress = {
      'DRAFT': 10,
      'SUBMITTED': 20,
      'UNDER_REVIEW': 30,
      'RETURNED': 25,
      'DOCS_APPROVED': 50,
      'PAYMENT_PENDING': 60,
      'ONLINE_SCHEDULED': 70,
      'ONLINE_COMPLETED': 80,
      'ONSITE_SCHEDULED': 85,
      'ONSITE_COMPLETED': 90,
      'CERTIFIED': 100,
    };
    return statusProgress[status as keyof typeof statusProgress] || 0;
  };

  const stats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(app => !['CERTIFIED', 'REVOKED'].includes(app.status)).length,
    approvedApplications: applications.filter(app => app.status === 'CERTIFIED').length,
    completedPayments: payments.filter(payment => payment.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Header with Apple styling */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">GACP Certification</h1>
                <p className="text-sm text-gray-500">ยินดีต้อนรับ, {user?.profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>ผู้สมัคร</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>ออกจากระบบ</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dashboard-widget">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ใบสมัครทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-widget">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">กำลังดำเนินการ</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingApplications}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-widget">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ผ่านการรับรอง</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approvedApplications}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-widget">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">การชำระเงิน</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.completedPayments}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* New Application Card */}
          <Card className="card-apple hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">สร้างใบสมัครใหม่</CardTitle>
                  <CardDescription>เริ่มต้นกระบวนการสมัครรับรองมาตรฐาน GACP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link to="/applicant/application/new">
                <Button className="w-full btn-primary">
                  เริ่มต้นสมัคร
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Knowledge Test Card */}
          <Card className="card-apple hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">แบบทดสอบความรู้</CardTitle>
                  <CardDescription>ทำแบบทดสอบความรู้เกี่ยวกับมาตรฐาน GACP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                เริ่มทำแบบทดสอบ
              </Button>
            </CardContent>
          </Card>

          {/* Quick Payment */}
          <Card className="card-apple hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">ชำระค่าธรรมเนียม</CardTitle>
                  <CardDescription>ชำระค่าตรวจสอบเอกสารและค่าประเมิน</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                ดูรายการชำระเงิน
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>ใบสมัครล่าสุด</span>
              </CardTitle>
              <CardDescription>
                รายการใบสมัครและสถานะการดำเนินการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{app.application_number}</p>
                          <p className="text-sm text-gray-600">{app.farm_name || 'ไม่ระบุชื่อฟาร์ม'}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>ความคืบหน้า</span>
                          <span>{getProgressPercentage(app.status)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${getProgressPercentage(app.status)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          สร้างเมื่อ {new Date(app.created_at).toLocaleDateString('th-TH')}
                        </span>
                        <Button size="sm" variant="outline">
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </div>
                  ))}
                  {applications.length > 3 && (
                    <Button variant="outline" className="w-full">
                      ดูใบสมัครทั้งหมด ({applications.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">ยังไม่มีใบสมัคร</p>
                  <Link to="/applicant/application/new">
                    <Button>สร้างใบสมัครแรก</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links & Status */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>การดำเนินการต่อไป</span>
              </CardTitle>
              <CardDescription>
                ขั้นตอนที่ต้องดำเนินการในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Next Actions based on application status */}
                {applications.length === 0 ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">เริ่มต้นการสมัคร</p>
                        <p className="text-sm text-blue-700">สร้างใบสมัครรับรองมาตรฐาน GACP ใบแรกของคุณ</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {applications.some(app => app.status === 'DRAFT') && (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="font-medium text-amber-900">ใบสมัครแบบร่าง</p>
                            <p className="text-sm text-amber-700">มีใบสมัครที่ยังไม่ได้ส่ง กรุณาเสร็จสิ้นและส่งใบสมัคร</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {applications.some(app => app.status === 'PAYMENT_PENDING') && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-purple-900">รอชำระเงิน</p>
                            <p className="text-sm text-purple-700">กรุณาชำระค่าธรรมเนียมเพื่อดำเนินการต่อ</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {applications.some(app => ['ONLINE_SCHEDULED', 'ONSITE_SCHEDULED'].includes(app.status)) && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">นัดหมายประเมิน</p>
                            <p className="text-sm text-green-700">มีนัดหมายประเมินที่กำลังจะถึง</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Contact Support */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">ต้องการความช่วยเหลือ?</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      คู่มือการใช้งาน
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      ติดต่อเจ้าหน้าที่
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ApplicantDashboard;