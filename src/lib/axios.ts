import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

// In local dev / Docker, the frontend and backend share an origin (via the Vite
// or nginx proxy), so a relative "/api/v1" is enough. When deployed separately
// (e.g. Vercel + Render), set VITE_API_BASE_URL to the backend's full URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const token = res.data.data.accessToken as string;
  useAuthStore.getState().updateAccessToken(token);
  return token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.set?.("Authorization", `Bearer ${token}`);
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
