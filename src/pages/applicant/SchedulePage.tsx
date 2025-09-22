import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Assessment {
  id: string;
  application_id: string;
  type: 'ONLINE' | 'ONSITE';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduled_at: string;
  auditor_id?: string;
  notes?: string;
  meeting_url?: string;
  meeting_token?: string;
  applications?: {
    application_number: string;
    farm_name: string;
    applicant_name: string;
  };
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface Application {
  id: string;
  application_number: string;
  farm_name: string;
  status: string;
  created_at: string;
}

interface ScheduleRequest {
  application_id: string;
  assessment_type: 'ONLINE' | 'ONSITE';
  preferred_date: string;
  preferred_time: string;
  notes: string;
}

const SchedulePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's applications
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('id, application_number, farm_name, status, created_at')
        .eq('applicant_id', user?.id)
        .in('status', ['DOCS_APPROVED', 'PAYMENT_PENDING', 'ONLINE_SCHEDULED', 'ONSITE_SCHEDULED'])
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);

      // Load assessments for user's applications
      if (appsData && appsData.length > 0) {
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select(`
            *,
            applications!inner(application_number, farm_name, applicant_name),
            profiles(full_name, phone)
          `)
          .in('application_id', appsData.map(app => app.id))
          .order('scheduled_at', { ascending: true });

        if (assessmentsError) throw assessmentsError;
        setAssessments(assessmentsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการนัดหมายได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed assessment request functionality - handled by staff now

  const handleJoinOnlineAssessment = async (assessment: Assessment) => {
    if (assessment.meeting_url) {
      window.open(assessment.meeting_url, '_blank');
    } else {
      // Generate meeting URL if not exists
      try {
        const { data, error } = await supabase.functions.invoke('generate-meeting-link', {
          body: { assessment_id: assessment.id }
        });

        if (error) throw error;

        if (data?.meeting_url) {
          window.open(data.meeting_url, '_blank');
          loadData(); // Refresh to get updated meeting URL
        }
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเข้าร่วมการประเมินออนไลน์ได้",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'SCHEDULED': { label: 'กำหนดการแล้ว', variant: 'secondary' as const },
      'IN_PROGRESS': { label: 'กำลังดำเนินการ', variant: 'default' as const },
      'COMPLETED': { label: 'เสร็จสิ้น', variant: 'default' as const },
      'CANCELLED': { label: 'ยกเลิก', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAssessmentIcon = (type: string) => {
    return type === 'ONLINE' ? 
      <Video className="h-5 w-5 text-primary" /> : 
      <MapPin className="h-5 w-5 text-success" />;
  };

  const canRequestSchedule = (app: Application) => {
    return ['DOCS_APPROVED', 'PAYMENT_PENDING'].includes(app.status);
  };

  const upcomingAssessments = assessments.filter(a => 
    a.status === 'SCHEDULED' && new Date(a.scheduled_at) > new Date()
  );

  const pastAssessments = assessments.filter(a => 
    a.status !== 'SCHEDULED' || new Date(a.scheduled_at) <= new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">การนัดหมายประเมินของฉัน</h1>
          <p className="text-muted-foreground">
            ติดตามการนัดหมายประเมินที่เจ้าหน้าที่กำหนดให้
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-info/10">
            <AlertTriangle className="mr-1 h-3 w-3" />
            เจ้าหน้าที่จะติดต่อเพื่อนัดหมายประเมิน
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">การนัดหมายทั้งหมด</p>
                <p className="text-3xl font-bold">{assessments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">นัดหมายที่กำลังจะมาถึง</p>
                <p className="text-3xl font-bold text-primary">{upcomingAssessments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ประเมินออนไลน์</p>
                <p className="text-3xl font-bold text-blue-600">
                  {assessments.filter(a => a.type === 'ONLINE').length}
                </p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ประเมินออนไซต์</p>
                <p className="text-3xl font-bold text-success">
                  {assessments.filter(a => a.type === 'ONSITE').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              การนัดหมายที่กำลังจะมาถึง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getAssessmentIcon(assessment.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {assessment.applications?.application_number} - {assessment.applications?.farm_name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          การประเมิน{assessment.type === 'ONLINE' ? 'ออนไลน์' : 'ออนไซต์'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(assessment.scheduled_at).toLocaleDateString('th-TH')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(assessment.scheduled_at).toLocaleTimeString('th-TH', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          {assessment.profiles && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>ผู้ประเมิน: {assessment.profiles.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assessment.status)}
                      {assessment.type === 'ONLINE' && assessment.status === 'SCHEDULED' && (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinOnlineAssessment(assessment)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Video className="mr-2 h-4 w-4" />
                          เข้าร่วมการประเมิน
                        </Button>
                      )}
                    </div>
                  </div>
                  {assessment.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{assessment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ประวัติการนัดหมาย
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ยังไม่มีประวัติการนัดหมาย</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastAssessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getAssessmentIcon(assessment.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {assessment.applications?.application_number} - {assessment.applications?.farm_name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          การประเมิน{assessment.type === 'ONLINE' ? 'ออนไลน์' : 'ออนไซต์'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(assessment.scheduled_at).toLocaleDateString('th-TH')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(assessment.scheduled_at).toLocaleTimeString('th-TH', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assessment.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-info/10 rounded-full">
              <Calendar className="h-6 w-6 text-info" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-info">ข้อมูลการนัดหมายประเมิน</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• หลังจากเอกสารได้รับการอนุมัติ เจ้าหน้าที่จะติดต่อเพื่อนัดหมายการประเมิน</p>
                <p>• การประเมินจะดำเนินการในรูปแบบออนไลน์หรือออนไซต์ตามความเหมาะสม</p>
                <p>• ท่านจะได้รับการแจ้งเตือนเมื่อมีการกำหนดนัดหมาย</p>
                <p>• สามารถดูรายละเอียดและเข้าร่วมการประเมินได้จากหน้านี้</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;