import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { ProgressTracker } from "@/components/ui/progress-tracker";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  FileText, 
  CreditCard, 
  Calendar, 
  Download, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Video,
  MapPin,
  Plus
} from "lucide-react";

export default function ApplicantDashboard() {
  const [user] = useState({
    name: "สมชาย ใจดี",
    email: "somchai@email.com",
    farmName: "ฟาร์มผักปลอดภัย สมชาย",
    memberSince: "มกราคม 2567"
  });

  const progressSteps = [
    { id: "draft", title: "ร่าง", status: "completed" as const },
    { id: "review", title: "ตรวจสอบ", status: "current" as const },
    { id: "revision", title: "แก้ไข", status: "pending" as const },
    { id: "online", title: "ออนไลน์", status: "pending" as const },
    { id: "onsite", title: "ลงพื้นที่", status: "pending" as const },
    { id: "certified", title: "รับรอง", status: "pending" as const }
  ];

  const notifications = [
    {
      id: 1,
      type: "warning",
      title: "ต้องชำระค่าตรวจสอบเอกสาร",
      message: "กรุณาชำระค่าตรวจสอบเอกสาร 5,000 บาท ภายใน 7 วัน",
      time: "2 ชั่วโมงที่แล้ว",
      isRead: false
    },
    {
      id: 2, 
      type: "info",
      title: "เอกสารได้รับการตรวจสอบแล้ว",
      message: "เอกสารของคุณผ่านการตรวจสอบเบื้องต้นแล้ว รอการอนุมัติ",
      time: "1 วันที่แล้ว",
      isRead: true
    },
    {
      id: 3,
      type: "success", 
      title: "อัพโหลดเอกสารสำเร็จ",
      message: "เอกสารทั้งหมดถูกอัพโหลดเรียบร้อยแล้ว",
      time: "2 วันที่แล้ว",
      isRead: true
    }
  ];

  const quickActions = [
    {
      title: "ชำระค่าตรวจเอกสาร",
      description: "5,000 บาท - ครบกำหนด 25 ก.ย. 67",
      icon: CreditCard,
      variant: "warning" as const,
      href: "/applicant/payments?type=document"
    },
    {
      title: "เลือกวันนัดหมายออนไลน์",
      description: "ประเมินออนไลน์ 45 นาที",
      icon: Video,
      variant: "primary" as const,
      href: "/applicant/assessment/online"
    },
    {
      title: "ดาวน์โหลดคู่มือ",
      description: "เอกสารแนะนำการเตรียมตัว",
      icon: Download,
      variant: "secondary" as const,
      href: "/applicant/knowledge/guide"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header 
        isLoggedIn={true}
        userRole="applicant"
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
            {user.farmName} • สมาชิกตั้งแต่ {user.memberSince}
          </p>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8 shadow-medium border-0 bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              ความคืบหน้าการขอใบรับรอง
            </CardTitle>
            <CardDescription>
              ติดตามสถานะการดำเนินการขอใบรับรอง GACP ของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTracker steps={progressSteps} />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Application */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    คำขอปัจจุบัน
                  </span>
                  <StatusBadge variant="review">กำลังตรวจสอบ</StatusBadge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">หมายเลขคำขอ</p>
                    <p className="font-medium">GACP-2024-001234</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่ยื่นคำขอ</p>
                    <p className="font-medium">15 กันยายน 2567</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ประเภทพืช</p>
                    <p className="font-medium">ผักใบเขียว</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">พื้นที่เพาะปลูก</p>
                    <p className="font-medium">5 ไร่</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/applicant/applications/GACP-2024-001234">
                      ดูรายละเอียด
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/applicant/applications/GACP-2024-001234/edit">
                      แก้ไขข้อมูล
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>การดำเนินการที่ต้องทำ</CardTitle>
                <CardDescription>
                  รายการที่ต้องดำเนินการเพื่อให้กระบวนการขอใบรับรองเป็นไปอย่างราบรื่น
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:shadow-soft transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        action.variant === 'warning' ? 'bg-warning/10' :
                        action.variant === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}>
                        <action.icon className={`h-5 w-5 ${
                          action.variant === 'warning' ? 'text-warning' :
                          action.variant === 'primary' ? 'text-primary' : 'text-secondary'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={action.href}>ดำเนินการ</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  สถานะการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">ค่าตรวจสอบเอกสาร</p>
                        <p className="text-sm text-muted-foreground">ครบกำหนด 25 ก.ย. 2567</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">5,000 บาท</p>
                      <StatusBadge variant="warning">รอชำระ</StatusBadge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-muted-foreground">ค่าตรวจประเมิน</p>
                        <p className="text-sm text-muted-foreground">จ่ายหลังผ่านการตรวจเอกสาร</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-muted-foreground">25,000 บาท</p>
                      <StatusBadge variant="default">รอดำเนินการ</StatusBadge>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <Button variant="warning" className="w-full" asChild>
                    <Link to="/applicant/payments">
                      ชำระเงินทันที
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    การแจ้งเตือน
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {notifications.filter(n => !n.isRead).length} ใหม่
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/20 transition-smooth ${
                        !notification.isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${
                          notification.type === 'warning' ? 'bg-warning/20' :
                          notification.type === 'success' ? 'bg-success/20' : 'bg-secondary/20'
                        }`}>
                          {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-warning" />}
                          {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                          {notification.type === 'info' && <Bell className="h-4 w-4 text-secondary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/applicant/notifications">ดูทั้งหมด</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  การนัดหมายที่กำลังจะมาถึง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">ยังไม่มีการนัดหมาย</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/applicant/assessment">
                      จองเวลาประเมิน
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>ลิงก์ด่วน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/applicant/knowledge">
                    <FileText className="h-4 w-4 mr-2" />
                    เอกสารและความรู้ GACP
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/applicant/applications/new">
                    <Plus className="h-4 w-4 mr-2" />
                    สร้างคำขอใหม่
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/applicant/certificate">
                    <Download className="h-4 w-4 mr-2" />
                    ใบรับรองของฉัน
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