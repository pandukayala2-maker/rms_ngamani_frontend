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
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from "../../hooks/useAccounts";
import { getErrorMessage } from "../../lib/axios";
import type { Account, AccountType } from "../../types";

const typeTone: Record<AccountType, "good" | "critical" | "warning" | "brand" | "neutral"> = {
  ASSET: "good",
  LIABILITY: "critical",
  EQUITY: "brand",
  REVENUE: "good",
  EXPENSE: "warning",
};

interface FormValues {
  name: string;
  code?: string;
  type: AccountType;
  parentId?: string;
}

export default function ChartOfAccounts() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { type: "EXPENSE" } });

  useEffect(() => {
    if (modalOpen) {
      reset(
        editing
          ? { name: editing.name, code: editing.code ?? "", type: editing.type, parentId: editing.parentId ?? "" }
          : { name: "", code: "", type: "EXPENSE", parentId: "" }
      );
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const payload = { ...values, code: values.code || undefined, parentId: values.parentId || undefined };
    const mutation = editing ? updateAccount : createAccount;
    mutation.mutate(editing ? { id: editing.id, ...payload } : (payload as never), {
      onSuccess: () => {
        toast.success(editing ? "Account updated" : "Account created");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Account, any>[]>(
    () => [
      { header: "Code", cell: ({ row }) => row.original.code ?? "—" },
      { header: "Name", accessorKey: "name" },
      { header: "Type", cell: ({ row }) => <Badge tone={typeTone[row.original.type]}>{row.original.type}</Badge> },
      { header: "Parent", cell: ({ row }) => row.original.parent?.name ?? "—" },
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
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <HiOutlinePlus size={16} className="mr-1" /> Add Account
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={accounts ?? []} isLoading={isLoading} emptyTitle="No accounts yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Account" : "Add Account"} maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Code (optional)" {...register("code")} />
          <Select label="Type" {...register("type")}>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
          </Select>
          <Select label="Parent Account (optional)" {...register("parentId")}>
            <option value="">None</option>
            {accounts
              ?.filter((a) => a.id !== editing?.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createAccount.isPending || updateAccount.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete account"
        description={`Delete "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Delete"
        isLoading={deleteAccount.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteAccount.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Account deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
