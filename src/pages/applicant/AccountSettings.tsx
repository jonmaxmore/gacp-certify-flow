import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Building, MapPin, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AccountSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization_name: '',
    thai_id_number: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || '',
        email: user.profile.email || '',
        phone: user.profile.phone || '',
        organization_name: user.profile.organization_name || '',
        
        thai_id_number: user.profile.thai_id_number || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await updateProfile(formData);
      
      if (error) throw error;

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตแล้ว",
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านใหม่และการยืนยันรหัสผ่าน",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "รหัสผ่านสั้นเกินไป",
        description: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของคุณได้รับการอัปเดตแล้ว",
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">ตั้งค่าบัญชี</h1>
          <p className="text-muted-foreground">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription>
              อัปเดตข้อมูลโปรไฟล์และข้อมูลติดต่อของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="กรอกอีเมล"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thai_id_number">เลขบัตรประจำตัวประชาชน</Label>
                  <Input
                    id="thai_id_number"
                    value={formData.thai_id_number}
                    onChange={(e) => handleInputChange('thai_id_number', e.target.value)}
                    placeholder="กรอกเลขบัตรประจำตัว 13 หลัก"
                    maxLength={13}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="organization_name">ชื่อองค์กร/บริษัท</Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    placeholder="กรอกชื่อองค์กร (ถ้ามี)"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ความปลอดภัย
            </CardTitle>
            <CardDescription>
              จัดการรหัสผ่านและการตั้งค่าความปลอดภัยของบัญชี
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordChange ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">รหัสผ่าน</h3>
                  <p className="text-sm text-muted-foreground">
                    เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordChange(true)}
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "กำลังอัปเดต..." : "อัปเดตรหัสผ่าน"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชี</CardTitle>
            <CardDescription>
              ข้อมูลบัญชีและสถานะการใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>บทบาท</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {user?.profile?.role === 'applicant' ? 'ผู้สมัคร' : 
                     user?.profile?.role === 'reviewer' ? 'ผู้ตรวจสอบ' :
                     user?.profile?.role === 'auditor' ? 'ผู้ประเมิน' :
                     user?.profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ไม่ระบุ'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>สถานะบัญชี</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <span className="text-sm font-medium text-green-600">
                    {user?.profile?.is_active ? 'ใช้งานได้' : 'ถูกระงับ'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>วันที่สร้างบัญชี</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <span className="text-sm">
                    {user?.profile?.created_at ? 
                      new Date(user.profile.created_at).toLocaleDateString('th-TH') : 
                      'ไม่ระบุ'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>เข้าสู่ระบบครั้งล่าสุด</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <span className="text-sm">
                    {user?.profile?.last_login_at ? 
                      new Date(user.profile.last_login_at).toLocaleDateString('th-TH') : 
                      'ไม่ระบุ'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;