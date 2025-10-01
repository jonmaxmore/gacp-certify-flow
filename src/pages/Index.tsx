import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, Shield, FileCheck, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">GACP Certification</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link to="/register">
              <Button>ลงทะเบียน</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 text-primary">
            ระบบรับรองมาตรฐาน GACP
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Good Agricultural and Collection Practices for Thai Herbal Medicine
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            กรมการแพทย์แผนไทยและการแพทย์ทางเลือก กระทรวงสาธารณสุข
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 bg-white rounded-lg shadow-lg hover-scale">
            <Sprout className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">เกษตรกร</h3>
            <p className="text-muted-foreground mb-4">
              ยื่นคำขอรับรองมาตรฐาน ติดตามสถานะ และจัดการเอกสาร
            </p>
            <Link to="/register?role=farmer">
              <Button variant="outline" className="w-full">ลงทะเบียนเกษตรกร</Button>
            </Link>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-lg hover-scale">
            <FileCheck className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">ผู้ตรวจสอบเอกสาร</h3>
            <p className="text-muted-foreground mb-4">
              ตรวจสอบและอนุมัติเอกสารคำขอ
            </p>
            <Link to="/login?role=reviewer">
              <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
            </Link>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-lg hover-scale">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">ผู้ตรวจประเมิน</h3>
            <p className="text-muted-foreground mb-4">
              ดำเนินการตรวจประเมินในพื้นที่และออกรายงาน
            </p>
            <Link to="/login?role=auditor">
              <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
            </Link>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-lg hover-scale">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">ผู้ดูแลระบบ</h3>
            <p className="text-muted-foreground mb-4">
              จัดการระบบและดูภาพรวมทั้งหมด
            </p>
            <Link to="/login?role=admin">
              <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-6 text-center">ขั้นตอนการขอรับรอง</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "ลงทะเบียน", desc: "สร้างบัญชีและกรอกข้อมูล" },
              { step: "2", title: "ยื่นคำขอ", desc: "อัพโหลดเอกสารและชำระเงิน" },
              { step: "3", title: "ตรวจสอบเอกสาร", desc: "เจ้าหน้าที่ตรวจสอบ" },
              { step: "4", title: "ตรวจประเมิน", desc: "ตรวจในพื้นที่จริง" },
              { step: "5", title: "รับใบรับรอง", desc: "ดาวน์โหลดใบรับรอง" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 กรมการแพทย์แผนไทยและการแพทย์ทางเลือก (DTAM)</p>
          <p className="text-sm mt-2">Department of Thai Traditional and Alternative Medicine</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
