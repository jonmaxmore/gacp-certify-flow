import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare, 
  Send,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    
    toast({
      title: "ส่งข้อความสำเร็จ",
      description: "เราจะติดต่อกลับไปภายใน 24 ชั่วโมง",
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      category: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'ที่อยู่สำนักงาน',
      details: [
        'กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์',
        'ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร',
        'กรุงเทพมหานคร 10900'
      ]
    },
    {
      icon: Phone,
      title: 'โทรศัพท์',
      details: [
        'สายด่วน: 1556',
        'โทรศัพท์: 02-579-0102',
        'โทรสาร: 02-579-7094'
      ]
    },
    {
      icon: Mail,
      title: 'อีเมล',
      details: [
        'info@gacp.gov.th',
        'support@gacp.gov.th',
        'certification@gacp.gov.th'
      ]
    },
    {
      icon: Clock,
      title: 'เวลาทำการ',
      details: [
        'จันทร์ - ศุกร์: 08:30 - 16:30',
        'พักเที่ยง: 12:00 - 13:00',
        'หยุดวันเสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์'
      ]
    }
  ];

  const faqItems = [
    {
      question: 'ใช้เวลานานแค่ไหนในการรับรองมาตรฐาน GACP?',
      answer: 'โดยทั่วไปใช้เวลาประมาณ 30-45 วันทำการ ตั้งแต่ยื่นเอกสารครบถ้วนจนถึงการออกใบรับรอง'
    },
    {
      question: 'ค่าใช้จ่ายในการรับรองเป็นอย่างไร?',
      answer: 'ค่าธรรมเนียมขึ้นอยู่กับขนาดของฟาร์มและประเภทผลิตภัณฑ์ สามารถดูรายละเอียดได้ในหน้าบริการออนไลน์'
    },
    {
      question: 'ใบรับรองมีอายุเท่าไหร่?',
      answer: 'ใบรับรองมาตรฐาน GACP มีอายุ 3 ปี และสามารถต่ออายุได้โดยผ่านการประเมินซ้ำ'
    },
    {
      question: 'จำเป็นต้องมีการตรวจประเมินในพื้นที่หรือไม่?',
      answer: 'ใช่ การตรวจประเมินในพื้นที่เป็นส่วนสำคัญของกระบวนการรับรอง เพื่อตรวจสอบการปฏิบัติจริง'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">ติดต่อเรา</h1>
        <p className="text-xl text-muted-foreground">
          สอบถามข้อมูล ขอความช่วยเหลือ หรือให้ข้อเสนอแนะ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>ส่งข้อความถึงเรา</span>
              </CardTitle>
              <CardDescription>
                กรอกแบบฟอร์มด้านล่าง เราจะติดต่อกลับภายใน 24 ชั่วโมง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">หมวดหมู่</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">สอบถามทั่วไป</SelectItem>
                        <SelectItem value="certification">การรับรองมาตรฐาน</SelectItem>
                        <SelectItem value="technical">ปัญหาทางเทคนิค</SelectItem>
                        <SelectItem value="training">การอบรม</SelectItem>
                        <SelectItem value="complaint">ร้องเรียน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">หัวข้อ *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">ข้อความ *</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  ส่งข้อความ
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลการติดต่อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2 text-primary">
                    <info.icon className="h-5 w-5" />
                    <h4 className="font-semibold">{info.title}</h4>
                  </div>
                  <div className="pl-7">
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>ลิงก์ด่วน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                ตรวจสอบใบรับรอง
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                คู่มือการใช้งาน
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                สายด่วน 1556
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">คำถามที่พบบ่อย</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>แผนที่</CardTitle>
            <CardDescription>
              สำนักงานกรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">แผนที่จะแสดงที่นี่</p>
                <p className="text-sm text-muted-foreground">
                  (ในการใช้งานจริงจะเป็น Google Maps หรือ OpenStreetMap)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;