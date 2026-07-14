import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, QRCodeEntity } from "../types";

export function useQrCodes() {
  return useQuery({
    queryKey: ["qr-codes"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QRCodeEntity[]>>("/qr-codes");
      return res.data.data;
    },
  });
}

export function useCreateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: "BRANCH" | "TABLE"; tableId?: string }) => {
      const res = await api.post<ApiResponse<QRCodeEntity>>("/qr-codes", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-codes"] }),
  });
}

export function useRegenerateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<QRCodeEntity>>(`/qr-codes/${id}/regenerate`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-codes"] }),
  });
}

export function useToggleQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch<ApiResponse<QRCodeEntity>>(`/qr-codes/${id}/toggle`, { isActive });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-codes"] }),
  });
}
