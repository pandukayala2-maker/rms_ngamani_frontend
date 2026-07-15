import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineTrash,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCake,
  HiOutlineBeaker,
  HiOutlineRectangleStack,
} from "react-icons/hi2";
import { api, getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { ApiResponse, MenuItem } from "../../types";

interface PublicCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface PublicMenuData {
  restaurant: { name: string; logo: string | null; address: string | null; contact: string | null; currency: string };
  table: { id: string; name: string; code: string } | null;
  categories: PublicCategory[];
}

interface CartLine {
  item: MenuItem;
  quantity: number;
}

const spicyDots: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };

function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("breakfast") || n.includes("tiffin")) return HiOutlineSun;
  if (n.includes("dinner")) return HiOutlineMoon;
  if (n.includes("dessert")) return HiOutlineCake;
  if (n.includes("beverage") || n.includes("coffee") || n.includes("tea") || n.includes("juice")) return HiOutlineBeaker;
  if (n.includes("fire") || n.includes("starter") || n.includes("fast")) return HiOutlineFire;
  return HiOutlineRectangleStack;
}

export default function PublicMenu() {
  const { token } = useParams<{ token: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<{ orderNumber: string; total: number } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-menu", token],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PublicMenuData>>(`/public/menu/${token}`);
      return res.data.data;
    },
    retry: false,
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ orderNumber: string; total: number; status: string }>>(
        `/public/menu/${token}/order`,
        {
          items: Object.values(cart).map((line) => ({ menuItemId: line.item.id, quantity: line.quantity })),
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
        }
      );
      return res.data.data;
    },
    onSuccess: (order) => {
      setConfirmedOrder({ orderNumber: order.orderNumber, total: order.total });
      setCart({});
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotal = cartLines.reduce(
    (sum, l) => sum + (l.item.discountPrice ?? l.item.price) * l.quantity,
    0
  );

  const specials = useMemo(() => {
    if (!data) return [];
    return data.categories
      .flatMap((c) => c.items)
      .filter((item) => item.isFeatured || item.isBestseller)
      .slice(0, 8);
  }, [data]);

  const addToCart = (item: MenuItem) =>
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, quantity: (existing?.quantity ?? 0) + 1 } };
    });

  const changeQty = (itemId: string, delta: number) =>
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...existing, quantity: nextQty } };
    });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <EmptyState title="Menu unavailable" description="This QR menu link is invalid, disabled, or has expired." />
      </div>
    );
  }

  const currentCategory = activeCategory ?? data.categories[0]?.id;
  const currency = data.restaurant.currency === "INR" ? "₹" : data.restaurant.currency;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 px-4 pb-8 pt-10 text-white">
        <div className="mx-auto max-w-2xl text-center">
          {data.restaurant.logo && (
            <img src={resolveAssetUrl(data.restaurant.logo)} alt="" className="mx-auto mb-3 h-16 w-16 rounded-2xl object-cover" />
          )}
          <h1 className="text-2xl font-bold">{data.restaurant.name}</h1>
          {data.table && <p className="mt-1 text-sm text-white/80">{data.table.name}</p>}
          {data.restaurant.address && <p className="mt-1 text-xs text-white/70">{data.restaurant.address}</p>}
        </div>
      </div>

      {/* Today's Specials banner */}
      {specials.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <HiOutlineFire className="text-amber-500" size={16} />
            <p className="text-sm font-semibold">Today&apos;s Specials</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {specials.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="glass-card relative w-32 shrink-0 overflow-hidden p-0 text-left"
              >
                {item.image ? (
                  <img src={resolveAssetUrl(item.image)} alt="" className="h-20 w-full object-cover" />
                ) : (
                  <div className="h-20 w-full bg-[var(--bg-surface-2)]" />
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="text-xs font-semibold text-brand-600">
                    {currency}
                    {item.discountPrice ?? item.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category nav */}
      <div className="sticky top-0 z-10 mx-auto max-w-2xl px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-[var(--bg-surface)] p-2 shadow-glass scrollbar-thin">
          {data.categories.map((cat) => {
            const Icon = categoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  currentCategory === cat.id
                    ? "bg-brand-600 text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
                }`}
              >
                <Icon size={15} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="mx-auto max-w-2xl space-y-3 px-4 pt-6">
        {data.categories.length === 0 && (
          <EmptyState title="No items available" description="Please check back later." />
        )}
        {data.categories
          .filter((cat) => cat.id === currentCategory)
          .flatMap((cat) => cat.items)
          .map((item, i) => {
            const inCart = cart[item.id];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className="glass-card flex gap-3 p-3"
              >
                {item.image ? (
                  <img src={resolveAssetUrl(item.image)} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-[var(--bg-surface-2)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex h-3 w-3 items-center justify-center rounded-sm border-2 ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        }`}
                      >
                        <span className={`h-1 w-1 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                      </span>
                      <p className="font-medium">{item.name}</p>
                    </div>
                    <p className="shrink-0 font-semibold">
                      {currency}
                      {item.discountPrice ?? item.price}
                    </p>
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isBestseller && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                          <HiOutlineFire size={11} /> Bestseller
                        </span>
                      )}
                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-600">
                          <HiOutlineSparkles size={11} /> Featured
                        </span>
                      )}
                      {spicyDots[item.spicyLevel] > 0 && (
                        <span className="text-[10px] text-red-500">{"🌶".repeat(spicyDots[item.spicyLevel])}</span>
                      )}
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-1.5 py-1">
                        <button onClick={() => changeQty(item.id, -1)} className="rounded-md bg-[var(--bg-surface)] p-1">
                          <HiOutlineMinus size={12} />
                        </button>
                        <span className="w-4 text-center text-xs font-medium">{inCart.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="rounded-md bg-[var(--bg-surface)] p-1">
                          <HiOutlinePlus size={12} />
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => addToCart(item)}>
                        <HiOutlinePlus size={13} className="mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Floating cart bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={() => setCartOpen(true)}
            className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white shadow-lg"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <HiOutlineShoppingBag size={18} />
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-semibold">
              View Cart &middot; {currency}
              {cartTotal.toFixed(0)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <Modal
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          setConfirmedOrder(null);
        }}
        title={confirmedOrder ? "Order Placed" : "Your Order"}
        maxWidth="max-w-md"
      >
        {confirmedOrder ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-4xl">✅</p>
            <p className="font-medium">Order #{confirmedOrder.orderNumber} sent to the kitchen</p>
            <p className="text-2xl font-bold">
              {currency}
              {confirmedOrder.total.toFixed(0)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">A staff member will confirm and bring it out shortly.</p>
            <Button
              className="mt-2"
              onClick={() => {
                setCartOpen(false);
                setConfirmedOrder(null);
              }}
            >
              Done
            </Button>
          </div>
        ) : cartLines.length === 0 ? (
          <EmptyState title="Your cart is empty" description="Tap Add on any item to order it." />
        ) : (
          <div className="space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
              {cartLines.map((line) => (
                <div key={line.item.id} className="flex items-center gap-2 rounded-xl bg-[var(--bg-surface-2)] p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {currency}
                      {line.item.discountPrice ?? line.item.price} each
                    </p>
                  </div>
                  <button onClick={() => changeQty(line.item.id, -1)} className="rounded-md bg-[var(--bg-surface)] p-1">
                    <HiOutlineMinus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm">{line.quantity}</span>
                  <button onClick={() => changeQty(line.item.id, 1)} className="rounded-md bg-[var(--bg-surface)] p-1">
                    <HiOutlinePlus size={12} />
                  </button>
                  <button onClick={() => changeQty(line.item.id, -line.quantity)} className="p-1 text-red-500">
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-[var(--border-color)] pt-3 text-base font-semibold">
              <span>Total</span>
              <span>
                {currency}
                {cartTotal.toFixed(0)}
              </span>
            </div>

            <Input
              label="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rohan"
            />
            <Input
              label="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9000000000"
            />

            <Button className="w-full" onClick={() => placeOrder.mutate()} isLoading={placeOrder.isPending}>
              Place Order
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
