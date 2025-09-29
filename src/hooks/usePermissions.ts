import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook for permission-based access control
 * Provides role and permission checking functionality
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    // Get permissions from user profile metadata or role-based defaults
    if (!user?.profile) return [];
    
    // Extract permissions from profile metadata or derive from role
    const rolePermissions = getRolePermissions(user.profile.role);
    // For now, we'll just use role-based permissions
    const customPermissions: string[] = [];
    
    return [...rolePermissions, ...customPermissions];
  }, [user?.profile]);

  const hasRole = useMemo(() => (role: string) => {
    return user?.profile?.role === role;
  }, [user?.profile?.role]);

  const hasPermission = useMemo(() => (permission: string) => {
    if (!user?.profile) return false;
    
    // Admin has all permissions
    if (user.profile.role === 'admin') return true;
    
    return permissions.includes(permission);
  }, [permissions, user?.profile]);

  const hasAnyRole = useMemo(() => (roles: string[]) => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAnyPermission = useMemo(() => (perms: string[]) => {
    return perms.some(permission => hasPermission(permission));
  }, [hasPermission]);

  return {
    permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    userRole: user?.profile?.role || null,
    isAdmin: hasRole('admin'),
    isReviewer: hasRole('reviewer'),
    isAuditor: hasRole('auditor'),
    isApplicant: hasRole('applicant'),
  };
};

/**
 * Get default permissions for a role
 */
function getRolePermissions(role: string): string[] {
  const rolePermissionMap: Record<string, string[]> = {
    admin: [
      'users.read',
      'users.write',
      'users.delete',
      'applications.read',
      'applications.write',
      'applications.delete',
      'certificates.read',
      'certificates.write',
      'certificates.revoke',
      'payments.read',
      'payments.write',
      'analytics.read',
      'system.configure',
    ],
    reviewer: [
      'applications.read',
      'applications.review',
      'documents.read',
      'documents.verify',
      'reviews.write',
      'notifications.send',
    ],
    auditor: [
      'applications.read',
      'assessments.read',
      'assessments.write',
      'assessments.schedule',
      'certificates.verify',
      'reports.generate',
    ],
    applicant: [
      'applications.own.read',
      'applications.own.write',
      'documents.own.upload',
      'certificates.own.read',
      'payments.own.read',
      'assessments.own.read',
    ],
  };

  return rolePermissionMap[role] || [];
}