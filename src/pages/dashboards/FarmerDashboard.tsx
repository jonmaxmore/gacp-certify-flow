import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const FarmerDashboard = () => {
  // Mock data - replace with actual MongoDB API calls
  const applications = [
    { id: "1", number: "GACP-2025-001", status: "pending_review", date: "2025-01-15" },
    { id: "2", number: "GACP-2024-089", status: "approved", date: "2024-12-10" },
  ];

  const stats = [
    { label: "คำขอทั้งหมด", value: "2", icon: FileText, color: "text-blue-600" },
    { label: "รอตรวจสอบ", value: "1", icon: Clock, color: "text-yellow-600" },
    { label: "อนุมัติแล้ว", value: "1", icon: CheckCircle, color: "text-green-600" },
    { label: "ถูกส่งคืน", value: "0", icon: AlertCircle, color: "text-red-600" },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending_review: { label: "รอตรวจสอบ", class: "bg-yellow-100 text-yellow-800" },
      approved: { label: "อนุมัติ", class: "bg-green-100 text-green-800" },
      rejected: { label: "ไม่อนุมัติ", class: "bg-red-100 text-red-800" },
      under_review: { label: "กำลังตรวจสอบ", class: "bg-blue-100 text-blue-800" },
    };
    const { label, class: className } = statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">แดชบอร์ดเกษตรกร</h1>
          <Button variant="outline" onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-12 w-12 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>คำขอของฉัน</CardTitle>
                    <CardDescription>รายการคำขอรับรองทั้งหมด</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    ยื่นคำขอใหม่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{app.number}</p>
                          <p className="text-sm text-muted-foreground">ยื่นเมื่อ {app.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(app.status)}
                        <Button variant="outline" size="sm">ดูรายละเอียด</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การแจ้งเตือน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">คำขอ GACP-2025-001 กำลังรอการตรวจสอบ</p>
                    <p className="text-xs text-muted-foreground mt-1">2 ชั่วโมงที่แล้ว</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">คำขอ GACP-2024-089 ได้รับการอนุมัติ</p>
                    <p className="text-xs text-muted-foreground mt-1">5 วันที่แล้ว</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ขั้นตอนถัดไป</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</div>
                    <div>
                      <p className="text-sm font-medium">รอผลการตรวจสอบเอกสาร</p>
                      <p className="text-xs text-muted-foreground">ประมาณ 3-5 วันทำการ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">2</div>
                    <div>
                      <p className="text-sm font-medium">นัดหมายตรวจประเมิน</p>
                      <p className="text-xs text-muted-foreground">หลังผ่านการตรวจสอบ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">3</div>
                    <div>
                      <p className="text-sm font-medium">รับใบรับรอง</p>
                      <p className="text-xs text-muted-foreground">หลังผ่านการตรวจประเมิน</p>
                    </div>
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

export default FarmerDashboard;
