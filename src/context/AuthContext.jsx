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

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [initialized, setInitialized] = useAtom(initializedAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(authErrorAtom);

  // ── Restore session on every page load ─────────────────────
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedUserRaw = localStorage.getItem("user");
      let storedUser = null;
      try {
        if (storedUserRaw) storedUser = JSON.parse(storedUserRaw);
      } catch {
        storedUser = null;
      }

      // 1) If we have a stored token, put it into axios immediately
      if (storedToken) {
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        if (!cancelled) setAccessToken(storedToken);
        if (!cancelled && storedUser) setUser(storedUser);
      }

      // 2) Validate the token by calling /auth/me
      if (storedToken) {
        try {
          const { data } = await getMe();
          if (!cancelled) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
          if (!cancelled) setInitialized(true);
          return; // token is valid, we're done
        } catch (meErr) {
          // token expired or invalid — try silent refresh
        }
      }

      // 3) Try silent refresh via httpOnly cookie
      try {
        const { data } = await callRefresh();
        const newToken = data.accessToken;
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
        // No valid cookie and no valid stored token
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
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Login failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setAccessToken, setUser, setLoading, setError],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
  }, [setAccessToken, setUser]);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        initialized,
      }}
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
