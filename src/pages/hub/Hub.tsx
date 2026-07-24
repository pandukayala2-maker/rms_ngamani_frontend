import { Link } from "react-router-dom";
import clsx from "clsx";
import { HiOutlineLockClosed } from "react-icons/hi2";
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
    <div className="flex min-h-full flex-col items-center justify-center gap-10 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt={settings?.restaurantName ?? "Nagami Restaurant"} className="h-20 w-20 object-contain" />
        <div>
          <h1 className="text-xl font-semibold">{settings?.restaurantName ?? "Nagami Restaurant"}</h1>
          <p className="text-sm text-[var(--text-muted)]">Welcome back, {user?.name}. Choose a module to continue.</p>
        </div>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 px-4 sm:grid-cols-2">
        {MODULES.map((module) => {
          const enabled = canEnter(module.navKeys);
          const card = (
            <div
              className={clsx(
                "glass-card flex h-full flex-col items-center gap-3 p-8 text-center transition-all",
                enabled ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={clsx(
                  "flex h-16 w-16 items-center justify-center rounded-2xl",
                  enabled
                    ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-600/25"
                    : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                )}
              >
                {enabled ? module.icon : <HiOutlineLockClosed size={26} />}
              </div>
              <div>
                <p className="text-base font-semibold">{module.label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{module.description}</p>
              </div>
            </div>
          );

          return enabled ? (
            <Link key={module.key} to={module.path}>
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
