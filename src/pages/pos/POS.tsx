import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineQrCode,
} from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useCategories } from "../../hooks/useCategories";
import { useMenuItems } from "../../hooks/useMenu";
import { useTables } from "../../hooks/useTables";
import { useCreateOrder } from "../../hooks/useOrders";
import { useCurrentSession, useOpenSession, useCloseSession } from "../../hooks/usePosSessions";
import { useCurrencyFormatter } from "../../hooks/useCurrency";
import { useCartStore } from "../../store/cartStore";
import { getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { Order, OrderType } from "../../types";
import { PaymentModal } from "./PaymentModal";
import { HeldBillsModal } from "./HeldBillsModal";

// Helper to parse base pieces from item name
function getBasePieces(name: string): number {
  const match = name.match(/(\d+)\s*(?:pcs|pc|x|pieces|piece)/i);
  if (match) return parseInt(match[1], 10);
  const xMatch = name.match(/(?:x)\s*(\d+)/i);
  if (xMatch) return parseInt(xMatch[1], 10);
  const matchX = name.match(/(\d+)\s*(?:x)/i);
  if (matchX) return parseInt(matchX[1], 10);
  return 1;
}

// Helper to calculate unit price based on portion and pieces settings
function getLineUnitPrice(line: any): number {
  const basePrice = Number(line.menuItem.discountPrice ?? line.menuItem.price);
  let price = basePrice;
  
  if (line.portion === "HALF") {
    price = basePrice / 2;
  }
  
  if (line.isSinglePiece) {
    const basePieces = getBasePieces(line.menuItem.name);
    price = (basePrice / basePieces) * (line.pieces || 1);
  }
  
  return price;
}

export default function POS() {
  const currency = useCurrencyFormatter();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [heldOpen, setHeldOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [openCounterModalOpen, setOpenCounterModalOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closeCounterModalOpen, setCloseCounterModalOpen] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  const { data: currentSession, isSuccess: sessionLoaded } = useCurrentSession();
  const openSession = useOpenSession();
  const closeSession = useCloseSession();

  // Prompt to open the counter if none is open
  useEffect(() => {
    if (sessionLoaded && !currentSession && !hasAutoPrompted) {
      setOpenCounterModalOpen(true);
      setHasAutoPrompted(true);
    }
  }, [sessionLoaded, currentSession, hasAutoPrompted]);

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
    () => lines.reduce((sum, l) => sum + getLineUnitPrice(l) * l.quantity, 0),
    [lines]
  );
  
  const tax = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + (getLineUnitPrice(l) * l.quantity * l.menuItem.tax) / 100,
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
        items: lines.map((l) => ({
          menuItemId: l.menuItem.id,
          quantity: l.quantity,
          portion: l.portion,
          isSinglePiece: l.isSinglePiece,
          pieces: l.pieces,
        })),
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
        items: lines.map((l) => ({
          menuItemId: l.menuItem.id,
          quantity: l.quantity,
          portion: l.portion,
          isSinglePiece: l.isSinglePiece,
          pieces: l.pieces,
        })),
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

  const handleCloseCounter = () => {
    if (!currentSession) return;
    const amount = Number(closingCash);
    if (Number.isNaN(amount) || amount < 0) return toast.error("Enter a valid closing cash amount");
    closeSession.mutate(
      { id: currentSession.id, closingCash: amount },
      {
        onSuccess: (result) => {
          toast.success(
            result.variance === 0
              ? "Counter closed — cash matched exactly"
              : `Counter closed — ${result.variance > 0 ? "over" : "short"} by ${currency.format(Math.abs(result.variance))}`
          );
          setCloseCounterModalOpen(false);
          setClosingCash("");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4 overflow-hidden">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[220px_1fr_360px] gap-4 min-h-0 overflow-hidden">
        
        {/* Category sidebar - Full Height Grid */}
        <Card className="h-full flex flex-col p-3 bg-[var(--bg-surface)] overflow-hidden">
          <p className="mb-3 px-1 text-xs font-semibold uppercase text-[var(--text-muted)] flex-shrink-0">Categories</p>
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCategoryId(undefined)}
                className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                  !categoryId 
                    ? "bg-brand-600 text-white border-brand-600 shadow-md" 
                    : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] text-[var(--text-main)]"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-xl mb-2 font-bold text-brand-600">
                  🍽️
                </div>
                <span className="text-xs font-semibold truncate w-full">All Items</span>
              </button>
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                    categoryId === c.id 
                      ? "bg-brand-600 text-white border-brand-600 shadow-md" 
                      : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] text-[var(--text-main)]"
                  }`}
                >
                  {c.image ? (
                    <img 
                      src={resolveAssetUrl(c.image)} 
                      alt="" 
                      className="w-12 h-12 rounded-full object-cover mb-2 border border-stone-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-xl mb-2 font-bold">
                      🍲
                    </div>
                  )}
                  <span className="text-xs font-semibold truncate w-full">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Product grid - Full Height Layout */}
        <div className="h-full space-y-3 flex flex-col overflow-hidden">
          <div className="flex gap-2 flex-shrink-0">
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

        {/* Cart / Sidebar - Full Height layout */}
        <Card className="h-full flex flex-col p-4 overflow-hidden">
          <div className="mb-3 flex items-center justify-between flex-shrink-0">
            <p className="font-semibold">Current Order</p>
            <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}>
              <HiOutlineClock size={14} className="mr-1" /> Held Bills
            </Button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 flex-shrink-0">
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

          {/* Cart Items List - Clean Scrollable area */}
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto scrollbar-thin pr-1">
            {lines.length === 0 ? (
              <EmptyState title="Cart is empty" description="Tap items to add them" />
            ) : (
              lines.map((line) => {
                const basePieces = getBasePieces(line.menuItem.name);
                const hasMultiPieces = basePieces > 1;
                const unitPrice = getLineUnitPrice(line);
                
                return (
                  <div key={line.menuItem.id} className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{line.menuItem.name}</p>
                        <p className="text-xs text-brand-600 font-medium">
                          {currency.format(unitPrice)} each
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] rounded-lg p-0.5 border border-[var(--border-color)]">
                        <button
                          onClick={() => cart.incrementLine(line.menuItem.id, -1)}
                          className="rounded-md p-1 hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors"
                        >
                          <HiOutlineMinus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{line.quantity}</span>
                        <button
                          onClick={() => cart.incrementLine(line.menuItem.id, 1)}
                          className="rounded-md p-1 hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors"
                        >
                          <HiOutlinePlus size={12} />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => cart.removeLine(line.menuItem.id)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                    
                    {/* Options Toggle for Portions and Pieces */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-[var(--border-color)]">
                      
                      {/* Portion Selector */}
                      <div className="flex rounded-lg bg-[var(--bg-surface)] p-0.5 border border-[var(--border-color)] text-[10px] font-semibold">
                        <button
                          onClick={() => cart.updateLinePortion(line.menuItem.id, "FULL")}
                          className={`rounded px-2.5 py-1 transition-all ${
                            line.portion !== "HALF"
                              ? "bg-brand-600 text-white shadow-sm"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                          }`}
                        >
                          Full
                        </button>
                        <button
                          onClick={() => cart.updateLinePortion(line.menuItem.id, "HALF")}
                          className={`rounded px-2.5 py-1 transition-all ${
                            line.portion === "HALF"
                              ? "bg-brand-600 text-white shadow-sm"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                          }`}
                        >
                          Half
                        </button>
                      </div>

                      {/* Pieces Selector */}
                      {hasMultiPieces && (
                        <div className="flex items-center gap-1">
                          <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-[var(--text-secondary)]">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-3 h-3"
                              checked={line.isSinglePiece || false}
                              onChange={(e) => cart.updateLineSinglePiece(line.menuItem.id, e.target.checked)}
                            />
                            <span>Pieces:</span>
                          </label>
                          
                          {line.isSinglePiece && (
                            <select
                              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-1 py-0.5 text-[10px] font-semibold"
                              value={line.pieces || 1}
                              onChange={(e) => cart.updateLineSinglePiece(line.menuItem.id, true, Number(e.target.value))}
                            >
                              {Array.from({ length: basePieces }, (_, idx) => idx + 1).map((pcsVal) => (
                                <option key={pcsVal} value={pcsVal}>
                                  {pcsVal} of {basePieces}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 space-y-1 border-t border-[var(--border-color)] pt-3 text-sm flex-shrink-0">
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

          <div className="mt-3 grid grid-cols-2 gap-2 flex-shrink-0">
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

      <Modal open={closeCounterModalOpen} onClose={() => setCloseCounterModalOpen(false)} title="Close Counter" maxWidth="max-w-sm">
        <div className="space-y-4">
          {currentSession && (
            <p className="text-sm text-[var(--text-secondary)]">
              Opened with {currency.format(currentSession.openingCash)}. Count the cash drawer and enter the total below.
            </p>
          )}
          <Input
            label="Closing Cash"
            type="number"
            min={0}
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            placeholder="0"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseCounterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseCounter} isLoading={closeSession.isPending}>
              Close Counter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
