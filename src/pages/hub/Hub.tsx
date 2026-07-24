import { Link } from "react-router-dom";
import clsx from "clsx";
import { HiOutlineLockClosed } from "react-icons/hi2";
import { MODULES } from "../../config/modules";
import { useAuthStore } from "../../store/authStore";
import { useMyPermissions } from "../../hooks/usePermissions";

export default function Hub() {
  const user = useAuthStore((s) => s.user);
  const { data: myPermissions } = useMyPermissions();

  const isAdmin = user?.role === "ADMIN";
  const allowedNavKeys = myPermissions?.allowedNavKeys ?? [];
  const canEnter = (moduleNavKeys: string[]) => isAdmin || moduleNavKeys.some((k) => allowedNavKeys.includes(k));

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-10 py-10">
      <div className="grid w-full max-w-6xl grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => {
          const enabled = canEnter(module.navKeys);
          const card = (
            <div
              className={clsx(
                "group flex flex-col items-center gap-4 text-center transition-all duration-200",
                enabled ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              )}
            >
              <div className="relative flex h-28 w-28 items-center justify-center">
                {enabled && (
                  <div
                    className={clsx(
                      "absolute inset-0 rounded-full opacity-30 blur-2xl transition-opacity duration-200 group-hover:opacity-50",
                      module.glowBg
                    )}
                  />
                )}
                <div
                  className={clsx(
                    "relative flex h-24 w-24 items-center justify-center rounded-full border bg-[var(--bg-surface)]/40 backdrop-blur-sm transition-transform duration-200",
                    enabled ? [module.ring, "group-hover:scale-105"] : "border-[var(--border-color)]"
                  )}
                >
                  {enabled ? (
                    <span className={clsx(module.iconColor, module.iconGlow)}>{module.icon}</span>
                  ) : (
                    <HiOutlineLockClosed size={32} className="text-[var(--text-muted)]" />
                  )}
                </div>
              </div>

              <div>
                <p className="text-base font-semibold">{module.label}</p>
                <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-[var(--text-muted)]">{module.description}</p>
              </div>

              {enabled && (
                <div className={clsx("h-0.5 w-14 rounded-full bg-gradient-to-r", module.accent)} />
              )}
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
