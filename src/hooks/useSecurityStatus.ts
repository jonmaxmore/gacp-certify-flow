import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'critical';
  authStatus: 'secure' | 'warning' | 'critical';
  dataProtection: 'secure' | 'warning' | 'critical';
  systemIntegrity: 'secure' | 'warning' | 'critical';
  lastCheck: Date;
  alerts: SecurityAlert[];
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export const useSecurityStatus = () => {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    overall: 'secure',
    authStatus: 'secure',
    dataProtection: 'secure',
    systemIntegrity: 'secure',
    lastCheck: new Date(),
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSecurityStatus = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Simulate security checks
        const alerts: SecurityAlert[] = [];
        
        // Check authentication status
        let authStatus: 'secure' | 'warning' | 'critical' = 'secure';
        if (!user.profile?.phone) {
          alerts.push({
            id: 'missing-phone',
            type: 'medium',
            title: 'Incomplete Profile Security',
            description: 'Phone number not verified. This reduces account security.',
            timestamp: new Date(),
            resolved: false
          });
          authStatus = 'warning';
        }

        // Check for session expiry warning
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        if (sessionExpiry.getTime() - Date.now() < 5 * 60 * 1000) { // 5 minutes warning
          alerts.push({
            id: 'session-expiry',
            type: 'info',
            title: 'Session Expiring Soon',
            description: 'Your session will expire in less than 5 minutes.',
            timestamp: new Date(),
            resolved: false
          });
        }

        // Determine overall security status
        const hasHigh = alerts.some(alert => alert.type === 'critical' || alert.type === 'high');
        const hasMedium = alerts.some(alert => alert.type === 'medium');
        
        let overall: 'secure' | 'warning' | 'critical' = 'secure';
        if (hasHigh) overall = 'critical';
        else if (hasMedium) overall = 'warning';

        setSecurityStatus({
          overall,
          authStatus,
          dataProtection: 'secure',
          systemIntegrity: 'secure',
          lastCheck: new Date(),
          alerts
        });
      } catch (error) {
        console.error('Security status check failed:', error);
        setSecurityStatus(prev => ({
          ...prev,
          overall: 'warning',
          lastCheck: new Date(),
          alerts: [{
            id: 'check-failed',
            type: 'high',
            title: 'Security Check Failed',
            description: 'Unable to verify current security status.',
            timestamp: new Date(),
            resolved: false
          }]
        }));
      } finally {
        setLoading(false);
      }
    };

    checkSecurityStatus();
    
    // Recheck every 5 minutes
    const interval = setInterval(checkSecurityStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const resolveAlert = (alertId: string) => {
    setSecurityStatus(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    }));
  };

  return {
    securityStatus,
    loading,
    resolveAlert,
    refresh: () => {
      setLoading(true);
      // Trigger useEffect to run again
      setSecurityStatus(prev => ({ ...prev, lastCheck: new Date() }));
    }
  };
};