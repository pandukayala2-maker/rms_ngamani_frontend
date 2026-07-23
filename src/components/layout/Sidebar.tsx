import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { FaUtensils } from "react-icons/fa6";
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
} from "react-icons/hi2";
import { useAuthStore } from "../../store/authStore";
import { useSettings } from "../../hooks/useSettings";
import { useMyPermissions } from "../../hooks/usePermissions";
import type { NavKey } from "../../config/navKeys";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  navKey: NavKey;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: <HiOutlineSquares2X2 size={18} />, navKey: "dashboard" }],
  },
  {
    label: "Operations",
    items: [
      { to: "/pos", label: "POS Counter", icon: <HiOutlineShoppingCart size={18} />, navKey: "pos" },
      { to: "/orders", label: "Orders", icon: <HiOutlineClipboardDocumentList size={18} />, navKey: "orders" },
      { to: "/tables", label: "Tables", icon: <HiOutlineTableCells size={18} />, navKey: "tables" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/menu", label: "Menu Management", icon: <HiOutlineSparkles size={18} />, navKey: "menu" },
      { to: "/qr-codes", label: "QR Menu", icon: <HiOutlineQrCode size={18} />, navKey: "qr" },
      { to: "/inventory", label: "Inventory", icon: <HiOutlineArchiveBox size={18} />, navKey: "inventory" },
    ],
  },
  {
    label: "People & Insights",
    items: [
      { to: "/customers", label: "Customers", icon: <HiOutlineUserGroup size={18} />, navKey: "customers" },
      { to: "/roles", label: "Role Management", icon: <HiOutlineUsers size={18} />, navKey: "role-management" },
      { to: "/reports", label: "Reports", icon: <HiOutlineChartBar size={18} />, navKey: "reports" },
      { to: "/reports/pos", label: "POS Report", icon: <HiOutlineDocumentChartBar size={18} />, navKey: "pos-report" },
      { to: "/expenses", label: "Expenses", icon: <HiOutlineBanknotes size={18} />, navKey: "expenses" },
      { to: "/settings", label: "Settings", icon: <HiOutlineCog6Tooth size={18} />, navKey: "settings" },
    ],
  },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();
  const { data: myPermissions } = useMyPermissions();

  const isAdmin = user?.role === "ADMIN";
  const allowedNavKeys = myPermissions?.allowedNavKeys ?? [];
  const canSee = (navKey: NavKey) => isAdmin || allowedNavKeys.includes(navKey);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-[var(--border-color)] bg-[var(--bg-surface)]/70 p-4 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-600/20">
          <FaUtensils className="text-white" size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{settings?.restaurantName ?? "Nagami Hotel"}</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">Restaurant OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => {
          const items = section.items.filter((item) => !user || canSee(item.navKey));
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
