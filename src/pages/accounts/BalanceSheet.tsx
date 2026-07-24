import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  HiOutlineScale,
  HiOutlineBuildingLibrary,
  HiOutlineArchiveBox,
  HiOutlineBanknotes,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { api } from "../../lib/axios";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCurrencyFormatter } from "../../hooks/useCurrency";
import { useSettings } from "../../hooks/useSettings";
import type { ApiResponse } from "../../types";

interface BalanceSheetReport {
  assets: { inventoryValue: number; cashOnHand: number; total: number };
  liabilities: { unpaidPurchaseOrders: number; total: number };
  equity: number;
  note: string;
}

export default function BalanceSheet() {
  const currency = useCurrencyFormatter();
  const { data: settings } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "balance-sheet"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BalanceSheetReport>>("/reports/balance-sheet");
      return res.data.data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600">
          <HiOutlineScale size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Balance Sheet</h2>
          <p className="text-sm text-[var(--text-muted)]">Assets, liabilities, and equity as of today</p>
        </div>
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
                icon={HiOutlineArchiveBox}
                iconClass="bg-emerald-500/15 text-emerald-500"
                label="Inventory Value"
                value={currency.format(data.assets.inventoryValue)}
                valueClass="text-emerald-500"
              />
              <LineRow
                icon={HiOutlineBanknotes}
                iconClass="bg-emerald-500/15 text-emerald-500"
                label="Cash on Hand"
                value={currency.format(data.assets.cashOnHand)}
                valueClass="text-emerald-500"
              />
              <LineRow
                icon={HiOutlineExclamationCircle}
                iconClass="bg-red-500/15 text-red-500"
                label="Unpaid Purchase Orders"
                value={currency.format(data.liabilities.total)}
                valueClass="text-red-500"
              />
            </div>
            <div className="m-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                  <HiOutlineBuildingLibrary size={18} />
                </div>
                <span className="text-base font-semibold">Total Assets</span>
              </div>
              <span className="text-lg font-bold text-emerald-500">{currency.format(data.assets.total)}</span>
            </div>
            <div className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-xl bg-sky-500/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-500">
                  <HiOutlineScale size={18} />
                </div>
                <span className="text-base font-semibold">Equity</span>
              </div>
              <span className="text-lg font-bold text-sky-500">{currency.format(data.equity)}</span>
            </div>
            <p className="px-5 pb-4 text-xs text-[var(--text-muted)]">{data.note}</p>
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
}: {
  icon: React.ComponentType<{ size?: number }>;
  iconClass?: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-4 px-5 py-4")}>
      <div className="flex items-center gap-3">
        <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={clsx("text-sm font-semibold", valueClass)}>{value}</span>
    </div>
  );
}
