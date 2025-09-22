import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReviewerDashboard = () => {
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
            <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
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
                  <p className="text-sm font-medium text-muted-foreground">รอตรวจสอบ</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">อนุมัติแล้ว</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ส่งกลับแก้ไข</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Reviews */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ใบสมัครรอตรวจสอบ
              </CardTitle>
              <CardDescription>
                รายการใบสมัครที่รอการตรวจสอบเอกสาร
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีใบสมัครรอตรวจสอบ
                </div>
                <Button className="w-full" disabled>
                  ดูรายการทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review Queue */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                คิวการตรวจสอบ
              </CardTitle>
              <CardDescription>
                จัดการลำดับความสำคัญในการตรวจสอบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีรายการในคิว
                </div>
                <Button variant="outline" className="w-full" disabled>
                  จัดการคิว
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review History */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ประวัติการตรวจสอบ
              </CardTitle>
              <CardDescription>
                ดูประวัติการตรวจสอบที่ผ่านมา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ยังไม่มีประวัติการตรวจสอบ
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูประวัติทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
              <CardDescription>
                รายการกิจกรรมการตรวจสอบล่าสุด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีกิจกรรมล่าสุด
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReviewerDashboard;