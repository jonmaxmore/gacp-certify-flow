import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  FileText, 
  Calendar,
  Video,
  Award,
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  type: 'document_review' | 'assessment' | 'payment' | 'certificate' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    revisionCount?: number;
    paymentAmount?: number;
    meetingUrl?: string;
    dueDate?: string;
  };
}

interface NotificationPanelProps {
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  className?: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  className
}) => {
  const navigate = useNavigate();

  // Mock notifications based on the workflow specification
  const defaultNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'document_review',
      priority: 'high',
      title: 'เอกสารได้รับการอนุมัติ',
      message: 'เอกสารของท่านผ่านการตรวจสอบแล้ว กรุณาชำระค่าประเมิน 25,000 บาท เพื่อเข้าสู่ขั้นตอนการประเมิน',
      actionLabel: 'ชำระค่าประเมิน',
      actionUrl: '/applicant/payments',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      metadata: { paymentAmount: 25000 }
    },
    {
      id: '2',
      type: 'assessment',
      priority: 'medium',
      title: 'การประเมินได้รับการจัดตาราง',
      message: 'การประเมินออนไลน์ของท่านได้รับการจัดตารางแล้ว วันที่ 20 มกราคม 2567 เวลา 14:00 น.',
      actionLabel: 'เข้าร่วมการประเมิน',
      actionUrl: '/applicant/schedule',
      timestamp: '2024-01-14T09:15:00Z',
      read: false,
      metadata: { 
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        dueDate: '2024-01-20T14:00:00Z'
      }
    },
    {
      id: '3',
      type: 'payment',
      priority: 'urgent',
      title: 'การชำระเงินสำเร็จ',
      message: 'การชำระค่าตรวจสอบเอกสาร จำนวน 5,000 บาท สำเร็จแล้ว',
      actionLabel: 'ดูใบเสร็จ',
      actionUrl: '/applicant/payments',
      timestamp: '2024-01-13T16:45:00Z',
      read: true,
      metadata: { paymentAmount: 5000 }
    }
  ];

  const allNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_review': return FileText;
      case 'assessment': return Video;
      case 'payment': return CreditCard;
      case 'certificate': return Award;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      urgent: { label: 'ด่วนมาก', variant: 'destructive' as const },
      high: { label: 'สำคัญ', variant: 'default' as const },
      medium: { label: 'ปานกลาง', variant: 'secondary' as const },
      low: { label: 'ทั่วไป', variant: 'outline' as const }
    };
    
    const { label, variant } = config[priority as keyof typeof config] || config.medium;
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
    }
  };

  return (
    <div className={cn("w-full max-w-md", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              การแจ้งเตือน
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                อ่านทั้งหมด
              </Button>
            )}
          </div>
          <CardDescription>
            ข้อความแจ้งเตือนและอัพเดทสถานะ
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            allNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm",
                    getPriorityColor(notification.priority),
                    notification.read ? 'opacity-70' : ''
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        {getPriorityBadge(notification.priority)}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        
                        {notification.actionLabel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2"
                          >
                            {notification.actionLabel}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Special metadata display */}
                      {notification.metadata?.meetingUrl && (
                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                          <div className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            <span>ลิงก์การประเมิน: พร้อมใช้งาน</span>
                          </div>
                        </div>
                      )}
                      
                      {notification.metadata?.paymentAmount && (
                        <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span>จำนวน: {notification.metadata.paymentAmount.toLocaleString()} บาท</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPanel;