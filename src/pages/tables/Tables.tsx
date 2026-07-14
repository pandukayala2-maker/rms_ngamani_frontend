import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HiOutlinePlus } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useCreateTable, useTables, useUpdateTable } from "../../hooks/useTables";
import { getErrorMessage } from "../../lib/axios";
import type { TableStatus } from "../../types";

const statusTone: Record<TableStatus, "good" | "critical" | "warning"> = {
  AVAILABLE: "good",
  OCCUPIED: "critical",
  RESERVED: "warning",
};

interface FormValues {
  code: string;
  name: string;
  capacity: number;
}

export default function Tables() {
  const { data: tables, isLoading } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    createTable.mutate(values, {
      onSuccess: () => {
        toast.success("Table created");
        setModalOpen(false);
        reset();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus size={16} className="mr-1" /> Add Table
        </Button>
      </div>

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : !tables || tables.length === 0 ? (
        <EmptyState title="No tables yet" description="Add tables to manage dine-in seating and QR codes." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="text-center">
              <p className="text-lg font-semibold">{table.name}</p>
              <p className="text-xs text-[var(--text-muted)]">Seats {table.capacity}</p>
              <div className="my-2">
                <Badge tone={statusTone[table.status]}>{table.status}</Badge>
              </div>
              <select
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
                value={table.status}
                onChange={(e) =>
                  updateTable.mutate({ id: table.id, status: e.target.value as TableStatus })
                }
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Table" maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Table Code" placeholder="T5" {...register("code", { required: true })} />
          <Input label="Table Name" placeholder="Table 5" {...register("name", { required: true })} />
          <Input label="Capacity" type="number" defaultValue={2} {...register("capacity")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTable.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
