import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineWallet,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import { api } from "../../lib/axios";
import { Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCurrencyFormatter } from "../../hooks/useCurrency";
import { useSettings } from "../../hooks/useSettings";
import type { ApiResponse } from "../../types";

interface ProfitLossReport {
  revenue: number;
  estimatedCost: number;
  totalExpenses: number;
  expensesByCategory: { category: string; total: number }[];
  profit: number;
}

type Period = "today" | "week" | "month" | "all";

function periodRange(period: Period): { from?: string; to?: string } {
  if (period === "all") return {};
  const now = new Date();
  const from = new Date(now);
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = (from.getDay() + 6) % 7; // Monday = 0
    from.setDate(from.getDate() - day);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function ProfitLoss() {
  const currency = useCurrencyFormatter();
  const { data: settings } = useSettings();
  const [period, setPeriod] = useState<Period>("today");
  const { from, to } = useMemo(() => periodRange(period), [period]);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "profit-loss", period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await api.get<ApiResponse<ProfitLossReport>>(`/reports/profit-loss?${params.toString()}`);
      return res.data.data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600">
            <HiOutlineArrowTrendingUp size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Profit &amp; Loss Summary</h2>
            <p className="text-sm text-[var(--text-muted)]">Overview of your business performance</p>
          </div>
        </div>
        <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-40">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div>
            <div className="flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <span>Particulars</span>
              <span>Amount ({settings?.currency ?? "—"})</span>
            </div>
            <div className="divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
              <LineRow
                icon={HiOutlineWallet}
                iconClass="bg-emerald-500/15 text-emerald-500"
                label="Revenue"
                value={currency.format(data.revenue)}
                valueClass="text-emerald-500"
              />
              <LineRow
                icon={HiOutlineShoppingBag}
                iconClass="bg-sky-500/15 text-sky-500"
                label="Estimated Cost"
                value={currency.format(data.estimatedCost)}
                valueClass="text-sky-500"
              />
              <LineRow
                icon={HiOutlineArrowTrendingDown}
                iconClass="bg-red-500/15 text-red-500"
                label="Expenses"
                value={currency.format(data.totalExpenses)}
                valueClass="text-red-500"
              />
              {data.expensesByCategory.map((e) => (
                <LineRow key={e.category} label={e.category} value={currency.format(e.total)} indent />
              ))}
            </div>
            <div className="m-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                  <HiOutlineArrowTrendingUp size={18} />
                </div>
                <span className="text-base font-semibold">Profit</span>
              </div>
              <span className="text-lg font-bold text-emerald-500">{currency.format(data.profit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LineRow({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  indent,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  iconClass?: string;
  label: string;
  value: string;
  valueClass?: string;
  indent?: boolean;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-4 px-5 py-4", indent && "py-3")}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
            <Icon size={18} />
          </div>
        ) : (
          <div className="w-10 shrink-0" />
        )}
        <span className={clsx("text-sm", indent ? "text-[var(--text-muted)]" : "font-medium")}>{label}</span>
      </div>
      <span className={clsx("text-sm font-semibold", valueClass)}>{value}</span>
    </div>
  );
}
