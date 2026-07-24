// Canonical sidebar/route access keys. Keep in sync with
// backend/src/config/navKeys.ts and frontend/src/config/modules.ts.
export const NAV_KEYS = [
  // Admin module
  "dashboard",
  "branches",
  "shifts",
  "departments",
  "designations",
  "employees",
  "role-management",
  "inventory",
  "settings",
  // POS Counter module
  "pos",
  // Menu module
  "menu",
  "qr",
  // Accounts & Reports module
  "pos-report",
  "orders",
  "profit-loss",
  "balance-sheet",
  "expenses",
  "customers",
  "tables",
  "chart-of-accounts",
] as const;

export type NavKey = (typeof NAV_KEYS)[number];

export const NAV_KEY_LABELS: Record<NavKey, string> = {
  dashboard: "Dashboard",
  branches: "Branches",
  shifts: "Shift Slot",
  departments: "Department",
  designations: "Designation",
  employees: "Employee",
  "role-management": "Role Management",
  inventory: "Inventory",
  settings: "Settings",
  pos: "POS Counter",
  menu: "Menu Items",
  qr: "QR Screen",
  "pos-report": "POS Reports",
  orders: "Orders",
  "profit-loss": "Profit & Loss",
  "balance-sheet": "Balance Sheet",
  expenses: "Expenses",
  customers: "Customers",
  tables: "Tables",
  "chart-of-accounts": "Chart of Accounts",
};
