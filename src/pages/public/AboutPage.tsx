import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, Users, Target } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          เกี่ยวกับ GACP Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          ระบบรับรองมาตรฐาน Good Agricultural and Collection Practices (GACP) 
          เพื่อยกระดับคุณภาพและความปลอดภัยของผลิตภัณฑ์เกษตรไทย
        </p>
      </div>

      {/* Mission Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="text-center">
          <CardHeader>
            <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">ความปลอดภัย</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              มาตรฐานความปลอดภัยสูงสุดในการผลิตและเก็บรักษาผลิตภัณฑ์เกษตร
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Award className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">คุณภาพ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              การรับรองคุณภาพที่เป็นไปตามมาตรฐานสากล
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Users className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">ชุมชน</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              สนับสนุนเกษตรกรและชุมชนในการพัฒนาอย่างยั่งยืน
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Target className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">เป้าหมาย</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              มุ่งเป้าสู่การเป็นผู้นำด้านเกษตรปลอดภัยในภูมิภาค
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What is GACP */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">GACP คืออะไร?</CardTitle>
          <CardDescription>
            Good Agricultural and Collection Practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            GACP (Good Agricultural and Collection Practices) เป็นมาตรฐานการปฏิบัติทางการเกษตรที่ดี
            และการเก็บรักษาที่ถูกต้องสำหรับสมุนไพรและพืชผลการเกษตร เพื่อให้ได้ผลิตภัณฑ์ที่มีคุณภาพ
            ปลอดภัย และมีประสิทธิภาพ
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">หลักการสำคัญ:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>การเตรียมดินและการเพาะปลูก</li>
                <li>การใช้ปุ่ยและสารป้องกันกำจัดศัตรูพืช</li>
                <li>การเก็บเกี่ยวและการจัดการหลังการเก็บเกี่ยว</li>
                <li>การบรรจุและการขนส่ง</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ประโยชน์:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>ผลิตภัณฑ์มีคุณภาพและปลอดภัย</li>
                <li>เพิ่มความน่าเชื่อถือในตลาด</li>
                <li>ลดความเสี่ยงด้านสุขภาพ</li>
                <li>สนับสนุนการส่งออก</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Our Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">บริการของเรา</CardTitle>
          <CardDescription>
            บริการครบวงจรสำหรับการรับรองมาตรฐาน GACP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <h4 className="font-semibold">การยื่นขอรับรอง</h4>
                  <p className="text-sm text-muted-foreground">
                    ระบบออนไลน์สำหรับการยื่นขอรับรองมาตรฐาน GACP
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <h4 className="font-semibold">การตรวจประเมิน</h4>
                  <p className="text-sm text-muted-foreground">
                    การตรวจประเมินโดยผู้เชี่ยวชาญที่ได้รับการรับรอง
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <h4 className="font-semibold">การออกใบรับรอง</h4>
                  <p className="text-sm text-muted-foreground">
                    การออกใบรับรองมาตรฐาน GACP ที่ได้รับการยอมรับ
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <h4 className="font-semibold">การติดตามและดูแล</h4>
                  <p className="text-sm text-muted-foreground">
                    การติดตามและให้คำแนะนำเพื่อการปรับปรุงอย่างต่อเนื่อง
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ติดต่อเรา</CardTitle>
          <CardDescription>
            สอบถามข้อมูลเพิ่มเติมหรือขอความช่วยเหลือ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold mb-2">โทรศัพท์</h4>
              <p className="text-muted-foreground">+66 2-XXX-XXXX</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">อีเมล</h4>
              <p className="text-muted-foreground">info@gacp.gov.th</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">เวลาทำการ</h4>
              <p className="text-muted-foreground">จันทร์-ศุกร์ 8:30-16:30</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;