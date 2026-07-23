import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { RoleManagementTabs } from "./RoleManagement";
import {
  useCreateDesignation,
  useDeleteDesignation,
  useDepartments,
  useDesignations,
  useUpdateDesignation,
} from "../../hooks/useHr";
import { getErrorMessage } from "../../lib/axios";
import type { Designation } from "../../types";

interface FormValues {
  name: string;
  departmentId?: string;
}

export default function Designations() {
  const { data: designations, isLoading } = useDesignations();
  const { data: departments } = useDepartments();
  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const deleteDesignation = useDeleteDesignation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (modalOpen) {
      reset(editing ? { name: editing.name, departmentId: editing.departmentId ?? "" } : { name: "", departmentId: "" });
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const payload = { name: values.name, departmentId: values.departmentId || undefined };
    const mutation = editing ? updateDesignation : createDesignation;
    mutation.mutate(editing ? { id: editing.id, ...payload } : (payload as never), {
      onSuccess: () => {
        toast.success(editing ? "Designation updated" : "Designation created");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Designation, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
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
          <HiOutlinePlus size={16} className="mr-1" /> Add Designation
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={designations ?? []} isLoading={isLoading} emptyTitle="No designations yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Designation" : "Add Designation"} maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Select label="Department (optional)" {...register("departmentId")}>
            <option value="">None</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createDesignation.isPending || updateDesignation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete designation"
        description={`Delete "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Delete"
        isLoading={deleteDesignation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteDesignation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Designation deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
