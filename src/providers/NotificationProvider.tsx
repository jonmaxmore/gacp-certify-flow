import React, { createContext, useContext, useState, useEffect } from 'react';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  getUnreadCount: () => number;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  userId?: string;
  role?: string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize with mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        title: 'Welcome to GACP System',
        message: 'Your account has been successfully created. You can now start your certification process.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionUrl: '/applicant/application/new',
        actionLabel: 'Start Application'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Documents Required',
        message: 'Please upload your farm registration documents to continue with your application.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        actionUrl: '/applicant/applications',
        actionLabel: 'Upload Documents'
      },
      {
        id: '3',
        type: 'success',
        title: 'Knowledge Test Passed',
        message: 'Congratulations! You have successfully passed the GACP knowledge test with a score of 85%.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        read: true
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 10 seconds for non-persistent notifications
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      getUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;