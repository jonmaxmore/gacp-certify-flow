import React from 'react';
import { CertificateVerification } from '@/components/security/CertificateVerification';

const CertificateVerificationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            ระบบตรวจสอบใบรับรอง GACP
          </h1>
          <p className="text-lg text-muted-foreground">
            ตรวจสอบความถูกต้องและสถานะของใบรับรองมาตรฐาน GACP
          </p>
        </div>
        
        <CertificateVerification />
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">เกี่ยวกับใบรับรอง GACP</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Good Agricultural and Collection Practices (GACP)</strong> 
              เป็นมาตรฐานการปฏิบัติทางการเกษตรและการเก็บรวบรวมที่ดี 
              สำหรับการผลิตสมุนไพรและพืชแพทย์แผนไทย
            </p>
            <p>
              ใบรับรองนี้รับรองว่าผลิตภัณฑ์ได้รับการผลิตตามมาตรฐานคุณภาพและความปลอดภัยที่กำหนด
            </p>
            <p>
              หากมีข้อสงสัยเกี่ยวกับความถูกต้องของใบรับรอง กรุณาติดต่อหน่วยงานออกใบรับรองโดยตรง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;