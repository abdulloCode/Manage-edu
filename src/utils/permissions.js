import { useAuth } from '../context/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role?.toLowerCase()?.trim() === 'admin';
}

export function useHasPage(page) {
  const { user } = useAuth();
  if (user?.role?.toLowerCase()?.trim() === 'admin') return true;
  return user?.pagesToAccess?.includes(page) ?? false;
}

export function handlePermissionError(error, defaultMessage = "Ruxsat yo'q") {
  if (error?.response?.status === 403) {
    return { message: "Sizda bu amalni bajarish uchun ruxsat yo'q", isPermissionError: true };
  }
  return { message: defaultMessage, isPermissionError: false };
}

export function isPermissionError(error) {
  return error?.response?.status === 403;
}