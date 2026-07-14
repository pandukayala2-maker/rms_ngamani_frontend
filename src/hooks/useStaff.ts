import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, User } from "../types";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>("/staff");
      return res.data.data;
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string; role: string; phone?: string }) => {
      const res = await api.post<ApiResponse<User>>("/staff", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<User> & { id: string }) => {
      const res = await api.put<ApiResponse<User>>(`/staff/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
