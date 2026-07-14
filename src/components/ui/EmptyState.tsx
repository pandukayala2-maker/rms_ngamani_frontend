import type { ReactNode } from "react";
import { HiOutlineInboxStack } from "react-icons/hi2";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-color)] p-12 text-center">
      <div className="text-[var(--text-muted)]">{icon ?? <HiOutlineInboxStack size={36} />}</div>
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
