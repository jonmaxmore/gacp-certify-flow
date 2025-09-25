import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          ข้อกำหนดการใช้งาน
        </h1>
        <p className="text-lg text-muted-foreground">
          ข้อกำหนดและเงื่อนไขสำหรับการใช้งาน GACP Platform
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          มีผลบังคับใช้ตั้งแต่: 1 มกราคม 2024
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scale className="h-5 w-5" />
            <span>บทนำ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ข้อกำหนดการใช้งานนี้กำหนดเงื่อนไขสำหรับการใช้บริการ GACP Platform ที่จัดทำโดยกรมวิชาการเกษตร 
            กระทรวงเกษตรและสหกรณ์ การเข้าใช้งานหรือใช้บริการของเราแสดงว่าคุณยอมรับและตกลงที่จะปฏิบัติตาม
            ข้อกำหนดเหล่านี้ทั้งหมด
          </p>
        </CardContent>
      </Card>

      {/* Acceptance of Terms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>การยอมรับข้อกำหนด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            การใช้งาน GACP Platform ถือว่าคุณได้อ่าน เข้าใจ และยอมรับข้อกำหนดการใช้งานนี้แล้ว 
            หากคุณไม่เห็นด้วยกับข้อกำหนดใดๆ กรุณาหยุดการใช้งานทันที
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>หมายเหตุ:</strong> ข้อกำหนดนี้อาจมีการเปลี่ยนแปลงเป็นครั้งคราว 
              การใช้งานต่อเนื่องหลังการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดใหม่
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Description */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>คำอธิบายบริการ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            GACP Platform เป็นระบบออนไลน์สำหรับการยื่นขอรับรองมาตรฐาน Good Agricultural and Collection Practices (GACP) 
            บริการของเราประกอบด้วย:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>ระบบยื่นขอรับรองมาตรฐาน GACP ออนไลน์</li>
            <li>การติดตามสถานะการประเมิน</li>
            <li>ระบบการชำระเงินออนไลน์</li>
            <li>การจัดการเอกสารและใบรับรอง</li>
            <li>ระบบตรวจสอบใบรับรองแบบออนไลน์</li>
            <li>บริการให้คำปรึกษาและสนับสนุน</li>
          </ul>
        </CardContent>
      </Card>

      {/* User Responsibilities */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ความรับผิดชอบของผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">การใช้งานที่เหมาะสม</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>ใช้บริการเพื่อวัตถุประสงค์ที่กฎหมายอนุญาตเท่านั้น</li>
              <li>ไม่ใช้บริการในทางที่ผิดกฎหมายหรือสร้างความเสียหาย</li>
              <li>ไม่รบกวนหรือขัดขวางการทำงานของระบบ</li>
              <li>ไม่พยายามเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">การจัดการบัญชีผู้ใช้</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>รักษาความปลอดภัยของรหัสผ่านและข้อมูลการเข้าสู่ระบบ</li>
              <li>แจ้งทันทีหากพบการใช้งานที่ไม่ได้รับอนุญาต</li>
              <li>รับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นในบัญชีของคุณ</li>
              <li>ให้ข้อมูลที่ถูกต้องและครบถ้วน</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">ข้อมูลและเอกสาร</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>ข้อมูลที่ส่งมาต้องเป็นจริงและถูกต้อง</li>
              <li>ไม่ส่งข้อมูลที่เป็นเท็จหรือทำให้เข้าใจผิด</li>
              <li>รับผิดชอบต่อการละเมิดลิขสิทธิ์ในเอกสารที่อัพโหลด</li>
              <li>อนุญาตให้เราใช้ข้อมูลสำหรับวัตถุประสงค์ของบริการ</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>เงื่อนไขการชำระเงิน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">ค่าธรรมเนียม</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>ค่าธรรมเนียมจะแสดงไว้อย่างชัดเจนก่อนการชำระเงิน</li>
              <li>ราคาอาจเปลี่ยนแปลงโดยมีการแจ้งให้ทราบล่วงหน้า</li>
              <li>การชำระเงินต้องทำผ่านช่องทางที่กำหนดเท่านั้น</li>
              <li>ใบเสร็จรับเงินจะออกให้โดยอัตโนมัติ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">การคืนเงิน</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>การคืนเงินพิจารณาเป็นรายกรณีตามเงื่อนไขที่กำหนด</li>
              <li>การยกเลิกการบริการหลังเริ่มกระบวนการอาจไม่ได้รับการคืนเงิน</li>
              <li>กรณีข้อผิดพลาดจากระบบ เราจะพิจารณาการคืนเงินหรือการให้บริการใหม่</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Intellectual Property */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ทรัพย์สินทางปัญญา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            เนื้อหา ระบบ และทรัพย์สินทางปัญญาทั้งหมดใน GACP Platform เป็นของกรมวิชาการเกษตร 
            กระทรวงเกษตรและสหกรณ์ รวมถึง:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>ซอฟต์แวร์และระบบการทำงาน</li>
            <li>ข้อความ รูปภาพ และสื่อมัลติมีเดีย</li>
            <li>โลโก้ เครื่องหมายการค้า และตราสัญลักษณ์</li>
            <li>ฐานข้อมูลและรูปแบบการจัดเก็บข้อมูล</li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-amber-800">ข้อจำกัดการใช้งาน</h5>
                <p className="text-sm text-amber-700">
                  ห้ามคัดลอก ดัดแปลง หรือนำไปใช้เพื่อการพาณิชย์โดยไม่ได้รับอนุญาต
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limitation of Liability */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ข้อจำกัดความรับผิดชอบ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">การให้บริการ</h4>
            <p className="text-sm text-muted-foreground">
              เราให้บริการตามความเป็นจริง ("as is") และไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาด 
              หรือการขัดข้องใดๆ อย่างไรก็ตาม เราจะพยายามอย่างดีที่สุดในการให้บริการที่มีคุณภาพ
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">ข้อจำกัดความเสียหาย</h4>
            <p className="text-sm text-muted-foreground">
              เราไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายพิเศษ หรือความเสียหายที่เกิดจากการใช้งาน
              เว้นแต่กรณีที่เกิดจากความประมาทเลินเล่ออย่างร้าย หรือการกระทำโดยเจตนา
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy and Data */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ความเป็นส่วนตัวและข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            การจัดการข้อมูลส่วนบุคคลจะเป็นไปตามนโยบายความเป็นส่วนตัวของเรา 
            ซึ่งเป็นส่วนหนึ่งของข้อกำหนดการใช้งานนี้
          </p>
          
          <div className="flex items-start space-x-2 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-blue-800">การปฏิบัติตาม PDPA</h5>
              <p className="text-sm text-blue-700">
                เราปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 อย่างเคร่งครัด
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Termination */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>การยกเลิกบริการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">การยกเลิกโดยผู้ใช้</h4>
            <p className="text-sm text-muted-foreground">
              คุณสามารถยกเลิกการใช้บริการได้ตลอดเวลา โดยการติดต่อเรา อย่างไรก็ตาม 
              การยกเลิกอาจไม่ส่งผลต่อการให้บริการที่อยู่ระหว่างดำเนินการ
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">การยกเลิกโดยเรา</h4>
            <p className="text-sm text-muted-foreground">
              เราอาจยกเลิกหรือระงับการให้บริการในกรณีที่มีการละเมิดข้อกำหนดการใช้งาน 
              หรือเพื่อปกป้องความปลอดภัยของระบบและผู้ใช้อื่น
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Governing Law */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>กฎหมายที่ใช้บังคับ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ข้อกำหนดการใช้งานนี้อยู่ภายใต้และตีความตามกฎหมายไทย 
            ข้อพิพาทใดๆ จะอยู่ในเขตอำนาจศาลไทยเท่านั้น
          </p>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการติดต่อ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งานนี้ กรุณาติดต่อเราผ่าน:
          </p>
          
          <div className="space-y-2 text-sm">
            <p><strong>หน่วยงาน:</strong> กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์</p>
            <p><strong>อีเมล:</strong> legal@gacp.gov.th</p>
            <p><strong>โทรศัพท์:</strong> 02-579-0102</p>
            <p><strong>ที่อยู่:</strong> ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsPage;