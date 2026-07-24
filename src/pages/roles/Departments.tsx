import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { DataTable } from "../../components/ui/DataTable";
import { useCreateDepartment, useDepartments, useUpdateDepartment } from "../../hooks/useHr";
import { getErrorMessage } from "../../lib/axios";
import type { Department } from "../../types";

interface FormValues {
  name: string;
}

export default function Departments() {
  const { data: departments, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (modalOpen) reset(editing ? { name: editing.name } : { name: "" });
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = editing ? updateDepartment : createDepartment;
    mutation.mutate(editing ? { id: editing.id, ...values } : (values as never), {
      onSuccess: () => {
        toast.success(editing ? "Department updated" : "Department created");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Department, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
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
          </div>
        ),
      },
    ],
    []
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
          <HiOutlinePlus size={16} className="mr-1" /> Add Department
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={departments ?? []} isLoading={isLoading} emptyTitle="No departments yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Department" : "Add Department"} maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createDepartment.isPending || updateDepartment.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
