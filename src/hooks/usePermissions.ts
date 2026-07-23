import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { useAuthStore } from "../store/authStore";
import type { ApiResponse, Role, RolePermission } from "../types";

export function usePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RolePermission[]>>("/permissions");
      return res.data.data;
    },
  });
}

export function useUpdateRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, allowedNavKeys }: { role: Role; allowedNavKeys: string[] }) => {
      const res = await api.put<ApiResponse<RolePermission>>(`/permissions/${role}`, { allowedNavKeys });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role-permissions"] }),
  });
}

export function useMyPermissions() {
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: ["my-permissions"],
    enabled: isAuthed,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<RolePermission>>("/permissions/mine");
      return res.data.data;
    },
  });
}
