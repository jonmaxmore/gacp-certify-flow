import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { getModulesForRole, ModuleItem } from '@/components/navigation/ModuleNavigation';

const ModuleDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.profile?.role || 'applicant';
  
  const moduleGroups = getModulesForRole(userRole);
  const allModules = moduleGroups.flatMap(group => group.modules);

  const handleModuleClick = (module: ModuleItem) => {
    const rolePrefix = `/${userRole}`;
    const fullPath = `${rolePrefix}${module.path}`;
    navigate(fullPath);
  };

  const getModuleStatusColor = (moduleId: string) => {
    // Mock status - in real implementation, this would come from API
    const mockStatuses: Record<string, string> = {
      'dashboard': 'active',
      'new-application': 'available',
      'applications-list': 'active',
      'knowledge-test': 'completed',
      'elearning': 'in-progress',
      'documents': 'available',
      'payments': 'attention',
      'certificates': 'available',
      'notifications': 'active'
    };

    return mockStatuses[moduleId] || 'available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">เสร็จสิ้น</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 text-white">กำลังดำเนินการ</Badge>;
      case 'attention':
        return <Badge className="bg-red-500 text-white">ต้องดำเนินการ</Badge>;
      case 'active':
        return <Badge className="bg-yellow-500 text-white">ใช้งานอยู่</Badge>;
      default:
        return <Badge variant="outline">พร้อมใช้งาน</Badge>;
    }
  };

  const featuredModules = allModules.filter(module => 
    ['dashboard', 'new-application', 'knowledge-test', 'payments'].includes(module.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ระบบโมดูล GACP
        </h1>
        <p className="text-gray-600">
          เข้าถึงโมดูลต่างๆ ของระบบรับรอง GACP สำหรับ{' '}
          <Badge className="ml-1">
            {userRole === 'applicant' && 'ผู้สมัคร'}
            {userRole === 'reviewer' && 'ผู้ตรวจสอบ'}  
            {userRole === 'auditor' && 'ผู้ประเมิน'}
            {userRole === 'admin' && 'ผู้ดูแลระบบ'}
          </Badge>
        </p>
      </div>

      {/* Featured Modules */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">โมดูลหลัก</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredModules.map((module) => {
            const status = getModuleStatusColor(module.id);
            return (
              <Card 
                key={module.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
                onClick={() => handleModuleClick(module)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <module.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  {module.description && (
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-2">
                    {getStatusBadge(status)}
                    {module.isNew && (
                      <Badge variant="destructive" className="ml-2">ใหม่</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* All Modules by Category */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">โมดูลทั้งหมด</h2>
        <div className="space-y-6">
          {moduleGroups.map((group) => (
            <div key={group.id}>
              <h3 className="text-xl font-medium mb-3 text-gray-800">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.modules.map((module) => {
                  const status = getModuleStatusColor(module.id);
                  return (
                    <Card 
                      key={module.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleModuleClick(module)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <module.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {module.title}
                            </h4>
                            {module.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {module.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              {getStatusBadge(status)}
                              {module.badge && (
                                <Badge variant="secondary">{module.badge}</Badge>
                              )}
                              {module.isNew && (
                                <Badge variant="destructive">ใหม่</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="h-auto py-4 flex-col space-y-2"
            onClick={() => navigate(`/${userRole}/dashboard`)}
          >
            <span className="text-lg">📊</span>
            <span>ไปที่แดชบอร์ด</span>
          </Button>
          
          {userRole === 'applicant' && (
            <>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate(`/${userRole}/application/new`)}
              >
                <span className="text-lg">📝</span>
                <span>สร้างใบสมัครใหม่</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate(`/${userRole}/payments`)}
              >
                <span className="text-lg">💳</span>
                <span>ชำระเงิน</span>
              </Button>
            </>
          )}
          
          {userRole === 'admin' && (
            <>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate(`/${userRole}/user-management`)}
              >
                <span className="text-lg">👥</span>
                <span>จัดการผู้ใช้</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate(`/${userRole}/platform-analytics`)}
              >
                <span className="text-lg">📈</span>
                <span>ดูสถิติ</span>
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ModuleDashboard;