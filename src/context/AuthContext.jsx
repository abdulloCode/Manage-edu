// @refresh reset
import { createContext, useContext, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import api, { callRefresh } from "../api/axios";
import { getMe } from "../api/auth";
import {
  accessTokenAtom,
  userAtom,
  initializedAtom,
  loadingAtom,
  authErrorAtom,
} from "../store/auth";

const AuthContext = createContext(null);

// ── Xatolik xabarlarini tarjima qilish ──────────────────────────────────────
function parseError(err, context = "general") {
  const status  = err?.response?.status;
  const data    = err?.response?.data;
  const server  = data?.message || data?.error || "";

  // Tarmoq xatosi (internet yo'q)
  if (!err.response) {
    return "Internet aloqasi yo'q. Tarmoqni tekshiring.";
  }

  // Kontekstga qarab xabarlar
  switch (context) {
    case "login":
      if (status === 401) return "Telefon raqam yoki parol noto'g'ri";
      if (status === 403) return "Bu akkaunt bloklangan. Administratorga murojaat qiling.";
      if (status === 404) return "Foydalanuvchi topilmadi";
      if (status === 422) return "Ma'lumotlar noto'g'ri formatda kiritilgan";
      if (status === 429) return "Juda ko'p urinish. Biroz kuting va qayta urining.";
      if (status >= 500)  return "Server xatosi. Iltimos, keyinroq urinib ko'ring.";
      break;

    case "refresh":
      if (status === 401) return null; // silent — foydalanuvchi bilmasa ham bo'ladi
      if (status >= 500)  return "Server vaqtinchalik ishlamayapti.";
      break;

    case "me":
      if (status === 401) return null; // silent refresh urinadi
      if (status === 403) return "Ruxsat yo'q.";
      if (status >= 500)  return "Foydalanuvchi ma'lumotlarini yuklashda xato.";
      break;

    case "logout":
      return null; // logout xatosi foydalanuvchiga ko'rsatilmaydi

    default:
      break;
  }

  // Server o'z xabarini yuborgan bo'lsa — uni ko'rsat
  if (server) return server;

  // Umumiy fallback
  if (status === 400) return "Noto'g'ri so'rov yuborildi.";
  if (status === 401) return "Tizimga kirish talab etiladi.";
  if (status === 403) return "Bu amalni bajarishga ruxsat yo'q.";
  if (status === 404) return "Ma'lumot topilmadi.";
  if (status === 408) return "So'rov vaqti tugadi. Qayta urining.";
  if (status === 409) return "Bu ma'lumot allaqachon mavjud.";
  if (status === 413) return "Fayl hajmi juda katta.";
  if (status === 422) return "Kiritilgan ma'lumotlarni tekshiring.";
  if (status === 429) return "Juda ko'p so'rov. Biroz kuting.";
  if (status >= 500)  return "Server xatosi. Iltimos, keyinroq urinib ko'ring.";

  return "Noma'lum xatolik yuz berdi. Qayta urining.";
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [user,        setUser]        = useAtom(userAtom);
  const [initialized, setInitialized] = useAtom(initializedAtom);
  const [loading,     setLoading]     = useAtom(loadingAtom);
  const [error,       setError]       = useAtom(authErrorAtom);

  // ── Sessiyani tiklash ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const storedToken   = localStorage.getItem("accessToken");
      const storedUserRaw = localStorage.getItem("user");
      let   storedUser    = null;

      try {
        if (storedUserRaw) storedUser = JSON.parse(storedUserRaw);
      } catch {
        storedUser = null;
      }

      // 1) Saqlangan token bor — darhol axios'ga qo'y
      if (storedToken) {
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        if (!cancelled) setAccessToken(storedToken);
        if (!cancelled && storedUser) setUser(storedUser);
      }

      // 2) Tokenni /auth/me orqali tekshir
      if (storedToken) {
        try {
          const { data } = await getMe();
          if (!cancelled) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            setInitialized(true);
          }
          return;
        } catch {
          // token eskirgan — refresh urinamiz
        }
      }

      // 3) Silent refresh (httpOnly cookie)
      try {
        const { data } = await callRefresh();
        const newToken  = data.accessToken;
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        if (!cancelled) setAccessToken(newToken);

        if (data.user) {
          if (!cancelled) setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          try {
            const { data: me } = await getMe();
            if (!cancelled) {
              setUser(me);
              localStorage.setItem("user", JSON.stringify(me));
            }
          } catch {
            if (!cancelled) setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          delete api.defaults.headers.common.Authorization;
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };

    restore();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/auth/login", credentials, {
          _isLogin: true,
        });
        const token = data.accessToken;
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setAccessToken(token);
        setUser(data.user);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return data.user;
      } catch (err) {
        const message = parseError(err, "login");
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setAccessToken, setUser, setLoading, setError],
  );

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // logout xatosi jimgina o'tadi
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
    }
  }, [setAccessToken, setUser]);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, isAuthenticated, initialized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}