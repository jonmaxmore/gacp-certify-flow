import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const Footer: React.FC = () => {
  const { t } = useTranslation('navigation');

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">{t('systemTitle')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบรับรองมาตรฐาน GACP สำหรับเกษตรกรและผู้ประกอบการ
              เพื่อยกระดับคุณภาพผลิตภัณฑ์เกษตรไทย
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">ลิงก์ด่วน</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                เกี่ยวกับเรา
              </Link>
              <Link to="/news" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                ข่าวสาร
              </Link>
              <Link to="/services" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                บริการออนไลน์
              </Link>
              <Link to="/verify-certificate" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                ตรวจสอบใบรับรอง
              </Link>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">บริการ</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">การรับรองมาตรฐาน GACP</p>
              <p className="text-sm text-muted-foreground">การประเมินคุณภาพฟาร์ม</p>
              <p className="text-sm text-muted-foreground">การอบรมและพัฒนา</p>
              <p className="text-sm text-muted-foreground">การตรวจสอบใบรับรอง</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">ติดต่อเรา</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>กรุงเทพมหานคร ประเทศไทย</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+66 2-XXX-XXXX</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@gacp.gov.th</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 GACP Platform. สงวนสิทธิ์ทั้งหมด.
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};