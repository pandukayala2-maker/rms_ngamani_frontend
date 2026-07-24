import type { ReactNode } from "react";
import {
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentList,
  HiOutlineQrCode,
  HiOutlineShoppingCart,
  HiOutlineArchiveBox,
  HiOutlineTableCells,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineSparkles,
  HiOutlineBanknotes,
  HiOutlineDocumentChartBar,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineIdentification,
  HiOutlineBriefcase,
  HiOutlineCalculator,
  HiOutlineTrophy,
} from "react-icons/hi2";
import { TbUserCog } from "react-icons/tb";
import { MdOutlinePointOfSale, MdOutlineRoomService } from "react-icons/md";
import type { NavKey } from "./navKeys";

export interface ModuleNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  navKey: NavKey;
}

export interface AppModule {
  key: "admin" | "pos" | "menu" | "accounts";
  label: string;
  description: string;
  icon: ReactNode;
  path: string;
  navKeys: NavKey[];
  items: ModuleNavItem[];
  /** Tailwind gradient stops used for this module's Hub tile underline accent. */
  accent: string;
  /** Neon-glow classes for the Hub tile's circular icon badge. */
  glowBg: string;
  ring: string;
  iconColor: string;
  iconGlow: string;
}

export const MODULES: AppModule[] = [
  {
    key: "admin",
    label: "Admin",
    description: "Branches, staff, and system configuration",
    icon: <TbUserCog size={40} />,
    path: "/admin",
    accent: "from-violet-500 to-purple-700",
    glowBg: "bg-violet-500",
    ring: "border-violet-400/50",
    iconColor: "text-violet-300",
    iconGlow: "drop-shadow-[0_0_10px_rgba(167,139,250,0.75)]",
    navKeys: ["dashboard", "branches", "shifts", "departments", "designations", "employees", "role-management", "inventory", "settings"],
    items: [
      { to: "/admin", label: "Dashboard", icon: <HiOutlineSquares2X2 size={18} />, navKey: "dashboard" },
      { to: "/admin/branches", label: "Branches", icon: <HiOutlineBuildingOffice2 size={18} />, navKey: "branches" },
      { to: "/admin/shifts", label: "Shift Slot", icon: <HiOutlineClock size={18} />, navKey: "shifts" },
      { to: "/admin/departments", label: "Department", icon: <HiOutlineBriefcase size={18} />, navKey: "departments" },
      { to: "/admin/designations", label: "Designation", icon: <HiOutlineIdentification size={18} />, navKey: "designations" },
      { to: "/admin/employees", label: "Employee", icon: <HiOutlineUsers size={18} />, navKey: "employees" },
      { to: "/admin/role-management", label: "Role Management", icon: <HiOutlineShieldCheck size={18} />, navKey: "role-management" },
      { to: "/admin/inventory", label: "Inventory", icon: <HiOutlineArchiveBox size={18} />, navKey: "inventory" },
      { to: "/admin/settings", label: "Settings", icon: <HiOutlineCog6Tooth size={18} />, navKey: "settings" },
    ],
  },
  {
    key: "pos",
    label: "POS Counter",
    description: "Live billing counter and transaction management",
    icon: <MdOutlinePointOfSale size={40} />,
    path: "/pos",
    accent: "from-sky-500 to-blue-700",
    glowBg: "bg-sky-500",
    ring: "border-sky-400/50",
    iconColor: "text-sky-300",
    iconGlow: "drop-shadow-[0_0_10px_rgba(56,189,248,0.75)]",
    navKeys: ["pos"],
    items: [{ to: "/pos", label: "Live Counter", icon: <HiOutlineShoppingCart size={18} />, navKey: "pos" }],
  },
  {
    key: "menu",
    label: "Menu",
    description: "Manage categories, items, and the QR menu",
    icon: <MdOutlineRoomService size={40} />,
    path: "/menu",
    accent: "from-amber-400 to-orange-600",
    glowBg: "bg-amber-500",
    ring: "border-amber-400/50",
    iconColor: "text-amber-300",
    iconGlow: "drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]",
    navKeys: ["menu", "qr"],
    items: [
      { to: "/menu/categories", label: "Category", icon: <HiOutlineSparkles size={18} />, navKey: "menu" },
      { to: "/menu", label: "Menu Items", icon: <HiOutlineClipboardDocumentList size={18} />, navKey: "menu" },
      { to: "/menu/qr", label: "QR Screen", icon: <HiOutlineQrCode size={18} />, navKey: "qr" },
    ],
  },
  {
    key: "accounts",
    label: "Accounts & Reports",
    description: "View orders, expenses, and financial reports",
    icon: <HiOutlineDocumentChartBar size={40} />,
    path: "/accounts",
    accent: "from-emerald-500 to-green-700",
    glowBg: "bg-emerald-500",
    ring: "border-emerald-400/50",
    iconColor: "text-emerald-300",
    iconGlow: "drop-shadow-[0_0_10px_rgba(52,211,153,0.75)]",
    navKeys: ["pos-report", "product-performance", "orders", "profit-loss", "balance-sheet", "expenses", "customers", "tables", "chart-of-accounts"],
    items: [
      { to: "/accounts", label: "POS Reports", icon: <HiOutlineDocumentChartBar size={18} />, navKey: "pos-report" },
      { to: "/accounts/product-performance", label: "Product Performance", icon: <HiOutlineTrophy size={18} />, navKey: "product-performance" },
      { to: "/accounts/orders", label: "Orders", icon: <HiOutlineClipboardDocumentList size={18} />, navKey: "orders" },
      { to: "/accounts/profit-loss", label: "Profit & Loss", icon: <HiOutlineChartBar size={18} />, navKey: "profit-loss" },
      { to: "/accounts/balance-sheet", label: "Balance Sheet", icon: <HiOutlineCalculator size={18} />, navKey: "balance-sheet" },
      { to: "/accounts/expenses", label: "Expenses", icon: <HiOutlineBanknotes size={18} />, navKey: "expenses" },
      { to: "/accounts/customers", label: "Customers", icon: <HiOutlineUserGroup size={18} />, navKey: "customers" },
      { to: "/accounts/tables", label: "Tables", icon: <HiOutlineTableCells size={18} />, navKey: "tables" },
      { to: "/accounts/chart-of-accounts", label: "Chart of Accounts", icon: <HiOutlineCalculator size={18} />, navKey: "chart-of-accounts" },
    ],
  },
];

export function moduleForPath(pathname: string): AppModule | undefined {
  return MODULES.find((m) => pathname === m.path || pathname.startsWith(`${m.path}/`));
}
