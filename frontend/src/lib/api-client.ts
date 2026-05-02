import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, TOKEN_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor - Add token to headers
apiClient.interceptors.request.use(
  (config) => {
    const cookieToken = Cookies.get(TOKEN_COOKIE);
    const storageToken =
      typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) || undefined : undefined;
    const token = cookieToken || storageToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear invalid token
      Cookies.remove(TOKEN_COOKIE);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }

      // Redirect to login if not already there
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    return Promise.reject(error);
  }
);
