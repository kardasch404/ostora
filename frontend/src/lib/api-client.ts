import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL, TOKEN_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const cookieToken = Cookies.get(TOKEN_COOKIE);
  const storageToken =
    typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) || undefined : undefined;
  const token = cookieToken || storageToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
