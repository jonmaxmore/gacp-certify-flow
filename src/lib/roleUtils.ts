// Centralized role-to-dashboard mapping and helpers

export type UserRole =
  | 'farmer'
  | 'reviewer'
  | 'auditor'
  | 'admin'
  | 'super_admin'
  | 'cs'
  | 'cms';

export function getDashboardPathForRole(role?: string): string {
  switch (role) {
    case 'farmer':
      return '/farmer/dashboard';
    case 'reviewer':
    case 'auditor':
    case 'admin':
    case 'super_admin':
    case 'cs':
    case 'cms':
      return `/dept/dashboard/${role}`;
    default:
      return '/error/invalid-role';
  }
}

export function isFarmerRole(role?: string): boolean {
  return role === 'farmer';
}

export function isDepartmentRole(role?: string): boolean {
  return [
    'reviewer',
    'auditor',
    'admin',
    'super_admin',
    'cs',
    'cms',
  ].includes(role || '');
}
