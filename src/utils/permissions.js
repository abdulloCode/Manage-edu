import { useAuth } from '../context/AuthContext';

/**
 * Permission utilities for role-based access control
 */

export const ROLE_LEVELS = {
  admin: 4,
  manager: 3,
  supporter: 3,
  teacher: 2,
  student: 1,
  staff: 1,
};

/**
 * Check if current user has required role level
 */
export function useHasRole(requiredRole) {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase()?.trim();
  const requiredRoleLower = requiredRole?.toLowerCase()?.trim();

  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRoleLower];
}

/**
 * Check if user is admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role?.toLowerCase()?.trim() === 'admin';
}

/**
 * Check if user is manager
 */
export function useIsManager() {
  const { user } = useAuth();
  return user?.role?.toLowerCase()?.trim() === 'manager';
}

/**
 * Check if user has admin or manager role
 */
export function useIsAdminOrManager() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase()?.trim();
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user is supporter
 */
export function useIsSupporter() {
  const { user } = useAuth();
  return user?.role?.toLowerCase()?.trim() === 'supporter';
}

/**
 * Check if user has admin, manager, or supporter role
 */
export function useIsAdminOrManagerOrSupporter() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase()?.trim();
  return role === 'admin' || role === 'manager' || role === 'supporter';
}

/**
 * Handle 403 Forbidden errors with user-friendly messages
 */
export function handlePermissionError(error, defaultMessage = "Ruxsat yo'q") {
  if (error?.response?.status === 403) {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}')?.role;
    console.error('Permission denied for role:', userRole);
    return {
      message: "Sizda bu amalni bajarish uchun ruxsat yo'q",
      isPermissionError: true,
      userRole: userRole
    };
  }
  return {
    message: defaultMessage,
    isPermissionError: false
  };
}

/**
 * Check if API error is permission related
 */
export function isPermissionError(error) {
  return error?.response?.status === 403 ||
         error?.response?.data?.message?.toLowerCase()?.includes('forbidden') ||
         error?.response?.data?.message?.toLowerCase()?.includes('insufficient permissions');
}
