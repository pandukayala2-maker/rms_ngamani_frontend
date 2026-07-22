import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, QRCodeEntity } from "../types";

export function useQrCode() {
  return useQuery({
    queryKey: ["qr-code"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QRCodeEntity>>("/qr-codes");
      return res.data.data;
    },
  });
}

export function useRegenerateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<QRCodeEntity>>("/qr-codes/regenerate");
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-code"] }),
  });
}

export function useToggleQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.patch<ApiResponse<QRCodeEntity>>("/qr-codes/toggle", { isActive });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-code"] }),
  });
}
