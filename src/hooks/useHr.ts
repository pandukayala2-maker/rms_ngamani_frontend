import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, Department, Designation, Shift } from "../types";

function crudHooks<T extends { id: string }>(resource: "departments" | "designations" | "shifts", key: string) {
  function useList() {
    return useQuery({
      queryKey: [key],
      queryFn: async () => {
        const res = await api.get<ApiResponse<T[]>>(`/hr/${resource}`);
        return res.data.data;
      },
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (input: Partial<T>) => {
        const res = await api.post<ApiResponse<T>>(`/hr/${resource}`, input);
        return res.data.data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...input }: Partial<T> & { id: string }) => {
        const res = await api.put<ApiResponse<T>>(`/hr/${resource}/${id}`, input);
        return res.data.data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/hr/${resource}/${id}`);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}

const departmentHooks = crudHooks<Department>("departments", "departments");
export const useDepartments = departmentHooks.useList;
export const useCreateDepartment = departmentHooks.useCreate;
export const useUpdateDepartment = departmentHooks.useUpdate;
export const useDeleteDepartment = departmentHooks.useDelete;

const designationHooks = crudHooks<Designation>("designations", "designations");
export const useDesignations = designationHooks.useList;
export const useCreateDesignation = designationHooks.useCreate;
export const useUpdateDesignation = designationHooks.useUpdate;
export const useDeleteDesignation = designationHooks.useDelete;

const shiftHooks = crudHooks<Shift>("shifts", "shifts");
export const useShifts = shiftHooks.useList;
export const useCreateShift = shiftHooks.useCreate;
export const useUpdateShift = shiftHooks.useUpdate;
export const useDeleteShift = shiftHooks.useDelete;
