import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch } from "../../hooks/useBranches";
import { getErrorMessage } from "../../lib/axios";
import type { Branch } from "../../types";

interface FormValues {
  name: string;
  address?: string;
  contact?: string;
  gstVat?: string;
  currency: string;
  language: string;
}

export default function Branches() {
  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { currency: "INR", language: "en" } });

  useEffect(() => {
    if (modalOpen) {
      reset(
        editing
          ? {
              name: editing.name,
              address: editing.address ?? "",
              contact: editing.contact ?? "",
              gstVat: editing.gstVat ?? "",
              currency: editing.currency,
              language: editing.language,
            }
          : { name: "", address: "", contact: "", gstVat: "", currency: "INR", language: "en" }
      );
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = editing ? updateBranch : createBranch;
    mutation.mutate(editing ? { id: editing.id, ...values } : (values as never), {
      onSuccess: () => {
        toast.success(editing ? "Branch updated" : "Branch created");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Branch, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Address", cell: ({ row }) => row.original.address ?? "—" },
      { header: "Contact", cell: ({ row }) => row.original.contact ?? "—" },
      { header: "Currency", accessorKey: "currency" },
      {
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.isActive ? "good" : "neutral"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBranch.mutate({ id: row.original.id, isActive: !row.original.isActive })}
            >
              {row.original.isActive ? "Deactivate" : "Activate"}
            </Button>
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
    [updateBranch]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <HiOutlinePlus size={16} className="mr-1" /> Add Branch
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={branches ?? []} isLoading={isLoading} emptyTitle="No branches yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Branch" : "Add Branch"} maxWidth="max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Address (optional)" {...register("address")} />
          <Input label="Contact (optional)" {...register("contact")} />
          <Input label="GST/VAT (optional)" {...register("gstVat")} />
          <Input label="Currency" {...register("currency", { required: true })} />
          <Input label="Language" {...register("language", { required: true })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createBranch.isPending || updateBranch.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete branch"
        description={`Delete "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Delete"
        isLoading={deleteBranch.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteBranch.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Branch deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
