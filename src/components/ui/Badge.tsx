import type { HTMLAttributes } from "react";
import clsx from "clsx";

type Tone = "neutral" | "good" | "warning" | "serious" | "critical" | "brand";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]",
  good: "bg-green-500/15 text-green-600 dark:text-green-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  serious: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  critical: "bg-red-500/15 text-red-600 dark:text-red-400",
  brand: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
