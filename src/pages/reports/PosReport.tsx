import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useSessionHistory, useSessionReport, type PosSession } from "../../hooks/usePosSessions";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function PosReport() {
  const { data: sessions, isLoading } = useSessionHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: report, isLoading: reportLoading } = useSessionReport(selectedId);

  const columns = useMemo<ColumnDef<PosSession, any>[]>(
    () => [
      { header: "Cashier", cell: ({ row }) => row.original.user?.name ?? "—" },
      { header: "Opened", cell: ({ row }) => dateTime.format(new Date(row.original.openedAt)) },
      { header: "Opening Cash", cell: ({ row }) => currency.format(row.original.openingCash) },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "OPEN" ? "warning" : "good"}>{row.original.status}</Badge>
        ),
      },
      {
        header: "Closing Cash",
        cell: ({ row }) => (row.original.closingCash != null ? currency.format(row.original.closingCash) : "—"),
      },
      {
        header: "Variance",
        cell: ({ row }) => {
          const { closingCash, expectedCash } = row.original;
          if (closingCash == null || expectedCash == null) return "—";
          const variance = closingCash - expectedCash;
          return (
            <span className={variance === 0 ? "" : variance > 0 ? "text-emerald-500" : "text-red-500"}>
              {variance === 0 ? "Matched" : currency.format(variance)}
            </span>
          );
        },
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setSelectedId(row.original.id)}>
            View
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <Card>
        <DataTable columns={columns} data={sessions ?? []} isLoading={isLoading} emptyTitle="No counter sessions yet" />
      </Card>

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Session Report" maxWidth="max-w-md">
        {reportLoading || !report ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <Row label="Cashier" value={report.session.user?.name ?? "—"} />
              <Row label="Opened" value={dateTime.format(new Date(report.session.openedAt))} />
              <Row label="Opening Cash" value={currency.format(report.session.openingCash)} />
              {report.session.closedAt && <Row label="Closed" value={dateTime.format(new Date(report.session.closedAt))} />}
              {report.session.closingCash != null && <Row label="Closing Cash" value={currency.format(report.session.closingCash)} />}
              {report.session.expectedCash != null && <Row label="Expected Cash" value={currency.format(report.session.expectedCash)} />}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales During Session</CardTitle>
              </CardHeader>
              <div className="space-y-1 text-sm">
                <Row label="Orders" value={String(report.orderCount)} />
                <Row label="Total Sales" value={currency.format(report.totalSales)} bold />
              </div>
            </Card>

            {report.paymentsByMethod.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>By Payment Method</CardTitle>
                </CardHeader>
                <div className="space-y-1 text-sm">
                  {report.paymentsByMethod.map((row) => (
                    <Row key={row.method} label={`${row.method} (${row.count})`} value={currency.format(row.total)} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
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
