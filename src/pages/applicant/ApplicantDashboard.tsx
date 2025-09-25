import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CreditCard, Calendar, Download, LogOut, Clock, CheckCircle, AlertCircle, Users, Brain, Award, BookOpen, ArrowLeft, ChevronRight, Video, QrCode } from 'lucide-react';
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
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-semibold">Applicant Dashboard</h1>
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
              
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
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

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Status */}
          {applications && applications.length > 0 && (applications[0]?.revision_count_current || 0) > 0 && (
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Document Rejected ({applications[0]?.revision_count_current || 0}/{applications[0]?.max_free_revisions || 2})</h3>
                      <p className="text-sm text-red-600">Please review and resubmit</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessment Scheduled */}
          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Assessment Scheduled</h3>
                    <p className="text-sm text-blue-600">Online assessment ready</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment for Rejected 3rd time */}
          {applications && applications.length > 0 && applications[0]?.workflow_status === 'REJECTED_PAYMENT_REQUIRED' && (
            <Card>
              <CardContent className="p-6">
                <Button className="w-full h-20 bg-green-600 hover:bg-green-700 text-white text-lg">
                  <div className="text-center">
                    <div className="font-bold">Pay 5,000</div>
                    <div className="text-sm">Rejected 3times</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment before scheduling */}
          <Card>
            <CardContent className="p-6">
              <Button variant="outline" className="w-full h-20 text-lg">
                <div className="text-center">
                  <div className="font-bold">Pay 5,000</div>
                  <div className="text-sm">Before scheduling</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Jul 26, 2025</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>10:00 am</span>
                  </div>
                  <Badge variant="outline">In line</Badge>
                  <Badge variant="outline">Online Assessment</Badge>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
                <Button variant="outline" className="flex-1">
                  Coin Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Section */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Certificate</span>
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">USAL9Q</div>
            </div>
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