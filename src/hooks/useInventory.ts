import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, InventoryItem } from "../types";

export function useInventoryItems() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<InventoryItem[]>>("/inventory");
      return res.data.data;
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<InventoryItem[]>>("/inventory/low-stock");
      return res.data.data;
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<InventoryItem>) => {
      const res = await api.post<ApiResponse<InventoryItem>>("/inventory", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useRecordStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "WASTE";
      quantity: number;
      reason?: string;
    }) => {
      const res = await api.post<ApiResponse<InventoryItem>>(`/inventory/${id}/movements`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}
