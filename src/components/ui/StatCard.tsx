import type { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { HiArrowTrendingDown, HiArrowTrendingUp } from "react-icons/hi2";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: number;
  accent?: string;
}

export function StatCard({ label, value, icon, trend, accent = "text-brand-600" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="glass-card flex items-center gap-4 p-5"
    >
      <div className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-2)]", accent)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[var(--text-secondary)]">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {trend !== undefined && (
          <p
            className={clsx(
              "mt-0.5 flex items-center gap-1 text-xs font-medium",
              trend >= 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {trend >= 0 ? <HiArrowTrendingUp size={12} /> : <HiArrowTrendingDown size={12} />}
            {Math.abs(trend)}%
          </p>
        )}
      </div>
    </motion.div>
  );
}
