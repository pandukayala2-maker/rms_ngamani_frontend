import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, MenuItem, Pagination } from "../types";

export interface MenuQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export function useMenuItems(query: MenuQuery) {
  return useQuery({
    queryKey: ["menu-items", query],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MenuItem[]>>("/menu-items", { params: query });
      return { items: res.data.data, pagination: res.data.meta?.pagination as Pagination };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MenuItem>) => {
      const res = await api.post<ApiResponse<MenuItem>>("/menu-items", input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<MenuItem> & { id: string }) => {
      const res = await api.put<ApiResponse<MenuItem>>(`/menu-items/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menu-items/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useDuplicateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<MenuItem>>(`/menu-items/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useUploadImage(endpoint: "/menu-items/upload-image" | "/categories/upload-image") {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post<ApiResponse<{ path: string }>>(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data.path;
    },
  });
}
