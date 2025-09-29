import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
}

/**
 * Route wrapper for authentication and authorization
 * Redirects unauthenticated users to login
 * Redirects unauthorized users to appropriate page
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  redirectTo,
}) => {
  const { user, loading } = useAuth();
  const { hasAnyRole, hasAnyPermission, hasPermission, hasRole } = usePermissions();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role-based access
  if (roles.length > 0) {
    const hasRequiredRoles = requireAll
      ? roles.every(role => hasRole(role))
      : hasAnyRole(roles);

    if (!hasRequiredRoles) {
      return (
        <Navigate
          to={redirectTo || '/unauthorized'}
          replace
        />
      );
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every(perm => hasPermission(perm))
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return (
        <Navigate
          to={redirectTo || '/unauthorized'}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};