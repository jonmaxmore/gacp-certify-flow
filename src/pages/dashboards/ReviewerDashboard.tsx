import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const ReviewerDashboard = () => {
  const stats = [
    { label: "รอตรวจสอบ", value: "12", icon: Clock, color: "text-yellow-600" },
    { label: "อนุมัติวันนี้", value: "5", icon: CheckCircle, color: "text-green-600" },
    { label: "ส่งคืนวันนี้", value: "2", icon: XCircle, color: "text-red-600" },
    { label: "ทั้งหมดเดือนนี้", value: "87", icon: FileText, color: "text-blue-600" },
  ];

  const pendingReviews = [
    { id: "1", number: "GACP-2025-001", farmer: "นายสมชาย ใจดี", submitted: "2025-01-15", urgency: "high" },
    { id: "2", number: "GACP-2025-002", farmer: "นางสาวมาลี ดอกไม้", submitted: "2025-01-14", urgency: "medium" },
    { id: "3", number: "GACP-2025-003", farmer: "นายประยุทธ์ เกษตรกร", submitted: "2025-01-13", urgency: "low" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">แดชบอร์ดผู้ตรวจสอบเอกสาร</h1>
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
            <CardTitle>คำขอรอตรวจสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">{review.number}</p>
                      <p className="text-sm text-muted-foreground">{review.farmer}</p>
                      <p className="text-xs text-muted-foreground">ยื่นเมื่อ {review.submitted}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      review.urgency === "high" ? "bg-red-100 text-red-800" :
                      review.urgency === "medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {review.urgency === "high" ? "เร่งด่วน" : review.urgency === "medium" ? "ปานกลาง" : "ปกติ"}
                    </span>
                    <Button size="sm">ตรวจสอบ</Button>
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

export default ReviewerDashboard;
