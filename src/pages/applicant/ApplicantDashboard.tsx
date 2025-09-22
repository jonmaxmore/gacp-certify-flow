import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, CreditCard, Calendar, Download, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ApplicantDashboard = () => {
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
            <h1 className="text-2xl font-semibold">GACP Certification Platform</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Application Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                สร้างใบสมัครใหม่
              </CardTitle>
              <CardDescription>
                เริ่มต้นกระบวนการสมัครรับรองมาตรฐาน GACP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/applicant/application/new">
                <Button className="w-full">
                  เริ่มต้นสมัคร
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Applications List Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ใบสมัครของคุณ
              </CardTitle>
              <CardDescription>
                ดูและจัดการใบสมัครทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ยังไม่มีใบสมัคร
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูใบสมัครทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                การชำระเงิน
              </CardTitle>
              <CardDescription>
                ติดตามสถานะการชำระเงิน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ยังไม่มีการชำระเงิน
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูประวัติการชำระเงิน
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                นัดหมายประเมิน
              </CardTitle>
              <CardDescription>
                จัดการนัดหมายประเมินออนไลน์และออนไซต์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ยังไม่มีนัดหมาย
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูนัดหมายทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                ใบรับรอง
              </CardTitle>
              <CardDescription>
                ดาวน์โหลดใบรับรองมาตรฐาน GACP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ยังไม่มีใบรับรอง
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูใบรับรองทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Test Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                แบบทดสอบความรู้
              </CardTitle>
              <CardDescription>
                ทำแบบทดสอบความรู้ก่อนสมัครรับรอง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                เริ่มทำแบบทดสอบ
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>ภาพรวมสถานะ</CardTitle>
              <CardDescription>
                สถานะการดำเนินการในระบบ GACP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-600">0</div>
                  <div className="text-sm text-muted-foreground">ใบสมัครรวม</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-sm text-muted-foreground">รอตรวจสอบ</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">อนุมัติแล้ว</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground">ใบรับรอง</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ApplicantDashboard;