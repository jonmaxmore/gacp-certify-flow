import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, Calendar, CheckCircle, XCircle, 
  Award, AlertTriangle, ArrowLeft, FileText, Eye 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AssessmentResultCard } from '@/components/auditor/AssessmentResultCard';

const AssessmentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          applications!inner(
            application_number,
            applicant_name,
            farm_name,
            workflow_status,
            status,
            profiles:applicant_id(full_name, organization_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการประเมินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssessments = () => {
    return assessments.filter(assessment => {
      const matchesSearch = searchTerm === '' || 
        assessment.applications.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.applications.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.applications.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
      
      const matchesResult = resultFilter === 'all' || 
        (resultFilter === 'passed' && assessment.passed === true) ||
        (resultFilter === 'failed' && assessment.passed === false) ||
        (resultFilter === 'pending' && assessment.passed === null);

      return matchesSearch && matchesStatus && matchesResult;
    });
  };

  const getStatsData = () => {
    const total = assessments.length;
    const completed = assessments.filter(a => a.status === 'COMPLETED').length;
    const passed = assessments.filter(a => a.passed === true).length;
    const failed = assessments.filter(a => a.passed === false).length;
    const certificateIssued = assessments.filter(a => 
      a.passed === true && a.applications.workflow_status === 'CERTIFIED'
    ).length;

    return { total, completed, passed, failed, certificateIssued };
  };

  const stats = getStatsData();
  const filteredAssessments = getFilteredAssessments();

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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/auditor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">จัดการการประเมิน</h1>
            <p className="text-sm text-muted-foreground">
              รายการการประเมินและผลการออกใบรับรอง GACP
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">การประเมินทั้งหมด</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">เสร็จสิ้นแล้ว</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.passed}</div>
              <div className="text-sm text-muted-foreground">ผ่านการประเมิน</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">ไม่ผ่านการประเมิน</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.certificateIssued}</div>
              <div className="text-sm text-muted-foreground">ออกใบรับรองแล้ว</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ตัวกรองและค้นหา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ค้นหา</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="หมายเลขใบสมัคร, ชื่อผู้สมัคร, ชื่อฟาร์ม"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">สถานะการประเมิน</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="SCHEDULED">กำหนดการแล้ว</SelectItem>
                    <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">ผลการประเมิน</label>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผล" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="passed">ผ่าน</SelectItem>
                    <SelectItem value="failed">ไม่ผ่าน</SelectItem>
                    <SelectItem value="pending">รอผล</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">การดำเนินการ</label>
                <Button onClick={fetchAssessments} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Results */}
        <div className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลการประเมิน</h3>
                <p className="text-muted-foreground">
                  ไม่มีการประเมินที่ตรงกับเงื่อนไขการค้นหา
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAssessments.map((assessment) => (
              <AssessmentResultCard key={assessment.id} assessment={assessment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentManagement;