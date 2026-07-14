import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, RestaurantTable } from "../types";

export function useTables() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RestaurantTable[]>>("/tables");
      return res.data.data;
    },
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; name: string; capacity: number }) => {
      const res = await api.post<ApiResponse<RestaurantTable>>("/tables", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<RestaurantTable> & { id: string }) => {
      const res = await api.put<ApiResponse<RestaurantTable>>(`/tables/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}
