import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { api } from "../../lib/axios";
import type { ApiResponse } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface ProductReportRow {
  name: string;
  quantitySold: number;
  revenue: number;
}

export default function ProductPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "product"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProductReportRow[]>>("/reports/product");
      return res.data.data;
    },
  });

  const columns = useMemo<ColumnDef<ProductReportRow, any>[]>(
    () => [
      { header: "Product", accessorKey: "name" },
      { header: "Qty Sold", accessorKey: "quantitySold" },
      { header: "Revenue", cell: ({ row }) => currency.format(row.original.revenue) },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <Card>
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} emptyTitle="No completed sales yet" />
      </Card>
    </div>
  );
}
