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
import { AppleStyleDashboard } from '@/components/dashboard/AppleStyleDashboard';

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

  const quickActions = [
    {
      title: 'สมัครใหม่',
      description: 'สร้างใบสมัครขอใบรับรอง GACP',
      icon: Plus,
      action: () => navigate('/applicant/application/new'),
      variant: 'primary' as const,
      disabled: !knowledgeTestPassed
    },
    {
      title: 'ชำระเงิน', 
      description: 'ชำระค่าธรรมเนียมการตรวจสอบ',
      icon: CreditCard,
      action: () => navigate('/applicant/payments'),
      variant: 'success' as const
    },
    {
      title: 'การประเมิน',
      description: 'ตารางการประเมินออนไลน์และในพื้นที่', 
      icon: Calendar,
      action: () => navigate('/applicant/schedule'),
      variant: 'default' as const
    }
  ];

  const nextSteps = [
    {
      title: 'เริ่มสมัคร',
      description: 'สร้างใบสมัครขอใบรับรอง GACP ครั้งแรก',
      action: 'สร้างใบสมัคร',
      priority: 'high' as const,
      dueDate: 'ภายใน 7 วัน'
    },
    {
      title: 'ทำแบบทดสอบ',
      description: 'ทำแบบทดสอบความรู้ GACP เพื่อปลดล็อคการสมัคร',
      action: 'เริ่มทดสอบ',
      priority: 'urgent' as const
    }
  ];

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
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">G</span>
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

      {/* Apple Style Dashboard */}
      <AppleStyleDashboard
        userName={user?.profile?.full_name || 'ผู้ใช้'}
        stats={stats}
        quickActions={quickActions}
        nextSteps={nextSteps}
        knowledgeTestPassed={knowledgeTestPassed}
        onKnowledgeTestClick={() => setShowKnowledgeTest(true)}
      />

      {/* Applications and Workflow - Additional Section */}
      {knowledgeTestPassed && applications && applications.length > 0 && (
        <div className="container mx-auto px-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications List */}
            <Card className="shadow-soft">
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
                    <div key={app.id} className="p-4 border border-border rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-soft">
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
            <Card className="shadow-soft">
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
        </div>
      )}

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