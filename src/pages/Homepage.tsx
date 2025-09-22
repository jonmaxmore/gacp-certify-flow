import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { 
  Shield, 
  FileText, 
  Users, 
  Award, 
  CheckCircle, 
  Clock, 
  Globe, 
  ArrowRight,
  Play,
  Download,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export default function Homepage() {
  const features = [
    {
      icon: Shield,
      title: "ระบบรักษาความปลอดภัย",
      description: "ระบบรักษาความปลอดภัยข้อมูลระดับสูง ตามมาตรฐานสากล"
    },
    {
      icon: FileText,
      title: "จัดการเอกสารดิจิทัล",
      description: "ยื่นและติดตามสถานะเอกสารออนไลน์ได้ตลอด 24 ชั่วโมง"
    },
    {
      icon: Users,
      title: "ทีมผู้เชี่ยวชาญ",
      description: "ผู้ตรวจประเมินที่ผ่านการรับรองและมีประสบการณ์สูง"
    },
    {
      icon: Award,
      title: "ใบรับรองมาตรฐาน",
      description: "ใบรับรองที่ได้รับการยอมรับในระดับสากล"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "สมัครสมาชิก",
      description: "ลงทะเบียนเข้าสู่ระบบและกรอกข้อมูลเบื้องต้น"
    },
    {
      number: "02", 
      title: "ยื่นคำขอ",
      description: "อัพโหลดเอกสารและข้อมูลที่จำเป็น"
    },
    {
      number: "03",
      title: "ตรวจประเมิน",
      description: "ผู้เชี่ยวชาญดำเนินการตรวจประเมินออนไลน์และลงพื้นที่"
    },
    {
      number: "04",
      title: "รับใบรับรอง",
      description: "ดาวน์โหลดใบรับรอง GACP พร้อมระบบตรวจสอบ QR Code"
    }
  ];

  const news = [
    {
      date: "22 ก.ย. 2567",
      title: "เปิดให้บริการระบบใหม่แล้ว",
      description: "ระบบขอใบรับรอง GACP ดิจิทัลเปิดให้บริการแล้ววันนี้"
    },
    {
      date: "20 ก.ย. 2567", 
      title: "คู่มือการใช้งานระบบ",
      description: "เผยแพร่คู่มือการใช้งานระบบใหม่สำหรับผู้ใช้งาน"
    },
    {
      date: "18 ก.ย. 2567",
      title: "อัพเดตข้อกำหนดใหม่",
      description: "ข้อกำหนดและเอกสารที่ต้องใช้ในการขอใบรับรอง"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/70" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              ระบบขอใบรับรอง
              <span className="block text-secondary-light">GACP ดิจิทัล</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-fade-in">
              ระบบออนไลน์ครบวงจรสำหรับการขอรับใบรับรองมาตรฐาน Good Agricultural Certification Practice (GACP) 
              ที่ทันสมัย รวดเร็ว และปลอดภัย
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button variant="hero" size="lg" asChild className="text-lg px-8 py-4">
                <Link to="/register">
                  เริ่มต้นใช้งาน
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                ดูวิดีโอแนะนำ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ทำไมต้องเลือกระบบของเรา
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ระบบที่ออกแบบมาเพื่อให้การขอใบรับรอง GACP เป็นเรื่องง่าย รวดเร็ว และเชื่อถือได้
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-medium hover:shadow-strong transition-smooth bg-gradient-card">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-glow">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ขั้นตอนการขอใบรับรอง
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              เพียง 4 ขั้นตอนง่ายๆ คุณก็สามารถได้รับใบรับรอง GACP ได้แล้ว
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-muted" 
                         style={{ transform: 'translateX(-50%)' }} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                ข่าวสารและประกาศ
              </h2>
              <p className="text-xl text-muted-foreground">
                ติดตามข่าวสารและการอัพเดตของระบบ
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/news">ดูทั้งหมด</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <Card key={index} className="hover:shadow-medium transition-smooth border-0 shadow-soft bg-background">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    {item.date}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                  <Button variant="link" className="p-0 h-auto text-primary mt-3">
                    อ่านต่อ
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            พร้อมที่จะเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            สมัครสมาชิกวันนี้และเริ่มต้นกระบวนการขอใบรับรอง GACP ของคุณ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild className="text-lg px-8 py-4">
              <Link to="/register">สมัครสมาชิกฟรี</Link>
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4" asChild>
              <Link to="/contact">ติดต่อสอบถาม</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold">GACP</div>
                  <div className="text-sm text-gray-400">Certification Platform</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                ระบบออนไลน์สำหรับการขอรับใบรับรองมาตรฐาน GACP ที่ทันสมัยและเชื่อถือได้
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">เมนูหลัก</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-smooth">หน้าแรก</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-smooth">เกี่ยวกับ GACP</Link></li>
                <li><Link to="/regulations" className="text-gray-400 hover:text-white transition-smooth">SOP & กฎระเบียบ</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-smooth">คำถามที่พบบ่อย</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">บริการ</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-smooth">สมัครสมาชิก</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-smooth">เข้าสู่ระบบ</Link></li>
                <li><Link to="/download" className="text-gray-400 hover:text-white transition-smooth">ดาวน์โหลดคู่มือ</Link></li>
                <li><Link to="/support" className="text-gray-400 hover:text-white transition-smooth">ศูนย์ช่วยเหลือ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">ติดต่อเรา</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-gray-400">02-123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-gray-400">info@gacp-cert.th</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <span className="text-gray-400">123 ถนนรัชดาภิเษก กรุงเทพฯ 10400</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 GACP Certification Platform. สงวนลิขสิทธิ์.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-smooth">
                นโยบายความเป็นส่วนตัว
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-smooth">
                ข้อกำหนดการใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}