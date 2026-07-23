import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { RoleManagementTabs } from "./RoleManagement";
import { useCreateShift, useDeleteShift, useShifts, useUpdateShift } from "../../hooks/useHr";
import { getErrorMessage } from "../../lib/axios";
import type { Shift } from "../../types";

interface FormValues {
  name: string;
  startTime: string;
  endTime: string;
}

export default function Shifts() {
  const { data: shifts, isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (modalOpen) {
      reset(editing ? { name: editing.name, startTime: editing.startTime, endTime: editing.endTime } : { name: "", startTime: "09:00", endTime: "17:00" });
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = editing ? updateShift : createShift;
    mutation.mutate(editing ? { id: editing.id, ...values } : (values as never), {
      onSuccess: () => {
        toast.success(editing ? "Shift updated" : "Shift created");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Shift, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Start", accessorKey: "startTime" },
      { header: "End", accessorKey: "endTime" },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(row.original);
                setModalOpen(true);
              }}
            >
              <HiOutlinePencil size={15} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)}>
              <HiOutlineTrash size={15} className="text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <RoleManagementTabs />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <HiOutlinePlus size={16} className="mr-1" /> Add Shift
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={shifts ?? []} isLoading={isLoading} emptyTitle="No shifts yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Shift" : "Add Shift"} maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" placeholder="Morning Shift" {...register("name", { required: true })} />
          <Input label="Start Time" type="time" {...register("startTime", { required: true })} />
          <Input label="End Time" type="time" {...register("endTime", { required: true })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createShift.isPending || updateShift.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete shift"
        description={`Delete "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Delete"
        isLoading={deleteShift.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteShift.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Shift deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
