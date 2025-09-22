import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Video, FileText, MapPin, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuditorDashboard = () => {
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
            <h1 className="text-2xl font-semibold">Auditor Dashboard</h1>
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
                  <p className="text-sm font-medium text-muted-foreground">นัดหมายวันนี้</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ประเมินออนไลน์</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Video className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ประเมินออนไซต์</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">รายงานสำเร็จ</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ตารางงานวันนี้
              </CardTitle>
              <CardDescription>
                รายการนัดหมายประเมินวันนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีนัดหมายวันนี้
                </div>
                <Button className="w-full" disabled>
                  ดูตารางเต็ม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Online Assessments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                ประเมินออนไลน์
              </CardTitle>
              <CardDescription>
                เข้าร่วมการประเมินผ่านระบบออนไลน์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีการประเมินออนไลน์
                </div>
                <Button variant="outline" className="w-full" disabled>
                  เข้าร่วมประเมิน
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Reports */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                รายงานการประเมิน
              </CardTitle>
              <CardDescription>
                จัดการและส่งรายงานการประเมิน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีรายงานรอส่ง
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูรายงานทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Onsite Assessments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                ประเมินออนไซต์
              </CardTitle>
              <CardDescription>
                การประเมินที่หน้างาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีการประเมินออนไซต์
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูรายการทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recording Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                จัดการบันทึกวิดีโอ
              </CardTitle>
              <CardDescription>
                ดูและจัดการบันทึกการประเมิน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ไม่มีบันทึกวิดีโอ
                </div>
                <Button variant="outline" className="w-full" disabled>
                  ดูบันทึกทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>การดำเนินการด่วน</CardTitle>
              <CardDescription>
                เครื่องมือสำหรับการทำงานประจำ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                สร้างรายงานใหม่
              </Button>
              <Button variant="outline" className="w-full" disabled>
                อัพโหลดหลักฐาน
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
              <CardDescription>
                รายการกิจกรรมการประเมินล่าสุด
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

export default AuditorDashboard;