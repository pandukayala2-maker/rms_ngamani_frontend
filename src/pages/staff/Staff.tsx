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
import { useCreateStaff, useStaff, useUpdateStaff } from "../../hooks/useStaff";
import { getErrorMessage } from "../../lib/axios";
import type { Role, User } from "../../types";

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}

export default function Staff() {
  const { data: staff, isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { role: "CASHIER" } });

  const onSubmit = handleSubmit((values) => {
    createStaff.mutate(values, {
      onSuccess: () => {
        toast.success("Staff member added");
        setModalOpen(false);
        reset();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      { header: "Role", cell: ({ row }) => <Badge tone="brand">{row.original.role}</Badge> },
      {
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.isActive ? "good" : "neutral"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStaff.mutate({ id: row.original.id, isActive: !row.original.isActive })}
          >
            {row.original.isActive ? "Deactivate" : "Activate"}
          </Button>
        ),
      },
    ],
    [updateStaff]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus size={16} className="mr-1" /> Add Staff
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={staff ?? []} isLoading={isLoading} emptyTitle="No staff members yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member" maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Email" type="email" {...register("email", { required: true })} />
          <Input label="Password" type="password" {...register("password", { required: true, minLength: 8 })} />
          <Select label="Role" {...register("role")}>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
          </Select>
          <Input label="Phone (optional)" {...register("phone")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createStaff.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
