import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/authStore";
import type { ApiResponse, User } from "../types";

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", input);
      return res.data.data;
    },
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => clearAuth(),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<ApiResponse<null>>("/auth/forgot-password", { email });
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; password: string }) => {
      const res = await api.post<ApiResponse<null>>("/auth/reset-password", input);
      return res.data;
    },
  });
}
