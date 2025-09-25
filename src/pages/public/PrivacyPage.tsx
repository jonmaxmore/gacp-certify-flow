import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Users } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          นโยบายความเป็นส่วนตัว
        </h1>
        <p className="text-lg text-muted-foreground">
          GACP Platform ให้ความสำคัญกับการปกป้องข้อมูลส่วนบุคคลของผู้ใช้งาน
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          ปรับปรุงล่าสุด: 1 มกราคม 2024
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>ภาพรวม</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่ GACP Platform เก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
            เมื่อคุณใช้บริการของเรา เราให้ความสำคัญกับความปลอดภัยและความเป็นส่วนตัวของข้อมูลของคุณอย่างยิ่ง
          </p>
        </CardContent>
      </Card>

      {/* Information We Collect */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ข้อมูลที่เราเก็บรวบรวม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">ข้อมูลส่วนบุคคล</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>ชื่อ-นามสกุล</li>
              <li>เลขประจำตัวประชาชน</li>
              <li>ที่อยู่อีเมล</li>
              <li>หมายเลขโทรศัพท์</li>
              <li>ที่อยู่</li>
              <li>ข้อมูลองค์กร (ถ้ามี)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">ข้อมูลการใช้งาน</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>บันทึกการเข้าสู่ระบบ</li>
              <li>การใช้งานคุณสมบัติต่างๆ</li>
              <li>ข้อมูลการเรียกดูหน้าเว็บ</li>
              <li>ที่อยู่ IP และข้อมูลอุปกรณ์</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">ข้อมูลการรับรอง</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>ข้อมูลใบสมัครรับรอง</li>
              <li>เอกสารหลักฐาน</li>
              <li>รูปภาพและไฟล์แนบ</li>
              <li>ผลการประเมิน</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* How We Use Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>วิธีการใช้ข้อมูล</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">การให้บริการ</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>ดำเนินการขอรับรองมาตรฐาน GACP</li>
                <li>การติดต่อสื่อสารเกี่ยวกับการให้บริการ</li>
                <li>การให้การสนับสนุนและช่วยเหลือ</li>
                <li>การอัพเดทสถานะและข้อมูลสำคัญ</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">การปรับปรุงบริการ</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>วิเคราะห์การใช้งานเพื่อปรับปรุงระบบ</li>
                <li>พัฒนาคุณสมบัติใหม่</li>
                <li>แก้ไขปัญหาและข้อบกพร่อง</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">การปฏิบัติตามกฎหมาย</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
                <li>การรายงานต่อหน่วยงานราชการ</li>
                <li>การตรวจสอบและออดิต</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>การปกป้องข้อมูล</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">มาตรการรักษาความปลอดภัย</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>การเข้ารหัสข้อมูล (SSL/TLS)</li>
              <li>การควบคุมการเข้าถึงด้วยสิทธิ์ผู้ใช้</li>
              <li>การสำรองข้อมูลอย่างปลอดภัย</li>
              <li>การตรวจสอบความปลอดภัยอย่างสม่ำเสมอ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">การเก็บรักษาข้อมูล</h4>
            <p className="text-sm text-muted-foreground">
              เราเก็บรักษาข้อมูลของคุณเท่าที่จำเป็นสำหรับการให้บริการและปฏิบัติตามกฎหมาย 
              โดยทั่วไปข้อมูลจะถูกเก็บไว้เป็นระยะเวลา 5 ปี หลังจากสิ้นสุดการให้บริการ
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>การแบ่งปันข้อมูล</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            เราไม่ขาย แลกเปลี่ยน หรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>หน่วยงานราชการ:</strong> เมื่อจำเป็นสำหรับการปฏิบัติตามกฎหมายหรือคำสั่งศาล
            </li>
            <li>
              <strong>ผู้ให้บริการ:</strong> บริษัทที่ให้บริการสนับสนุนการดำเนินงาน เช่น การเก็บข้อมูล การส่งอีเมล
            </li>
            <li>
              <strong>กรณีฉุกเฉิน:</strong> เพื่อปกป้องความปลอดภัยและสิทธิ์ของผู้ใช้งานหรือสาธารณะ
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>สิทธิของคุณ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">คุณมีสิทธิ์ดังต่อไปนี้เกี่ยวกับข้อมูลส่วนบุคคลของคุณ:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">สิทธิ์การเข้าถึง</h4>
              <p className="text-sm text-muted-foreground">ขอดูข้อมูลส่วนบุคคลที่เราเก็บรักษา</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">สิทธิ์การแก้ไข</h4>
              <p className="text-sm text-muted-foreground">แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่ครบถ้วน</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">สิทธิ์การลบ</h4>
              <p className="text-sm text-muted-foreground">ขอให้ลบข้อมูลในบางกรณี</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">สิทธิ์การคัดค้าน</h4>
              <p className="text-sm text-muted-foreground">คัดค้านการประมวลผลข้อมูลในบางกรณี</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookies */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>คุกกี้ (Cookies)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ คุกกี้ที่เราใช้ประกอบด้วย:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>คุกกี้ที่จำเป็น:</strong> สำหรับการทำงานของเว็บไซต์</li>
            <li><strong>คุกกี้การวิเคราะห์:</strong> เพื่อเข้าใจการใช้งานเว็บไซต์</li>
            <li><strong>คุกกี้การตั้งค่า:</strong> จดจำการตั้งค่าของผู้ใช้</li>
          </ul>
        </CardContent>
      </Card>

      {/* Changes to Policy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>การเปลี่ยนแปลงนโยบาย</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ทราบ
            ผ่านอีเมลหรือประกาศบนเว็บไซต์ การใช้งานบริการต่อไปหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับนโยบายใหม่
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>ติดต่อเรา</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิ์ของคุณ กรุณาติดต่อเราผ่าน:
          </p>
          
          <div className="space-y-2 text-sm">
            <p><strong>อีเมล:</strong> privacy@gacp.gov.th</p>
            <p><strong>โทรศัพท์:</strong> 02-579-0102</p>
            <p><strong>ที่อยู่:</strong> กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์ กรุงเทพมหานคร 10900</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;