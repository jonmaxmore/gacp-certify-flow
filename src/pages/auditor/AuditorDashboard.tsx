import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, FileText, MapPin, LogOut, Clock, Play, Upload, Camera, Monitor, ArrowLeft, ChevronDown, Users, CheckCircle, RotateCcw } from 'lucide-react';
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
            onClick={() => navigate('/auditor/assessment-management')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">จัดการผลการประเมิน</h3>
                  <p className="text-sm text-muted-foreground">ดูผลการประเมินและสถานะใบรับรอง</p>
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
            onClick={() => navigate('/auditor/calendar')}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approved Applications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Approved Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "John Doe", date: "July 23, 2025", time: "10:9am", type: "Online", avatar: "👨", status: "รอการประเมิน" },
                    { name: "Jane Smith", date: "August 1 2025", time: "18:9am", type: "Onsite", avatar: "👩", status: "ประเมินเสร็จ - ผ่าน" }
                  ].map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl">{app.avatar}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-muted-foreground">{app.date} {app.time}</p>
                          <p className="text-xs text-blue-600">{app.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{app.type}</Badge>
                        {app.status.includes('ผ่าน') && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">GACP ออกแล้ว</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Applicant Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Applicant</label>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Applicant</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <span>Oct</span>
                        <span className="font-bold">4</span>
                        <span>24</span>
                        <sup className="text-xs">16</sup>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Online</span>
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span>Online</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <div className="w-4 h-4 border rounded-full"></div>
                        <span>Onsite</span>
                      </label>
                    </div>
                  </div>

                  {/* Generate Link Button */}
                  <Button className="w-full">
                    Generate Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Applicant Photo */}
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src="/api/placeholder/200/200" 
                        alt="Applicant" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex flex-col h-16">
                      <FileText className="h-5 w-5 mb-1" />
                      <span className="text-xs">Upload Report</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-16">
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-xs">Capture Screen</span>
                    </Button>
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

export default AuditorDashboard;