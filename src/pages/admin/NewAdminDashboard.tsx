import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Calendar, 
  Award, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Package,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  total_users: number;
  monthly_applications: number;
  monthly_users: number;
  approval_rate: number;
  avg_review_time: number;
  active_users: number;
  usage_rate: number;
}

interface WorkPackageCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
  route: string;
  metrics?: {
    total: number;
    active: number;
    pending: number;
  };
}

export default function NewAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      setStats(data as unknown as DashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Work Package Cards based on the project execution plan
  const workPackages: WorkPackageCard[] = [
    {
      id: 'wp1',
      title: 'WP1: Core Infrastructure',
      description: 'ระบบพื้นฐานและการเริ่มใช้งาน',
      icon: Settings,
      progress: 85,
      status: 'in-progress',
      route: '/admin/system-settings',
      metrics: {
        total: stats?.total_users || 0,
        active: stats?.active_users || 0,
        pending: (stats?.total_users || 0) - (stats?.active_users || 0)
      }
    },
    {
      id: 'wp2',
      title: 'WP2: Digital SOP Wizard',
      description: 'ฟอร์มคำขอแบบ Wizard',
      icon: FileText,
      progress: 90,
      status: 'in-progress',
      route: '/admin/applications',
      metrics: {
        total: stats?.total_applications || 0,
        active: stats?.pending_applications || 0,
        pending: (stats?.total_applications || 0) - (stats?.approved_applications || 0)
      }
    },
    {
      id: 'wp3',
      title: 'WP3: Application Lifecycle',
      description: 'การจัดการคำขอและชำระเงิน',
      icon: TrendingUp,
      progress: 75,
      status: 'in-progress',
      route: '/admin/applications',
      metrics: {
        total: stats?.total_applications || 0,
        active: stats?.pending_applications || 0,
        pending: stats?.approved_applications || 0
      }
    },
    {
      id: 'wp4',
      title: 'WP4: Review & Assessment',
      description: 'เครื่องมือตรวจสอบและประเมิน',
      icon: Calendar,
      progress: 70,
      status: 'in-progress',
      route: '/admin/assessments',
      metrics: {
        total: 0, // Will be populated with assessment data
        active: 0,
        pending: 0
      }
    },
    {
      id: 'wp5',
      title: 'WP5: Admin & System Management',
      description: 'การจัดการระบบและผู้ใช้',
      icon: Users,
      progress: 80,
      status: 'in-progress',
      route: '/admin/users',
      metrics: {
        total: stats?.total_users || 0,
        active: stats?.active_users || 0,
        pending: 0
      }
    }
  ];

  const quickActions = [
    {
      title: 'จัดการสินค้าและบริการ',
      description: 'เพิ่ม แก้ไข หรือลบสินค้า GACP',
      icon: Package,
      route: '/admin/products',
      color: 'bg-blue-500'
    },
    {
      title: 'จัดการผู้ใช้งาน',
      description: 'ดูรายละเอียดและจัดการบทบาทผู้ใช้',
      icon: Users,
      route: '/admin/users',
      color: 'bg-green-500'
    },
    {
      title: 'รายงานและสถิติ',
      description: 'ดูรายงานประสิทธิภาพระบบ',
      icon: BarChart3,
      route: '/admin/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'ตั้งค่าระบบ',
      description: 'กำหนดค่าและการตั้งค่าระบบ',
      icon: Settings,
      route: '/admin/system-settings',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">GACP Platform Dashboard</h1>
        <p className="text-muted-foreground">ภาพรวมการดำเนินงานตาม Work Packages</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_applications || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.monthly_applications || 0} เดือนนี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้งานทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.monthly_users || 0} เดือนนี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการอนุมัติ</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approval_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              เฉลี่ย {stats?.avg_review_time || 0} วัน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้งานแอคทีฟ</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.usage_rate || 0}% อัตราการใช้งาน
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Packages Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            ความคืบหน้า Work Packages
          </CardTitle>
          <CardDescription>
            สถานะการพัฒนาตามแผนงานโครงการ GACP Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workPackages.map((wp) => (
              <Card key={wp.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader onClick={() => navigate(wp.route)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <wp.icon className="h-5 w-5" />
                      <CardTitle className="text-base">{wp.title}</CardTitle>
                    </div>
                    <Badge variant={
                      wp.status === 'completed' ? 'default' :
                      wp.status === 'in-progress' ? 'secondary' : 'outline'
                    }>
                      {wp.status === 'completed' ? 'เสร็จสิ้น' :
                       wp.status === 'in-progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                    </Badge>
                  </div>
                  <CardDescription>{wp.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ความคืบหน้า</span>
                      <span>{wp.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${wp.progress}%` }}
                      ></div>
                    </div>
                    {wp.metrics && (
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>ทั้งหมด: {wp.metrics.total}</span>
                        <span>ใช้งาน: {wp.metrics.active}</span>
                        <span>รอดำเนินการ: {wp.metrics.pending}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>เมนูด่วน</CardTitle>
          <CardDescription>เข้าถึงฟังก์ชันหลักได้อย่างรวดเร็ว</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2 hover:shadow-md"
                onClick={() => navigate(action.route)}
              >
                <div className={`p-3 rounded-full ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{action.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            กิจกรรมล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">ระบบจัดการสินค้าได้รับการอัปเดต</p>
                <p className="text-xs text-muted-foreground">เพิ่มฟีเจอร์การจัดการ Pricing Tiers</p>
              </div>
              <span className="text-xs text-muted-foreground">เมื่อสักครู่</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Settings className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">ระบบรักษาความปลอดภัยได้รับการปรับปรุง</p>
                <p className="text-xs text-muted-foreground">อัปเดต RLS Policies สำหรับทุกตาราง</p>
              </div>
              <span className="text-xs text-muted-foreground">15 นาทีที่แล้ว</span>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">จำเป็นต้องตรวจสอบคำขอใหม่</p>
                <p className="text-xs text-muted-foreground">{stats?.pending_applications || 0} คำขอรอการตรวจสอบ</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/applications')}>
                ดูรายละเอียด
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}