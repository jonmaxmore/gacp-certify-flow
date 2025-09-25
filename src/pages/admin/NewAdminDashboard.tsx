import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Award, Settings, BarChart3, Bell, Shield, Calendar } from 'lucide-react';
import NewsManager from '@/components/cms/NewsManager';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';

const NewAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    certifiedFarms: 0,
    monthlyApplications: 0,
    activeUsers: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load statistics from database
      const { data: adminStats } = await supabase.rpc('get_admin_stats');
      
      if (adminStats && typeof adminStats === 'object') {
        setStats({
          totalUsers: (adminStats as any).total_users || 0,
          totalApplications: (adminStats as any).total_applications || 0,
          pendingApplications: (adminStats as any).pending_applications || 0,
          approvedApplications: (adminStats as any).approved_applications || 0,
          certifiedFarms: (adminStats as any).approved_applications || 0,
          monthlyApplications: (adminStats as any).monthly_applications || 0,
          activeUsers: (adminStats as any).active_users || 0,
          approvalRate: (adminStats as any).approval_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'ผู้ใช้งานทั้งหมด',
      value: stats.totalUsers.toLocaleString(),
      description: `ผู้ใช้งานเดือนนี้ ${stats.activeUsers}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'ใบสมัครทั้งหมด',
      value: stats.totalApplications.toLocaleString(),
      description: `ใบสมัครเดือนนี้ ${stats.monthlyApplications}`,
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'รอการตรวจสอบ',
      value: stats.pendingApplications.toLocaleString(),
      description: 'ใบสมัครที่รอดำเนินการ',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'ฟาร์มที่ได้รับรอง',
      value: stats.certifiedFarms.toLocaleString(),
      description: `อัตราการอนุมัติ ${stats.approvalRate}%`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-gray-600">ภาพรวมและการจัดการระบบ GACP</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="px-3 py-1">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {user?.profile?.full_name}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="cms" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            จัดการเนื้อหา
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            จัดการผู้ใช้
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            ตั้งค่าระบบ
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            การแจ้งเตือน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>กิจกรรมล่าสุด</CardTitle>
                <CardDescription>การดำเนินการในระบบล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'ใบสมัครใหม่ส่งเข้ามา', time: '5 นาทีที่แล้ว', user: 'ฟาร์มผักปลอดภัย' },
                    { action: 'อนุมัติใบรับรอง', time: '1 ชั่วโมงที่แล้ว', user: 'ฟาร์มข้าวออร์แกนิค' },
                    { action: 'ผู้ใช้ใหม่สมัครสมาชิก', time: '2 ชั่วโมงที่แล้ว', user: 'เกษตรกรจังหวัดนครปฐม' },
                    { action: 'ส่งเอกสารเพิ่มเติม', time: '3 ชั่วโมงที่แล้ว', user: 'ฟาร์มผลไม้นำโชค' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถิติระบบ</CardTitle>
                <CardDescription>ข้อมูลประสิทธิภาพระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">อัตราการอนุมัติ</span>
                    <span className="font-medium">{stats.approvalRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">เวลาเฉลี่ยในการตรวจสอบ</span>
                    <span className="font-medium">3.2 วัน</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ผู้ใช้งานเข้าระบบวันนี้</span>
                    <span className="font-medium">{Math.floor(stats.activeUsers * 0.3)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">การแจ้งเตือนที่ส่งแล้ว</span>
                    <span className="font-medium">142</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cms">
          <NewsManager />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>การจัดการการแจ้งเตือน</CardTitle>
              <CardDescription>ตั้งค่าและจัดการการแจ้งเตือนในระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">ฟีเจอร์การจัดการการแจ้งเตือนจะเพิ่มในเร็วๆ นี้</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewAdminDashboard;