import { NavLink } from "react-router-dom";
import clsx from "clsx";

export function MenuTabs() {
  return (
    <div className="flex gap-2 border-b border-[var(--border-color)]">
      {[
        { to: "/menu", label: "Menu Items", end: true },
        { to: "/menu/categories", label: "Categories", end: false },
      ].map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            clsx(
              "border-b-2 px-3 pb-2 text-sm font-medium",
              isActive ? "border-brand-600 text-brand-600" : "border-transparent text-[var(--text-secondary)]"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
