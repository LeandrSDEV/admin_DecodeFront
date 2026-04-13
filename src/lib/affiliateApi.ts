import axios from "axios";
import { clearAffiliateAuth, getAffiliateToken } from "../auth/affiliateAuthStorage";

// Cliente axios isolado para o portal do afiliado.
// Aponta pros endpoints /api/affiliate/** que tem JWT e SecurityFilterChain proprios.
const affiliateApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

affiliateApi.interceptors.request.use((config) => {
  const token = getAffiliateToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

affiliateApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAffiliateAuth();
      if (window.location.pathname.startsWith("/afiliado/")) {
        window.location.href = "/afiliado/entrar";
      }
    }
    return Promise.reject(err);
  }
);

export default affiliateApi;
