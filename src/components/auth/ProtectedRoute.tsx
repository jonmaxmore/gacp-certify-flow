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

    // If user has no profile but is authenticated, show setup spinner (AuthProvider will create one)
    if (!user.profile) {
      return; // keep showing the setup UI below
    }

    // If role doesn't match the required route, send user to their correct dashboard instead of /login
    const currentRole = user.profile.role;
    const goHomeForRole = () => navigate(`/${currentRole}/dashboard`);

    if (requiredRole && currentRole !== requiredRole) {
      goHomeForRole();
      return;
    }

    if (allowedRoles && !allowedRoles.includes(currentRole)) {
      goHomeForRole();
      return;
    }
  }, [user, loading, navigate, requiredRole, allowedRoles]);

  // Loading UI
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

  // Unauthenticated
  if (!user) {
    return null;
  }

  // Authenticated but profile is being created/fetched
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

  // Authorized
  return <>{children}</>;
};