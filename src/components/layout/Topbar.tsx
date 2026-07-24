import { HiOutlineMoon, HiOutlineSun, HiOutlineArrowRightOnRectangle, HiOutlineSquares2X2 } from "react-icons/hi2";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Topbar({ title }: { title: string }) {
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const isHub = location.pathname === "/";
  const { data: settings } = useSettings();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)]/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {!isHub && (
          <Link
            to="/"
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
            aria-label="All Modules"
            title="All Modules"
          >
            <HiOutlineSquares2X2 size={18} />
          </Link>
        )}
        {isHub ? (
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">{settings?.restaurantName ?? "Nagami Restaurant"}</p>
              <p className="text-xs text-[var(--text-muted)]">Welcome back, {user?.name}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium">{user?.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{user?.role}</span>
        </div>
        <button
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/login") })}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          aria-label="Logout"
          title="Logout"
        >
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>
    </header>
  );
}
