import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePlus } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { DataTable } from "../../components/ui/DataTable";
import {
  useCreateInventoryItem,
  useInventoryItems,
  useRecordStockMovement,
} from "../../hooks/useInventory";
import { getErrorMessage } from "../../lib/axios";
import type { InventoryItem } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface CreateFormValues {
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPerUnit: number;
}

interface MovementFormValues {
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "WASTE";
  quantity: number;
  reason?: string;
}

export default function Inventory() {
  const { data: items, isLoading } = useInventoryItems();
  const createItem = useCreateInventoryItem();
  const recordMovement = useRecordStockMovement();

  const [createOpen, setCreateOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);

  const createForm = useForm<CreateFormValues>();
  const movementForm = useForm<MovementFormValues>({ defaultValues: { type: "STOCK_IN" } });

  const onCreate = createForm.handleSubmit((values) => {
    createItem.mutate(values, {
      onSuccess: () => {
        toast.success("Inventory item created");
        setCreateOpen(false);
        createForm.reset();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const onMovement = movementForm.handleSubmit((values) => {
    if (!movementItem) return;
    recordMovement.mutate(
      { id: movementItem.id, ...values },
      {
        onSuccess: () => {
          toast.success("Stock updated");
          setMovementItem(null);
          movementForm.reset();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  });

  const columns = useMemo<ColumnDef<InventoryItem, any>[]>(
    () => [
      { header: "Item", accessorKey: "name" },
      { header: "Unit", accessorKey: "unit" },
      {
        header: "Quantity",
        cell: ({ row }) => (
          <span>
            {row.original.quantity} {row.original.unit}
          </span>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) =>
          row.original.quantity <= row.original.reorderLevel ? (
            <Badge tone="warning">Low Stock</Badge>
          ) : (
            <Badge tone="good">In Stock</Badge>
          ),
      },
      { header: "Cost/Unit", cell: ({ row }) => currency.format(row.original.costPerUnit) },
      { header: "Supplier", accessorFn: (row) => row.supplier?.name ?? "-" },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setMovementItem(row.original)}>
            Adjust Stock
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <HiOutlinePlus size={16} className="mr-1" /> Add Inventory Item
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={items ?? []} isLoading={isLoading} emptyTitle="No inventory items yet" />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Inventory Item" maxWidth="max-w-sm">
        <form onSubmit={onCreate} className="space-y-4">
          <Input label="Name" {...createForm.register("name", { required: true })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit" placeholder="kg / litre / unit" {...createForm.register("unit", { required: true })} />
            <Input label="Cost per Unit" type="number" step="0.01" {...createForm.register("costPerUnit")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening Quantity" type="number" step="0.01" {...createForm.register("quantity")} />
            <Input label="Reorder Level" type="number" step="0.01" {...createForm.register("reorderLevel")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createItem.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!movementItem}
        onClose={() => setMovementItem(null)}
        title={`Adjust Stock — ${movementItem?.name}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={onMovement} className="space-y-4">
          <Select label="Movement Type" {...movementForm.register("type")}>
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="WASTE">Waste</option>
          </Select>
          <Input label="Quantity" type="number" step="0.01" {...movementForm.register("quantity", { required: true })} />
          <Input label="Reason (optional)" {...movementForm.register("reason")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setMovementItem(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordMovement.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
