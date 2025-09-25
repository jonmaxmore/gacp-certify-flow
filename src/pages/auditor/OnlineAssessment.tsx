import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  ArrowLeft, Clock, User, Building, FileText, Camera,
  CheckCircle, XCircle, AlertCircle, Share
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const OnlineAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [evaluationData, setEvaluationData] = useState({});
  const [notes, setNotes] = useState('');
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [evidence, setEvidence] = useState([]);

  // Assessment checklist sections
  const assessmentSections = [
    {
      title: 'ข้อมูลพื้นฐานของฟาร์ม',
      items: [
        'ตรวจสอบขอบเขตและพื้นที่การเพาะปลูก',
        'ตรวจสอบแหล่งน้ำและระบบชลประทาน',
        'ตรวจสอบโครงสร้างพื้นฐานของฟาร์ม',
        'ตรวจสอบการจัดเก็บเครื่องมือและอุปกรณ์'
      ]
    },
    {
      title: 'การจัดการดินและสารอาหาร',
      items: [
        'ตรวจสอบการเตรียมดินและการปรับปรุงดิน',
        'ตรวจสอบการใช้ปุ๋ยและสารอาหาร',
        'ตรวจสอบการบันทึกการใช้สารเคมี',
        'ตรวจสอบการจัดเก็บปุ๋ยและสารเคมี'
      ]
    },
    {
      title: 'การปลูกและดูแลพืช',
      items: [
        'ตรวจสอบพันธุ์พืชและแหล่งที่มา',
        'ตรวจสอบการปลูกและการดูแล',
        'ตรวจสอบการป้องกันและกำจัดศัตรูพืช',
        'ตรวจสอบการบันทึกกิจกรรมการเพาะปลูก'
      ]
    },
    {
      title: 'การเก็บเกี่ยวและหลังการเก็บเกี่ยว',
      items: [
        'ตรวจสอบวิธีการเก็บเกี่ยว',
        'ตรวจสอบการล้าง คัดแยก และแปรรูป',
        'ตรวจสอบการบรรจุภัณฑ์และการติดฉลาก',
        'ตรวจสอบการจัดเก็บและการขนส่ง'
      ]
    },
    {
      title: 'ระบบการจัดการและเอกสาร',
      items: [
        'ตรวจสอบระบบการบันทึกข้อมูล',
        'ตรวจสอบการติดตามย้อนกลับ',
        'ตรวจสอบการจัดการข้อร้องเรียน',
        'ตรวจสอบการตรวจสอบภายใน'
      ]
    }
  ];

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
      
      // Initialize evaluation data
      const initialEvaluation = {};
      assessmentSections.forEach((section, sIndex) => {
        section.items.forEach((item, iIndex) => {
          initialEvaluation[`${sIndex}-${iIndex}`] = 'pending';
        });
      });
      setEvaluationData(initialEvaluation);
      
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

  const startMeeting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsConnected(true);
      
      // Update assessment status
      await supabase
        .from('assessments')
        .update({ 
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      toast({
        title: "เข้าร่วมประชุมแล้ว",
        description: "การประเมินออนไลน์เริ่มต้นแล้ว",
      });
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเริ่มการประชุมได้",
        variant: "destructive",
      });
    }
  };

  const endMeeting = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setIsConnected(false);
    
    // Calculate score
    const totalItems = Object.keys(evaluationData).length;
    const passedItems = Object.values(evaluationData).filter(v => v === 'pass').length;
    const score = Math.round((passedItems / totalItems) * 100);
    const passed = score >= 70; // 70% pass threshold
    
    try {
      // Update assessment with results
      await supabase
        .from('assessments')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          score: score,
          passed: passed,
          checklist_data: evaluationData,
          notes: notes,
          evidence_urls: evidence.map(e => e.description)
        })
        .eq('id', id);

      // Update application workflow status based on assessment result
      const newWorkflowStatus = passed ? 'CERTIFIED' : 'ASSESSMENT_FAILED';
      
      await supabase
        .from('applications')
        .update({ 
          workflow_status: newWorkflowStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.application_id);

      // If passed, create notification for certificate issuance
      if (passed) {
        await supabase
          .from('workflow_notifications')
          .insert({
            user_id: assessment.applications.applicant_id,
            application_id: assessment.application_id,
            notification_type: 'assessment_passed',
            title: 'การประเมินผ่านแล้ว - กำลังออกใบรับรอง',
            message: `การประเมินออนไลน์ได้คะแนน ${score}% ผ่านแล้ว ระบบกำลังดำเนินการออกใบรับรอง GACP`,
            priority: 'high',
            action_url: '/applicant/certificates',
            action_label: 'ดูใบรับรอง',
            metadata: {
              assessment_id: id,
              score: score,
              assessment_type: 'ONLINE'
            }
          });

        // Auto-trigger certificate generation if passed
        // This will be handled by the existing auto_issue_certificate trigger
        // when the application status changes to CERTIFIED
        await supabase
          .from('applications')
          .update({ 
            status: 'CERTIFIED',
            approved_at: new Date().toISOString()
          })
          .eq('id', assessment.application_id);
      } else {
        // Create notification for failed assessment
        await supabase
          .from('workflow_notifications')
          .insert({
            user_id: assessment.applications.applicant_id,
            application_id: assessment.application_id,
            notification_type: 'assessment_failed',
            title: 'การประเมินไม่ผ่าน',
            message: `การประเมินออนไลน์ได้คะแนน ${score}% ไม่ผ่านเกณฑ์ กรุณาทำการแก้ไขและประเมินใหม่`,
            priority: 'high',
            action_url: '/applicant/applications',
            action_label: 'ดูรายละเอียด',
            metadata: {
              assessment_id: id,
              score: score,
              assessment_type: 'ONLINE'
            }
          });
      }

      toast({
        title: "การประเมินเสร็จสิ้น",
        description: `คะแนน: ${score}% - ${passed ? 'ผ่าน - กำลังออกใบรับรอง' : 'ไม่ผ่าน'}`,
        variant: passed ? "default" : "destructive"
      });

      // Navigate back with result status
      navigate('/auditor/assessments', { 
        state: { 
          assessmentCompleted: true, 
          result: passed ? 'passed' : 'failed',
          score: score 
        }
      });
    } catch (error) {
      console.error('Error ending assessment:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกผลการประเมินได้",
        variant: "destructive",
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setIsScreenSharing(true);
      toast({
        title: "เริ่มแชร์หน้าจอ",
        description: "กำลังแชร์หน้าจอกับผู้เข้าร่วมการประเมิน",
      });
      
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsScreenSharing(false);
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const updateEvaluation = (key, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const takeEvidence = () => {
    // Simulate taking a screenshot or photo
    const newEvidence = {
      id: Date.now(),
      type: 'screenshot',
      timestamp: new Date().toISOString(),
      description: `หลักฐานจากส่วน ${assessmentSections[currentSection].title}`
    };
    
    setEvidence(prev => [...prev, newEvidence]);
    toast({
      title: "บันทึกหลักฐานแล้ว",
      description: "เพิ่มหลักฐานการประเมินเรียบร้อยแล้ว",
    });
  };

  const getProgress = () => {
    const completed = Object.values(evaluationData).filter(v => v !== 'pending').length;
    const total = Object.keys(evaluationData).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getItemIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
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
            <h1 className="text-xl font-semibold">การประเมินออนไลน์</h1>
            <p className="text-sm text-muted-foreground">
              {assessment.applications.application_number} - {assessment.applications.profiles?.full_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {assessment.duration_minutes} นาที
            </Badge>
            <Badge variant="secondary">
              ความคืบหน้า: {getProgress()}%
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Conference */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  การประชุมออนไลน์
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Video Area */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    {isConnected ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                          <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>คลิก "เริ่มการประชุม" เพื่อเชื่อมต่อ</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {!isConnected ? (
                      <Button onClick={startMeeting} size="lg">
                        <Video className="h-4 w-4 mr-2" />
                        เริ่มการประชุม
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant={isVideoOn ? "default" : "destructive"}
                          onClick={toggleVideo}
                        >
                          {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={isAudioOn ? "default" : "destructive"}
                          onClick={toggleAudio}
                        >
                          {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={isScreenSharing ? "default" : "outline"}
                          onClick={startScreenShare}
                        >
                          {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                          {isScreenSharing && <span className="ml-2">แชร์หน้าจออยู่</span>}
                        </Button>
                        <Button variant="outline" onClick={takeEvidence}>
                          <Camera className="h-4 w-4 mr-2" />
                          บันทึกหลักฐาน
                        </Button>
                        <Button variant="destructive" onClick={endMeeting}>
                          จบการประเมิน
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Checklist */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>รายการตรวจสอบ</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentSection === 0}
                      onClick={() => setCurrentSection(currentSection - 1)}
                    >
                      ก่อนหน้า
                    </Button>
                    <span className="text-sm">
                      {currentSection + 1}/{assessmentSections.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentSection === assessmentSections.length - 1}
                      onClick={() => setCurrentSection(currentSection + 1)}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
                <Progress value={getProgress()} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {assessmentSections[currentSection].title}
                  </h3>
                  <div className="space-y-3">
                    {assessmentSections[currentSection].items.map((item, index) => {
                      const key = `${currentSection}-${index}`;
                      const status = evaluationData[key] || 'pending';
                      
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="pt-1">
                            {getItemIcon(status)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{item}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={status === 'pass' ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateEvaluation(key, 'pass')}
                            >
                              ผ่าน
                            </Button>
                            <Button
                              variant={status === 'fail' ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => updateEvaluation(key, 'fail')}
                            >
                              ไม่ผ่าน
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  บันทึกการประเมิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="บันทึกข้อสังเกต ข้อเสนอแนะ หรือรายละเอียดเพิ่มเติม..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    หลักฐานการประเมิน
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowEvidenceDialog(true)}>
                    ดูทั้งหมด ({evidence.length})
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {evidence.slice(-3).map((item) => (
                    <div key={item.id} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium">{item.type}</div>
                      <div className="text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString('th-TH')}
                      </div>
                    </div>
                  ))}
                  {evidence.length === 0 && (
                    <p className="text-sm text-muted-foreground">ยังไม่มีหลักฐาน</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Evidence Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>หลักฐานการประเมิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {evidence.map((item) => (
              <div key={item.id} className="border rounded p-3">
                <div className="font-medium">{item.description}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineAssessment;