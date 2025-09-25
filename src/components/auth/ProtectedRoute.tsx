import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'applicant' | 'reviewer' | 'auditor' | 'admin';
  allowedRoles?: ('applicant' | 'reviewer' | 'auditor' | 'admin')[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If user has no profile but is authenticated, allow access with default role
    if (!user.profile) {
      // Don't redirect immediately, give the profile some time to load
      const timer = setTimeout(() => {
        if (!user?.profile) {
          console.log('No profile found after timeout, creating default profile');
          // For now, allow access - profile creation should be handled by AuthProvider
        }
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Check specific role requirement
    if (requiredRole && user.profile.role !== requiredRole) {
      navigate('/login');
      return;
    }

    // Check allowed roles
    if (allowedRoles && !allowedRoles.includes(user.profile.role)) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate, requiredRole, allowedRoles]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Allow access even without profile initially - this prevents white screens
  if (!user) {
    return null;
  }

  // For users without profile, show a setup message instead of blocking
  if (!user.profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">กำลังตั้งค่าบัญชี</h2>
          <p className="text-muted-foreground">
            กรุณารอสักครู่ ระบบกำลังตั้งค่าบัญชีของคุณ
          </p>
        </div>
      </div>
    );
  }

  // Check role requirements with user.profile
  if (requiredRole && user.profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && user.profile && !allowedRoles.includes(user.profile.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};