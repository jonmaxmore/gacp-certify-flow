import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  BarChart3,
  FileText,
  Globe,
  UserPlus,
  Download,
  RefreshCw,
  Bell
} from 'lucide-react';

// Mock data for demonstration
const mockSystemStats = {
  totalUsers: 1247,
  totalApplications: 356,
  totalCertificates: 189,
  systemUptime: "99.9%",
  pendingApplications: 23,
  activeUsers: 157,
  monthlyGrowth: "+12%",
  successRate: "87%"
};

const mockRecentActivity = [
  {
    id: 1,
    type: "user_registration",
    message: "New applicant registered: สมชาย เกษตรกร",
    timestamp: "2 minutes ago",
    severity: "info"
  },
  {
    id: 2,
    type: "certificate_issued",
    message: "Certificate CERT-000189-2567 issued successfully",
    timestamp: "15 minutes ago", 
    severity: "success"
  },
  {
    id: 3,
    type: "system_backup",
    message: "Daily system backup completed successfully",
    timestamp: "1 hour ago",
    severity: "success"
  },
  {
    id: 4,
    type: "security_alert",
    message: "5 failed login attempts detected from IP 192.168.1.1",
    timestamp: "2 hours ago",
    severity: "warning"
  }
];

const mockSystemHealth = {
  database: { status: "healthy", response: "12ms" },
  api: { status: "healthy", response: "45ms" },
  storage: { status: "warning", usage: "78%" },
  backup: { status: "healthy", lastBackup: "2024-01-20 02:00" }
};

const EnhancedAdminDashboard = () => {
  const { user } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return UserPlus;
      case 'certificate_issued':
        return CheckCircle;
      case 'system_backup':
        return Database;
      case 'security_alert':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-amber-600 bg-amber-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⚙️ Admin Panel
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.profile?.full_name || 'Administrator'}! Monitor and manage the GACP platform.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSystemStats.totalUsers}</p>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xs text-green-600">{mockSystemStats.monthlyGrowth} this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSystemStats.totalApplications}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-xs text-amber-600">{mockSystemStats.pendingApplications} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSystemStats.totalCertificates}</p>
                <p className="text-sm text-gray-600">Certificates Issued</p>
                <p className="text-xs text-green-600">{mockSystemStats.successRate} success rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSystemStats.systemUptime}</p>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-xs text-green-600">{mockSystemStats.activeUsers} active users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* System Health */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Health Monitor
              </CardTitle>
              <CardDescription>
                Real-time system status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Database</p>
                        <p className="text-sm text-gray-500">Response: {mockSystemHealth.database.response}</p>
                      </div>
                    </div>
                    {getStatusBadge(mockSystemHealth.database.status)}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">API Service</p>
                        <p className="text-sm text-gray-500">Response: {mockSystemHealth.api.response}</p>
                      </div>
                    </div>
                    {getStatusBadge(mockSystemHealth.api.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Storage</p>
                        <p className="text-sm text-gray-500">Usage: {mockSystemHealth.storage.usage}</p>
                      </div>
                    </div>
                    {getStatusBadge(mockSystemHealth.storage.status)}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Backup System</p>
                        <p className="text-sm text-gray-500">Last: {mockSystemHealth.backup.lastBackup}</p>
                      </div>
                    </div>
                    {getStatusBadge(mockSystemHealth.backup.status)}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">All Systems Operational</p>
                </div>
                <p className="text-sm text-green-700">
                  System performance is within normal parameters. Storage usage approaching threshold - consider expansion.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Management Tools */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Management Tools
              </CardTitle>
              <CardDescription>
                Quick access to administrative functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">User Management</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Globe className="h-5 w-5" />
                  <span className="text-xs">CMS Management</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-xs">Security Logs</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Database className="h-5 w-5" />
                  <span className="text-xs">Backup & Restore</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Reports</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">System Config</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="h-5 w-5" />
                  <span className="text-xs">Export Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Recent Activity
                <Badge variant="secondary">{mockRecentActivity.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.severity);
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button variant="outline" className="w-full mt-4 gap-2">
                <Bell className="h-4 w-4" />
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Storage Usage</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Monthly Target</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">System Load</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                "I can help with system health checks, backup notifications, user management, and generating reports."
              </p>
              
              <Button 
                className="w-full gap-2"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                <MessageCircle className="h-4 w-4" />
                Admin Support
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="border-0 shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-lg text-amber-700">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Storage Warning</p>
                    <p className="text-xs text-gray-600">Storage usage at 78%. Consider cleanup or expansion.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Backup Completed</p>
                    <p className="text-xs text-gray-600">Daily backup completed successfully at 02:00.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50">
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Admin AI Assistant</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowChatbot(false)}
              >
                ×
              </Button>
            </div>
          </div>
          <div className="p-4 h-80 bg-gray-50 rounded-b-lg">
            <p className="text-sm text-gray-600 text-center">
              AI Assistant for Admins Coming Soon!<br/>
              This will help with system monitoring, user management, and backup notifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;