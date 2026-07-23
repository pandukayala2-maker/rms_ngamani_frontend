import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense, type Expense } from "../../hooks/useExpenses";
import { getErrorMessage } from "../../lib/axios";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

interface FormValues {
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export default function Expenses() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (modalOpen) {
      reset(
        editing
          ? { category: editing.category, amount: editing.amount, date: editing.date.slice(0, 10), notes: editing.notes ?? "" }
          : { category: "", amount: 0, date: new Date().toISOString().slice(0, 10), notes: "" }
      );
    }
  }, [modalOpen, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    const mutation = editing ? updateExpense : createExpense;
    mutation.mutate(editing ? { id: editing.id, ...values } : (values as never), {
      onSuccess: () => {
        toast.success(editing ? "Expense updated" : "Expense recorded");
        setModalOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Expense, any>[]>(
    () => [
      { header: "Date", cell: ({ row }) => dateFmt.format(new Date(row.original.date)) },
      { header: "Category", accessorKey: "category" },
      { header: "Amount", cell: ({ row }) => currency.format(row.original.amount) },
      { header: "Notes", cell: ({ row }) => row.original.notes ?? "—" },
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
          <HiOutlinePlus size={16} className="mr-1" /> Add Expense
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={expenses ?? []} isLoading={isLoading} emptyTitle="No expenses recorded yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"} maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Category" placeholder="Rent, Utilities, Salaries..." {...register("category", { required: true })} />
          <Input label="Amount" type="number" min={0} step="0.01" {...register("amount", { required: true, min: 0 })} />
          <Input label="Date" type="date" {...register("date", { required: true })} />
          <Textarea label="Notes (optional)" {...register("notes")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createExpense.isPending || updateExpense.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete expense"
        description={`Delete this ${deleteTarget?.category} expense of ${deleteTarget ? currency.format(deleteTarget.amount) : ""}?`}
        danger
        confirmLabel="Delete"
        isLoading={deleteExpense.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteExpense.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Expense deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
