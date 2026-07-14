import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import type { ApiResponse, Order, OrderType, Pagination, PaymentMethod } from "../types";

export interface CreateOrderInput {
  orderType: OrderType;
  tableId?: string;
  customerId?: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
  couponCode?: string;
  discount?: number;
  notes?: string;
  isHeld?: boolean;
}

export function useOrders(query: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["orders", query],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order[]>>("/orders", { params: query });
      return { items: res.data.data, pagination: res.data.meta?.pagination as Pagination };
    },
  });
}

export function useHeldOrders() {
  return useOrders({ isHeld: "true", limit: 50 });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await api.post<ApiResponse<Order>>("/orders", input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useResumeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Order>>(`/orders/${id}/resume`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddPayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payments,
    }: {
      id: string;
      payments: { method: PaymentMethod; amount: number; transactionRef?: string }[];
    }) => {
      const res = await api.post<ApiResponse<Order>>(`/orders/${id}/payments`, { payments });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
