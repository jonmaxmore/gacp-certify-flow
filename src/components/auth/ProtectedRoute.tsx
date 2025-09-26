import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardPathForRole, isFarmerRole, isDepartmentRole } from '@/lib/roleUtils';

import type { UserRole } from '@/lib/roleUtils';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  allowedRoles
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to correct login page
    if (!user) {
      if (location.pathname.startsWith('/farmer')) {
        navigate('/farmer/login');
      } else if (location.pathname.startsWith('/dept')) {
        navigate('/dept/login');
      } else {
        navigate('/login');
      }
      return;
    }

    // If user has no profile but is authenticated, show setup spinner (AuthProvider will create one)
    if (!user.profile) {
      return; // keep showing the setup UI below
    }

    const currentRole = user.profile.role;
    const dashboardPath = getDashboardPathForRole(currentRole);

    // Strict path separation
    if (location.pathname.startsWith('/farmer') && !isFarmerRole(currentRole)) {
      navigate(dashboardPath);
      return;
    }
    if (location.pathname.startsWith('/dept') && !isDepartmentRole(currentRole)) {
      navigate(dashboardPath);
      return;
    }

    // If role is invalid, redirect to error page
    if (dashboardPath === '/error/invalid-role') {
      navigate('/error/invalid-role');
      return;
    }

    // If role doesn't match the required route, send user to their correct dashboard
    if (requiredRole && currentRole !== requiredRole) {
      navigate(dashboardPath);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(currentRole)) {
      navigate(dashboardPath);
      return;
    }
  }, [user, loading, navigate, requiredRole, allowedRoles, location]);

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