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

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: <HiOutlineSquares2X2 size={18} />, roles: ["ADMIN", "MANAGER"] }],
  },
  {
    label: "Operations",
    items: [
      { to: "/pos", label: "POS Counter", icon: <HiOutlineShoppingCart size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
      { to: "/orders", label: "Orders", icon: <HiOutlineClipboardDocumentList size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
      { to: "/tables", label: "Tables", icon: <HiOutlineTableCells size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/menu", label: "Menu Management", icon: <HiOutlineSparkles size={18} />, roles: ["ADMIN", "MANAGER"] },
      { to: "/qr-codes", label: "QR Menu", icon: <HiOutlineQrCode size={18} />, roles: ["ADMIN", "MANAGER"] },
      { to: "/inventory", label: "Inventory", icon: <HiOutlineArchiveBox size={18} />, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "People & Insights",
    items: [
      { to: "/customers", label: "Customers", icon: <HiOutlineUserGroup size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
      { to: "/staff", label: "Staff", icon: <HiOutlineUsers size={18} />, roles: ["ADMIN"] },
      { to: "/reports", label: "Reports", icon: <HiOutlineChartBar size={18} />, roles: ["ADMIN", "MANAGER"] },
      { to: "/settings", label: "Settings", icon: <HiOutlineCog6Tooth size={18} />, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-[var(--border-color)] bg-[var(--bg-surface)]/70 p-4 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white font-bold shadow-lg shadow-brand-600/20">
          Q
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">QR Menu POS</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">Restaurant OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => {
          const items = section.items.filter((item) => !role || item.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      clsx(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/25"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
                      )
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)]/60 p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-semibold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{user.name}</p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">{user.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
