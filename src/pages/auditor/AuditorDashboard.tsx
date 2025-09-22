import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Camera,
  Upload,
  FileText,
  Play,
  Pause,
  Monitor
} from "lucide-react";

export default function AuditorDashboard() {
  const [user] = useState({
    name: "ดร.วิชาญ เชี่ยวชาญ",
    email: "auditor@gacp.com",
    role: "เจ้าหน้าที่ตรวจประเมิน",
    memberSince: "มกราคม 2567"
  });

  const queueStats = [
    {
      title: "ออนไลน์วันนี้",
      count: 3,
      icon: Video,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "ลงพื้นที่",
      count: 2,
      icon: MapPin,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "เสร็จสิ้น",
      count: 8,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "รอประเมิน",
      count: 5,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  const todayAppointments = [
    {
      id: "GACP-2024-001234",
      applicantName: "สมชาย ใจดี",
      farmName: "ฟาร์มผักปลอดภัย สมชาย",
      type: "online",
      time: "10:00 - 11:00",
      status: "scheduled",
      location: "Zoom Meeting"
    },
    {
      id: "GACP-2024-001235",
      applicantName: "จิรศักดิ์ กุลชาติ", 
      farmName: "สวนผลไม้ออร์แกนิค",
      type: "online",
      time: "14:00 - 15:00",
      status: "in_progress",
      location: "Google Meet"
    },
    {
      id: "GACP-2024-001236",
      applicantName: "มาลี สุขใส",
      farmName: "ไร่ข้าวอินทรีย์ มาลี",
      type: "onsite",
      time: "09:00 - 16:00",
      status: "scheduled",
      location: "จ.นครปฐม"
    }
  ];

  const completedAssessments = [
    {
      id: "GACP-2024-001230",
      applicantName: "วิทยา เกษมสุข",
      completedDate: "15 ก.ย. 67",
      result: "passed",
      type: "online"
    },
    {
      id: "GACP-2024-001231",
      applicantName: "สุดา ปลื้มใจ",
      completedDate: "14 ก.ย. 67", 
      result: "failed",
      type: "onsite"
    },
    {
      id: "GACP-2024-001232",
      applicantName: "ประยุทธ แกล้วหาญ",
      completedDate: "13 ก.ย. 67",
      result: "passed",
      type: "online"
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "scheduled":
        return { variant: "default" as const, text: "กำหนดการ" };
      case "in_progress":
        return { variant: "warning" as const, text: "กำลังดำเนินการ" };
      case "completed":
        return { variant: "success" as const, text: "เสร็จสิ้น" };
      default:
        return { variant: "default" as const, text: "ไม่ทราบสถานะ" };
    }
  };

  const getResultConfig = (result: string) => {
    switch (result) {
      case "passed":
        return { variant: "success" as const, text: "ผ่าน" };
      case "failed":
        return { variant: "destructive" as const, text: "ไม่ผ่าน" };
      default:
        return { variant: "default" as const, text: "รอผล" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header 
        isLoggedIn={true}
        userRole="auditor"
        userName={user.name}
        onLogout={() => {/* Handle logout */}}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ยินดีต้อนรับ, {user.name}
          </h1>
          <p className="text-muted-foreground">
            {user.role} • สมาชิกตั้งแต่ {user.memberSince}
          </p>
        </div>

        {/* Queue Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {queueStats.map((stat, index) => (
            <Card key={index} className="shadow-medium border-0 bg-background hover:shadow-soft transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.count}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  การนัดหมายวันนี้
                </CardTitle>
                <CardDescription>
                  รายการประเมินที่กำหนดไว้สำหรับวันนี้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayAppointments.map((appointment) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  return (
                    <div 
                      key={appointment.id}
                      className="p-4 rounded-lg border border-border hover:shadow-soft transition-smooth"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            appointment.type === 'online' ? 'bg-primary/10' : 'bg-warning/10'
                          }`}>
                            {appointment.type === 'online' ? 
                              <Video className={`h-5 w-5 ${appointment.type === 'online' ? 'text-primary' : 'text-warning'}`} /> :
                              <MapPin className={`h-5 w-5 ${appointment.type === 'online' ? 'text-primary' : 'text-warning'}`} />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{appointment.applicantName}</p>
                            <p className="text-sm text-muted-foreground">{appointment.farmName}</p>
                          </div>
                        </div>
                        <StatusBadge variant={statusConfig.variant}>
                          {statusConfig.text}
                        </StatusBadge>
                      </div>
                      
                      <div className="grid sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">หมายเลขคำขอ</p>
                          <p className="font-medium">{appointment.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">เวลา</p>
                          <p className="font-medium">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">สถานที่</p>
                          <p className="font-medium">{appointment.location}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {appointment.type === 'online' ? (
                          <>
                            {appointment.status === 'scheduled' && (
                              <Button size="sm" variant="default">
                                <Play className="h-4 w-4 mr-1" />
                                เริ่ม Video Call
                              </Button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <>
                                <Button size="sm" variant="warning">
                                  <Pause className="h-4 w-4 mr-1" />
                                  หยุดชั่วคราว
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Camera className="h-4 w-4 mr-1" />
                                  บันทึกหน้าจอ
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-1" />
                              อัพโหลดหลักฐาน
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/auditor/onsite/${appointment.id}`}>
                                <MapPin className="h-4 w-4 mr-1" />
                                ดูรายละเอียดพื้นที่
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-1" />
                              บันทึกผลตรวจ
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/auditor/assessment/${appointment.id}`}>
                            <FileText className="h-4 w-4 mr-1" />
                            ดูรายละเอียด
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Assessment Tools */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>เครื่องมือการประเมิน</CardTitle>
                <CardDescription>
                  เครื่องมือสำหรับการประเมินออนไลน์และลงพื้นที่
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/tools/video">
                    <Video className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Video Call</div>
                      <div className="text-sm text-muted-foreground">เริ่มการประเมินออนไลน์</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/tools/screen-record">
                    <Monitor className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">บันทึกหน้าจอ</div>
                      <div className="text-sm text-muted-foreground">จับภาพหลักฐาน</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/tools/camera">
                    <Camera className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">ถ่ายภาพ</div>
                      <div className="text-sm text-muted-foreground">บันทึกภาพหลักฐาน</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/tools/upload">
                    <Upload className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">อัพโหลดไฟล์</div>
                      <div className="text-sm text-muted-foreground">เอกสารและรูปภาพ</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/ai-summary">
                    <FileText className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">AI Summary</div>
                      <div className="text-sm text-muted-foreground">สรุปผลอัตโนมัติ</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/auditor/reports">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">สรุปผล</div>
                      <div className="text-sm text-muted-foreground">อนุมัติใบรับรอง</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Completed Today */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  เสร็จสิ้นล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedAssessments.map((assessment) => {
                  const resultConfig = getResultConfig(assessment.result);
                  return (
                    <div key={assessment.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{assessment.applicantName}</p>
                        <StatusBadge variant={resultConfig.variant}>
                          {resultConfig.text}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{assessment.id}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{assessment.completedDate}</p>
                        <div className="flex items-center gap-1">
                          {assessment.type === 'online' ? 
                            <Video className="h-3 w-3 text-muted-foreground" /> :
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                          }
                          <span className="text-xs text-muted-foreground capitalize">
                            {assessment.type === 'online' ? 'ออนไลน์' : 'ลงพื้นที่'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>สถิติการทำงาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ประเมินวันนี้</span>
                    <span className="font-medium">3/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">อัตราผ่าน</span>
                    <span className="font-medium text-success">82%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">เฉลี่ยต่อวัน</span>
                    <span className="font-medium">6 ราย</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">เวลาเฉลี่ย</span>
                    <span className="font-medium">45 นาที</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>ลิงก์ด่วน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/auditor/guidelines">
                    <FileText className="h-4 w-4 mr-2" />
                    คู่มือการประเมิน
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/auditor/checklist">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Checklist ประเมิน
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/auditor/history">
                    <Clock className="h-4 w-4 mr-2" />
                    ประวัติการประเมิน
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}