import { useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/DataTable";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import {
  useDeleteMenuItem,
  useDuplicateMenuItem,
  useMenuItems,
  type MenuQuery,
} from "../../hooks/useMenu";
import { useCategories } from "../../hooks/useCategories";
import { api, getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { MenuItem, MenuItemStatus } from "../../types";
import { MenuForm } from "./MenuForm";
import { MenuTabs } from "./MenuTabs";

const statusTone: Record<MenuItemStatus, "good" | "neutral" | "warning" | "critical"> = {
  ACTIVE: "good",
  HIDDEN: "neutral",
  OUT_OF_STOCK: "warning",
  DISABLED: "critical",
};

export default function MenuList() {
  const [query, setQuery] = useState<MenuQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useMenuItems(query);
  const { data: categories } = useCategories();
  const deleteItem = useDeleteMenuItem();
  const duplicateItem = useDuplicateMenuItem();

  const columns = useMemo<ColumnDef<MenuItem, any>[]>(
    () => [
      {
        header: "Item",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.image ? (
              <img src={resolveAssetUrl(row.original.image)} alt="" className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--bg-surface-2)]" />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{row.original.itemCode}</p>
            </div>
          </div>
        ),
      },
      { header: "Category", accessorFn: (row) => row.category?.name ?? "-" },
      {
        header: "Price",
        cell: ({ row }) => (
          <div>
            {row.original.discountPrice ? (
              <>
                <span className="font-semibold">₹{row.original.discountPrice}</span>{" "}
                <span className="text-xs text-[var(--text-muted)] line-through">₹{row.original.price}</span>
              </>
            ) : (
              <span className="font-semibold">₹{row.original.price}</span>
            )}
          </div>
        ),
      },
      {
        header: "Type",
        cell: ({ row }) => (
          <span
            className={`inline-block h-3 w-3 rounded-sm border-2 ${
              row.original.isVeg ? "border-green-600" : "border-red-600"
            }`}
          >
            <span className={`block h-1 w-1 m-auto rounded-full ${row.original.isVeg ? "bg-green-600" : "bg-red-600"}`} />
          </span>
        ),
      },
      {
        header: "Flags",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isFeatured && <Badge tone="brand">Featured</Badge>}
            {row.original.isBestseller && <Badge tone="warning">Bestseller</Badge>}
            {row.original.showOnQr ? <Badge tone="good">On QR</Badge> : <Badge tone="neutral">Off QR</Badge>}
          </div>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) => <Badge tone={statusTone[row.original.status]}>{row.original.status.replace("_", " ")}</Badge>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => duplicateItem.mutate(row.original.id)} title="Duplicate">
              <HiOutlineDocumentDuplicate size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingItem(row.original);
                setFormOpen(true);
              }}
              title="Edit"
            >
              <HiOutlinePencil size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)} title="Delete">
              <HiOutlineTrash size={16} className="text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [duplicateItem]
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      await api.post("/menu-items/import", { items });
      toast.success("Menu items imported successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    const res = await api.get("/menu-items/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu-export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <MenuTabs />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setQuery((q) => ({ ...q, search, page: 1 }));
            }}
            className="w-56"
          />
          <Button variant="outline" size="sm" onClick={() => setQuery((q) => ({ ...q, search, page: 1 }))}>
            <HiOutlineMagnifyingGlass size={16} />
          </Button>
          <Select
            className="w-44"
            value={query.categoryId ?? ""}
            onChange={(e) => setQuery((q) => ({ ...q, categoryId: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            className="w-40"
            value={query.status ?? ""}
            onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="HIDDEN">Hidden</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <HiOutlineArrowUpTray size={16} className="mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <HiOutlineArrowDownTray size={16} className="mr-1" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            <HiOutlinePlus size={16} className="mr-1" /> Add Item
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          pagination={data?.pagination}
          onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
          emptyTitle="No menu items yet"
          emptyDescription="Add your first menu item to get started."
        />
      </Card>

      <MenuForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editingItem}
        categories={categories ?? []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete menu item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        danger
        confirmLabel="Delete"
        isLoading={deleteItem.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteItem.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Menu item deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
