import { Link } from "react-router-dom";
import clsx from "clsx";
import { HiOutlineLockClosed, HiArrowRight } from "react-icons/hi2";
import { MODULES } from "../../config/modules";
import { useAuthStore } from "../../store/authStore";
import { useMyPermissions } from "../../hooks/usePermissions";
import { useSettings } from "../../hooks/useSettings";

export default function Hub() {
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();
  const { data: myPermissions } = useMyPermissions();

  const isAdmin = user?.role === "ADMIN";
  const allowedNavKeys = myPermissions?.allowedNavKeys ?? [];
  const canEnter = (moduleNavKeys: string[]) => isAdmin || moduleNavKeys.some((k) => allowedNavKeys.includes(k));

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-12 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <img
          src="/logo.png"
          alt={settings?.restaurantName ?? "Nagami Restaurant"}
          className="h-16 w-16 rounded-2xl object-contain shadow-lg"
        />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{settings?.restaurantName ?? "Nagami Restaurant"}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Welcome back, {user?.name}. Choose a module to continue.</p>
        </div>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => {
          const enabled = canEnter(module.navKeys);
          const card = (
            <div
              className={clsx(
                "group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition-all duration-200",
                enabled
                  ? "border-[var(--border-color)] bg-[var(--bg-surface)] hover:-translate-y-1 hover:border-transparent hover:shadow-xl cursor-pointer"
                  : "border-[var(--border-color)] bg-[var(--bg-surface)]/60 cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={clsx(
                  "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-200",
                  enabled ? [module.accent, module.glow, "text-white group-hover:scale-105"] : "from-[var(--bg-surface-2)] to-[var(--bg-surface-2)] text-[var(--text-muted)]"
                )}
              >
                {enabled ? module.icon : <HiOutlineLockClosed size={24} />}
              </div>

              <div className="flex-1">
                <p className="text-base font-semibold">{module.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{module.description}</p>
              </div>

              {enabled && (
                <div className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors group-hover:text-brand-600">
                  Enter <HiArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              )}

              {enabled && (
                <div
                  className={clsx(
                    "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                    module.accent
                  )}
                />
              )}
            </div>
          );

          return enabled ? (
            <Link key={module.key} to={module.path} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={module.key}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
