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
      <div className="relative grid w-full max-w-6xl grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connecting path between steps, large screens only */}
        <div className="pointer-events-none absolute top-12 left-[12.5%] right-[12.5%] hidden border-t-2 border-dashed border-[var(--border-color)] lg:block" />

        {MODULES.map((module, index) => {
          const enabled = canEnter(module.navKeys);
          const card = (
            <div
              className={clsx(
                "group relative flex flex-col items-center gap-3 text-center transition-all duration-200",
                enabled ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              )}
            >
              <div
                className={clsx(
                  "relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200",
                  enabled ? [module.glowBg, "group-hover:scale-105"] : "bg-[var(--bg-surface-2)]"
                )}
              >
                {enabled ? module.icon : <HiOutlineLockClosed size={30} className="text-[var(--text-muted)]" />}
              </div>

              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-page)] text-[10px] font-bold text-[var(--text-muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{module.label}</p>
                <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-[var(--text-muted)]">{module.description}</p>
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
