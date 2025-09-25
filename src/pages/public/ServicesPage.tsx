import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ClipboardCheck, 
  Award, 
  BookOpen, 
  Users, 
  Search,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesPage = () => {
  const navigate = useNavigate();

  const mainServices = [
    {
      icon: FileText,
      title: 'การยื่นขอรับรองมาตรฐาน GACP',
      description: 'ยื่นคำขอรับรองมาตรฐานการปฏิบัติทางการเกษตรที่ดีและการเก็บรักษาที่ถูกต้องผ่านระบบออนไลน์',
      features: ['ยื่นคำขอออนไลน์', 'ติดตามสถานะ', 'อัพโหลดเอกสาร', 'ชำระค่าธรรมเนียม'],
      action: 'เริ่มยื่นคำขอ',
      actionPath: '/register',
      highlight: true
    },
    {
      icon: ClipboardCheck,
      title: 'การตรวจประเมินและออดิต',
      description: 'บริการตรวจประเมินมาตรฐานโดยผู้เชี่ยวชาญที่ได้รับการรับรองอย่างเป็นทางการ',
      features: ['การตรวจประเมินในพื้นที่', 'การประเมินออนไลน์', 'รายงานผลการประเมิน', 'คำแนะนำการปรับปรุง'],
      action: 'ดูรายละเอียด',
      actionPath: '/about'
    },
    {
      icon: Award,
      title: 'การออกใบรับรองและการต่ออายุ',
      description: 'ออกใบรับรองมาตรฐาน GACP และบริการการต่ออายุใบรับรองสำหรับผู้ที่ผ่านการประเมิน',
      features: ['ใบรับรองมีอายุ 3 ปี', 'ระบบตรวจสอบออนไลน์', 'QR Code verification', 'การต่ออายุอัตโนมัติ'],
      action: 'ตรวจสอบใบรับรอง',
      actionPath: '/verify-certificate'
    },
    {
      icon: BookOpen,
      title: 'การอบรมและพัฒนาความรู้',
      description: 'หลักสูตรอบรมและพัฒนาความรู้เกี่ยวกับมาตรฐาน GACP และการปฏิบัติที่ดี',
      features: ['อบรมออนไลน์', 'อบรมในพื้นที่', 'วัสดุการเรียนรู้', 'ใบประกาศนียบัตร'],
      action: 'ดูหลักสูตร',
      actionPath: '/news'
    }
  ];

  const additionalServices = [
    {
      icon: Users,
      title: 'การให้คำปรึกษา',
      description: 'บริการให้คำปรึกษาและแนะนำการปรับปรุงระบบการผลิตให้ตรงตามมาตรฐาน GACP'
    },
    {
      icon: Search,
      title: 'การตรวจสอบและติดตาม',
      description: 'บริการติดตามและตรวจสอบการดำเนินงานหลังได้รับใบรับรองเพื่อการปรับปรุงอย่างต่อเนื่อง'
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: 'ยื่นคำขอ',
      description: 'สมัครสมาชิกและยื่นคำขอรับรองผ่านระบบออนไลน์'
    },
    {
      step: 2,
      title: 'ตรวจสอบเอกสาร',
      description: 'เจ้าหน้าที่ตรวจสอบเอกสารและความครบถ้วนของข้อมูล'
    },
    {
      step: 3,
      title: 'ชำระค่าธรรมเนียม',
      description: 'ชำระค่าธรรมเนียมการประเมินผ่านระบบออนไลน์'
    },
    {
      step: 4,
      title: 'การประเมิน',
      description: 'ผู้ประเมินดำเนินการตรวจประเมินในพื้นที่หรือออนไลน์'
    },
    {
      step: 5,
      title: 'ออกใบรับรอง',
      description: 'ออกใบรับรองมาตรฐาน GACP หากผ่านการประเมิน'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          บริการออนไลน์
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          บริการครบวงจรสำหรับการรับรองมาตรฐาน GACP 
          ตั้งแต่การยื่นคำขอจนถึงการออกใบรับรอง
        </p>
      </div>

      {/* Main Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {mainServices.map((service, index) => (
          <Card key={index} className={`h-full ${service.highlight ? 'border-primary ring-1 ring-primary/20' : ''}`}>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${service.highlight ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{service.title}</CardTitle>
                  {service.highlight && (
                    <Badge variant="default" className="mb-2">แนะนำ</Badge>
                  )}
                  <CardDescription>{service.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">คุณสมบัติหลัก:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate(service.actionPath)}
                  className="w-full"
                  variant={service.highlight ? "default" : "outline"}
                >
                  {service.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Services */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">บริการเสริม</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {additionalServices.map((service, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">ขั้นตอนการรับรอง</h2>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border hidden md:block" 
                 style={{ height: 'calc(100% - 4rem)' }} />
            
            <div className="space-y-6">
              {processSteps.map((step, index) => (
                <div key={index} className="relative flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="text-center bg-primary/5 border-primary/20">
        <CardContent className="py-8">
          <h3 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            เริ่มต้นการรับรองมาตรฐาน GACP วันนี้ เพื่อยกระดับคุณภาพและความปลอดภัยของผลิตภัณฑ์เกษตรของคุณ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
            >
              สมัครสมาชิกเพื่อเริ่มต้น
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/contact')}
            >
              ติดต่อสอบถาม
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesPage;