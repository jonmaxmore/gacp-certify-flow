import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Users,
  Eye,
  Edit,
  Send
} from "lucide-react";

export default function ReviewerDashboard() {
  const [user] = useState({
    name: "ดร.สมหญิง ใจดี",
    email: "reviewer@gacp.com",
    role: "เจ้าหน้าที่ตรวจสอบเอกสาร",
    memberSince: "มกราคม 2567"
  });

  const queueStats = [
    {
      title: "รอตรวจสอบ",
      count: 5,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "รอแก้ไข",
      count: 2,
      icon: AlertCircle,
      color: "text-destructive", 
      bgColor: "bg-destructive/10"
    },
    {
      title: "อนุมัติแล้ว",
      count: 10,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "วันนี้",
      count: 3,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  const applications = [
    {
      id: "GACP-2024-001234",
      applicantName: "สมชาย ใจดี",
      farmName: "ฟาร์มผักปลอดภัย สมชาย",
      status: "pending",
      submittedDate: "15 ก.ย. 67",
      daysWaiting: 2,
      revisionCount: 0
    },
    {
      id: "GACP-2024-001235", 
      applicantName: "จิรศักดิ์ กุลชาติ",
      farmName: "สวนผลไม้ออร์แกนิค",
      status: "revision",
      submittedDate: "12 ก.ย. 67",
      daysWaiting: 5,
      revisionCount: 1
    },
    {
      id: "GACP-2024-001236",
      applicantName: "มาลี สุขใส",
      farmName: "ไร่ข้าวอินทรีย์ มาลี",
      status: "approved",
      submittedDate: "10 ก.ย. 67",
      daysWaiting: 0,
      revisionCount: 0
    },
    {
      id: "GACP-2024-001237",
      applicantName: "วิทยา เกษมสุข",
      farmName: "สวนผัก Hydroponic",
      status: "pending",
      submittedDate: "16 ก.ย. 67",
      daysWaiting: 1,
      revisionCount: 0
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { variant: "warning" as const, text: "รอตรวจสอบ" };
      case "revision":
        return { variant: "destructive" as const, text: "รอแก้ไข" };
      case "approved":
        return { variant: "success" as const, text: "อนุมัติแล้ว" };
      default:
        return { variant: "default" as const, text: "ไม่ทราบสถานะ" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header 
        isLoggedIn={true}
        userRole="reviewer"
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
            {/* Applications Queue */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  คิวการตรวจสอบ
                </CardTitle>
                <CardDescription>
                  รายการคำขอที่รอการตรวจสอบและอนุมัติ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>หมายเลขคำขอ</TableHead>
                        <TableHead>ผู้ยื่นคำขอ</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>วันที่ยื่น</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => {
                        const statusConfig = getStatusConfig(app.status);
                        return (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">
                              {app.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.applicantName}</p>
                                <p className="text-sm text-muted-foreground">{app.farmName}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge variant={statusConfig.variant}>
                                {statusConfig.text}
                              </StatusBadge>
                              {app.revisionCount > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  แก้ไขครั้งที่ {app.revisionCount}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p>{app.submittedDate}</p>
                                {app.daysWaiting > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    รอ {app.daysWaiting} วัน
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/reviewer/applications/${app.id}`}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    ดู
                                  </Link>
                                </Button>
                                {app.status === "pending" && (
                                  <>
                                    <Button variant="default" size="sm">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      อนุมัติ
                                    </Button>
                                    <Button variant="destructive" size="sm">
                                      <Send className="h-4 w-4 mr-1" />
                                      ส่งกลับ
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>การดำเนินการด่วน</CardTitle>
                <CardDescription>
                  เครื่องมือที่ใช้บ่อยสำหรับการตรวจสอบ
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/reviewer/applications/pending">
                    <Clock className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">คำขอรอตรวจสอบ</div>
                      <div className="text-sm text-muted-foreground">5 รายการ</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/reviewer/scheduling">
                    <Calendar className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">จัดตารางออนไลน์</div>
                      <div className="text-sm text-muted-foreground">เปิดช่วงเวลา</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/reviewer/applications/revision">
                    <Edit className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">รอการแก้ไข</div>
                      <div className="text-sm text-muted-foreground">2 รายการ</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/reviewer/reports">
                    <FileText className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">รายงานสรุป</div>
                      <div className="text-sm text-muted-foreground">สถิติการทำงาน</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  งานวันนี้
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="font-medium text-sm">ตรวจสอบเอกสาร</p>
                    <p className="text-xs text-muted-foreground">3 รายการรอดำเนินการ</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="font-medium text-sm">ประชุมทีม</p>
                    <p className="text-xs text-muted-foreground">14:00 - 15:00 น.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <p className="font-medium text-sm">รีวิวระบบ</p>
                    <p className="text-xs text-muted-foreground">16:00 - 17:00 น.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>สถิติการทำงาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">เสร็จสิ้นวันนี้</span>
                    <span className="font-medium">8/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">เฉลี่ยต่อวัน</span>
                    <span className="font-medium">12 รายการ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">อัตราอนุมัติ</span>
                    <span className="font-medium text-success">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">เวลาเฉลี่ย</span>
                    <span className="font-medium">2.5 วัน</span>
                  </div>
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
                  <Link to="/reviewer/guidelines">
                    <FileText className="h-4 w-4 mr-2" />
                    คู่มือการตรวจสอบ
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/reviewer/templates">
                    <Edit className="h-4 w-4 mr-2" />
                    เทมเพลตการตรวจสอบ
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/reviewer/history">
                    <Clock className="h-4 w-4 mr-2" />
                    ประวัติการทำงาน
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