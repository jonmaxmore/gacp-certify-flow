import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Alert component not needed - removing unused import
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CreditCard, 
  VideoIcon, 
  MapPin, 
  Award, 
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { WorkflowStatusTracker } from '@/components/workflow/WorkflowStatusTracker';
import { PaymentManager } from '@/components/payments/PaymentManager';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PaymentPrompt } from '@/components/dashboard/PaymentPrompt';

interface ApplicationSummary {
  id: string;
  application_number: string;
  workflow_status: string;
  created_at: string;
  estimated_completion_date?: string;
  next_action_required?: string;
}

interface DashboardStats {
  total_applications: number;
  active_applications: number;
  pending_payments: number;
  completed_certifications: number;
  unread_notifications: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'payment' | 'assessment' | 'document' | 'other';
  action_url?: string;
}

export const EnhancedApplicantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_applications: 0,
    active_applications: 0,
    pending_payments: 0,
    completed_certifications: 0,
    unread_notifications: 0
  });
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch applications
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id, application_number, workflow_status, created_at, estimated_completion_date, next_action_required')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Set default task data to avoid errors
      const tasksData = { pending_payments: [] };

      // Fetch unread notifications count
      const { count: unreadCount, error: notifError } = await supabase
        .from('workflow_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'unread');

      if (notifError) throw notifError;

      // Process data
      setApplications(applicationsData || []);
      
      const activeApps = applicationsData?.filter(app => 
        !['CERTIFIED', 'REJECTED', 'EXPIRED'].includes(app.workflow_status)
      ) || [];

      const certifiedApps = applicationsData?.filter(app => 
        app.workflow_status === 'CERTIFIED'
      ) || [];

      setStats({
        total_applications: applicationsData?.length || 0,
        active_applications: activeApps.length,
        pending_payments: tasksData?.pending_payments?.length || 0,
        completed_certifications: certifiedApps.length,
        unread_notifications: unreadCount || 0
      });

      // Generate upcoming tasks
      generateUpcomingTasks(applicationsData || [], tasksData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUpcomingTasks = (apps: ApplicationSummary[], tasksData: any) => {
    const tasks: UpcomingTask[] = [];

    // Add payment tasks
    if (tasksData?.pending_payments) {
      tasksData.pending_payments.forEach((payment: any) => {
        tasks.push({
          id: `payment-${payment.id}`,
          title: `ชำระค่าธรรมเนียม ${payment.amount?.toLocaleString()} บาท`,
          description: `ค่าธรรมเนียม${payment.milestone === 'DOCUMENT_REVIEW' ? 'ตรวจเอกสาร' : 'ประเมิน'}`,
          due_date: payment.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high' as const,
          type: 'payment' as const,
          action_url: '/applicant/payments'
        });
      });
    }

    // Add application-specific tasks
    apps.forEach(app => {
      if (app.workflow_status === 'REVISION_REQUESTED') {
        tasks.push({
          id: `revision-${app.id}`,
          title: 'แก้ไขเอกสารตามข้อเสนอแนะ',
          description: `ใบสมัคร ${app.application_number}`,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent' as const,
          type: 'document' as const,
          action_url: `/applicant/applications/${app.id}`
        });
      }

      if (app.workflow_status.includes('ASSESSMENT_SCHEDULED')) {
        const isOnline = app.workflow_status.includes('ONLINE');
        tasks.push({
          id: `assessment-${app.id}`,
          title: `เข้าร่วมการประเมิน${isOnline ? 'ออนไลน์' : 'ในพื้นที่'}`,
          description: `ใบสมัคร ${app.application_number}`,
          due_date: app.estimated_completion_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high' as const,
          type: 'assessment' as const,
          action_url: '/applicant/assessments'
        });
      }
    });

    // Sort by priority and due date
    tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    setUpcomingTasks(tasks.slice(0, 5)); // Show top 5 tasks
  };

  const getWorkflowStatusBadge = (status: string) => {
    const statusMap = {
      'DRAFT': { variant: 'outline' as const, label: 'ร่าง' },
      'SUBMITTED': { variant: 'secondary' as const, label: 'ส่งแล้ว' },
      'PAYMENT_PENDING_REVIEW': { variant: 'destructive' as const, label: 'รอชำระค่าตรวจเอกสาร' },
      'UNDER_REVIEW': { variant: 'default' as const, label: 'ตรวจสอบเอกสาร' },
      'REVISION_REQUESTED': { variant: 'destructive' as const, label: 'ต้องแก้ไข' },
      'REVIEW_APPROVED': { variant: 'default' as const, label: 'เอกสารผ่าน' },
      'PAYMENT_PENDING_ASSESSMENT': { variant: 'destructive' as const, label: 'รอชำระค่าประเมิน' },
      'ONLINE_ASSESSMENT_SCHEDULED': { variant: 'default' as const, label: 'กำหนดประเมินออนไลน์' },
      'ONSITE_ASSESSMENT_SCHEDULED': { variant: 'default' as const, label: 'กำหนดประเมินพื้นที่' },
      'CERTIFIED': { variant: 'default' as const, label: 'ได้รับใบรับรอง' },
      'REJECTED': { variant: 'destructive' as const, label: 'ไม่ผ่าน' }
    };

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTaskIcon = (type: UpcomingTask['type']) => {
    const icons = {
      payment: CreditCard,
      assessment: VideoIcon,
      document: FileText,
      other: Clock
    };
    return icons[type];
  };

  const getPriorityColor = (priority: UpcomingTask['priority']) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">แดshboartเกษตรกร</h1>
          <p className="text-muted-foreground">
            ยินดีต้อนรับ, {user?.profile?.full_name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="gap-1">
            <Bell className="h-3 w-3" />
            การแจ้งเตือน {stats.unread_notifications}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_applications}</p>
                <p className="text-sm text-muted-foreground">ใบสมัครทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active_applications}</p>
                <p className="text-sm text-muted-foreground">กำลังดำเนินการ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending_payments}</p>
                <p className="text-sm text-muted-foreground">รอชำระเงิน</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed_certifications}</p>
                <p className="text-sm text-muted-foreground">ใบรับรองที่ได้</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Prompts - Show if payment is required */}
      {applications.length > 0 && applications.map(app => {
        const needsPayment = [
          'PAYMENT_PENDING_REVIEW',
          'SUBMITTED',
          'REJECTED_PAYMENT_REQUIRED',
          'PAYMENT_PENDING_ASSESSMENT',
          'REVIEW_APPROVED'
        ].includes(app.workflow_status);
        
        if (needsPayment) {
          return (
            <PaymentPrompt
              key={app.id}
              applicationId={app.id}
              workflowStatus={app.workflow_status}
              revisionCount={3} // You can pass actual revision count if available
            />
          );
        }
        return null;
      })}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="applications">ใบสมัคร</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workflow Status */}
            <div className="lg:col-span-2">
              {applications.length > 0 && (
                <WorkflowStatusTracker
                  currentStatus={applications[0].workflow_status}
                  userRole="applicant"
                  applicationData={applications[0]}
                />
              )}
            </div>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>งานที่ต้องทำ</span>
                </CardTitle>
                <CardDescription>
                  รายการงานที่ต้องดำเนินการในระยะใกล้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    ไม่มีงานที่ต้องทำในขณะนี้
                  </p>
                ) : (
                  upcomingTasks.map((task) => {
                    const Icon = getTaskIcon(task.type);
                    const isOverdue = new Date(task.due_date) < new Date();
                    
                    return (
                      <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <Icon className={cn("h-4 w-4 mt-0.5", getPriorityColor(task.priority))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn(
                              "text-xs",
                              isOverdue ? "text-red-500" : "text-muted-foreground"
                            )}>
                              {isOverdue ? "เกินกำหนด" : `ครบกำหนด ${new Date(task.due_date).toLocaleDateString('th-TH')}`}
                            </span>
                            {task.action_url && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                ดำเนินการ
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ใบสมัครของฉัน</CardTitle>
              <CardDescription>
                รายการใบสมัครรับรอง GACP ทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">ยังไม่มีใบสมัคร</p>
                  <Button className="mt-4">สร้างใบสมัครใหม่</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">{app.application_number}</h4>
                          {getWorkflowStatusBadge(app.workflow_status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ส่งเมื่อ: {new Date(app.created_at).toLocaleDateString('th-TH')}
                        </p>
                        {app.next_action_required && (
                          <p className="text-sm text-blue-600 mt-1">
                            การดำเนินการต่อไป: {app.next_action_required}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          ดูรายละเอียด
                        </Button>
                        {app.workflow_status === 'CERTIFIED' && (
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            ดาวน์โหลดใบรับรอง
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {applications.length > 0 ? (
            <PaymentManager applicationId={applications[0].id} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationCenter showHeader={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};