import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, MapPin, LogOut, Clock, Play, Upload, Camera, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuditorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    online: 0,
    onsite: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
    fetchStats();
  }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          applications!inner(
            application_number,
            farm_name,
            profiles:applicant_id(full_name, organization_name)
          )
        `)
        .in('status', ['SCHEDULED', 'IN_PROGRESS'])
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('assessments')
        .select('type, status, scheduled_at');

      if (error) throw error;

      const stats = {
        today: data.filter(a => a.scheduled_at?.startsWith(today)).length,
        online: data.filter(a => a.type === 'ONLINE' && a.status === 'SCHEDULED').length,
        onsite: data.filter(a => a.type === 'ONSITE' && a.status === 'SCHEDULED').length,
        completed: data.filter(a => a.status === 'COMPLETED').length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SCHEDULED: { label: 'กำหนดการแล้ว', variant: 'secondary' },
      IN_PROGRESS: { label: 'กำลังดำเนินการ', variant: 'default' },
      COMPLETED: { label: 'เสร็จสิ้น', variant: 'success' },
      CANCELLED: { label: 'ยกเลิก', variant: 'destructive' }
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      ONLINE: { label: 'ออนไลน์', variant: 'outline', icon: Monitor },
      ONSITE: { label: 'ออนไซต์', variant: 'outline', icon: MapPin }
    };
    const config = typeMap[type] || { label: type, variant: 'outline', icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Auditor Dashboard</h1>
            <p className="text-muted-foreground">ยินดีต้อนรับ, {user?.profile?.full_name}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">นัดหมายวันนี้</p>
                  <p className="text-3xl font-bold">{stats.today}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ประเมินออนไลน์</p>
                  <p className="text-3xl font-bold">{stats.online}</p>
                </div>
                <Video className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ประเมินออนไซต์</p>
                  <p className="text-3xl font-bold">{stats.onsite}</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รายงานสำเร็จ</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/auditor/assessments')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">เริ่มประเมิน</h3>
                  <p className="text-sm text-muted-foreground">เข้าร่วมการประเมินออนไลน์</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/auditor/assessments')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">บันทึกหลักฐาน</h3>
                  <p className="text-sm text-muted-foreground">ถ่ายภาพและบันทึกวิดีโอ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/auditor/assessments')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">อัพโหลดรายงาน</h3>
                  <p className="text-sm text-muted-foreground">ส่งรายงานการประเมิน</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/auditor/assessments')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">จัดตารางงาน</h3>
                  <p className="text-sm text-muted-foreground">ดูและจัดการนัดหมาย</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    ตารางการประเมิน
                  </CardTitle>
                  <CardDescription>
                    รายการการประเมินที่กำหนดการไว้
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  ดูปฏิทิน
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีการประเมินที่กำหนดการไว้
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assessment.applications.application_number}</h4>
                            {getTypeBadge(assessment.type)}
                            {getStatusBadge(assessment.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assessment.applications.profiles?.full_name} - {assessment.applications.farm_name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {assessment.scheduled_at ? new Date(assessment.scheduled_at).toLocaleString('th-TH') : 'ยังไม่กำหนด'}
                            </div>
                            {assessment.duration_minutes && (
                              <span>ระยะเวลา: {assessment.duration_minutes} นาที</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assessment.type === 'ONLINE' && (
                            <Button variant="default" size="sm">
                              <Video className="h-4 w-4 mr-2" />
                              เข้าร่วม
                            </Button>
                          )}
                          {assessment.type === 'ONSITE' && (
                            <Button variant="outline" size="sm">
                              <MapPin className="h-4 w-4 mr-2" />
                              ดูรายละเอียด
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            รายงาน
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {assessments.length > 0 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => navigate('/auditor/assessments')}>ดูรายการทั้งหมด</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AuditorDashboard;