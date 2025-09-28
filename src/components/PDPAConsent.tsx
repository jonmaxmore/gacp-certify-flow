import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Users, Cookie } from 'lucide-react';
import { PDPA_TEXTS, THAI_REGULATIONS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

interface PDPAConsentProps {
  userId: string;
  onComplete: (consents: PDPAConsentData[]) => void;
}

interface PDPAConsentData {
  type: 'registration' | 'data_processing' | 'marketing' | 'cookies';
  consent_given: boolean;
  consent_text: string;
}

const PDPAConsent: React.FC<PDPAConsentProps> = ({ userId, onComplete }) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    registration: false,
    data_processing: false,
    marketing: false,
    cookies: false
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const consentTypes = [
    {
      id: 'registration',
      title: 'การเก็บรวบรวมข้อมูลสำหรับการสมัครสมาชิก',
      description: 'ข้อมูลพื้นฐานสำหรับการสร้างบัญชีและการติดต่อ',
      icon: <Users className="h-5 w-5" />,
      required: true,
      text: PDPA_TEXTS?.consent_registration?.th || 'เราจะเก็บรวบรวมข้อมูลส่วนบุคคลที่จำเป็นสำหรับการสมัครสมาชิกและการติดต่อ'
    },
    {
      id: 'data_processing',
      title: 'การประมวลผลข้อมูลสำหรับการรับรองมาตรฐาน',
      description: 'ข้อมูลที่จำเป็นสำหรับกระบวนการตรวจสอบและรับรอง GACP',
      icon: <FileText className="h-5 w-5" />,
      required: true,
      text: PDPA_TEXTS?.consent_data_processing?.th || 'เราจะประมวลผลข้อมูลของท่านเพื่อการตรวจสอบและออกใบรับรอง GACP'
    },
    {
      id: 'marketing',
      title: 'การรับข้อมูลข่าวสารและการตลาด',
      description: 'ข้อมูลเกี่ยวกับบริการใหม่ กิจกรรม และข้อเสนอพิเศษ',
      icon: <Shield className="h-5 w-5" />,
      required: false,
      text: 'เราอาจใช้ข้อมูลของท่านเพื่อส่งข้อมูลข่าวสาร กิจกรรม และข้อเสนอพิเศษที่เกี่ยวข้องกับบริการของเรา ท่านสามารถเลือกไม่รับข้อมูลดังกล่าวได้ตลอดเวลา'
    },
    {
      id: 'cookies',
      title: 'การใช้คุกกี้และเทคโนโลยีติดตาม',
      description: 'เพื่อปรับปรุงประสบการณ์การใช้งานเว็บไซต์',
      icon: <Cookie className="h-5 w-5" />,
      required: false,
      text: 'เราใช้คุกกี้เพื่อจดจำการตั้งค่าของท่าน วิเคราะห์การใช้งาน และปรับปรุงบริการ ท่านสามารถปฏิเสธการใช้คุกกี้ที่ไม่จำเป็นได้'
    }
  ];

  const handleConsentChange = (type: string, checked: boolean) => {
    setConsents(prev => ({ ...prev, [type]: checked }));
  };

  const canSubmit = () => {
    const requiredConsents = consentTypes.filter(ct => ct.required);
    return requiredConsents.every(ct => consents[ct.id]);
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    
    setIsSubmitting(true);
    
    try {
      const consentData: PDPAConsentData[] = consentTypes.map(ct => ({
        type: ct.id as PDPAConsentData['type'],
        consent_given: consents[ct.id] || false,
        consent_text: ct.text
      }));

      // Save to database if supabase is available
      if (supabase) {
        const consentRecords = consentData.map(consent => ({
          user_id: userId,
          consent_type: consent.type,
          consent_given: consent.consent_given,
          consent_text: consent.consent_text,
          ip_address: null,
          user_agent: navigator.userAgent
        }));

        try {
          const { error } = await supabase
            .from('pdpa_consents')
            .insert(consentRecords);

          if (error) {
            console.error('Error saving PDPA consents:', error);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      onComplete(consentData);
    } catch (error) {
      console.error('Error processing PDPA consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">การคุ้มครองข้อมูลส่วนบุคคล</CardTitle>
          <p className="text-muted-foreground mt-2">
            ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">หน่วยงานผู้ควบคุมข้อมูล</h3>
            <p className="text-sm text-muted-foreground">
              {THAI_REGULATIONS?.department || 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก'}
            </p>
            <p className="text-sm text-muted-foreground">
              ดำเนินการตาม {THAI_REGULATIONS?.act || 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562'}
            </p>
          </div>

          <div className="space-y-4">
            {consentTypes.map((consentType) => (
              <Card key={consentType.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={consentType.id}
                      checked={consents[consentType.id] || false}
                      onCheckedChange={(checked) => 
                        handleConsentChange(consentType.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {consentType.icon}
                        <label 
                          htmlFor={consentType.id}
                          className="font-medium cursor-pointer"
                        >
                          {consentType.title}
                          {consentType.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {consentType.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(consentType.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        อ่านรายละเอียด
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>หมายเหตุ:</strong> รายการที่มีเครื่องหมาย * จำเป็นต้องยินยอมเพื่อใช้บริการ
              ส่วนรายการอื่นท่านสามารถเลือกได้ และสามารถเปลี่ยนแปลงได้ในภายหลัง
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'ยินยอมและดำเนินการต่อ'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {consentTypes.find(ct => ct.id === showDetails)?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                {consentTypes.find(ct => ct.id === showDetails)?.text}
              </p>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">สิทธิของเจ้าของข้อมูล</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• สิทธิในการเข้าถึงข้อมูล</li>
                  <li>• สิทธิในการแก้ไขข้อมูล</li>
                  <li>• สิทธิในการลบข้อมูล</li>
                  <li>• สิทธิในการคัดค้านการประมวลผล</li>
                  <li>• สิทธิในการยกเลิกความยินยอม</li>
                  <li>• สิทธิในการร้องเรียน</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">การติดต่อ</h4>
                <p className="text-sm text-muted-foreground">
                  หากท่านมีคำถามเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล 
                  กรุณาติดต่อ: privacy@gacp.go.th หรือ โทร 02-123-4567
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDPAConsent;