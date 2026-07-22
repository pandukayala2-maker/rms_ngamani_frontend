export type Role = "ADMIN" | "MANAGER" | "CASHIER" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  displayOrder: number;
  isActive: boolean;
  _count?: { menuItems: number };
}

export type MenuItemStatus = "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK" | "DISABLED";
export type SpicyLevel = "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";

export interface MenuItem {
  id: string;
  name: string;
  itemCode: string;
  categoryId: string;
  category?: { id: string; name: string };
  subcategory?: string | null;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  tax: number;
  image?: string | null;
  prepTimeMins?: number | null;
  ingredients: string[];
  tags: string[];
  isVeg: boolean;
  spicyLevel: SpicyLevel;
  isFeatured: boolean;
  isBestseller: boolean;
  displayOrder: number;
  status: MenuItemStatus;
  showOnQr: boolean;
  posOnly: boolean;
  isTempHidden: boolean;
  isSeasonal: boolean;
  isAvailable: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { pagination?: Pagination };
}

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED";

export interface RestaurantTable {
  id: string;
  code: string;
  name: string;
  capacity: number;
  status: TableStatus;
}

export interface QRCodeEntity {
  id: string;
  token: string;
  imageUrl: string | null;
  isActive: boolean;
  scanCount: number;
}

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET" | "MIXED";

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  menuItem?: { name: string; image: string | null };
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  transactionRef?: string | null;
  paidAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  isHeld: boolean;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  table?: { id: string; name: string; code: string } | null;
  customer?: { id: string; name: string; phone: string } | null;
  createdBy?: { id: string; name: string } | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPerUnit: number;
  expiryDate?: string | null;
  supplier?: { id: string; name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  loyaltyPoints: number;
  membershipLevel: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
}

export interface DashboardKpis {
  todaySales: number;
  todayOrders: number;
  revenue: number;
  profit: number;
  activeMenuItems: number;
  hiddenMenuItems: number;
  inventoryValue: number;
  lowStock: number;
  customers: number;
  tables: number;
}

export interface Settings {
  restaurantName: string;
  logo?: string | null;
  address?: string | null;
  contact?: string | null;
  gstVat?: string | null;
  currency: string;
  language: string;
  theme: string;
  notifyLowStock: boolean;
  notifyNewOrders: boolean;
  notifyCompletedOrders: boolean;
  notifyInventoryAlerts: boolean;
  notifyPaymentAlerts: boolean;
}
