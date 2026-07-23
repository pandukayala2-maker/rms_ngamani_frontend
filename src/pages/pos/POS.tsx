import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineQrCode,
  HiOutlineBanknotes,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { useCategories } from "../../hooks/useCategories";
import { useMenuItems } from "../../hooks/useMenu";
import { useTables } from "../../hooks/useTables";
import { useCreateOrder } from "../../hooks/useOrders";
import { useCurrentSession, useOpenSession } from "../../hooks/usePosSessions";
import { useCartStore } from "../../store/cartStore";
import { getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { Order, OrderType } from "../../types";
import { PaymentModal } from "./PaymentModal";
import { HeldBillsModal } from "./HeldBillsModal";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function POS() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [heldOpen, setHeldOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [openCounterModalOpen, setOpenCounterModalOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: currentSession } = useCurrentSession();
  const openSession = useOpenSession();

  const { data: categories } = useCategories();
  const { data: menuData, isLoading } = useMenuItems({
    categoryId,
    search: search || undefined,
    status: "ACTIVE",
    limit: 60,
  });
  const { data: tables } = useTables();
  const createOrder = useCreateOrder();

  const cart = useCartStore();
  const { lines, orderType, tableId, discount } = cart;

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.menuItem.discountPrice ?? l.menuItem.price) * l.quantity, 0),
    [lines]
  );
  const tax = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + ((l.menuItem.discountPrice ?? l.menuItem.price) * l.quantity * l.menuItem.tax) / 100,
        0
      ),
    [lines]
  );
  const total = Math.max(0, subtotal - discount + tax);

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const item = menuData?.items.find((i) => i.itemCode.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (item) {
      cart.addItem(item);
      setBarcodeInput("");
    } else {
      toast.error("No matching item code found");
    }
  };

  const handleHold = () => {
    if (lines.length === 0) return toast.error("Cart is empty");
    createOrder.mutate(
      {
        orderType,
        tableId: orderType === "DINE_IN" ? tableId : undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
        discount,
        isHeld: true,
      },
      {
        onSuccess: () => {
          toast.success("Bill held");
          cart.clear();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleCharge = () => {
    if (lines.length === 0) return toast.error("Cart is empty");
    createOrder.mutate(
      {
        orderType,
        tableId: orderType === "DINE_IN" ? tableId : undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
        discount,
        isHeld: false,
      },
      {
        onSuccess: (order) => {
          setPendingOrder(order);
          cart.clear();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleOpenCounter = () => {
    const amount = Number(openingCash);
    if (Number.isNaN(amount) || amount < 0) return toast.error("Enter a valid opening cash amount");
    openSession.mutate(amount, {
      onSuccess: () => {
        toast.success("Counter opened");
        setOpenCounterModalOpen(false);
        setOpeningCash("");
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {!currentSession && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <HiOutlineBanknotes size={16} />
            <span>Your counter isn&apos;t open. Open it to track cash for this shift.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpenCounterModalOpen(true)}>
              Open Counter
            </Button>
            <button onClick={() => setBannerDismissed(true)} className="p-1 text-amber-600 dark:text-amber-400" aria-label="Dismiss">
              <HiOutlineXMark size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[220px_1fr_360px] gap-4 min-h-0">
      {/* Category sidebar */}
      <Card className="p-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase text-[var(--text-muted)]">Categories</p>
        <div className="space-y-1">
          <button
            onClick={() => setCategoryId(undefined)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              !categoryId ? "bg-brand-600 text-white" : "hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            All Items
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                categoryId === c.id ? "bg-brand-600 text-white" : "hover:bg-[var(--bg-surface-2)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Product grid */}
      <div className="space-y-3 overflow-hidden flex flex-col">
        <div className="flex gap-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Scan barcode / QR..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeSearch}
            className="w-52"
          />
          <Button variant="outline" size="md" title="Barcode / QR scanner input">
            <HiOutlineQrCode size={16} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
          {isLoading ? (
            <SkeletonCards count={8} />
          ) : !menuData || menuData.items.length === 0 ? (
            <EmptyState title="No items found" icon={<HiOutlineMagnifyingGlass size={32} />} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {menuData.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => cart.addItem(item)}
                  className="glass-card flex flex-col items-start gap-1 p-3 text-left hover:-translate-y-0.5 transition-transform"
                >
                  {item.image ? (
                    <img src={resolveAssetUrl(item.image)} alt="" className="mb-1 h-20 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mb-1 h-20 w-full rounded-lg bg-[var(--bg-surface-2)]" />
                  )}
                  <p className="truncate w-full text-sm font-medium">{item.name}</p>
                  <p className="text-sm font-semibold text-brand-600">
                    {currency.format(item.discountPrice ?? item.price)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <Card className="flex flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">Current Order</p>
          <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}>
            <HiOutlineClock size={14} className="mr-1" /> Held Bills
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <Select value={orderType} onChange={(e) => cart.setOrderType(e.target.value as OrderType)}>
            <option value="DINE_IN">Dine-In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </Select>
          {orderType === "DINE_IN" && (
            <Select value={tableId ?? ""} onChange={(e) => cart.setTableId(e.target.value || undefined)}>
              <option value="">Select table</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
          {lines.length === 0 ? (
            <EmptyState title="Cart is empty" description="Tap items to add them" />
          ) : (
            lines.map((line) => (
              <div key={line.menuItem.id} className="flex items-center gap-2 rounded-xl bg-[var(--bg-surface-2)] p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.menuItem.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {currency.format(line.menuItem.discountPrice ?? line.menuItem.price)} each
                  </p>
                </div>
                <button
                  onClick={() => cart.incrementLine(line.menuItem.id, -1)}
                  className="rounded-md bg-[var(--bg-surface)] p-1"
                >
                  <HiOutlineMinus size={12} />
                </button>
                <span className="w-5 text-center text-sm">{line.quantity}</span>
                <button
                  onClick={() => cart.incrementLine(line.menuItem.id, 1)}
                  className="rounded-md bg-[var(--bg-surface)] p-1"
                >
                  <HiOutlinePlus size={12} />
                </button>
                <button onClick={() => cart.removeLine(line.menuItem.id)} className="p-1 text-red-500">
                  <HiOutlineTrash size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 space-y-1 border-t border-[var(--border-color)] pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span>{currency.format(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Discount</span>
            <Input
              type="number"
              className="w-24 text-right"
              value={discount || ""}
              onChange={(e) => cart.setDiscount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Tax</span>
            <span>{currency.format(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency.format(total)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleHold} isLoading={createOrder.isPending}>
            Hold Bill
          </Button>
          <Button onClick={handleCharge} isLoading={createOrder.isPending}>
            Charge
          </Button>
        </div>
      </Card>
      </div>

      <HeldBillsModal
        open={heldOpen}
        onClose={() => setHeldOpen(false)}
        onResume={(order) => {
          setHeldOpen(false);
          setPendingOrder(order);
        }}
      />

      <PaymentModal order={pendingOrder} onClose={() => setPendingOrder(null)} />

      <Modal open={openCounterModalOpen} onClose={() => setOpenCounterModalOpen(false)} title="Open Counter" maxWidth="max-w-sm">
        <div className="space-y-4">
          <Input
            label="Opening Cash"
            type="number"
            min={0}
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenCounterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenCounter} isLoading={openSession.isPending}>
              Open Counter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
