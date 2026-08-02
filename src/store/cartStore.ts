import { create } from "zustand";
import type { MenuItem, OrderType } from "../types";

export interface CartLine {
  id: string; // Unique identifier for this line in the cart
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  portion?: "FULL" | "HALF";
  isSinglePiece?: boolean;
  pieces?: number;
  basePieces?: number;
}

interface CartState {
  lines: CartLine[];
  orderType: OrderType;
  tableId?: string;
  customerId?: string;
  couponCode?: string;
  discount: number;
  addItem: (item: MenuItem, portion?: "FULL" | "HALF") => void;
  incrementLine: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  updateLinePortion: (lineId: string, portion: "FULL" | "HALF") => void;
  updateLineSinglePiece: (lineId: string, isSinglePiece: boolean, pieces?: number, basePieces?: number) => void;
  setOrderType: (type: OrderType) => void;
  setTableId: (id?: string) => void;
  setCustomerId: (id?: string) => void;
  setCouponCode: (code?: string) => void;
  setDiscount: (amount: number) => void;
  clear: () => void;
  loadFromOrder: (lines: CartLine[]) => void;
}

// Helper to parse base pieces from item name
function getBasePiecesFromName(name: string): number {
  const match = name.match(/(\d+)\s*(?:pcs|pc|x|pieces|piece)/i);
  if (match) return parseInt(match[1], 10);
  const xMatch = name.match(/(?:x)\s*(\d+)/i);
  if (xMatch) return parseInt(xMatch[1], 10);
  const matchX = name.match(/(\d+)\s*(?:x)/i);
  if (matchX) return parseInt(matchX[1], 10);
  return 1;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  orderType: "DINE_IN",
  discount: 0,

  addItem: (item, portion = "FULL") =>
    set((state) => {
      // Find an existing line of the same item that is in the requested portion / Plate mode
      const existing = state.lines.find(
        (l) => l.menuItem.id === item.id && l.portion === portion && !l.isSinglePiece
      );
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l
          ),
        };
      }
      const initialBasePieces = getBasePiecesFromName(item.name);
      return {
        lines: [
          ...state.lines,
          {
            id: Math.random().toString(36).substring(7),
            menuItem: item,
            quantity: 1,
            portion,
            isSinglePiece: false,
            pieces: 1,
            basePieces: initialBasePieces,
          },
        ],
      };
    }),

  incrementLine: (lineId, delta) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.id === lineId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    })),

  removeLine: (lineId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== lineId) })),

  updateLinePortion: (lineId, portion) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === lineId ? { ...l, portion } : l
      ),
    })),

  updateLineSinglePiece: (lineId, isSinglePiece, pieces, basePieces) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              isSinglePiece,
              pieces: pieces !== undefined ? pieces : l.pieces,
              basePieces: basePieces !== undefined ? basePieces : l.basePieces,
            }
          : l
      ),
    })),

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

  loadFromOrder: (lines) =>
    set({
      lines: lines.map((l) => ({
        ...l,
        id: l.id || Math.random().toString(36).substring(7),
      })),
    }),
}));
