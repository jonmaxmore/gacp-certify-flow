import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, MapPin, LogOut, Clock, Play, Upload, Camera, Monitor, ArrowLeft, CheckCircle, XCircle, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const AuditorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    scheduled: 0,
    completed: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    scheduledDate: '',
    scheduledTime: '',
    type: 'ONLINE',
    notes: ''
  });
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, filter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:applicant_id(full_name, organization_name, email, phone),
          payments!payments_application_id_fkey(id, milestone, amount, status),
          assessments(id, status, type, scheduled_at, passed)
        `)
        .in('workflow_status', ['REVIEW_APPROVED', 'PAYMENT_CONFIRMED_ASSESSMENT', 'ONLINE_ASSESSMENT_SCHEDULED', 'ONSITE_ASSESSMENT_SCHEDULED', 'ONLINE_ASSESSMENT_COMPLETED', 'ONSITE_ASSESSMENT_COMPLETED'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter applications that have paid assessment fee (milestone 2)
      const paidApplications = data?.filter(app => 
        app.payments?.some(payment => payment.milestone === 2 && payment.status === 'COMPLETED')
      ) || [];

      setApplications(paidApplications);

      // Calculate stats
      const pending = paidApplications.filter(app => 
        app.workflow_status === 'PAYMENT_CONFIRMED_ASSESSMENT' && 
        !app.assessments?.length
      ).length;
      
      const scheduled = paidApplications.filter(app => 
        app.workflow_status.includes('ASSESSMENT_SCHEDULED')
      ).length;
      
      const completed = paidApplications.filter(app => 
        app.workflow_status.includes('ASSESSMENT_COMPLETED') || app.workflow_status === 'CERTIFIED'
      ).length;

      const today = new Date().toISOString().split('T')[0];
      const todayCount = paidApplications.filter(app => 
        app.assessments?.some(assessment => 
          assessment.scheduled_at?.startsWith(today)
        )
      ).length;

      setStats({ pending, scheduled, completed, today: todayCount });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลใบสมัครได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;
    
    switch (filter) {
      case 'pending':
        filtered = applications.filter(app => 
          app.workflow_status === 'PAYMENT_CONFIRMED_ASSESSMENT' && 
          !app.assessments?.length
        );
        break;
      case 'scheduled':
        filtered = applications.filter(app => 
          app.workflow_status.includes('ASSESSMENT_SCHEDULED')
        );
        break;
      case 'completed':
        filtered = applications.filter(app => 
          app.workflow_status.includes('ASSESSMENT_COMPLETED') || app.workflow_status === 'CERTIFIED'
        );
        break;
      default:
        filtered = applications;
    }
    
    setFilteredApplications(filtered);
  };

  const handleScheduleAssessment = async () => {
    if (!scheduleForm.applicationId || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledAt = new Date(`${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}`);
      
      // Create assessment record
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          application_id: scheduleForm.applicationId,
          auditor_id: user.id,
          type: scheduleForm.type as 'ONLINE' | 'ONSITE',
          status: 'SCHEDULED',
          scheduled_at: scheduledAt.toISOString(),
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Generate meeting link for online assessments
      let meetingUrl = '';
      if (scheduleForm.type === 'ONLINE') {
        const { data: meetingData, error: meetingError } = await supabase.functions
          .invoke('generate-meeting-link', {
            body: { assessment_id: assessment.id }
          });

        if (meetingError) throw meetingError;
        meetingUrl = meetingData.meeting_url;

        // Update assessment with meeting URL
        await supabase
          .from('assessments')
          .update({ meeting_url: meetingUrl })
          .eq('id', assessment.id);
      }

      // Update application workflow status
      const newStatus = scheduleForm.type === 'ONLINE' ? 'ONLINE_ASSESSMENT_SCHEDULED' : 'ONSITE_ASSESSMENT_SCHEDULED';
      await supabase
        .from('applications')
        .update({ workflow_status: newStatus })
        .eq('id', scheduleForm.applicationId);

      // Send notification to applicant
      const application = applications.find(app => app.id === scheduleForm.applicationId);
      await supabase
        .from('notifications')
        .insert({
          user_id: application.applicant_id,
          type: 'assessment_scheduled',
          title: `นัดหมายการประเมิน${scheduleForm.type === 'ONLINE' ? 'ออนไลน์' : 'ออนไซต์'}`,
          message: `การประเมินของท่านได้รับการนัดหมายเป็นวันที่ ${new Date(scheduledAt).toLocaleDateString('th-TH')} เวลา ${new Date(scheduledAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}${meetingUrl ? ` ลิงก์การประชุม: ${meetingUrl}` : ''}`,
          priority: 'high',
          action_url: '/applicant/schedule',
          action_label: 'ดูรายละเอียด',
          related_id: assessment.id
        });

      toast({
        title: "จัดตารางสำเร็จ",
        description: "การประเมินได้รับการนัดหมายเรียบร้อยแล้ว",
      });

      // Reset form and refresh data
      setScheduleForm({
        applicationId: '',
        scheduledDate: '',
        scheduledTime: '',
        type: 'ONLINE',
        notes: ''
      });
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error scheduling assessment:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถจัดตารางการประเมินได้",
        variant: "destructive",
      });
    }
  };

  const handleConductAssessment = (applicationId) => {
    const application = applications.find(app => app.id === applicationId);
    const assessment = application?.assessments?.[0];
    
    if (assessment?.type === 'ONLINE') {
      navigate(`/auditor/assessment/${assessment.id}`);
    } else {
      // For onsite, navigate to report upload
      navigate(`/auditor/report/${assessment.id}`);
    }
  };

  const getStatusBadge = (application) => {
    const status = application.workflow_status;
    const assessment = application.assessments?.[0];
    
    switch (status) {
      case 'PAYMENT_CONFIRMED_ASSESSMENT':
        return <Badge variant="secondary">รอจัดตาราง</Badge>;
      case 'ONLINE_ASSESSMENT_SCHEDULED':
        return <Badge variant="outline">นัดออนไลน์แล้ว</Badge>;
      case 'ONSITE_ASSESSMENT_SCHEDULED':
        return <Badge variant="outline">นัดออนไซต์แล้ว</Badge>;
      case 'ONLINE_ASSESSMENT_COMPLETED':
      case 'ONSITE_ASSESSMENT_COMPLETED':
        if (assessment?.passed === true) {
          return <Badge variant="default" className="bg-green-500">ผ่าน</Badge>;
        } else if (assessment?.passed === false) {
          return <Badge variant="destructive">ไม่ผ่าน</Badge>;
        }
        return <Badge variant="secondary">รอผล</Badge>;
      case 'CERTIFIED':
        return <Badge variant="default" className="bg-purple-500">ออกใบรับรองแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Auditor Dashboard</h1>
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
                  <p className="text-sm font-medium text-muted-foreground">รอจัดตาราง</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">จัดตารางแล้ว</p>
                  <p className="text-3xl font-bold">{stats.scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">เสร็จสิ้นแล้ว</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">นัดหมายวันนี้</p>
                  <p className="text-3xl font-bold">{stats.today}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            รอจัดตาราง ({stats.pending})
          </Button>
          <Button 
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilter('scheduled')}
          >
            จัดตารางแล้ว ({stats.scheduled})
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            เสร็จสิ้นแล้ว ({stats.completed})
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications Queue */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>คิวการประเมิน</CardTitle>
                <CardDescription>
                  รายการใบสมัครที่อนุมัติเอกสารและชำระค่าประเมินแล้ว
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูล</h3>
                      <p className="text-muted-foreground">
                        ไม่มีใบสมัครในสถานะนี้
                      </p>
                    </div>
                  ) : (
                    filteredApplications.map((app) => (
                      <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{app.profiles?.full_name}</h4>
                              {getStatusBadge(app)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {app.profiles?.organization_name} | {app.farm_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              เบอร์ใบสมัคร: {app.application_number || 'ไม่ระบุ'}
                            </p>
                            {app.assessments?.[0]?.scheduled_at && (
                              <p className="text-xs text-blue-600 mt-1">
                                นัดหมาย: {new Date(app.assessments[0].scheduled_at).toLocaleDateString('th-TH')} 
                                {' '}{new Date(app.assessments[0].scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {filter === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedApp(app);
                                  setScheduleForm({
                                    ...scheduleForm,
                                    applicationId: app.id
                                  });
                                }}
                              >
                                จัดตาราง
                              </Button>
                            )}
                            {filter === 'scheduled' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleConductAssessment(app.id)}
                              >
                                ดำเนินการประเมิน
                              </Button>
                            )}
                            {filter === 'completed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/auditor/report/${app.assessments?.[0]?.id}`)}
                              >
                                ดูรายงาน
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Assessment Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>จัดตารางการประเมิน</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedApp ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium">{selectedApp.profiles?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedApp.farm_name}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">วันที่</label>
                      <Input
                        type="date"
                        value={scheduleForm.scheduledDate}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          scheduledDate: e.target.value
                        })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">เวลา</label>
                      <Input
                        type="time"
                        value={scheduleForm.scheduledTime}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          scheduledTime: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">ประเภทการประเมิน</label>
                      <Select 
                        value={scheduleForm.type} 
                        onValueChange={(value) => setScheduleForm({
                          ...scheduleForm,
                          type: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              ออนไลน์
                            </div>
                          </SelectItem>
                          <SelectItem value="ONSITE">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              ออนไซต์
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">หมายเหตุ</label>
                      <Textarea
                        placeholder="หมายเหตุเพิ่มเติม"
                        value={scheduleForm.notes}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          notes: e.target.value
                        })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleScheduleAssessment}
                        className="flex-1"
                      >
                        ยืนยันการจัดตาราง
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(null);
                          setScheduleForm({
                            applicationId: '',
                            scheduledDate: '',
                            scheduledTime: '',
                            type: 'ONLINE',
                            notes: ''
                          });
                        }}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">เลือกใบสมัครเพื่อจัดตาราง</h3>
                    <p className="text-muted-foreground">
                      คลิกปุ่ม "จัดตาราง" ในรายการใบสมัครเพื่อเริ่มจัดตารางการประเมิน
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditorDashboard;