import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE + "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

/* ── Token helpers ─────────────────────────────────────────── */

const getStoredToken = () => localStorage.getItem("accessToken");

const setToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common.Authorization;
  }
};

/* ── Request: attach current access token ──────────────────── */

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response: 401 refresh logic ───────────────────────────── */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

export const callRefresh = () =>
  api.post("/auth/refresh", {}, { _isRefresh: true });

api.interceptors.response.use(
  (res) => {
    // Backend may send a new token in header after /auth/me
    const newToken = res.headers["x-access-token"];
    if (newToken) setToken(newToken);
    return res;
  },

  async (error) => {
    const original = error.config;

    // Never loop on refresh/login endpoints
    if (original?._isRefresh || original?._isLogin) {
      return Promise.reject(error);
    }

    // Not a 401, or already retried — just fail
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Another request is already refreshing — queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        failedQueue.push({ resolve, reject }),
      ).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await callRefresh();
      const newToken = data.accessToken;
      setToken(newToken);

      // Also persist user if backend sends it
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setToken(null);
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
