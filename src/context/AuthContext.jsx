import { createContext, useContext, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import api, { callRefresh } from "../api/axios";
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

  // Silently restore session on every page load via the httpOnly refresh cookie
  useEffect(() => {
    callRefresh()
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        if (data.user) setUser(data.user);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      })
      .catch(() => {
        // No valid cookie — user needs to log in manually, no redirect here
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        setInitialized(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post("/auth/login", credentials);
        setAccessToken(data.accessToken);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        return data.user;
      } catch (err) {
        const message = err.response?.data?.message || "Login failed";
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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    delete api.defaults.headers.common.Authorization;
  }, [setAccessToken, setUser]);

  const isAuthenticated = !!user && !!accessToken;
  // const isAuthenticated = !!user && !!localStorage.getItem('accessToken')

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
