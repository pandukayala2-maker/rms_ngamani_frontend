import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import type { ApiResponse } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface ProfitLossReport {
  revenue: number;
  estimatedCost: number;
  totalExpenses: number;
  expensesByCategory: { category: string; total: number }[];
  profit: number;
}

export default function ProfitLoss() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "profit-loss"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProfitLossReport>>("/reports/profit-loss");
      return res.data.data;
    },
  });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Profit &amp; Loss</CardTitle>
        </CardHeader>
        {isLoading || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-1 text-sm">
            <Row label="Revenue" value={currency.format(data.revenue)} />
            <Row label="Estimated Cost" value={currency.format(data.estimatedCost)} />
            <Row label="Expenses" value={currency.format(data.totalExpenses)} />
            {data.expensesByCategory.map((e) => (
              <Row key={e.category} label={`  ${e.category}`} value={currency.format(e.total)} />
            ))}
            <Row label="Profit" value={currency.format(data.profit)} bold />
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
