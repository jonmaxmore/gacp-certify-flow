import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, TrendingUp, Award } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: "1,234", icon: Users, color: "text-blue-600", change: "+12%" },
    { label: "คำขอทั้งหมด", value: "456", icon: FileText, color: "text-green-600", change: "+8%" },
    { label: "ใบรับรองที่ออก", value: "312", icon: Award, color: "text-purple-600", change: "+15%" },
    { label: "อัตราความสำเร็จ", value: "87%", icon: TrendingUp, color: "text-yellow-600", change: "+3%" },
  ];

  const recentActivity = [
    { action: "คำขอใหม่", user: "นายสมชาย ใจดี", time: "5 นาทีที่แล้ว", type: "new" },
    { action: "อนุมัติคำขอ", user: "ผู้ตรวจสอบ: สมหญิง", time: "15 นาทีที่แล้ว", type: "approved" },
    { action: "เสร็จสิ้นการตรวจ", user: "ผู้ตรวจประเมิน: สมศักดิ์", time: "1 ชั่วโมงที่แล้ว", type: "completed" },
    { action: "ลงทะเบียนใหม่", user: "นางสาวมาลี ดอกไม้", time: "2 ชั่วโมงที่แล้ว", type: "register" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">แดชบอร์ดผู้ดูแลระบบ</h1>
          <Button variant="outline" onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}>
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === "new" ? "bg-blue-500" :
                      activity.type === "approved" ? "bg-green-500" :
                      activity.type === "completed" ? "bg-purple-500" :
                      "bg-gray-500"
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.user}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สถิติรายเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">คำขอใหม่</span>
                    <span className="text-sm font-medium">89 คำขอ</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: "75%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">อนุมัติแล้ว</span>
                    <span className="text-sm font-medium">67 คำขอ</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: "85%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">กำลังดำเนินการ</span>
                    <span className="text-sm font-medium">15 คำขอ</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{width: "45%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">ส่งคืน</span>
                    <span className="text-sm font-medium">7 คำขอ</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{width: "25%"}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
