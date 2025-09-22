import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  priority: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
  userId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Set up real-time notifications
    const interval = setInterval(checkNewNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = () => {
    // Mock notifications - in real app, fetch from API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'ใบสมัครได้รับการอนุมัติ',
        message: 'ใบสมัครของคุณได้ผ่านการตรวจสอบเอกสารเรียบร้อยแล้ว กรุณาชำระเงินเพื่อดำเนินการขั้นตอนต่อไป',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        read: false,
        priority: 'high',
        action: {
          label: 'ชำระเงิน',
          url: '/applicant/payments'
        }
      },
      {
        id: '2',
        type: 'info',
        title: 'กำหนดการประเมินออนไลน์',
        message: 'การประเมินออนไลน์ของคุณถูกกำหนดในวันที่ 25 มกราคม 2567 เวลา 14:00 น.',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        read: false,
        priority: 'medium',
        action: {
          label: 'ดูรายละเอียด',
          url: '/applicant/assessments'
        }
      },
      {
        id: '3',
        type: 'warning',
        title: 'เอกสารต้องการแก้ไข',
        message: 'เอกสารใบรับรองการฝึกอบรมต้องการการแก้ไข กรุณาอัพโหลดเอกสารใหม่',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true,
        priority: 'high',
        action: {
          label: 'แก้ไขเอกสาร',
          url: '/applicant/documents'
        }
      },
      {
        id: '4',
        type: 'info',
        title: 'ระบบปรับปรุง',
        message: 'ระบบจะมีการปรับปรุงในวันเสาร์ที่ 20 มกราคม 2567 เวลา 02:00-04:00 น.',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        read: true,
        priority: 'low'
      }
    ];
    setNotifications(mockNotifications);
  };

  const checkNewNotifications = () => {
    // Simulate receiving new notifications
    const random = Math.random();
    if (random < 0.1) { // 10% chance of new notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'info',
        title: 'อัพเดทสถานะใบสมัคร',
        message: 'สถานะใบสมัครของคุณมีการอัพเดท',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast notification
      toast({
        title: newNotification.title,
        description: newNotification.message,
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive';
      case 'medium':
        return 'border-l-warning';
      default:
        return 'border-l-muted';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  อ่านทั้งหมด
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-accent transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>
                            {notification.action && (
                              <Button size="sm" variant="outline" className="text-xs">
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => setShowNotifications(false)}
            >
              ดูทั้งหมด
            </Button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};