import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const newsItems = [
    {
      id: 1,
      title: "ประกาศหลักเกณฑ์ใหม่ GACP 2024",
      excerpt: "กรมวิชาการเกษตรประกาศหลักเกณฑ์ใหม่สำหรับการรับรอง GACP ประจำปี 2024",
      date: "2024-01-15",
      category: "ประกาศ",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "เปิดรับสมัครผู้ประเมิน GACP",
      excerpt: "เปิดรับสมัครผู้ประเมินคุณภาพการปฏิบัติทางการเกษตรที่ดี",
      date: "2024-01-10", 
      category: "ข่าวสาร",
      image: "/api/placeholder/400/200"
    },
    {
      id: 3,
      title: "อบรมเกษตรกรออนไลน์",
      excerpt: "จัดอบรมเกษตรกรเรื่องมาตรฐาน GACP ผ่านระบบออนไลน์",
      date: "2024-01-05",
      category: "กิจกรรม", 
      image: "/api/placeholder/400/200"
    }
  ];

  const statistics = [
    { icon: Users, label: "เกษตรกรที่ลงทะเบียน", value: "2,847", color: "text-blue-600" },
    { icon: Award, label: "ใบรับรองออกแล้ว", value: "1,256", color: "text-green-600" },
    { icon: ShieldCheck, label: "ฟาร์มได้รับรอง", value: "892", color: "text-purple-600" },
    { icon: TrendingUp, label: "อัตราความสำเร็จ", value: "94%", color: "text-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">GACP Certification</h1>
                <p className="text-sm text-muted-foreground">Good Agricultural Certification Platform</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-foreground hover:text-primary transition-colors">หน้าหลัก</a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">เกี่ยวกับเรา</a>
              <a href="#news" className="text-muted-foreground hover:text-primary transition-colors">ข่าวสาร</a>
              <a href="#services" className="text-muted-foreground hover:text-primary transition-colors">บริการออนไลน์</a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">ติดต่อ</a>
            </nav>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>สมัครสมาชิก</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                ระบบรับรองมาตรฐาน GACP
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                ระบบรับรอง
                <span className="text-primary block">การปฏิบัติทางการเกษตรที่ดี</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ยกระดับคุณภาพการผลิตทางการเกษตรของคุณด้วยมาตรฐาน GACP 
                ที่ได้รับการยอมรับในระดับสากล เพื่อความปลอดภัยของผู้บริโภคและสิ่งแวดล้อม
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="flex items-center space-x-2"
                >
                  <span>เริ่มต้นสมัครรับรอง</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/verify-certificate')}
                >
                  ตรวจสอบใบรับรอง
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-32 h-32 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">ข่าวสารและประกาศ</h2>
            <p className="text-muted-foreground">อัปเดตข่าวสารและประกาศสำคัญเกี่ยวกับ GACP</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {newsItems.map((news) => (
              <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-primary/40" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {news.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{news.date}</span>
                  </div>
                  <CardTitle className="text-lg">{news.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {news.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-primary hover:text-primary/80">
                    อ่านเพิ่มเติม
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline">
              ดูข่าวสารทั้งหมด
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">บริการออนไลน์</h2>
            <p className="text-muted-foreground">บริการครบวงจรสำหรับการรับรองมาตรฐาน GACP</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">สมัครรับรอง</h3>
              <p className="text-muted-foreground mb-4">ส่งใบสมัครรับรองมาตรฐาน GACP ออนไลน์</p>
              <Button onClick={() => navigate('/register')}>เริ่มต้น</Button>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ตรวจสอบใบรับรอง</h3>
              <p className="text-muted-foreground mb-4">ตรวจสอบความถูกต้องของใบรับรอง</p>
              <Button onClick={() => navigate('/verify-certificate')}>ตรวจสอบ</Button>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ติดตามสถานะ</h3>
              <p className="text-muted-foreground mb-4">ติดตามความคืบหน้าการรับรอง</p>
              <Button onClick={() => navigate('/login')}>เข้าสู่ระบบ</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">ติดต่อเรา</h2>
            <p className="text-muted-foreground">สอบถามข้อมูลเพิ่มเติมเกี่ยวกับการรับรองมาตรฐาน GACP</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">ที่อยู่</h3>
              <p className="text-muted-foreground text-sm">
                กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์<br />
                ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร<br />
                กรุงเทพมหานคร 10900
              </p>
            </Card>

            <Card className="text-center p-6">
              <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">โทรศัพท์</h3>
              <p className="text-muted-foreground text-sm">
                02-579-8000<br />
                02-940-6000
              </p>
            </Card>

            <Card className="text-center p-6">
              <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">อีเมล</h3>
              <p className="text-muted-foreground text-sm">
                gacp@doa.go.th<br />
                info@gacp-thailand.org
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">GACP</span>
              </div>
              <p className="text-slate-300 text-sm">
                ระบบรับรองการปฏิบัติทางการเกษตรที่ดี เพื่อความปลอดภัยและคุณภาพของผลผลิตทางการเกษตร
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">ลิงก์สำคัญ</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white transition-colors">มาตรฐาน GACP</a></li>
                <li><a href="#" className="hover:text-white transition-colors">คู่มือการใช้งาน</a></li>
                <li><a href="#" className="hover:text-white transition-colors">คำถามที่พบบ่อย</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">บริการ</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">สมัครรับรอง</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ตรวจสอบใบรับรอง</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ติดตามสถานะ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ดาวน์โหลดเอกสาร</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">ติดต่อเรา</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>02-579-8000</li>
                <li>gacp@doa.go.th</li>
                <li>กรมวิชาการเกษตร</li>
                <li>กระทรวงเกษตรและสหกรณ์</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 mt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 GACP Certification Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;