import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, Award, Settings, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground">ยินดีต้อนรับ, {user?.profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ใบสมัครรวม</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รายได้ (บาท)</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ใบรับรอง</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                จัดการผู้ใช้
              </CardTitle>
              <CardDescription>
                จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ผู้ใช้ใหม่วันนี้: 0
                </div>
                <Button className="w-full" disabled>
                  จัดการผู้ใช้
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                จัดการใบสมัคร
              </CardTitle>
              <CardDescription>
                ติดตามและจัดการใบสมัครทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  รอดำเนินการ: 0
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูรายการทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                จัดการการเงิน
              </CardTitle>
              <CardDescription>
                ติดตามการชำระเงินและรายได้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  รายได้เดือนนี้: 0 บาท
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูรายงานการเงิน
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                จัดการใบรับรอง
              </CardTitle>
              <CardDescription>
                ออกและจัดการใบรับรองมาตรฐาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ออกใบรับรองแล้ว: 0
                </div>
                <Button variant="outline" className="w-full" disabled>
                  จัดการใบรับรอง
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ตั้งค่าระบบ
              </CardTitle>
              <CardDescription>
                กำหนดค่าการทำงานของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  ตั้งค่าทั่วไป
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  จัดการเทมเพลต
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security & Audit */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ความปลอดภัย
              </CardTitle>
              <CardDescription>
                ตรวจสอบบันทึกและความปลอดภัย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  การเข้าถึงล่าสุด: ไม่มีข้อมูล
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูบันทึกการใช้งาน
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
              <CardDescription>
                รายการกิจกรรมที่สำคัญในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีกิจกรรมล่าสุด
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สถิติระบบ</CardTitle>
              <CardDescription>
                ข้อมูลสถิติการใช้งานระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0%</div>
                  <div className="text-sm text-muted-foreground">อัตราการอนุมัติ</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">วันเฉลี่ยในการประมวลผล</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;