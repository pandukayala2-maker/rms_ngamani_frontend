import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { RoleManagementTabs } from "./RoleManagement";
import { useCreateStaff, useDeleteStaff, useStaff, useUpdateStaff } from "../../hooks/useStaff";
import { useDepartments, useDesignations, useShifts } from "../../hooks/useHr";
import { getErrorMessage } from "../../lib/axios";
import type { Role, User } from "../../types";

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  employeeCode?: string;
  departmentId?: string;
  designationId?: string;
  shiftId?: string;
}

export default function Employees() {
  const { data: staff, isLoading } = useStaff();
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const { data: shifts } = useShifts();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { role: "CASHIER" } });

  useEffect(() => {
    if (modalOpen) {
      reset(
        editing
          ? {
              name: editing.name,
              email: editing.email,
              password: "",
              role: editing.role,
              phone: editing.phone ?? "",
              employeeCode: editing.employeeCode ?? "",
              departmentId: editing.departmentId ?? "",
              designationId: editing.designationId ?? "",
              shiftId: editing.shiftId ?? "",
            }
          : { role: "CASHIER" }
      );
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    if (editing) {
      const { password: _password, email: _email, ...rest } = values;
      updateStaff.mutate(
        { id: editing.id, ...rest },
        {
          onSuccess: () => {
            toast.success("Employee updated");
            setModalOpen(false);
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
      return;
    }
    createStaff.mutate(values, {
      onSuccess: () => {
        toast.success("Employee added");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      { header: "Role", cell: ({ row }) => <Badge tone="brand">{row.original.role}</Badge> },
      { header: "Department", cell: ({ row }) => row.original.department?.name ?? "—" },
      { header: "Designation", cell: ({ row }) => row.original.designation?.name ?? "—" },
      { header: "Shift", cell: ({ row }) => row.original.shift?.name ?? "—" },
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
              onClick={() => updateStaff.mutate({ id: row.original.id, isActive: !row.original.isActive })}
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
    [updateStaff]
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
          <HiOutlinePlus size={16} className="mr-1" /> Add Employee
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={staff ?? []} isLoading={isLoading} emptyTitle="No employees yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Employee" : "Add Employee"} maxWidth="max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Email" type="email" disabled={!!editing} {...register("email", { required: true })} />
          {!editing && <Input label="Password" type="password" {...register("password", { required: true, minLength: 8 })} />}
          <Select label="Role" {...register("role")}>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
          </Select>
          <Input label="Phone (optional)" {...register("phone")} />
          <Input label="Employee Code (optional)" {...register("employeeCode")} />
          <Select label="Department (optional)" {...register("departmentId")}>
            <option value="">None</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select label="Designation (optional)" {...register("designationId")}>
            <option value="">None</option>
            {designations?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select label="Shift (optional)" {...register("shiftId")}>
            <option value="">None</option>
            {shifts?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime}–{s.endTime})
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createStaff.isPending || updateStaff.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove employee"
        description={`Remove "${deleteTarget?.name}"? They will lose access immediately.`}
        danger
        confirmLabel="Remove"
        isLoading={deleteStaff.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteStaff.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Employee removed");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
