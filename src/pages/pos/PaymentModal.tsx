import { useState, useEffect } from "react";
import { toast } from "sonner";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePrinter, HiOutlineUser } from "react-icons/hi2";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { useAddPayments } from "../../hooks/useOrders";
import { useCurrencyFormatter } from "../../hooks/useCurrency";
import { getErrorMessage, api } from "../../lib/axios";
import { openReceipt } from "../../lib/receipt";
import type { Order, PaymentMethod } from "../../types";

const methods: PaymentMethod[] = ["CASH", "CARD", "UPI", "WALLET"];

interface SplitLine {
  method: PaymentMethod;
  amount: string; // Stored as string to support clean keypad typing
}

export function PaymentModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const currency = useCurrencyFormatter();
  const addPayments = useAddPayments();
  
  // State variables
  const [splits, setSplits] = useState<SplitLine[]>([{ method: "CASH", amount: "" }]);
  const [activeSplitIndex, setActiveSplitIndex] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Customer states
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // Initialize values when order changes
  useEffect(() => {
    if (order) {
      setSplits([{ method: "CASH", amount: "" }]);
      setActiveSplitIndex(0);
      setCompletedOrder(null);
      
      if (order.customer) {
        setCustomerPhone(order.customer.phone || "");
        setCustomerName(order.customer.name || "");
        setSelectedCustomerId(order.customer.id);
      } else {
        setCustomerPhone("");
        setCustomerName("");
        setSelectedCustomerId(null);
      }
    }
  }, [order]);

  if (!order) return null;

  const alreadyPaid = order.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - alreadyPaid);
  const enteredTotal = splits.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

  const updateSplit = (i: number, patch: Partial<SplitLine>) =>
    setSplits((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const handlePhoneChange = async (phoneVal: string) => {
    setCustomerPhone(phoneVal);
    if (phoneVal.length >= 3) {
      setLoadingCustomer(true);
      try {
        const res = await api.get(`/customers?search=${phoneVal}`);
        const matches = res.data?.data || [];
        const exact = matches.find((c: any) => c.phone === phoneVal);
        if (exact) {
          setCustomerName(exact.name);
          setSelectedCustomerId(exact.id);
          toast.success(`Found existing customer: ${exact.name}`);
        } else {
          setSelectedCustomerId(null);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoadingCustomer(false);
      }
    } else {
      setSelectedCustomerId(null);
    }
  };

  const handleSubmit = async () => {
    const payments = splits
      .map((s) => ({ method: s.method, amount: parseFloat(s.amount) || 0 }))
      .filter((s) => s.amount > 0);

    if (payments.length === 0) {
      toast.error("Enter at least one payment amount");
      return;
    }

    let finalCustomerId = selectedCustomerId || undefined;

    // Create a new customer if phone and name are provided but customer doesn't exist yet
    if (!finalCustomerId && customerPhone && customerName) {
      try {
        const custRes = await api.post("/customers", {
          name: customerName,
          phone: customerPhone,
        });
        finalCustomerId = custRes.data?.data?.id;
        toast.success(`Registered new customer: ${customerName}`);
      } catch (err) {
        toast.error("Failed to register customer: " + getErrorMessage(err));
        return;
      }
    }

    addPayments.mutate(
      { id: order.id, payments, customerId: finalCustomerId },
      {
        onSuccess: (updated) => {
          toast.success(updated.status === "COMPLETED" ? "Payment complete" : "Partial payment recorded");
          setCompletedOrder(updated);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleKeypadPress = (val: string) => {
    const currentLine = splits[activeSplitIndex];
    if (!currentLine) return;
    
    let amountStr = currentLine.amount;

    if (val === "C") {
      amountStr = "";
    } else if (val === "⌫") {
      amountStr = amountStr.slice(0, -1);
    } else if (val === ".") {
      if (!amountStr.includes(".")) {
        amountStr = amountStr === "" ? "0." : amountStr + ".";
      }
    } else {
      amountStr = amountStr + val;
    }
    
    updateSplit(activeSplitIndex, { amount: amountStr });
  };

  const handleQuickAdd = (kdAmount: number | string) => {
    let finalAmount = "";
    if (kdAmount === "exact") {
      finalAmount = String(remaining);
    } else {
      finalAmount = String(kdAmount);
    }
    updateSplit(activeSplitIndex, { amount: finalAmount });
  };

  const close = () => {
    setSplits([{ method: "CASH", amount: "" }]);
    setCompletedOrder(null);
    onClose();
  };

  if (completedOrder?.status === "COMPLETED") {
    return (
      <Modal open onClose={close} title="Payment Successful" maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <p className="text-3xl">✅</p>
          <p className="font-semibold text-emerald-600">Order #{completedOrder.orderNumber} completed</p>
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

  const keypadKeys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "⌫", "."];

  return (
    <Modal open onClose={close} title={`Payment — Order #${order.orderNumber}`} maxWidth="max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
        
        {/* Left Column: Customer details & Payments List */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Total Remaining Card (Colorful Forest Green & Gold gradient) */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-950 p-4 text-white shadow-md border-l-4 border-amber-500">
              <div className="flex justify-between text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                <span>Total Bill</span>
                <span>{currency.format(order.total)}</span>
              </div>
              {alreadyPaid > 0 && (
                <div className="flex justify-between text-xs text-emerald-300/80 mt-1">
                  <span>Paid so far</span>
                  <span>{currency.format(alreadyPaid)}</span>
                </div>
              )}
              <div className="flex justify-between items-end mt-3 border-t border-emerald-800/40 pt-2">
                <span className="text-sm font-semibold">Remaining Due</span>
                <span className="text-2xl font-black text-amber-400">{currency.format(remaining)}</span>
              </div>
            </div>

            {/* Entered & Change Return Summary Box */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 shadow-sm flex justify-between items-center gap-4">
              <div className="text-center flex-1">
                <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Total Entered</div>
                <div className="text-2xl font-black text-[var(--text-main)] mt-1">
                  {currency.format(enteredTotal)}
                </div>
              </div>
              <div className="h-8 w-px bg-[var(--border-color)]" />
              <div className="text-center flex-1">
                <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Change Return</div>
                <div className={`text-2xl font-black mt-1 ${enteredTotal > remaining ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)]"}`}>
                  {currency.format(Math.max(0, enteredTotal - remaining))}
                </div>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-2)] p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--text-secondary)]">
                <HiOutlineUser size={14} className="text-brand-600" />
                <span>Customer Link (Optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Phone Number"
                  placeholder="e.g. 98765432"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="text-xs"
                />
                <Input
                  label="Customer Name"
                  placeholder="e.g. Aarav"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={loadingCustomer}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Payment lines */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-[var(--text-secondary)]">Split Payments</div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {splits.map((line, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveSplitIndex(i)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                      activeSplitIndex === i 
                        ? "border-brand-600 bg-brand-50/10 shadow-sm" 
                        : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)]"
                    }`}
                  >
                    <Select
                      className="w-28 text-xs font-bold"
                      value={line.method}
                      onChange={(e) => updateSplit(i, { method: e.target.value as PaymentMethod })}
                    >
                      {methods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full bg-transparent font-bold text-sm text-right focus:outline-none px-2"
                        value={line.amount}
                        readOnly
                        placeholder="0.00"
                      />
                    </div>
                    {splits.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSplits((prev) => prev.filter((_, idx) => idx !== i));
                          setActiveSplitIndex(Math.max(0, i - 1));
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick preset Kd buttons & action triggers */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleQuickAdd("exact")}
                className="px-2.5 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Exact Due
              </button>
              {[1, 5, 10, 20].map((val) => (
                <button
                  key={val}
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  {val} KD
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSplits((prev) => [...prev, { method: "CARD", amount: "" }]);
                  setActiveSplitIndex(splits.length);
                }}
              >
                <HiOutlinePlus size={14} className="mr-1" /> Add Split
              </Button>
              <div className="text-xs font-semibold text-brand-600">
                Entered: {currency.format(enteredTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculator/Keypad interface */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase text-slate-500 mb-3 text-center">Amount Keypad</div>
          
          <div className="grid grid-cols-3 gap-2 flex-1 justify-items-stretch">
            {keypadKeys.map((key) => {
              const isClear = key === "C";
              const isBackspace = key === "⌫";
              return (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className={`py-4 text-lg font-black rounded-xl border flex items-center justify-center transition-all duration-100 active:scale-95 active:bg-slate-200 ${
                    isClear
                      ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      : isBackspace
                      ? "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-800 shadow-sm"
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="ghost" className="flex-1" onClick={close}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold" 
              onClick={handleSubmit} 
              isLoading={addPayments.isPending}
            >
              Confirm
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
