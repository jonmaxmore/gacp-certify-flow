import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, FileText, Download, Send, User, Building,
  CheckCircle, XCircle, AlertCircle, Clock, Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AssessmentReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    executive_summary: '',
    findings: '',
    recommendations: '',
    conclusion: '',
    next_steps: ''
  });

  useEffect(() => {
    if (id) {
      fetchAssessmentDetail();
    }
  }, [id]);

  const fetchAssessmentDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          applications!inner(
            *,
            profiles:applicant_id(full_name, organization_name, email, phone)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssessment(data);
      
      // Load existing report if available
      if (data.detailed_report) {
        try {
          const existingReport = JSON.parse(data.detailed_report);
          setReport(existingReport);
        } catch (e) {
          // If parsing fails, use the string as executive summary
          setReport(prev => ({ ...prev, executive_summary: data.detailed_report }));
        }
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการประเมินได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          detailed_report: JSON.stringify(report),
          result_summary: report.executive_summary,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "บันทึกรายงานแล้ว",
        description: "รายงานการประเมินได้รับการบันทึกเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกรายงานได้",
        variant: "destructive",
      });
    }
  };

  const submitReport = async () => {
    await saveReport();
    
    try {
      // Update assessment status to completed if not already
      const { error } = await supabase
        .from('assessments')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "ส่งรายงานแล้ว",
        description: "รายงานการประเมินได้รับการส่งเรียบร้อยแล้ว",
      });

      navigate('/auditor/assessments');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถส่งรายงานได้",
        variant: "destructive",
      });
    }
  };

  const generatePDFReport = () => {
    // This would typically integrate with a PDF generation service
    toast({
      title: "กำลังสร้างรายงาน PDF",
      description: "รายงานจะถูกส่งให้ภายใน 5 นาที",
    });
  };

  const getChecklistSummary = () => {
    if (!assessment?.checklist_data) return { total: 0, passed: 0, failed: 0 };
    
    const data = assessment.checklist_data;
    const values = Object.values(data);
    
    return {
      total: values.length,
      passed: values.filter(v => v === 'pass').length,
      failed: values.filter(v => v === 'fail').length,
      pending: values.filter(v => v === 'pending').length
    };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ไม่พบการประเมิน</h2>
          <Button onClick={() => navigate('/auditor/assessments')}>กลับไปหน้ารายการ</Button>
        </div>
      </div>
    );
  }

  const checklistSummary = getChecklistSummary();
  const overallScore = assessment.score || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/auditor/assessments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">รายงานการประเมิน</h1>
            <p className="text-sm text-muted-foreground">
              {assessment.applications.application_number} - {assessment.applications.profiles?.full_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(assessment.status)}
            <Button variant="outline" onClick={generatePDFReport}>
              <Download className="h-4 w-4 mr-2" />
              ส่งออก PDF
            </Button>
            <Button onClick={saveReport}>
              บันทึก
            </Button>
            <Button onClick={submitReport}>
              <Send className="h-4 w-4 mr-2" />
              ส่งรายงาน
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>สรุปผลการประเมิน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      overallScore >= 80 ? 'text-green-600' : 
                      overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {overallScore}%
                    </div>
                    <p className="text-sm text-muted-foreground">คะแนนรวม</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{checklistSummary.passed}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">รายการผ่าน</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">{checklistSummary.failed}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">รายการไม่ผ่าน</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>ความคืบหน้า</span>
                    <span>{checklistSummary.passed + checklistSummary.failed}/{checklistSummary.total} รายการ</span>
                  </div>
                  <Progress 
                    value={(checklistSummary.passed + checklistSummary.failed) / checklistSummary.total * 100} 
                    className="w-full" 
                  />
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    {assessment.passed ? (
                      <Award className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      ผลการประเมิน: {assessment.passed ? 'ผ่านการประเมิน' : 'ไม่ผ่านการประเมิน'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {assessment.passed ? 
                      'ผ่านเกณฑ์การประเมิน สามารถดำเนินการออกใบรับรองได้' :
                      'ไม่ผ่านเกณฑ์การประเมิน ต้องปรับปรุงตามข้อเสนอแนะ'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle>สรุปสำหรับผู้บริหาร</CardTitle>
                <CardDescription>
                  สรุปผลการประเมินโดยรวมและข้อเสนอแนะหลัก
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={report.executive_summary}
                  onChange={(e) => setReport(prev => ({ ...prev, executive_summary: e.target.value }))}
                  placeholder="สรุปผลการประเมินโดยรวม จุดแข็ง จุดที่ต้องปรับปรุง และข้อเสนอแนะหลัก..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Detailed Findings */}
            <Card>
              <CardHeader>
                <CardTitle>ผลการตรวจสอบรายละเอียด</CardTitle>
                <CardDescription>
                  รายละเอียดการตรวจสอบในแต่ละส่วน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={report.findings}
                  onChange={(e) => setReport(prev => ({ ...prev, findings: e.target.value }))}
                  placeholder="รายละเอียดการตรวจสอบในแต่ละหัวข้อ สิ่งที่พบ ปัญหาที่ตรวจพบ..."
                  rows={8}
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อเสนอแนะ</CardTitle>
                <CardDescription>
                  ข้อเสนอแนะสำหรับการปรับปรุงและพัฒนา
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={report.recommendations}
                  onChange={(e) => setReport(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="ข้อเสนอแนะเพื่อการปรับปรุง แนวทางแก้ไข และการพัฒนา..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Conclusion */}
            <Card>
              <CardHeader>
                <CardTitle>บทสรุป</CardTitle>
                <CardDescription>
                  สรุปผลการประเมินและความเห็นของผู้ประเมิน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={report.conclusion}
                  onChange={(e) => setReport(prev => ({ ...prev, conclusion: e.target.value }))}
                  placeholder="บทสรุปและความเห็นของผู้ประเมิน..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>ขั้นตอนถัดไป</CardTitle>
                <CardDescription>
                  แผนการดำเนินงานและการติดตามผล
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={report.next_steps}
                  onChange={(e) => setReport(prev => ({ ...prev, next_steps: e.target.value }))}
                  placeholder="แผนการดำเนินงาน กำหนดเวลา และการติดตามผล..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ข้อมูลการประเมิน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">หมายเลขใบสมัคร</Label>
                  <p className="text-sm">{assessment.applications.application_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ประเภทการประเมิน</Label>
                  <p className="text-sm">{assessment.type === 'ONLINE' ? 'ออนไลน์' : 'ออนไซต์'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">วันที่ประเมิน</Label>
                  <p className="text-sm">
                    {assessment.scheduled_at && new Date(assessment.scheduled_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ระยะเวลา</Label>
                  <p className="text-sm">{assessment.duration_minutes} นาที</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ผู้ประเมิน</Label>
                  <p className="text-sm">{assessment.auditor?.full_name || 'ไม่ระบุ'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลผู้สมัคร
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">ชื่อผู้สมัคร</Label>
                  <p className="text-sm">{assessment.applications.profiles?.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">องค์กร</Label>
                  <p className="text-sm">{assessment.applications.profiles?.organization_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ชื่อฟาร์ม</Label>
                  <p className="text-sm">{assessment.applications.farm_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">พื้นที่</Label>
                  <p className="text-sm">
                    {assessment.applications.farm_area_rai}-{assessment.applications.farm_area_ngan}-{assessment.applications.farm_area_wah} ไร่
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ประเภทพืช</Label>
                  <p className="text-sm">{assessment.applications.crop_types?.join(', ')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ประวัติการดำเนินการ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>กำหนดการ</span>
                    <span>
                      {assessment.scheduled_at && new Date(assessment.scheduled_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  {assessment.started_at && (
                    <div className="flex justify-between">
                      <span>เริ่มประเมิน</span>
                      <span>{new Date(assessment.started_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                  {assessment.completed_at && (
                    <div className="flex justify-between">
                      <span>เสร็จสิ้น</span>
                      <span>{new Date(assessment.completed_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentReport;