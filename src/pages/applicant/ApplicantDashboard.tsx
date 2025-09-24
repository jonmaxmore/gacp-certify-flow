import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CreditCard, Calendar, Download, LogOut, Clock, CheckCircle, AlertCircle, Users, Brain, Award, BookOpen } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { Link, useNavigate } from 'react-router-dom';
import { KnowledgeTestModule } from '@/components/modules/knowledge-test/KnowledgeTestModule';
import { WorkflowStatusTracker } from '@/components/workflow/WorkflowStatusTracker';
import { PaymentManager } from '@/components/payments/PaymentManager';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ApplicationData {
  id: string;
  application_number: string;
  status: string;
  workflow_status: string;
  created_at: string;
  farm_name?: string;
  applicant_name?: string;
}

interface TestResult {
  id: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
}

const ApplicantDashboard = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation('dashboard');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [knowledgeTestPassed, setKnowledgeTestPassed] = useState(false);
  const [showKnowledgeTest, setShowKnowledgeTest] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  const { 
    applications, 
    userTasks, 
    loading: workflowLoading, 
    getWorkflowProgress, 
    getNextAction 
  } = useWorkflowStatus();

  useEffect(() => {
    checkKnowledgeTestStatus();
  }, [user]);

  const checkKnowledgeTestStatus = async () => {
    if (!user?.id) return;
    
    try {
      // Check if user has passed knowledge test
      // For demo, we'll check if user has any applications or use localStorage
      const testStatus = localStorage.getItem(`knowledge_test_${user.id}`);
      if (testStatus) {
        const result = JSON.parse(testStatus);
        setKnowledgeTestPassed(result.passed);
        setTestResult(result);
      }
    } catch (error) {
      console.error('Error checking test status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCompleted = (result: TestResult) => {
    setTestResult(result);
    setKnowledgeTestPassed(result.passed);
    setShowKnowledgeTest(false);
    
    // Store result locally for demo
    localStorage.setItem(`knowledge_test_${user?.id}`, JSON.stringify(result));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { label: 'แบบร่าง', variant: 'secondary' as const, icon: FileText },
      'SUBMITTED': { label: 'ส่งแล้ว', variant: 'default' as const, icon: CheckCircle },
      'PAYMENT_PENDING_REVIEW': { label: 'รอชำระค่าตรวจเอกสาร', variant: 'destructive' as const, icon: CreditCard },
      'UNDER_REVIEW': { label: 'กำลังตรวจสอบ', variant: 'default' as const, icon: Clock },
      'PAYMENT_PENDING_ASSESSMENT': { label: 'รอชำระค่าประเมิน', variant: 'destructive' as const, icon: CreditCard },
      'ONLINE_ASSESSMENT_SCHEDULED': { label: 'นัดประเมินออนไลน์', variant: 'default' as const, icon: Calendar },
      'CERTIFIED': { label: 'ได้รับใบรับรอง', variant: 'default' as const, icon: Award },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: AlertCircle 
    };
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    totalApplications: applications?.length || 0,
    pendingApplications: applications?.filter(app => !['CERTIFIED', 'REJECTED'].includes(app.workflow_status)).length || 0,
    approvedApplications: applications?.filter(app => app.workflow_status === 'CERTIFIED').length || 0,
    knowledgeTestScore: testResult?.percentage || 0,
  };

  if (loading || workflowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">แพลตฟอร์ม GACP</h1>
                <p className="text-sm text-muted-foreground">ยินดีต้อนรับ, {user?.profile?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                การแจ้งเตือน
                {userTasks?.unread_notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {userTasks.unread_notifications}
                  </Badge>
                )}
              </Button>
              
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>ผู้สมัคร</span>
              </div>
              
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Knowledge Test Section */}
        {!knowledgeTestPassed && (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-warning" />
                <div>
                  <CardTitle className="text-warning">จำเป็นต้องทำแบบทดสอบความรู้ก่อน</CardTitle>
                  <CardDescription>
                    คุณต้องผ่านแบบทดสอบความรู้ GACP ก่อนที่จะสามารถสมัครขอใบรับรองได้
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowKnowledgeTest(true)} className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                เริ่มทำแบบทดสอบความรู้
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ใบสมัครทั้งหมด</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalApplications}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">กำลังดำเนินการ</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingApplications}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ได้รับใบรับรอง</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approvedApplications}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">คะแนนทดสอบ</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.knowledgeTestScore}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {knowledgeTestPassed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">สมัครใหม่</CardTitle>
                    <CardDescription>สร้างใบสมัครขอใบรับรอง GACP</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to="/applicant/application/new">
                  <Button className="w-full">
                    เริ่มสมัคร
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ชำระเงิน</CardTitle>
                    <CardDescription>ชำระค่าธรรมเนียมการตรวจสอบ</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to="/applicant/payments">
                  <Button variant="outline" className="w-full">
                    ดูรายการชำระเงิน
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">การประเมิน</CardTitle>
                    <CardDescription>ตารางการประเมินออนไลน์และในพื้นที่</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to="/applicant/schedule">
                  <Button variant="outline" className="w-full">
                    ดูตารางเวลา
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications and Workflow */}
        {knowledgeTestPassed && applications && applications.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>ใบสมัครล่าสุด</span>
                </CardTitle>
                <CardDescription>
                  ติดตามสถานะใบสมัครของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Workflow Status Tracker for each application */}
                      <div className="mb-4">
                        <WorkflowStatusTracker 
                          currentStatus={app.workflow_status}
                          applicationData={app}
                          userRole="applicant"
                        />
                      </div>
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">{app.application_number}</p>
                          <p className="text-sm text-muted-foreground">{app.farm_name || 'ไม่ระบุชื่อฟาร์ม'}</p>
                        </div>
                        {getStatusBadge(app.workflow_status)}
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          สร้างเมื่อ {formatDate(app.created_at, language)}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/applicant/application/${app.id}`}>
                              ดูรายละเอียด
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payments for each application */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>การชำระเงิน</span>
                </CardTitle>
                <CardDescription>
                  ค่าธรรมเนียมและสถานะการชำระเงิน
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.map((app) => (
                  <div key={app.id} className="mb-4">
                    <PaymentManager applicationId={app.id} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State for Knowledge Test Not Passed */}
        {!knowledgeTestPassed && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                เริ่มต้นการเรียนรู้ GACP
              </h3>
              <p className="text-muted-foreground mb-6">
                ทำแบบทดสอบความรู้เพื่อปลดล็อคการสมัครขอใบรับรอง
              </p>
              <Button onClick={() => setShowKnowledgeTest(true)} size="lg">
                <BookOpen className="h-4 w-4 mr-2" />
                เริ่มแบบทดสอบ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State for No Applications */}
        {knowledgeTestPassed && (!applications || applications.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ยังไม่มีใบสมัคร
              </h3>
              <p className="text-muted-foreground mb-6">
                เริ่มสมัครขอใบรับรอง GACP เพื่อรับการรับรองมาตรฐานการเกษตร
              </p>
              <Button asChild size="lg">
                <Link to="/applicant/application/new">
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบสมัครใหม่
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Knowledge Test Dialog */}
      <Dialog open={showKnowledgeTest} onOpenChange={setShowKnowledgeTest}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แบบทดสอบความรู้ GACP</DialogTitle>
          </DialogHeader>
          <KnowledgeTestModule
            userId={user?.id || ''}
            onTestCompleted={handleTestCompleted}
          />
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>การแจ้งเตือน</DialogTitle>
          </DialogHeader>
          <NotificationCenter />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicantDashboard;