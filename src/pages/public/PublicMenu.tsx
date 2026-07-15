import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { FaUtensils } from "react-icons/fa6";
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
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2";
import { api, getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
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

type ViewMode = "grid" | "list";

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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
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

  const [showSlowLoadHint, setShowSlowLoadHint] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShowSlowLoadHint(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowLoadHint(true), 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

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
    return data.categories.flatMap((c) => c.items).filter((item) => item.isFeatured || item.isBestseller);
  }, [data]);
  const heroSpecial = specials[0];

  const addToCart = (item: MenuItem, qty = 1) =>
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, quantity: (existing?.quantity ?? 0) + qty } };
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
      <div className="min-h-screen bg-neutral-950 p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {showSlowLoadHint && (
            <div className="flex flex-col items-center gap-2 pt-16 text-center text-neutral-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="text-sm">Waking up the kitchen&hellip;</p>
              <p className="text-xs text-neutral-500">First scan after a while can take a few seconds.</p>
            </div>
          )}
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
        <EmptyState title="Menu unavailable" description="This QR menu link is invalid, disabled, or has expired." />
      </div>
    );
  }

  const currentCategory = activeCategory ?? data.categories[0]?.id;
  const currency = data.restaurant.currency === "INR" ? "₹" : data.restaurant.currency;
  const currentItems = data.categories.filter((cat) => cat.id === currentCategory).flatMap((cat) => cat.items);

  return (
    <div className="min-h-screen bg-neutral-950 pb-28 text-neutral-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 px-4 pb-6 pt-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/40">
            {data.restaurant.logo ? (
              <img src={resolveAssetUrl(data.restaurant.logo)} alt="" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <FaUtensils className="text-white" size={22} />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{data.restaurant.name}</h1>
          {data.table && (
            <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-amber-300">
              {data.table.name}
            </span>
          )}
        </div>
      </div>

      {/* Today's Special hero */}
      {heroSpecial && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <button
            onClick={() => setDetailItem(heroSpecial)}
            className="relative block w-full overflow-hidden rounded-2xl text-left"
          >
            {heroSpecial.image ? (
              <img src={resolveAssetUrl(heroSpecial.image)} alt="" className="h-44 w-full object-cover" />
            ) : (
              <div className="h-44 w-full bg-neutral-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-950">
              Today&apos;s Special
            </div>
            <div className="absolute inset-x-4 bottom-3">
              <p className="text-lg font-bold leading-tight">{heroSpecial.name}</p>
              <p className="mt-0.5 text-amber-400 font-semibold">
                {currency}
                {heroSpecial.discountPrice ?? heroSpecial.price}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Category nav */}
      <div className="sticky top-0 z-10 mx-auto max-w-2xl px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-neutral-900/90 p-2 shadow-lg shadow-black/30 backdrop-blur-md scrollbar-thin">
          {data.categories.map((cat) => {
            const Icon = categoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  currentCategory === cat.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950"
                    : "text-neutral-300 hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section header with view toggle */}
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-300">
            {data.categories.find((c) => c.id === currentCategory)?.name ?? "Menu"}
          </p>
          <div className="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-amber-500 text-neutral-950" : "text-neutral-400"}`}
              aria-label="Grid view"
            >
              <HiOutlineSquares2X2 size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-amber-500 text-neutral-950" : "text-neutral-400"}`}
              aria-label="List view"
            >
              <HiOutlineBars3 size={15} />
            </button>
          </div>
        </div>

        {currentItems.length === 0 && (
          <EmptyState title="No items available" description="Please check back later." />
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {currentItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => setDetailItem(item)}
                className="relative overflow-hidden rounded-2xl bg-neutral-900 text-left shadow-md shadow-black/20"
              >
                {item.image ? (
                  <img src={resolveAssetUrl(item.image)} alt="" className="h-28 w-full object-cover" />
                ) : (
                  <div className="h-28 w-full bg-neutral-800" />
                )}
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="mt-0.5 text-sm font-semibold text-amber-400">
                    {currency}
                    {item.discountPrice ?? item.price}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-neutral-950 shadow-lg"
                >
                  <HiOutlinePlus size={14} />
                </button>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item, i) => {
              const inCart = cart[item.id];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="flex gap-3 rounded-2xl bg-neutral-900 p-3 shadow-md shadow-black/20"
                >
                  <button onClick={() => setDetailItem(item)} className="shrink-0">
                    {item.image ? (
                      <img src={resolveAssetUrl(item.image)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-neutral-800" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setDetailItem(item)} className="block w-full text-left">
                      <div className="flex items-center gap-1.5">
                        <VegDot isVeg={item.isVeg} />
                        <p className="font-medium">{item.name}</p>
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-neutral-400">{item.description}</p>
                      )}
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-semibold text-amber-400">
                        {currency}
                        {item.discountPrice ?? item.price}
                      </p>
                      {inCart ? (
                        <div className="flex items-center gap-2 rounded-lg bg-neutral-800 px-1.5 py-1">
                          <button onClick={() => changeQty(item.id, -1)} className="rounded-md bg-neutral-700 p-1">
                            <HiOutlineMinus size={12} />
                          </button>
                          <span className="w-4 text-center text-xs font-medium">{inCart.quantity}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="rounded-md bg-neutral-700 p-1">
                            <HiOutlinePlus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-neutral-950"
                        >
                          <HiOutlinePlus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item detail modal */}
      <AnimatePresence>
        {detailItem && (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setDetailItem(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-t-3xl bg-neutral-900"
            >
              <button
                onClick={() => setDetailItem(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <HiOutlineXMark size={18} />
              </button>
              {detailItem.image ? (
                <img src={resolveAssetUrl(detailItem.image)} alt="" className="h-56 w-full object-cover" />
              ) : (
                <div className="h-56 w-full bg-neutral-800" />
              )}
              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-5">
                <div className="flex items-center gap-1.5">
                  <VegDot isVeg={detailItem.isVeg} />
                  <h2 className="text-xl font-bold">{detailItem.name}</h2>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {detailItem.isBestseller && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      <HiOutlineFire size={11} /> Bestseller
                    </span>
                  )}
                  {detailItem.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                      <HiOutlineSparkles size={11} /> Featured
                    </span>
                  )}
                  {spicyDots[detailItem.spicyLevel] > 0 && (
                    <span className="text-xs text-red-400">{"🌶".repeat(spicyDots[detailItem.spicyLevel])}</span>
                  )}
                </div>
                {detailItem.description && <p className="mt-3 text-sm text-neutral-400">{detailItem.description}</p>}
                {detailItem.ingredients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {detailItem.ingredients.map((ing) => (
                      <span key={ing} className="rounded-full bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-400">
                    {currency}
                    {detailItem.discountPrice ?? detailItem.price}
                  </p>
                  <button
                    onClick={() => {
                      addToCart(detailItem);
                      setDetailItem(null);
                      toast.success(`${detailItem.name} added to cart`);
                    }}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 px-6 py-3 text-sm font-semibold text-neutral-950"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating cart bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={() => setCartOpen(true)}
            className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 to-orange-600 px-5 py-3.5 text-neutral-950 shadow-lg shadow-orange-950/40"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <HiOutlineShoppingBag size={18} />
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold">
              View Cart &middot; {currency}
              {cartTotal.toFixed(0)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => {
                setCartOpen(false);
                setConfirmedOrder(null);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-2xl rounded-t-3xl bg-neutral-900 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{confirmedOrder ? "Order Placed" : "Your Order"}</h2>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setConfirmedOrder(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800"
                >
                  <HiOutlineXMark size={16} />
                </button>
              </div>

              {confirmedOrder ? (
                <div className="space-y-3 py-4 text-center">
                  <p className="text-4xl">✅</p>
                  <p className="font-medium">Order #{confirmedOrder.orderNumber} sent to the kitchen</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {currency}
                    {confirmedOrder.total.toFixed(0)}
                  </p>
                  <p className="text-xs text-neutral-500">A staff member will confirm and bring it out shortly.</p>
                  <button
                    className="mt-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 px-6 py-2.5 text-sm font-semibold text-neutral-950"
                    onClick={() => {
                      setCartOpen(false);
                      setConfirmedOrder(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : cartLines.length === 0 ? (
                <EmptyState title="Your cart is empty" description="Tap any item to add it." />
              ) : (
                <div className="space-y-4">
                  <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                    {cartLines.map((line) => (
                      <div key={line.item.id} className="flex items-center gap-2 rounded-xl bg-neutral-800 p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line.item.name}</p>
                          <p className="text-xs text-neutral-500">
                            {currency}
                            {line.item.discountPrice ?? line.item.price} each
                          </p>
                        </div>
                        <button onClick={() => changeQty(line.item.id, -1)} className="rounded-md bg-neutral-700 p-1">
                          <HiOutlineMinus size={12} />
                        </button>
                        <span className="w-5 text-center text-sm">{line.quantity}</span>
                        <button onClick={() => changeQty(line.item.id, 1)} className="rounded-md bg-neutral-700 p-1">
                          <HiOutlinePlus size={12} />
                        </button>
                        <button onClick={() => changeQty(line.item.id, -line.quantity)} className="p-1 text-red-400">
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span className="text-amber-400">
                      {currency}
                      {cartTotal.toFixed(0)}
                    </span>
                  </div>

                  <div className="[&_input]:bg-neutral-800 [&_input]:border-white/10 [&_input]:text-white [&_span]:text-neutral-400">
                    <Input
                      label="Your name (optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rohan"
                    />
                    <div className="h-3" />
                    <Input
                      label="Phone (optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9000000000"
                    />
                  </div>

                  <button
                    onClick={() => placeOrder.mutate()}
                    disabled={placeOrder.isPending}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 py-3 text-sm font-bold text-neutral-950 disabled:opacity-60"
                  >
                    {placeOrder.isPending ? "Placing order..." : "Place Order"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-flex h-3 w-3 items-center justify-center rounded-sm border-2 ${
        isVeg ? "border-green-500" : "border-red-500"
      }`}
    >
      <span className={`h-1 w-1 rounded-full ${isVeg ? "bg-green-500" : "bg-red-500"}`} />
    </span>
  );
}
