import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import type { ApiResponse } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface SalesReport {
  orderCount: number;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
}

interface ProfitLoss {
  revenue: number;
  estimatedCost: number;
  profit: number;
}

interface CashierReportRow {
  cashier: string;
  orders: number;
  total: number;
}

interface ProductReportRow {
  name: string;
  quantitySold: number;
  revenue: number;
}

function useReport<T>(path: string) {
  return useQuery({
    queryKey: ["reports", path],
    queryFn: async () => {
      const res = await api.get<ApiResponse<T>>(`/reports/${path}`);
      return res.data.data;
    },
  });
}

export default function Reports() {
  const { data: sales, isLoading: salesLoading } = useReport<SalesReport>("sales");
  const { data: pnl, isLoading: pnlLoading } = useReport<ProfitLoss>("profit-loss");
  const { data: cashiers, isLoading: cashiersLoading } = useReport<CashierReportRow[]>("cashier");
  const { data: products, isLoading: productsLoading } = useReport<ProductReportRow[]>("product");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          {salesLoading || !sales ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-1 text-sm">
              <Row label="Orders" value={String(sales.orderCount)} />
              <Row label="Total Sales" value={currency.format(sales.totalSales)} />
              <Row label="Total Tax" value={currency.format(sales.totalTax)} />
              <Row label="Total Discount" value={currency.format(sales.totalDiscount)} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit &amp; Loss</CardTitle>
          </CardHeader>
          {pnlLoading || !pnl ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-1 text-sm">
              <Row label="Revenue" value={currency.format(pnl.revenue)} />
              <Row label="Estimated Cost" value={currency.format(pnl.estimatedCost)} />
              <Row label="Profit" value={currency.format(pnl.profit)} bold />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cashier Report</CardTitle>
          </CardHeader>
          {cashiersLoading || !cashiers ? (
            <Skeleton className="h-24 w-full" />
          ) : cashiers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No completed orders yet</p>
          ) : (
            <div className="space-y-1 text-sm">
              {cashiers.map((c) => (
                <Row key={c.cashier} label={`${c.cashier} (${c.orders})`} value={currency.format(c.total)} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        {productsLoading || !products ? (
          <Skeleton className="h-48 w-full" />
        ) : products.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No completed sales yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-xs uppercase text-[var(--text-muted)]">
                <th className="py-2">Product</th>
                <th className="py-2">Qty Sold</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.quantitySold}</td>
                  <td className="py-2 text-right">{currency.format(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
