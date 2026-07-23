import { NavLink } from "react-router-dom";
import clsx from "clsx";

const tabs = [
  { to: "/roles", label: "Employees", end: true },
  { to: "/roles/departments", label: "Departments", end: false },
  { to: "/roles/designations", label: "Designations", end: false },
  { to: "/roles/shifts", label: "Shifts", end: false },
  { to: "/roles/permissions", label: "Permissions", end: false },
];

export function RoleManagementTabs() {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-color)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            clsx(
              "whitespace-nowrap border-b-2 px-3 pb-2 text-sm font-medium",
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
