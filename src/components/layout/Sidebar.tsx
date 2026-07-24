import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "../../store/authStore";
import { useSettings } from "../../hooks/useSettings";
import { useMyPermissions } from "../../hooks/usePermissions";
import { moduleForPath } from "../../config/modules";

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();
  const { data: myPermissions } = useMyPermissions();
  const location = useLocation();

  const isAdmin = user?.role === "ADMIN";
  const allowedNavKeys = myPermissions?.allowedNavKeys ?? [];
  const canSee = (navKey: string) => isAdmin || allowedNavKeys.includes(navKey as never);

  const activeModule = moduleForPath(location.pathname);
  const items = activeModule ? activeModule.items.filter((item) => !user || canSee(item.navKey)) : [];

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-[var(--border-color)] bg-[var(--bg-surface)]/70 p-4 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img src="/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{settings?.restaurantName ?? "Nadhamuni Restaurant"}</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">{activeModule?.label ?? "Restaurant OS"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === activeModule?.path}
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
