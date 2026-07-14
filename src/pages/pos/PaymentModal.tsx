import { useState } from "react";
import { toast } from "sonner";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePrinter } from "react-icons/hi2";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { useAddPayments } from "../../hooks/useOrders";
import { getErrorMessage } from "../../lib/axios";
import { openReceipt } from "../../lib/receipt";
import type { Order, PaymentMethod } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const methods: PaymentMethod[] = ["CASH", "CARD", "UPI", "WALLET"];

interface SplitLine {
  method: PaymentMethod;
  amount: number;
}

export function PaymentModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const addPayments = useAddPayments();
  const [splits, setSplits] = useState<SplitLine[]>([{ method: "CASH", amount: 0 }]);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!order) return null;

  const alreadyPaid = order.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - alreadyPaid);
  const enteredTotal = splits.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const updateSplit = (i: number, patch: Partial<SplitLine>) =>
    setSplits((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const handleSubmit = () => {
    const payments = splits.filter((s) => s.amount > 0);
    if (payments.length === 0) {
      toast.error("Enter at least one payment amount");
      return;
    }
    addPayments.mutate(
      { id: order.id, payments },
      {
        onSuccess: (updated) => {
          toast.success(updated.status === "COMPLETED" ? "Payment complete" : "Partial payment recorded");
          setCompletedOrder(updated);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const close = () => {
    setSplits([{ method: "CASH", amount: 0 }]);
    setCompletedOrder(null);
    onClose();
  };

  if (completedOrder?.status === "COMPLETED") {
    return (
      <Modal open onClose={close} title="Payment Successful" maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <p className="text-3xl">✅</p>
          <p className="font-medium">Order #{completedOrder.orderNumber} completed</p>
          <p className="text-2xl font-bold">{currency.format(completedOrder.total)}</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                openReceipt(completedOrder.id).catch((err) => toast.error(getErrorMessage(err)))
              }
            >
              <HiOutlinePrinter size={16} className="mr-1" /> Print Receipt
            </Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={close} title={`Payment — Order #${order.orderNumber}`} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="rounded-xl bg-[var(--bg-surface-2)] p-3 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-semibold">{currency.format(order.total)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Already paid</span>
              <span>{currency.format(alreadyPaid)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Remaining</span>
            <span>{currency.format(remaining)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {splits.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                className="w-32"
                value={line.method}
                onChange={(e) => updateSplit(i, { method: e.target.value as PaymentMethod })}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                value={line.amount || ""}
                onChange={(e) => updateSplit(i, { amount: Number(e.target.value) })}
                placeholder="Amount"
              />
              {splits.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setSplits((prev) => prev.filter((_, idx) => idx !== i))}>
                  <HiOutlineTrash size={14} className="text-red-500" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setSplits((prev) => [...prev, { method: "CARD", amount: 0 }])}>
              <HiOutlinePlus size={14} className="mr-1" /> Split Payment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSplits([{ method: splits[0]?.method ?? "CASH", amount: remaining }])}
            >
              Fill Remaining
            </Button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)]">Entered: {currency.format(enteredTotal)}</p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={addPayments.isPending}>
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
