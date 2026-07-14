import { NavLink } from "react-router-dom";
import clsx from "clsx";
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
} from "react-icons/hi2";
import { useAuthStore } from "../../store/authStore";
import type { Role } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <HiOutlineSquares2X2 size={18} />, roles: ["ADMIN", "MANAGER"] },
  { to: "/pos", label: "POS Counter", icon: <HiOutlineShoppingCart size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/orders", label: "Orders", icon: <HiOutlineClipboardDocumentList size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/menu", label: "Menu Management", icon: <HiOutlineSparkles size={18} />, roles: ["ADMIN", "MANAGER"] },
  { to: "/qr-codes", label: "QR Menu", icon: <HiOutlineQrCode size={18} />, roles: ["ADMIN", "MANAGER"] },
  { to: "/tables", label: "Tables", icon: <HiOutlineTableCells size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/inventory", label: "Inventory", icon: <HiOutlineArchiveBox size={18} />, roles: ["ADMIN", "MANAGER"] },
  { to: "/customers", label: "Customers", icon: <HiOutlineUserGroup size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/staff", label: "Staff", icon: <HiOutlineUsers size={18} />, roles: ["ADMIN"] },
  { to: "/reports", label: "Reports", icon: <HiOutlineChartBar size={18} />, roles: ["ADMIN", "MANAGER"] },
  { to: "/settings", label: "Settings", icon: <HiOutlineCog6Tooth size={18} />, roles: ["ADMIN"] },
];

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
          Q
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">QR Menu POS</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">Restaurant OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems
          .filter((item) => !role || item.roles.includes(role))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
