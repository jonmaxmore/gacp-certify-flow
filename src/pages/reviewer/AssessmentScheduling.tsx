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
  Users,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
    applicant_id: string;
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
  applicant_name: string;
  applicant_id: string;
  status: string;
  created_at: string;
}

interface CreateAssessmentRequest {
  application_id: string;
  assessment_type: 'ONLINE' | 'ONSITE';
  scheduled_date: string;
  scheduled_time: string;
  auditor_id: string;
  duration_minutes: number;
  notes: string;
}

const AssessmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditors, setAuditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createRequest, setCreateRequest] = useState<CreateAssessmentRequest>({
    application_id: '',
    assessment_type: 'ONLINE',
    scheduled_date: '',
    scheduled_time: '',
    auditor_id: '',
    duration_minutes: 120,
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
      
      // Load applications ready for assessment (documents approved)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'DOCS_APPROVED')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);

      // Load all assessments for oversight
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          applications!inner(application_number, farm_name, applicant_name, applicant_id),
          profiles(full_name, phone)
        `)
        .order('scheduled_at', { ascending: true });

      if (assessmentsError) throw assessmentsError;
      setAssessments(assessmentsData || []);

      // Load auditors
      const { data: auditorsData, error: auditorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'auditor')
        .eq('is_active', true);

      if (auditorsError) throw auditorsError;
      setAuditors(auditorsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      if (!createRequest.application_id || !createRequest.scheduled_date || !createRequest.scheduled_time) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกข้อมูลให้ครบถ้วน",
          variant: "destructive",
        });
        return;
      }

      const scheduledAt = `${createRequest.scheduled_date}T${createRequest.scheduled_time}:00`;

      const { error } = await supabase
        .from('assessments')
        .insert([{
          application_id: createRequest.application_id,
          auditor_id: createRequest.auditor_id || null,
          type: createRequest.assessment_type,
          scheduled_at: scheduledAt,
          duration_minutes: createRequest.duration_minutes,
          notes: createRequest.notes,
          status: 'SCHEDULED'
        }]);

      if (error) throw error;

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: createRequest.assessment_type === 'ONLINE' ? 'ONLINE_SCHEDULED' : 'ONSITE_SCHEDULED' 
        })
        .eq('id', createRequest.application_id);

      if (updateError) throw updateError;

      toast({
        title: "สร้างการประเมินสำเร็จ",
        description: "การประเมินได้รับการกำหนดเรียบร้อยแล้ว",
      });

      setShowCreateDialog(false);
      setCreateRequest({
        application_id: '',
        assessment_type: 'ONLINE',
        scheduled_date: '',
        scheduled_time: '',
        auditor_id: '',
        duration_minutes: 120,
        notes: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างการประเมินได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
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

  const upcomingAssessments = assessments.filter(a => 
    a.status === 'SCHEDULED' && new Date(a.scheduled_at) > new Date()
  );

  const todayAssessments = assessments.filter(a => {
    const today = new Date().toDateString();
    return a.scheduled_at && new Date(a.scheduled_at).toDateString() === today;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">การจัดการการประเมิน</h1>
          <p className="text-muted-foreground">
            กำหนดการประเมินสำหรับใบสมัครที่เอกสารได้รับการอนุมัติแล้ว
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/reviewer/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                กำหนดการประเมินใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>กำหนดการประเมิน</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>เลือกใบสมัคร</Label>
                  <Select 
                    value={createRequest.application_id} 
                    onValueChange={(value) => setCreateRequest(prev => ({...prev, application_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกใบสมัครที่จะประเมิน" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.application_number} - {app.applicant_name} ({app.farm_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>ประเภทการประเมิน</Label>
                  <Select 
                    value={createRequest.assessment_type} 
                    onValueChange={(value: 'ONLINE' | 'ONSITE') => setCreateRequest(prev => ({...prev, assessment_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          การประเมินออนไลน์
                        </div>
                      </SelectItem>
                      <SelectItem value="ONSITE">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          การประเมินออนไซต์
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>วันที่</Label>
                    <Input
                      type="date"
                      value={createRequest.scheduled_date}
                      onChange={(e) => setCreateRequest(prev => ({...prev, scheduled_date: e.target.value}))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>เวลา</Label>
                    <Input
                      type="time"
                      value={createRequest.scheduled_time}
                      onChange={(e) => setCreateRequest(prev => ({...prev, scheduled_time: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>ผู้ประเมิน (ถ้ามี)</Label>
                  <Select 
                    value={createRequest.auditor_id} 
                    onValueChange={(value) => setCreateRequest(prev => ({...prev, auditor_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้ประเมิน (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {auditors.map((auditor) => (
                        <SelectItem key={auditor.id} value={auditor.id}>
                          {auditor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>ระยะเวลาประเมิน (นาที)</Label>
                  <Input
                    type="number"
                    value={createRequest.duration_minutes}
                    onChange={(e) => setCreateRequest(prev => ({...prev, duration_minutes: parseInt(e.target.value) || 120}))}
                    min="60"
                    max="480"
                  />
                </div>
                
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={createRequest.notes}
                    onChange={(e) => setCreateRequest(prev => ({...prev, notes: e.target.value}))}
                    placeholder="หมายเหตุหรือข้อมูลเพิ่มเติมสำหรับการประเมิน"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleCreateAssessment}>
                    กำหนดการประเมิน
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">รอการประเมิน</p>
                <p className="text-3xl font-bold text-warning">{applications.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">กำหนดการแล้ว</p>
                <p className="text-3xl font-bold text-primary">{upcomingAssessments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">วันนี้</p>
                <p className="text-3xl font-bold text-success">{todayAssessments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">การประเมินทั้งหมด</p>
                <p className="text-3xl font-bold">{assessments.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Ready for Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            ใบสมัครที่รอการประเมิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">ไม่มีใบสมัครที่รอการประเมิน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {application.application_number} - {application.applicant_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        ฟาร์ม: {application.farm_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>สมัครเมื่อ: {new Date(application.created_at).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setCreateRequest(prev => ({...prev, application_id: application.id}));
                        setShowCreateDialog(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      กำหนดการประเมิน
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              การประเมินที่กำลังจะมาถึง
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
                          ผู้สมัคร: {assessment.applications?.applicant_name}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        ดูรายละเอียด
                      </Button>
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
    </div>
  );
};

export default AssessmentScheduling;