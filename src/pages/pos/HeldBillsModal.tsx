import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useHeldOrders } from "../../hooks/useOrders";
import type { Order } from "../../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

interface HeldBillsModalProps {
  open: boolean;
  onClose: () => void;
  onResume: (order: Order) => void;
}

export function HeldBillsModal({ open, onClose, onResume }: HeldBillsModalProps) {
  const { data, isLoading } = useHeldOrders();

  return (
    <Modal open={open} onClose={onClose} title="Held Bills" maxWidth="max-w-md">
      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No held bills" description="Bills you hold from the POS will appear here." />
      ) : (
        <div className="space-y-2">
          {data.items.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3"
            >
              <div>
                <p className="text-sm font-medium">#{order.orderNumber}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {order.table?.name ?? order.orderType} &middot; {order.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{currency.format(order.total)}</span>
                <Button size="sm" onClick={() => onResume(order)}>
                  Resume
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
