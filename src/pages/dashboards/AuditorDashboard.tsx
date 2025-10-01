import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle, Clock } from "lucide-react";

const AuditorDashboard = () => {
  const stats = [
    { label: "นัดหมายวันนี้", value: "3", icon: Calendar, color: "text-blue-600" },
    { label: "รอนัดหมาย", value: "8", icon: Clock, color: "text-yellow-600" },
    { label: "เสร็จสิ้นเดือนนี้", value: "24", icon: CheckCircle, color: "text-green-600" },
    { label: "ทั้งหมดปีนี้", value: "156", icon: MapPin, color: "text-purple-600" },
  ];

  const upcomingAudits = [
    { id: "1", number: "GACP-2025-001", farmer: "นายสมชาย ใจดี", location: "เชียงใหม่", date: "2025-01-20", time: "09:00" },
    { id: "2", number: "GACP-2025-005", farmer: "นางสาวมาลี ดอกไม้", location: "ลำปาง", date: "2025-01-21", time: "13:00" },
    { id: "3", number: "GACP-2025-007", farmer: "นายประยุทธ์ เกษตรกร", location: "แม่ฮ่องสอน", date: "2025-01-22", time: "10:30" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">แดชบอร์ดผู้ตรวจประเมิน</h1>
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

        <Card>
          <CardHeader>
            <CardTitle>ตารางตรวจประเมินที่จะถึง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">{audit.number}</p>
                      <p className="text-sm text-muted-foreground">{audit.farmer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        <p className="text-xs text-muted-foreground">{audit.location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{audit.date}</p>
                    <p className="text-sm text-muted-foreground">{audit.time}</p>
                    <Button size="sm" className="mt-2">ดูรายละเอียด</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuditorDashboard;
