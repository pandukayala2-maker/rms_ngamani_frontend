import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, Settings } from "../types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Settings>>("/settings");
      return res.data.data;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Settings>) => {
      const res = await api.put<ApiResponse<Settings>>("/settings", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
