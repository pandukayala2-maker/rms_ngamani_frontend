// Canonical sidebar/route access keys. Keep in sync with
// backend/src/config/navKeys.ts.
export const NAV_KEYS = [
  "dashboard",
  "pos",
  "orders",
  "tables",
  "menu",
  "qr",
  "inventory",
  "customers",
  "role-management",
  "reports",
  "pos-report",
  "expenses",
  "settings",
] as const;

export type NavKey = (typeof NAV_KEYS)[number];

export const NAV_KEY_LABELS: Record<NavKey, string> = {
  dashboard: "Dashboard",
  pos: "POS Counter",
  orders: "Orders",
  tables: "Tables",
  menu: "Menu Management",
  qr: "QR Menu",
  inventory: "Inventory",
  customers: "Customers",
  "role-management": "Role Management",
  reports: "Reports",
  "pos-report": "POS Report",
  expenses: "Expenses",
  settings: "Settings",
};
