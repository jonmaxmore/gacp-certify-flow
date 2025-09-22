import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

const ApplicationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: 'ข้อมูลผู้สมัคร', description: 'กรอกข้อมูลพื้นฐานของผู้สมัคร' },
    { id: 2, title: 'ข้อมูลพื้นที่เพาะปลูก', description: 'รายละเอียดพื้นที่และวิธีการเพาะปลูก' },
    { id: 3, title: 'อัพโหลดเอกสาร', description: 'แนบเอกสารประกอบการสมัคร' },
    { id: 4, title: 'การรับรองตนเอง', description: 'ยืนยันความถูกต้องของข้อมูล' },
    { id: 5, title: 'ตรวจสอบและส่ง', description: 'ตรวจสอบข้อมูลและส่งใบสมัคร' },
  ];

  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement autosave functionality
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ข้อมูลผู้สมัคร</h3>
            <p className="text-muted-foreground">
              กรุณากรอกข้อมูลพื้นฐานของผู้สมัครรับรองมาตรฐาน GACP
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">ข้อมูลบุคคล</h4>
                <div className="text-sm text-muted-foreground">
                  • ชื่อ-นามสกุล<br/>
                  • เลขบัตรประชาชน<br/>
                  • ที่อยู่<br/>
                  • หมายเลขโทรศัพท์<br/>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">ข้อมูลนิติบุคคล (ถ้ามี)</h4>
                <div className="text-sm text-muted-foreground">
                  • ชื่อองค์กร<br/>
                  • เลขทะเบียนนิติบุคคล<br/>
                  • ที่อยู่องค์กร<br/>
                  • ผู้แทนองค์กร<br/>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ข้อมูลพื้นที่เพาะปลูก</h3>
            <p className="text-muted-foreground">
              ระบุรายละเอียดเกี่ยวกับพื้นที่เพาะปลูกและวิธีการเพาะปลูก
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">ขนาดพื้นที่</h4>
                <div className="text-sm text-muted-foreground">
                  • ขนาดพื้นที่ (ไร่-งาน-ตารางวา)<br/>
                  • ที่ตั้งพื้นที่<br/>
                  • พิกัดที่ตั้ง<br/>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">การเพาะปลูก</h4>
                <div className="text-sm text-muted-foreground">
                  • ชนิดพืช<br/>
                  • วิธีการเพาะปลูก<br/>
                  • ปริมาณการผลิตโดยประมาณ<br/>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">อัพโหลดเอกสาร</h3>
            <p className="text-muted-foreground">
              แนบเอกสารที่จำเป็นสำหรับการสมัครรับรอง
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">เอกสารบังคับ</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• ใบรับรอง COA (Certificate of Analysis)</div>
                  <div>• แบบฟอร์ม กทล.1</div>
                  <div>• สำเนาบัตรประชาชน</div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">เอกสารเพิ่มเติม</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• ใบอนุญาตประกอบธุรกิจ</div>
                  <div>• แผนที่ตั้งพื้นที่เพาะปลูก</div>
                  <div>• รูปถ่ายพื้นที่เพาะปลูก</div>
                </div>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-muted-foreground">
                ลากและวางไฟล์ที่นี่ หรือ
              </div>
              <Button variant="outline" className="mt-2">
                เลือกไฟล์
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">การรับรองตนเอง</h3>
            <p className="text-muted-foreground">
              ยืนยันความถูกต้องของข้อมูลและการปฏิบัติตามมาตรฐาน GACP
            </p>
            <div className="p-6 border rounded-lg bg-blue-50">
              <h4 className="font-medium mb-3">คำรับรองของผู้สมัคร</h4>
              <div className="space-y-2 text-sm">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span>ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดที่ได้กรอกในใบสมัครนี้เป็นความจริง</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span>ข้าพเจ้ายอมรับและจะปฏิบัติตามเงื่อนไขและข้อกำหนดของมาตรฐาน GACP</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <span>ข้าพเจ้าอนุญาตให้เจ้าหน้าที่เข้าตรวจสอบพื้นที่เพาะปลูกตามที่นัดหมาย</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ตรวจสอบและส่งใบสมัคร</h3>
            <p className="text-muted-foreground">
              กรุณาตรวจสอบข้อมูลทั้งหมดก่อนส่งใบสมัคร
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">สรุปข้อมูล</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><strong>ผู้สมัคร:</strong> {user?.profile?.full_name}</div>
                  <div><strong>อีเมล:</strong> {user?.profile?.email}</div>
                  <div><strong>โทรศัพท์:</strong> {user?.profile?.phone || 'ไม่ระบุ'}</div>
                  <div><strong>องค์กร:</strong> {user?.profile?.organization_name || 'ไม่ระบุ'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ค่าธรรมเนียม</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>ค่าตรวจสอบเอกสาร: 5,000 บาท</div>
                  <div>ค่าตรวจประเมินออนไซต์: 25,000 บาท</div>
                  <div className="border-t pt-2 font-semibold">
                    รวมทั้งสิ้น: 30,000 บาท
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">ขั้นตอนถัดไป</h4>
              <div className="text-sm text-yellow-700">
                หลังจากส่งใบสมัครแล้ว คุณจะได้รับอีเมลยืนยันและลิงก์สำหรับชำระเงินค่าตรวจสอบเอกสาร
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/applicant/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">สร้างใบสมัครใหม่</h1>
              <p className="text-sm text-muted-foreground">
                ขั้นตอนที่ {currentStep} จาก {totalSteps}: {steps[currentStep - 1]?.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`text-center ${currentStep >= step.id ? 'text-primary font-medium' : ''}`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ย้อนกลับ
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
            </Button>

            {currentStep === totalSteps ? (
              <Button>
                ส่งใบสมัคร
              </Button>
            ) : (
              <Button onClick={handleNext}>
                ถัดไป
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationWizard;