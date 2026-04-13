import axios from "axios";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "../auth/authStorage";

// Runtime config injected by /env.js (written by docker-entrypoint.sh from
// container env vars). Falls back to Vite build-time env for local dev.
declare global {
  interface Window {
    __ENV__?: { VITE_API_BASE_URL?: string };
  }
}

const apiBaseUrl =
  (typeof window !== "undefined" && window.__ENV__?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;

    // evita loop
    if (status === 401 && original && !original.__isRetry) {
      original.__isRetry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const r = await axios.post(
            `${apiBaseUrl}/api/auth/refresh`,
            { refreshToken }
          );
          setToken(r.data.token);
          setRefreshToken(r.data.refreshToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${r.data.token}`;
          return api(original);
        } catch {
          clearToken();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      } else {
        clearToken();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;