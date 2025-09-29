import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedComponentProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Component wrapper for permission-based access control
 * Shows content only if user has required permissions/roles
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  children,
  fallback = null,
  loading = null,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    userRole,
  } = usePermissions();

  // Handle loading state
  if (userRole === null && loading) {
    return <>{loading}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every(perm => hasPermission(perm))
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles.length > 0) {
    const hasRequiredRoles = requireAll
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);

    if (!hasRequiredRoles) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * HOC version for wrapping components
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<ProtectedComponentProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <ProtectedComponent {...permissionConfig}>
        <Component {...props} />
      </ProtectedComponent>
    );
  };
}