import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import type { ApiResponse } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface BalanceSheetReport {
  assets: { inventoryValue: number; cashOnHand: number; total: number };
  liabilities: { unpaidPurchaseOrders: number; total: number };
  equity: number;
  note: string;
}

export default function BalanceSheet() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "balance-sheet"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BalanceSheetReport>>("/reports/balance-sheet");
      return res.data.data;
    },
  });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        {isLoading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-1 text-sm">
            <Row label="Inventory Value" value={currency.format(data.assets.inventoryValue)} />
            <Row label="Cash on Hand" value={currency.format(data.assets.cashOnHand)} />
            <Row label="Total Assets" value={currency.format(data.assets.total)} bold />
            <Row label="Unpaid Purchase Orders" value={currency.format(data.liabilities.total)} />
            <Row label="Equity" value={currency.format(data.equity)} bold />
            <p className="pt-1 text-xs text-[var(--text-muted)]">{data.note}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
