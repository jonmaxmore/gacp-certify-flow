import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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

    // If user has no profile, redirect to login
    if (!user.profile) {
      navigate('/login');
      return;
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
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user or wrong role
  if (!user || !user.profile) {
    return null;
  }

  if (requiredRole && user.profile.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.profile.role)) {
    return null;
  }

  return <>{children}</>;
};