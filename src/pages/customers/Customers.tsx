import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { HiOutlinePlus } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { DataTable } from "../../components/ui/DataTable";
import { useAdjustLoyalty, useCreateCustomer, useCustomers } from "../../hooks/useCustomers";
import { getErrorMessage } from "../../lib/axios";
import type { Customer } from "../../types";

const membershipTone: Record<Customer["membershipLevel"], "neutral" | "brand" | "warning" | "good"> = {
  BRONZE: "neutral",
  SILVER: "brand",
  GOLD: "warning",
  PLATINUM: "good",
};

interface FormValues {
  name: string;
  email?: string;
  phone: string;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers(search || undefined);
  const createCustomer = useCreateCustomer();
  const adjustLoyalty = useAdjustLoyalty();
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    createCustomer.mutate(values, {
      onSuccess: () => {
        toast.success("Customer added");
        setModalOpen(false);
        reset();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  const columns = useMemo<ColumnDef<Customer, any>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Phone", accessorKey: "phone" },
      { header: "Email", accessorFn: (row) => row.email ?? "-" },
      { header: "Loyalty Points", accessorKey: "loyaltyPoints" },
      {
        header: "Membership",
        cell: ({ row }) => <Badge tone={membershipTone[row.original.membershipLevel]}>{row.original.membershipLevel}</Badge>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="outline" size="sm" onClick={() => adjustLoyalty.mutate({ id: row.original.id, points: 50 })}>
              +50 pts
            </Button>
          </div>
        ),
      },
    ],
    [adjustLoyalty]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus size={16} className="mr-1" /> Add Customer
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} data={customers ?? []} isLoading={isLoading} emptyTitle="No customers yet" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer" maxWidth="max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Phone" {...register("phone", { required: true })} />
          <Input label="Email (optional)" {...register("email")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCustomer.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
