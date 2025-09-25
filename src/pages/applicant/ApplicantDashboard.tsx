import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CreditCard, Calendar, Download, LogOut, Clock, CheckCircle, AlertCircle, Users, Brain, Award, BookOpen, ArrowLeft, ChevronRight, Video, QrCode, BarChart3, TrendingUp, Sprout as Seedling } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { Link, useNavigate } from 'react-router-dom';
import { KnowledgeTestModule } from '@/components/modules/knowledge-test/KnowledgeTestModule';
import { WorkflowStatusTracker } from '@/components/workflow/WorkflowStatusTracker';
import { PaymentManager } from '@/components/payments/PaymentManager';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppleStyleDashboard } from '@/components/dashboard/AppleStyleDashboard';
import { WorkflowProgressStepper } from '@/components/workflow/WorkflowProgressStepper';
import { RejectionCountBadge } from '@/components/dashboard/RejectionCountBadge';
import { FarmManagementDashboard } from '@/components/applicant/FarmManagementDashboard';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-background to-blue-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <Seedling className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    GACP Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">ระบบจัดการใบรับรองมาตรฐาน GACP</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative hover:bg-accent/50"
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
              
              <Button variant="outline" onClick={handleSignOut} size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">ใบสมัครทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">กำลังดำเนินการ</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.pendingApplications}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">ได้รับใบรับรอง</p>
                  <p className="text-3xl font-bold text-green-900">{stats.approvedApplications}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">คะแนนทดสอบ</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.knowledgeTestScore}%</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Stepper */}
        {applications && applications.length > 0 && (
          <div className="mb-8">
            <WorkflowProgressStepper 
              currentStatus={applications[0]?.workflow_status}
              revisionCount={applications[0]?.revision_count_current || 0}
              maxFreeRevisions={applications[0]?.max_free_revisions || 2}
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              การดำเนินการหลัก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all"
                    onClick={action.action}
                    disabled={action.disabled}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Farm Management Dashboard */}
        <FarmManagementDashboard />

        {/* Knowledge Test Section */}
        {!knowledgeTestPassed && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Brain className="h-5 w-5" />
                แบบทดสอบความรู้ GACP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 mb-2">
                    คุณต้องผ่านแบบทดสอบความรู้ GACP ก่อนสร้างใบสมัคร
                  </p>
                  <p className="text-sm text-yellow-600">
                    คะแนนผ่าน: 80% | เวลา: 30 นาที
                  </p>
                </div>
                <Button onClick={() => setShowKnowledgeTest(true)} className="bg-yellow-600 hover:bg-yellow-700">
                  <Brain className="h-4 w-4 mr-2" />
                  เริ่มทดสอบ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ใบสมัครล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!applications || applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">ยังไม่มีใบสมัคร</p>
                {knowledgeTestPassed ? (
                  <Button onClick={() => navigate('/applicant/application/new')}>
                    สร้างใบสมัครแรก
                  </Button>
                ) : (
                  <p className="text-sm text-yellow-600">ทำแบบทดสอบเพื่อปลดล็อคการสมัคร</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{app.application_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          {app.farm_name || 'ไม่ระบุชื่อฟาร์ม'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          สร้างเมื่อ: {formatDate(app.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(app.workflow_status)}
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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