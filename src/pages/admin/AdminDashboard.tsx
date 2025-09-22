import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Users, 
  FileText, 
  Shield, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Download,
  Plus,
  Edit,
  Search,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboard() {
  const [user] = useState({
    name: "ผู้ดูแลระบบ",
    email: "admin@gacp.com",
    role: "ผู้ดูแลระบบ",
    memberSince: "มกราคม 2567"
  });

  const systemStats = [
    {
      title: "ผู้ใช้ทั้งหมด",
      count: 350,
      change: +12,
      changeType: "increase",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "คำขอดำเนินการ",
      count: 25,
      change: -3,
      changeType: "decrease", 
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "ใบรับรองออกแล้ว",
      count: 120,
      change: +8,
      changeType: "increase",
      icon: Shield,
      color: "text-success", 
      bgColor: "bg-success/10"
    },
    {
      title: "รายการแจ้งเตือน",
      count: 5,
      change: 0,
      changeType: "stable",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "user_register",
      message: "ผู้ใช้ใหม่สมัครสมาชิก: สมชาย ใจดี",
      time: "5 นาทีที่แล้ว",
      icon: Users,
      color: "text-primary"
    },
    {
      id: 2,
      type: "application_submit",
      message: "คำขอใหม่: GACP-2024-001234",
      time: "15 นาทีที่แล้ว", 
      icon: FileText,
      color: "text-warning"
    },
    {
      id: 3,
      type: "certificate_issued",
      message: "ออกใบรับรอง: GACP-2024-001230",
      time: "1 ชั่วโมงที่แล้ว",
      icon: Shield,
      color: "text-success"
    },
    {
      id: 4,
      type: "system_update",
      message: "อัพเดทระบบเวอร์ชัน 2.1.0",
      time: "2 ชั่วโมงที่แล้ว",
      icon: Settings,
      color: "text-secondary"
    },
    {
      id: 5,
      type: "security_alert",
      message: "ตรวจพบการเข้าถึงผิดปกติ",
      time: "3 ชั่วโมงที่แล้ว",
      icon: AlertTriangle,
      color: "text-destructive"
    }
  ];

  const quickActions = [
    {
      title: "เพิ่มผู้ใช้ใหม่",
      description: "สร้างบัญชีผู้ใช้สำหรับเจ้าหน้าที่",
      icon: Plus,
      href: "/admin/users/new",
      variant: "default" as const
    },
    {
      title: "สร้าง SOP Template",
      description: "เพิ่มเทมเพลตมาตรฐานใหม่",
      icon: FileText,
      href: "/admin/sop/new",
      variant: "outline" as const
    },
    {
      title: "ดูใบรับรองทั้งหมด",
      description: "จัดการและตรวจสอบใบรับรอง",
      icon: Shield,
      href: "/admin/certificates",
      variant: "outline" as const
    },
    {
      title: "Export บันทึกการใช้งาน",
      description: "ดาวน์โหลดรายงานการใช้งานระบบ",
      icon: Download,
      href: "/admin/logs/export",
      variant: "outline" as const
    }
  ];

  const systemHealth = [
    {
      component: "เซิร์ฟเวอร์หลัก",
      status: "online",
      uptime: "99.9%",
      lastCheck: "1 นาทีที่แล้ว"
    },
    {
      component: "ฐานข้อมูล",
      status: "online", 
      uptime: "99.8%",
      lastCheck: "2 นาทีที่แล้ว"
    },
    {
      component: "ระบบจัดเก็บไฟล์",
      status: "warning",
      uptime: "95.2%",
      lastCheck: "5 นาทีที่แล้ว"
    },
    {
      component: "ระบบแจ้งเตือน",
      status: "online",
      uptime: "98.9%",
      lastCheck: "3 นาทีที่แล้ว"
    }
  ];

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "decrease": 
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getHealthStatus = (status: string) => {
    switch (status) {
      case "online":
        return { variant: "success" as const, text: "ปกติ" };
      case "warning":
        return { variant: "warning" as const, text: "เตือน" };
      case "error":
        return { variant: "destructive" as const, text: "ผิดปกติ" };
      default:
        return { variant: "default" as const, text: "ไม่ทราบ" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Header 
        isLoggedIn={true}
        userRole="admin"
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
            {user.role} • ระบบ GACP Certification Platform
          </p>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <Card key={index} className="shadow-medium border-0 bg-background hover:shadow-soft transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(stat.changeType)}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-success' :
                      stat.changeType === 'decrease' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {stat.change !== 0 ? `${stat.change > 0 ? '+' : ''}${stat.change}` : '0'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {stat.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  การดำเนินการด่วน
                </CardTitle>
                <CardDescription>
                  เครื่องมือจัดการระบบที่ใช้บ่อย
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant={action.variant} 
                    className="justify-start h-auto p-4" 
                    asChild
                  >
                    <Link to={action.href}>
                      <action.icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm opacity-70">{action.description}</div>
                      </div>
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Management Tools */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>เครื่องมือจัดการ</CardTitle>
                <CardDescription>
                  เข้าถึงส่วนต่างๆ ของระบบจัดการ
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/users">
                    <Users className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">จัดการผู้ใช้</div>
                      <div className="text-sm text-muted-foreground">350 ผู้ใช้</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/sop">
                    <FileText className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">เทมเพลต SOP</div>
                      <div className="text-sm text-muted-foreground">15 เทมเพลต</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/settings">
                    <Settings className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">ตั้งค่าระบบ</div>
                      <div className="text-sm text-muted-foreground">การกำหนดค่า</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/certificates">
                    <Shield className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">ใบรับรอง</div>
                      <div className="text-sm text-muted-foreground">120 ใบ</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/analytics">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">รายงาน</div>
                      <div className="text-sm text-muted-foreground">สถิติและการวิเคราะห์</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link to="/admin/logs">
                    <Activity className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">บันทึกการใช้งาน</div>
                      <div className="text-sm text-muted-foreground">ตรวจสอบกิจกรรม</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  กิจกรรมล่าสุด
                </CardTitle>
                <CardDescription>
                  กิจกรรมและการเปลี่ยนแปลงในระบบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-smooth">
                    <div className="p-2 rounded-full bg-muted/50">
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/admin/activities">ดูกิจกรรมทั้งหมด</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Health */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  สถานะระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemHealth.map((component, index) => {
                  const statusConfig = getHealthStatus(component.status);
                  return (
                    <div key={index} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{component.component}</p>
                        <StatusBadge variant={statusConfig.variant}>
                          {statusConfig.text}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uptime: {component.uptime}</span>
                        <span>{component.lastCheck}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-medium border-0 bg-background">
              <CardHeader>
                <CardTitle>สถิติด่วน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ผู้ใช้ออนไลน์</span>
                    <span className="font-medium">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">คำขอวันนี้</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ประเมินเสร็จสิ้น</span>
                    <span className="font-medium">15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">การใช้งานระบบ</span>
                    <span className="font-medium text-success">92%</span>
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
                  <Link to="/admin/backup">
                    <Download className="h-4 w-4 mr-2" />
                    สำรองข้อมูล
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/admin/security">
                    <Shield className="h-4 w-4 mr-2" />
                    ตั้งค่าความปลอดภัย
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/admin/support">
                    <Settings className="h-4 w-4 mr-2" />
                    ระบบช่วยเหลือ
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