import { useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Optimized auth hook with memoized values
 * Reduces unnecessary re-renders and improves performance
 */
export const useOptimizedAuth = () => {
  const authContext = useAuth();

  // Memoize frequently accessed values
  const memoizedValues = useMemo(() => ({
    isAuthenticated: !!authContext.user,
    userRole: authContext.user?.profile?.role || null,
    userId: authContext.user?.id || null,
    userProfile: authContext.user?.profile || null,
    isLoading: authContext.loading,
  }), [
    authContext.user?.id,
    authContext.user?.profile?.role,
    authContext.user?.profile,
    authContext.loading
  ]);

  // Memoize role checking functions
  const roleCheckers = useMemo(() => ({
    isApplicant: memoizedValues.userRole === 'applicant',
    isReviewer: memoizedValues.userRole === 'reviewer',
    isAuditor: memoizedValues.userRole === 'auditor',
    isAdmin: memoizedValues.userRole === 'admin',
    isStaff: ['reviewer', 'auditor', 'admin'].includes(memoizedValues.userRole || ''),
  }), [memoizedValues.userRole]);

  // Memoize auth actions
  const authActions = useMemo(() => ({
    signIn: authContext.signIn,
    signOut: authContext.signOut,
    signUp: authContext.signUp,
    updateProfile: authContext.updateProfile,
  }), [
    authContext.signIn,
    authContext.signOut,
    authContext.signUp,
    authContext.updateProfile
  ]);

  return {
    ...memoizedValues,
    ...roleCheckers,
    ...authActions,
    // Original context for backward compatibility
    ...authContext,
  };
};