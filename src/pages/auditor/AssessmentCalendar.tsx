import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, ArrowLeft, Plus, Video, MapPin, Clock, User, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AssessmentCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    application_id: '',
    type: 'ONLINE',
    scheduled_at: '',
    duration_minutes: 120,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assessmentsData, applicationsData] = await Promise.all([
        supabase
          .from('assessments')
          .select(`
            *,
            applications!inner(
              application_number,
              farm_name,
              profiles:applicant_id(full_name, organization_name)
            )
          `)
          .order('scheduled_at', { ascending: true }),
        
        supabase
          .from('applications')
          .select(`
            *,
            profiles:applicant_id(full_name, organization_name)
          `)
          .eq('status', 'DOCS_APPROVED')
      ]);

      if (assessmentsData.error) throw assessmentsData.error;
      if (applicationsData.error) throw applicationsData.error;

      setAssessments(assessmentsData.data || []);
      setApplications(applicationsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async () => {
    if (!newAssessment.application_id || !newAssessment.scheduled_at) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assessments')
        .insert([{
          application_id: newAssessment.application_id,
          auditor_id: user?.id,
          type: newAssessment.type as 'ONLINE' | 'ONSITE',
          scheduled_at: newAssessment.scheduled_at,
          duration_minutes: newAssessment.duration_minutes,
          notes: newAssessment.notes,
          status: 'SCHEDULED'
        }]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "สร้างการประเมินใหม่เรียบร้อยแล้ว",
      });

      setShowCreateDialog(false);
      setNewAssessment({
        application_id: '',
        type: 'ONLINE',
        scheduled_at: '',
        duration_minutes: 120,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างการประเมินได้",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SCHEDULED: { label: 'กำหนดการแล้ว', variant: 'secondary' },
      IN_PROGRESS: { label: 'กำลังดำเนินการ', variant: 'default' },
      COMPLETED: { label: 'เสร็จสิ้น', variant: 'default' },
      CANCELLED: { label: 'ยกเลิก', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      ONLINE: { label: 'ออนไลน์', icon: Video, color: 'text-green-600' },
      ONSITE: { label: 'ออนไซต์', icon: MapPin, color: 'text-orange-600' }
    };
    const config = typeMap[type] || { label: type, icon: Calendar, color: 'text-gray-600' };
    const Icon = config.icon;
    return (
      <div className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm">{config.label}</span>
      </div>
    );
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAssessmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return assessments.filter(assessment => 
      assessment.scheduled_at && assessment.scheduled_at.startsWith(dateStr)
    );
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/auditor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">ปฏิทินการประเมิน</h1>
            <p className="text-muted-foreground">จัดการและติดตามการนัดหมายประเมิน</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                สร้างการประเมิน
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>สร้างการประเมินใหม่</DialogTitle>
                <DialogDescription>
                  เลือกใบสมัครและกำหนดรายละเอียดการประเมิน
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ใบสมัคร</Label>
                  <Select value={newAssessment.application_id} onValueChange={(value) => 
                    setNewAssessment(prev => ({...prev, application_id: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกใบสมัคร" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.application_number} - {app.profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ประเภทการประเมิน</Label>
                  <Select value={newAssessment.type} onValueChange={(value) => 
                    setNewAssessment(prev => ({...prev, type: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">ออนไลน์</SelectItem>
                      <SelectItem value="ONSITE">ออนไซต์</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>วันที่และเวลา</Label>
                  <Input
                    type="datetime-local"
                    value={newAssessment.scheduled_at}
                    onChange={(e) => setNewAssessment(prev => ({...prev, scheduled_at: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>ระยะเวลา (นาที)</Label>
                  <Input
                    type="number"
                    value={newAssessment.duration_minutes}
                    onChange={(e) => setNewAssessment(prev => ({...prev, duration_minutes: parseInt(e.target.value)}))}
                  />
                </div>
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={newAssessment.notes}
                    onChange={(e) => setNewAssessment(prev => ({...prev, notes: e.target.value}))}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={createAssessment}>
                  สร้างการประเมิน
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                      ←
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      วันนี้
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    const dayAssessments = day ? getAssessmentsForDate(day) : [];
                    const isToday = day && 
                      day.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-2 border rounded-lg ${
                          day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                        } ${isToday ? 'ring-2 ring-primary' : ''}`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isToday ? 'text-primary' : ''
                            }`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayAssessments.slice(0, 2).map((assessment) => (
                                <div
                                  key={assessment.id}
                                  className={`text-xs p-1 rounded cursor-pointer ${
                                    assessment.type === 'ONLINE' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                  onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
                                >
                                  {assessment.applications.application_number}
                                  <br />
                                  {new Date(assessment.scheduled_at).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              ))}
                              {dayAssessments.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayAssessments.length - 2} เพิ่มเติม
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การประเมินวันนี้</CardTitle>
                <CardDescription>
                  {getAssessmentsForDate(new Date()).length} รายการ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : getAssessmentsForDate(new Date()).length === 0 ? (
                  <p className="text-muted-foreground text-sm">ไม่มีการประเมินวันนี้</p>
                ) : (
                  <div className="space-y-3">
                    {getAssessmentsForDate(new Date()).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm">
                            {assessment.applications.application_number}
                          </span>
                          {getStatusBadge(assessment.status)}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {assessment.applications.profiles?.full_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {assessment.applications.farm_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(assessment.scheduled_at).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {getTypeBadge(assessment.type)}
                        </div>
                        {assessment.type === 'ONLINE' && assessment.status === 'SCHEDULED' && (
                          <Button size="sm" className="w-full mt-2">
                            <Video className="h-3 w-3 mr-1" />
                            เข้าร่วม
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สถิติ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">การประเมินเดือนนี้</span>
                    <span className="font-medium">
                      {assessments.filter(a => 
                        new Date(a.scheduled_at).getMonth() === new Date().getMonth()
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">รอดำเนินการ</span>
                    <span className="font-medium">
                      {assessments.filter(a => a.status === 'SCHEDULED').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">เสร็จสิ้น</span>
                    <span className="font-medium">
                      {assessments.filter(a => a.status === 'COMPLETED').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentCalendar;