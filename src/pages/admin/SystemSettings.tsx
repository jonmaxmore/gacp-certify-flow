import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings, Save, Database, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Application Settings
    applicationFeeAmount: '',
    assessmentFeeAmount: '',
    certificateValidityMonths: '',
    
    // Email Settings
    emailNotificationEnabled: true,
    emailTemplateWelcome: '',
    emailTemplateApproval: '',
    
    // System Settings
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileUploadSize: '',
    
    // Security Settings
    passwordMinLength: '',
    sessionTimeout: '',
    maxLoginAttempts: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*');

      if (error) throw error;

      const settingsMap = {};
      data.forEach(config => {
        settingsMap[config.key] = config.value;
      });

      setSettings(prev => ({
        ...prev,
        ...settingsMap
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: typeof value === 'object' ? value : { value },
          description: getSettingDescription(key),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const getSettingDescription = (key) => {
    const descriptions = {
      applicationFeeAmount: 'ค่าธรรมเนียมการสมัคร',
      assessmentFeeAmount: 'ค่าธรรมเนียมการประเมิน',
      certificateValidityMonths: 'ระยะเวลาการใช้งานใบรับรอง (เดือน)',
      emailNotificationEnabled: 'เปิดใช้งานการแจ้งเตือนทางอีเมล',
      maintenanceMode: 'โหมดปรับปรุงระบบ',
      registrationEnabled: 'เปิดให้ลงทะเบียนใหม่',
      maxFileUploadSize: 'ขนาดไฟล์สูงสุดที่อัพโหลดได้ (MB)',
      passwordMinLength: 'ความยาวรหัสผ่านต้องการ',
      sessionTimeout: 'เวลาหมดอายุของ Session (นาที)',
      maxLoginAttempts: 'จำนวนครั้งการเข้าสู่ระบบที่ล้มเหลวสูงสุด'
    };
    return descriptions[key] || key;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        updateSetting(key, value)
      );

      await Promise.all(promises);

      toast({
        title: "สำเร็จ",
        description: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">ตั้งค่าระบบ</h1>
            <p className="text-muted-foreground">กำหนดค่าการทำงานของระบบ</p>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                การตั้งค่าใบสมัคร
              </CardTitle>
              <CardDescription>
                กำหนดค่าธรรมเนียมและระยะเวลาต่างๆ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="applicationFee">ค่าธรรมเนียมการสมัคร (บาท)</Label>
                <Input
                  id="applicationFee"
                  type="number"
                  value={settings.applicationFeeAmount}
                  onChange={(e) => updateSettings('applicationFeeAmount', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="assessmentFee">ค่าธรรมเนียมการประเมิน (บาท)</Label>
                <Input
                  id="assessmentFee"
                  type="number"
                  value={settings.assessmentFeeAmount}
                  onChange={(e) => updateSettings('assessmentFeeAmount', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="certificateValidity">ระยะเวลาใบรับรอง (เดือน)</Label>
                <Input
                  id="certificateValidity"
                  type="number"
                  value={settings.certificateValidityMonths}
                  onChange={(e) => updateSettings('certificateValidityMonths', e.target.value)}
                  placeholder="36"
                />
              </div>
              
              <div>
                <Label htmlFor="maxFileSize">ขนาดไฟล์สูงสุด (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileUploadSize}
                  onChange={(e) => updateSettings('maxFileUploadSize', e.target.value)}
                  placeholder="10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                การตั้งค่าอีเมล
              </CardTitle>
              <CardDescription>
                กำหนดค่าการแจ้งเตือนและเทมเพลตอีเมล
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>เปิดใช้งานการแจ้งเตือนอีเมล</Label>
                  <p className="text-sm text-muted-foreground">ส่งอีเมลแจ้งเตือนผู้ใช้</p>
                </div>
                <Switch
                  checked={settings.emailNotificationEnabled}
                  onCheckedChange={(checked) => updateSettings('emailNotificationEnabled', checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="welcomeTemplate">เทมเพลตอีเมลต้อนรับ</Label>
                <Textarea
                  id="welcomeTemplate"
                  value={settings.emailTemplateWelcome}
                  onChange={(e) => updateSettings('emailTemplateWelcome', e.target.value)}
                  placeholder="ข้อความต้อนรับสำหรับสมาชิกใหม่..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="approvalTemplate">เทมเพลตอีเมลการอนุมัติ</Label>
                <Textarea
                  id="approvalTemplate"
                  value={settings.emailTemplateApproval}
                  onChange={(e) => updateSettings('emailTemplateApproval', e.target.value)}
                  placeholder="ข้อความแจ้งการอนุมัติใบสมัคร..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                การตั้งค่าระบบ
              </CardTitle>
              <CardDescription>
                กำหนดค่าการทำงานของระบบโดยรวม
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>โหมดปรับปรุงระบบ</Label>
                  <p className="text-sm text-muted-foreground">ปิดการใช้งานชั่วคราวเพื่อปรับปรุง</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSettings('maintenanceMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>เปิดให้ลงทะเบียน</Label>
                  <p className="text-sm text-muted-foreground">อนุญาตให้ผู้ใช้ใหม่ลงทะเบียน</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => updateSettings('registrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                การตั้งค่าความปลอดภัย
              </CardTitle>
              <CardDescription>
                กำหนดนโยบายความปลอดภัยของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordLength">ความยาวรหัสผ่านขั้นต่ำ</Label>
                <Input
                  id="passwordLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => updateSettings('passwordMinLength', e.target.value)}
                  placeholder="8"
                />
              </div>
              
              <div>
                <Label htmlFor="sessionTimeout">เวลาหมดอายุ Session (นาที)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSettings('sessionTimeout', e.target.value)}
                  placeholder="60"
                />
              </div>
              
              <div>
                <Label htmlFor="maxAttempts">จำนวนครั้งล็อกอินล้มเหลวสูงสุด</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSettings('maxLoginAttempts', e.target.value)}
                  placeholder="5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SystemSettings;