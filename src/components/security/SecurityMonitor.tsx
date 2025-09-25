import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

export const SecurityMonitor = () => {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [sessionActive, setSessionActive] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Monitor session activity
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSessionActive(false);
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again."
        });
        return;
      }

      // Update session activity
      try {
        await supabase.from('user_sessions').upsert({
          user_id: user.id,
          session_token: session.access_token.substring(0, 20), // Partial token for tracking
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          ip_address: null, // Will be handled server-side
          user_agent: navigator.userAgent.substring(0, 100)
        });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    };

    // Check session every 5 minutes
    const sessionInterval = setInterval(checkSession, 5 * 60 * 1000);
    checkSession(); // Initial check

    return () => clearInterval(sessionInterval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Monitor for suspicious activity
    const detectSuspiciousActivity = () => {
      const mouseMovements = localStorage.getItem('mouse_movements');
      const keystrokes = localStorage.getItem('keystrokes');
      
      // Clear tracking data regularly for privacy
      if (mouseMovements && JSON.parse(mouseMovements).length > 100) {
        localStorage.removeItem('mouse_movements');
      }
      if (keystrokes && JSON.parse(keystrokes).length > 100) {
        localStorage.removeItem('keystrokes');
      }
    };

    const activityInterval = setInterval(detectSuspiciousActivity, 60000); // Every minute
    return () => clearInterval(activityInterval);
  }, [user]);

  // Monitor for page visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tab - start idle timer
        setTimeout(() => {
          if (document.hidden) {
            toast({
              title: "Session Warning",
              description: "Your session will expire soon due to inactivity."
            });
          }
        }, 15 * 60 * 1000); // 15 minutes
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        // Mark session as inactive
        navigator.sendBeacon('/api/session-end', JSON.stringify({ userId: user.id }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  if (!user || user.profile?.role !== 'admin') {
    return null; // Only show to admins
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg p-3 shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">Security Monitor</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Session: {sessionActive ? 'Active' : 'Expired'}
        </div>
        {securityEvents.length > 0 && (
          <div className="mt-2 text-xs">
            <div className="text-orange-500">
              {securityEvents.length} security event(s) detected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};