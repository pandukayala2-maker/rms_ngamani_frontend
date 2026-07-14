import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, DashboardKpis } from "../types";

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardKpis>>("/dashboard/kpis");
      return res.data.data;
    },
  });
}

export function useDailySales() {
  return useQuery({
    queryKey: ["dashboard", "daily-sales"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ date: string; total: number }[]>>("/dashboard/sales/daily");
      return res.data.data;
    },
  });
}

export function useMonthlySales() {
  return useQuery({
    queryKey: ["dashboard", "monthly-sales"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ month: string; total: number }[]>>(
        "/dashboard/sales/monthly"
      );
      return res.data.data;
    },
  });
}

export function useCategorySales() {
  return useQuery({
    queryKey: ["dashboard", "category-sales"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ category: string; revenue: number }[]>>(
        "/dashboard/sales/by-category"
      );
      return res.data.data;
    },
  });
}

export function useTopSellingItems() {
  return useQuery({
    queryKey: ["dashboard", "top-selling"],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ menuItemId: string; name: string; quantitySold: number; revenue: number }[]>
      >("/dashboard/top-selling");
      return res.data.data;
    },
  });
}
