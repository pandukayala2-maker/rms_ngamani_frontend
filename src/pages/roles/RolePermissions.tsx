import { toast } from "sonner";
import { Card } from "../../components/ui/Card";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { RoleManagementTabs } from "./RoleManagement";
import { usePermissions, useUpdateRolePermission } from "../../hooks/usePermissions";
import { NAV_KEYS, NAV_KEY_LABELS } from "../../config/navKeys";
import { getErrorMessage } from "../../lib/axios";
import type { Role } from "../../types";

const EDITABLE_ROLES: Role[] = ["MANAGER", "CASHIER", "CUSTOMER"];

export default function RolePermissions() {
  const { data: permissions, isLoading } = usePermissions();
  const updatePermission = useUpdateRolePermission();

  const allowedFor = (role: Role) => permissions?.find((p) => p.role === role)?.allowedNavKeys ?? [];

  const toggle = (role: Role, navKey: string) => {
    const current = allowedFor(role);
    const next = current.includes(navKey) ? current.filter((k) => k !== navKey) : [...current, navKey];
    updatePermission.mutate(
      { role, allowedNavKeys: next },
      { onError: (err) => toast.error(getErrorMessage(err)) }
    );
  };

  return (
    <div className="space-y-4">
      <RoleManagementTabs />
      <p className="text-sm text-[var(--text-secondary)]">
        Choose which sidebar sections each role can see. Admin always has full access.
      </p>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-xs uppercase text-[var(--text-muted)]">
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 px-3 text-center">Admin</th>
                {EDITABLE_ROLES.map((role) => (
                  <th key={role} className="py-2 px-3 text-center">
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NAV_KEYS.map((navKey) => (
                <tr key={navKey} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="py-2.5 pr-3">{NAV_KEY_LABELS[navKey]}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input type="checkbox" checked disabled className="h-4 w-4 accent-brand-600 opacity-50" />
                  </td>
                  {EDITABLE_ROLES.map((role) => (
                    <td key={role} className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={allowedFor(role).includes(navKey)}
                        onChange={() => toggle(role, navKey)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
