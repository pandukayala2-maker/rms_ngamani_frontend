import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, Category } from "../types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>("/categories");
      return res.data.data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Category>) => {
      const res = await api.post<ApiResponse<Category>>("/categories", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Category> & { id: string }) => {
      const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
