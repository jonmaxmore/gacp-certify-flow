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
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [scheduleRequest, setScheduleRequest] = useState<ScheduleRequest>({
    application_id: '',
    assessment_type: 'ONLINE',
    preferred_date: '',
    preferred_time: '',
    notes: ''
  });

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

  const handleRequestSchedule = async () => {
    try {
      if (!scheduleRequest.application_id || !scheduleRequest.preferred_date || !scheduleRequest.preferred_time) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกข้อมูลให้ครบถ้วน",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke('schedule-assessment', {
        body: {
          ...scheduleRequest,
          scheduled_at: `${scheduleRequest.preferred_date}T${scheduleRequest.preferred_time}:00`,
          user_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "ส่งคำขอนัดหมายสำเร็จ",
        description: "เจ้าหน้าที่จะติดต่อกลับภายใน 2-3 วันทำการ",
      });

      setShowRequestDialog(false);
      setScheduleRequest({
        application_id: '',
        assessment_type: 'ONLINE',
        preferred_date: '',
        preferred_time: '',
        notes: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error requesting schedule:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งคำขอนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">การนัดหมายประเมิน</h1>
          <p className="text-muted-foreground">
            จัดการการนัดหมายประเมินออนไลน์และออนไซต์
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          ขอนัดหมายใหม่
        </Button>
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

      {/* Request Schedule Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ขอนัดหมายประเมิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>เลือกใบสมัคร</Label>
              <Select 
                value={scheduleRequest.application_id} 
                onValueChange={(value) => setScheduleRequest(prev => ({...prev, application_id: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกใบสมัคร" />
                </SelectTrigger>
                <SelectContent>
                  {applications
                    .filter(app => canRequestSchedule(app))
                    .map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.application_number} - {app.farm_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ประเภทการประเมิน</Label>
              <Select 
                value={scheduleRequest.assessment_type} 
                onValueChange={(value) => setScheduleRequest(prev => ({...prev, assessment_type: value as 'ONLINE' | 'ONSITE'}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">ประเมินออนไลน์</SelectItem>
                  <SelectItem value="ONSITE">ประเมินออนไซต์</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>วันที่ต้องการ</Label>
              <Input
                type="date"
                value={scheduleRequest.preferred_date}
                onChange={(e) => setScheduleRequest(prev => ({...prev, preferred_date: e.target.value}))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label>เวลาที่ต้องการ</Label>
              <Input
                type="time"
                value={scheduleRequest.preferred_time}
                onChange={(e) => setScheduleRequest(prev => ({...prev, preferred_time: e.target.value}))}
              />
            </div>

            <div>
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                value={scheduleRequest.notes}
                onChange={(e) => setScheduleRequest(prev => ({...prev, notes: e.target.value}))}
                placeholder="เพิ่มข้อมูลเพิ่มเติมสำหรับการนัดหมาย"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleRequestSchedule}>
                ส่งคำขอ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;