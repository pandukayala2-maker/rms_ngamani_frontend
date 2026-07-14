import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HiOutlineFire, HiOutlineSparkles } from "react-icons/hi2";
import { api } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { ApiResponse, MenuItem } from "../../types";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";

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

const spicyDots: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };

export default function PublicMenu() {
  const { token } = useParams<{ token: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-menu", token],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PublicMenuData>>(`/public/menu/${token}`);
      return res.data.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
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

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-16">
      <div className="bg-gradient-to-br from-brand-600 to-violet-600 px-4 pb-8 pt-10 text-white">
        <div className="mx-auto max-w-2xl text-center">
          {data.restaurant.logo && (
            <img src={resolveAssetUrl(data.restaurant.logo)} alt="" className="mx-auto mb-3 h-16 w-16 rounded-2xl object-cover" />
          )}
          <h1 className="text-2xl font-bold">{data.restaurant.name}</h1>
          {data.table && <p className="mt-1 text-sm text-white/80">{data.table.name}</p>}
          {data.restaurant.address && <p className="mt-1 text-xs text-white/70">{data.restaurant.address}</p>}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mt-5 mx-auto max-w-2xl px-4">
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-[var(--bg-surface)] p-2 shadow-glass scrollbar-thin">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                currentCategory === cat.id
                  ? "bg-brand-600 text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-4 pt-6">
        {data.categories.length === 0 && (
          <EmptyState title="No items available" description="Please check back later." />
        )}
        {data.categories
          .filter((cat) => cat.id === currentCategory)
          .flatMap((cat) => cat.items)
          .map((item, i) => (
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
                    {data.restaurant.currency === "INR" ? "₹" : data.restaurant.currency}
                    {item.discountPrice ?? item.price}
                  </p>
                </div>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{item.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  {item.isSeasonal && (
                    <span className="rounded-full bg-[var(--bg-surface-2)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                      Seasonal
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
