import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse } from "../types";

export interface PosSession {
  id: string;
  branchId: string;
  userId: string;
  user?: { id: string; name: string };
  openedAt: string;
  openingCash: number;
  closedAt: string | null;
  closingCash: number | null;
  expectedCash: number | null;
  status: "OPEN" | "CLOSED";
  notes: string | null;
}

export interface PosSessionReport {
  session: PosSession;
  orderCount: number;
  totalSales: number;
  paymentsByMethod: { method: string; total: number; count: number }[];
}

export function useCurrentSession() {
  return useQuery({
    queryKey: ["pos-session-current"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PosSession | null>>("/pos-sessions/current");
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

export function useOpenSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (openingCash: number) => {
      const res = await api.post<ApiResponse<PosSession>>("/pos-sessions/open", { openingCash });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-session-current"] }),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, closingCash, notes }: { id: string; closingCash: number; notes?: string }) => {
      const res = await api.post<ApiResponse<PosSession & { variance: number }>>(`/pos-sessions/${id}/close`, {
        closingCash,
        notes,
      });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-session-current"] });
      qc.invalidateQueries({ queryKey: ["pos-sessions"] });
    },
  });
}

export function useSessionHistory() {
  return useQuery({
    queryKey: ["pos-sessions"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PosSession[]>>("/pos-sessions");
      return res.data.data;
    },
  });
}

export function useSessionReport(id: string | null) {
  return useQuery({
    queryKey: ["pos-session-report", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PosSessionReport>>(`/pos-sessions/${id}/report`);
      return res.data.data;
    },
  });
}
