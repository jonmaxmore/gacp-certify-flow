import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Video, MapPin, Clock, ArrowLeft, Plus, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AssessmentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    filterAssessments();
  }, [assessments, searchTerm, statusFilter, typeFilter]);

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
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssessments = () => {
    let filtered = assessments;

    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.applications.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.applications.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.applications.farm_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter);
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.type === typeFilter);
    }

    setFilteredAssessments(filtered);
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
      ONLINE: { label: 'ออนไลน์', variant: 'outline', icon: Video },
      ONSITE: { label: 'ออนไซต์', variant: 'outline', icon: MapPin }
    };
    const config = typeMap[type] || { label: type, variant: 'outline', icon: Calendar };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const startAssessment = async (assessmentId) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ 
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) throw error;
      fetchAssessments();
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

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
            <h1 className="text-2xl font-semibold">จัดการการประเมิน</h1>
            <p className="text-muted-foreground">ดูและจัดการการประเมินทั้งหมด</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            สร้างการประเมินใหม่
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาหมายเลขใบสมัคร, ชื่อ, หรือฟาร์ม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="กรองตามสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="SCHEDULED">กำหนดการแล้ว</SelectItem>
              <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
              <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="กรองตามประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภท</SelectItem>
              <SelectItem value="ONLINE">ออนไลน์</SelectItem>
              <SelectItem value="ONSITE">ออนไซต์</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assessments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              รายการการประเมิน ({filteredAssessments.length})
            </CardTitle>
            <CardDescription>
              คลิกที่การประเมินเพื่อดูรายละเอียดและดำเนินการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {assessments.length === 0 ? 'ไม่มีการประเมิน' : 'ไม่พบการประเมินที่ตรงกับเงื่อนไขการค้นหา'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => (
                  <div key={assessment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assessment.applications.application_number}</h4>
                          {getTypeBadge(assessment.type)}
                          {getStatusBadge(assessment.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>ผู้สมัคร: {assessment.applications.profiles?.full_name}</div>
                          <div>ฟาร์ม: {assessment.applications.farm_name}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            กำหนดการ: {assessment.scheduled_at ? new Date(assessment.scheduled_at).toLocaleDateString('th-TH') : 'ยังไม่กำหนด'}
                          </div>
                          {assessment.duration_minutes && (
                            <div>ระยะเวลา: {assessment.duration_minutes} นาที</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {assessment.status === 'SCHEDULED' && (
                          <Button 
                            size="sm"
                            onClick={() => startAssessment(assessment.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            เริ่มประเมิน
                          </Button>
                        )}
                        {assessment.type === 'ONLINE' && assessment.status === 'IN_PROGRESS' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            เข้าร่วม
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/auditor/assessment/${assessment.id}`)}
                        >
                          ดูรายละเอียด
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
    </div>
  );
};

export default AssessmentManagement;