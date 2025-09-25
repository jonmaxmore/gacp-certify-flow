import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Activity } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'data_access' | 'system_change' | 'suspicious_activity';
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  user?: string;
  resolved: boolean;
}

export const SecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    activeUsers: 0,
    suspiciousActivity: 0,
    systemHealth: 'good' as 'good' | 'warning' | 'critical'
  });

  useEffect(() => {
    loadSecurityEvents();
    loadSystemStatus();
  }, []);

  const loadSecurityEvents = () => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login_attempt',
        timestamp: '2024-01-20T10:30:00Z',
        severity: 'low',
        details: 'ผู้ใช้ล็อกอินสำเร็จ',
        user: 'user@example.com',
        resolved: true
      },
      {
        id: '2',
        type: 'suspicious_activity',
        timestamp: '2024-01-20T09:15:00Z',
        severity: 'high',
        details: 'พยายามเข้าถึงข้อมูลโดยไม่ได้รับอนุญาตหลายครั้ง',
        user: 'suspicious@example.com',
        resolved: false
      },
      {
        id: '3',
        type: 'system_change',
        timestamp: '2024-01-20T08:45:00Z',
        severity: 'medium',
        details: 'การเปลี่ยนแปลงการตั้งค่าระบบ',
        user: 'admin@example.com',
        resolved: true
      }
    ];
    setSecurityEvents(mockEvents);
  };

  const loadSystemStatus = () => {
    setSystemStatus({
      activeUsers: 147,
      suspiciousActivity: 2,
      systemHealth: 'good'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (user?.profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4" />
            <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ตรวจสอบความปลอดภัย</h1>
        <Badge variant={systemStatus.systemHealth === 'good' ? 'success' : 'warning'}>
          {systemStatus.systemHealth === 'good' ? 'ปกติ' : 'ต้องตรวจสอบ'}
        </Badge>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ผู้ใช้ออนไลน์</p>
                <p className="text-2xl font-bold">{systemStatus.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">กิจกรรมน่าสงสัย</p>
                <p className="text-2xl font-bold">{systemStatus.suspiciousActivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สถานะระบบ</p>
                <p className="text-lg font-semibold text-success">ปกติ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>เหตุการณ์ความปลอดภัย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getSeverityIcon(event.severity)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{event.details}</span>
                      <Badge variant={getSeverityColor(event.severity) as any}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(event.timestamp).toLocaleString('th-TH')}</span>
                      </span>
                      {event.user && <span>ผู้ใช้: {event.user}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {event.resolved ? (
                    <Badge variant="success">แก้ไขแล้ว</Badge>
                  ) : (
                    <Button size="sm" variant="outline">
                      จัดการ
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitor;