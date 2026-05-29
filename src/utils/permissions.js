import { useAuth } from '../context/AuthContext';

/**
 * Telefon raqamini +998XXXXXXXXX formatiga keltiradi.
 * 9 raqam, 12 raqam (998...) yoki +998... bo'lsa ham to'g'ri ko'rsatadi.
 */
export function formatPhone(phone) {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return phone;
  // Remove leading 998 if present
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  if (local.length !== 9) return `+998${local}`;
  return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)}-${local.slice(5, 7)}-${local.slice(7, 9)}`;
}

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