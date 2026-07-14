import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePrinter } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { useOrders, useUpdateOrderStatus } from "../../hooks/useOrders";
import { getErrorMessage } from "../../lib/axios";
import { openReceipt } from "../../lib/receipt";
import type { Order, OrderStatus } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const statusTone: Record<OrderStatus, "neutral" | "warning" | "good" | "critical" | "brand"> = {
  PENDING: "neutral",
  PREPARING: "warning",
  READY: "brand",
  COMPLETED: "good",
  CANCELLED: "critical",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export default function Orders() {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ status: status || undefined, page, limit: 15 });
  const updateStatus = useUpdateOrderStatus();

  const columns = useMemo<ColumnDef<Order, any>[]>(
    () => [
      { header: "Order #", accessorKey: "orderNumber" },
      { header: "Type", accessorKey: "orderType" },
      { header: "Table", accessorFn: (row) => row.table?.name ?? "-" },
      { header: "Items", accessorFn: (row) => row.items.length },
      { header: "Total", cell: ({ row }) => currency.format(row.original.total) },
      {
        header: "Status",
        cell: ({ row }) => <Badge tone={statusTone[row.original.status]}>{row.original.status}</Badge>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => {
          const next = nextStatus[row.original.status];
          return (
            <div className="flex justify-end gap-2">
              {next && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatus.mutate(
                      { id: row.original.id, status: next },
                      { onError: (err) => toast.error(getErrorMessage(err)) }
                    )
                  }
                >
                  Mark {next}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  openReceipt(row.original.id).catch((err) => toast.error(getErrorMessage(err)))
                }
              >
                <HiOutlinePrinter size={15} />
              </Button>
            </div>
          );
        },
      },
    ],
    [updateStatus]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          pagination={data?.pagination}
          onPageChange={setPage}
          emptyTitle="No orders yet"
        />
      </Card>
    </div>
  );
}
