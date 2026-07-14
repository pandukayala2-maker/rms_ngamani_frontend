import { create } from "zustand";
import type { MenuItem, OrderType } from "../types";

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  lines: CartLine[];
  orderType: OrderType;
  tableId?: string;
  customerId?: string;
  couponCode?: string;
  discount: number;
  addItem: (item: MenuItem) => void;
  incrementLine: (menuItemId: string, delta: number) => void;
  removeLine: (menuItemId: string) => void;
  setOrderType: (type: OrderType) => void;
  setTableId: (id?: string) => void;
  setCustomerId: (id?: string) => void;
  setCouponCode: (code?: string) => void;
  setDiscount: (amount: number) => void;
  clear: () => void;
  loadFromOrder: (lines: CartLine[]) => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  orderType: "DINE_IN",
  discount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.lines.find((l) => l.menuItem.id === item.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.menuItem.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
          ),
        };
      }
      return { lines: [...state.lines, { menuItem: item, quantity: 1 }] };
    }),

  incrementLine: (menuItemId, delta) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.menuItem.id === menuItemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    })),

  removeLine: (menuItemId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.menuItem.id !== menuItemId) })),

  setOrderType: (orderType) => set({ orderType }),
  setTableId: (tableId) => set({ tableId }),
  setCustomerId: (customerId) => set({ customerId }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setDiscount: (discount) => set({ discount }),

  clear: () =>
    set({
      lines: [],
      tableId: undefined,
      customerId: undefined,
      couponCode: undefined,
      discount: 0,
    }),

  loadFromOrder: (lines) => set({ lines }),
}));
