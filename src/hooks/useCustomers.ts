import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, Customer } from "../types";

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer[]>>("/customers", { params: { search } });
      return res.data.data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email?: string; phone: string }) => {
      const res = await api.post<ApiResponse<Customer>>("/customers", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useAdjustLoyalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const res = await api.post<ApiResponse<Customer>>(`/customers/${id}/loyalty`, { points });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
