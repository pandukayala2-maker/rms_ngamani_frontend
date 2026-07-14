import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { Button } from "./Button";
import { SkeletonRows } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import type { Pagination } from "../../types";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  emptyTitle = "No records found",
  emptyDescription,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <SkeletonRows rows={6} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[var(--border-color)]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-surface-2)]/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <HiChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <HiChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
