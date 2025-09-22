import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// ScrollArea component not needed - will use div with overflow
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  Check, 
  Clock, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Archive,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

interface WorkflowNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  application_id?: string;
}

interface NotificationCenterProps {
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
}

const getPriorityColor = (priority: WorkflowNotification['priority']) => {
  const colors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };
  return colors[priority];
};

const getPriorityBadge = (priority: WorkflowNotification['priority']) => {
  const variants = {
    low: 'outline' as const,
    medium: 'secondary' as const,
    high: 'default' as const,
    urgent: 'destructive' as const
  };

  const labels = {
    low: 'ต่ำ',
    medium: 'ปกติ',
    high: 'สำคัญ',
    urgent: 'ด่วนมาก'
  };

  return (
    <Badge variant={variants[priority]} className="text-xs">
      {labels[priority]}
    </Badge>
  );
};

const getNotificationIcon = (type: string) => {
  const icons = {
    payment_due: CreditCard,
    status_change: FileText,
    reminder: Clock,
    deadline: AlertCircle,
    success: CheckCircle,
    default: Bell
  };
  
  return icons[type] || icons.default;
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  compact = false,
  showHeader = true
}) => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('workflow-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workflow_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as WorkflowNotification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflow_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(compact ? 5 : 50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดการแจ้งเตือนได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'unread');

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.status === 'unread'
            ? { ...notif, status: 'read' as const, read_at: new Date().toISOString() }
            : notif
        )
      );

      toast({
        title: "อัปเดตสำเร็จ",
        description: "ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return notif.status === 'unread';
    if (filter === 'read') return notif.status === 'read';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="h-5 w-5" />
              <CardTitle>การแจ้งเตือน</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {!compact && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                อ่านทั้งหมด
              </Button>
            )}
          </div>
          
          {!compact && (
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                ทั้งหมด ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                ยังไม่อ่าน ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                อ่านแล้ว ({notifications.length - unreadCount})
              </Button>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className={cn("p-0", showHeader && "pt-0")}>
        <div className={cn("h-full overflow-auto", compact ? "max-h-96" : "max-h-[600px]")}>
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'unread' ? 'ไม่มีการแจ้งเตือนใหม่' : 'ไม่มีการแจ้งเตือน'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const isUnread = notification.status === 'unread';
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors",
                      isUnread && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "flex-shrink-0 p-2 rounded-full",
                        isUnread ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isUnread ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className={cn(
                                "font-medium text-sm",
                                isUnread ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {notification.title}
                              </p>
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              
                              {notification.action_url && notification.action_label && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="h-auto p-0 text-xs"
                                  onClick={() => {
                                    if (isUnread) markAsRead(notification.id);
                                    // Navigate to action URL
                                    window.location.href = notification.action_url!;
                                  }}
                                >
                                  {notification.action_label}
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {!compact && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};