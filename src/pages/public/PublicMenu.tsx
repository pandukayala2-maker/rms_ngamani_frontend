import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaUtensils, FaBowlFood, FaStar, FaFire, FaBowlRice } from "react-icons/fa6";
import {
  HiOutlineSun,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineChevronDown,
} from "react-icons/hi2";
import { api } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import { currencySymbol } from "../../lib/currency";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import type { ApiResponse, MenuItem } from "../../types";

interface PublicCategory {
  id: string;
  name: string;
  image?: string | null;
  description?: string | null;
  items: MenuItem[];
}

interface PublicMenuData {
  restaurant: { name: string; logo: string | null; address: string | null; contact: string | null; currency: string };
  tables: { id: string; name: string; code: string }[];
  categories: PublicCategory[];
}

type ViewMode = "grid" | "list";
type Language = "en" | "te" | "ar";

const spicyDots: Record<string, number> = { NONE: 0, MILD: 1, MEDIUM: 2, HOT: 3, EXTRA_HOT: 4 };

// Translations dictionary for English, Telugu, Arabic
const translations: Record<
  Language,
  {
    digitalMenu: string;
    openNow: string;
    hours: string;
    searchPlaceholder: string;
    thankYouTitle: string;
    thankYouSubtitle: string;
    bestseller: string;
    featured: string;
    ingredients: string;
    close: string;
    noItemsFound: string;
    menuUnavailable: string;
    menuUnavailableDesc: string;
    wakingUp: string;
    firstScanNotice: string;
    todaysSpecial: string;
    categoryNames: Record<string, string>;
  }
> = {
  en: {
    digitalMenu: "Digital Menu",
    openNow: "Open Now",
    hours: "10:00 AM - 11:00 PM",
    searchPlaceholder: "Search for dishes...",
    thankYouTitle: "Thank you for scanning!",
    thankYouSubtitle: "Please place your order at the counter.",
    bestseller: "Bestseller",
    featured: "Featured",
    ingredients: "Ingredients",
    close: "Close",
    noItemsFound: "No items found matching your search.",
    menuUnavailable: "Menu unavailable",
    menuUnavailableDesc: "This QR menu link is invalid, disabled, or has expired.",
    wakingUp: "Waking up the kitchen...",
    firstScanNotice: "First scan after a while can take a few seconds.",
    todaysSpecial: "Today's Special",
    categoryNames: {
      "Paneer & Veg Curries": "Paneer & Veg Curries",
      "North Indian Main Course": "North Indian Main Course",
      "Chinese Items": "Chinese Items",
      Breakfast: "Breakfast",
      "Tandoori Items": "Tandoori Items",
      Starters: "Starters",
      "Biryani & Rice": "Biryani & Rice",
      Beverages: "Beverages & Drinks",
      Desserts: "Desserts & Sweets",
    },
  },
  te: {
    digitalMenu: "డిజిటల్ మెనూ",
    openNow: "ఇప్పుడు తెరిచి ఉంది",
    hours: "10:00 AM - 11:00 PM",
    searchPlaceholder: "వంటకాల కోసం శోధించండి...",
    thankYouTitle: "స్కాన్ చేసినందుకు ధన్యవాదాలు!",
    thankYouSubtitle: "దయచేసి కౌంటర్ వద్ద ఆర్డర్ ఇవ్వండి.",
    bestseller: "ప్రసిద్ధమైనవి",
    featured: "ప్రత్యేకమైనవి",
    ingredients: "పదార్థాలు",
    close: "మూసివేయి",
    noItemsFound: "మీ శోధనకు తగిన వంటకాలు దొరకలేదు.",
    menuUnavailable: "మెనూ అందుబాటులో లేదు",
    menuUnavailableDesc: "ఈ QR మెనూ లింక్ చెల్లదు లేదా గడువు ముగిసింది.",
    wakingUp: "కిచెన్ ప్రారంభమవుతోంది...",
    firstScanNotice: "కొంత సమయం తర్వాత మొదటి స్కాన్‌కు కొద్ది సెకన్లు పట్టవచ్చు.",
    todaysSpecial: "ఈరోజు ప్రత్యేకం",
    categoryNames: {
      "Paneer & Veg Curries": "పనీర్ & వెజ్ కర్రీలు",
      "North Indian Main Course": "ఉత్తర భారత వంటకాలు",
      "Chinese Items": "చైనీస్ ఐటమ్స్",
      Breakfast: "టిఫిన్ & అల్పాహారం",
      "Tandoori Items": "తందూరీ ఐటమ్స్",
      Starters: "స్టార్టర్స్",
      "Biryani & Rice": "బిర్యానీ & రైస్",
      Beverages: "పానీయాలు",
      Desserts: "తీపి పదార్థాలు",
    },
  },
  ar: {
    digitalMenu: "قائمة طعام رقمية",
    openNow: "مفتوح الآن",
    hours: "10:00 ص - 11:00 م",
    searchPlaceholder: "البحث عن الأطباق...",
    thankYouTitle: "شكراً لمسح الرمز!",
    thankYouSubtitle: "يرجى تقديم طلبك عند الكاونتر.",
    bestseller: "الأكثر مبيعاً",
    featured: "مميز",
    ingredients: "المكونات",
    close: "إغلاق",
    noItemsFound: "لم يتم العثور على أطباق تطابق بحثك.",
    menuUnavailable: "القائمة غير متوفرة",
    menuUnavailableDesc: "رابط قائمة رمز QR هذا غير صالحة أو معطلة أو انتهت صلاحيتها.",
    wakingUp: "جاري تشغيل المطبخ...",
    firstScanNotice: "قد يستغرق المسح الأول بضع ثوانٍ.",
    todaysSpecial: "طبق اليوم المميز",
    categoryNames: {
      "Paneer & Veg Curries": "بانير وكاري خضار",
      "North Indian Main Course": "الأطباق الرئيسية الهندية",
      "Chinese Items": "الأطباق الصينية",
      Breakfast: "الإفطار",
      "Tandoori Items": "أطباق التندوري",
      Starters: "المقبلات",
      "Biryani & Rice": "البرياني والأرز",
      Beverages: "المشروبات",
      Desserts: "الحلويات",
    },
  },
};

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("paneer") || n.includes("veg") || n.includes("curry")) return FaBowlFood;
  if (n.includes("north") || n.includes("main") || n.includes("indian")) return FaUtensils;
  if (n.includes("chinese") || n.includes("noodle")) return FaBowlRice;
  if (n.includes("breakfast") || n.includes("tiffin")) return HiOutlineSun;
  if (n.includes("tandoori") || n.includes("kabab") || n.includes("grill")) return FaFire;
  if (n.includes("starter") || n.includes("snack")) return FaStar;
  return FaUtensils;
}

function formatPrice(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "0.000";
  const num = typeof val === "number" ? val : Number(val);
  return isNaN(num) ? "0.000" : num.toFixed(3);
}

export default function PublicMenu() {
  const { token } = useParams<{ token: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<Language>("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  const t = translations[lang];

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

  const specials = useMemo(() => {
    if (!data) return [];
    return data.categories.flatMap((c) => c.items).filter((item) => item.isFeatured || item.isBestseller);
  }, [data]);
  const heroSpecial = specials[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-4 text-stone-800">
        <div className="mx-auto max-w-xl space-y-4 pt-4">
          {showSlowLoadHint && (
            <div className="flex flex-col items-center gap-2 pt-12 text-center text-stone-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm font-medium">{t.wakingUp}</p>
              <p className="text-xs text-stone-400">{t.firstScanNotice}</p>
            </div>
          )}
          <Skeleton className="h-20 w-full rounded-2xl bg-stone-200/60" />
          <Skeleton className="h-12 w-full rounded-2xl bg-stone-200/60" />
          <Skeleton className="h-32 w-full rounded-2xl bg-stone-200/60" />
          <Skeleton className="h-44 w-full rounded-2xl bg-stone-200/60" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-4">
        <EmptyState title={t.menuUnavailable} description={t.menuUnavailableDesc} />
      </div>
    );
  }

  const currentCategory = activeCategory ?? data.categories[0]?.id;
  const currency = currencySymbol(data.restaurant.currency);
  const isSearching = search.trim().length > 0;
  const currentItems = isSearching
    ? data.categories
        .flatMap((cat) => cat.items)
        .filter((item) => {
          const matchName = item.name.toLowerCase().includes(search.trim().toLowerCase());
          const matchArabic = item.nameArabic ? item.nameArabic.includes(search.trim()) : false;
          return matchName || matchArabic;
        })
    : data.categories.filter((cat) => cat.id === currentCategory).flatMap((cat) => cat.items);

  const getCategoryTitle = (catName: string) => {
    return t.categoryNames[catName] || catName;
  };

  const getItemDisplayName = (item: MenuItem) => {
    if (lang === "ar" && item.nameArabic) {
      return item.nameArabic;
    }
    return item.name;
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#FDFBF7] pb-16 font-sans text-stone-800 antialiased selection:bg-orange-100 selection:text-orange-900"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-[#FDFBF7]/90 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          {/* Logo & Restaurant Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md">
              <img
                src={resolveAssetUrl(data.restaurant.logo) ?? "/logo.png"}
                alt={data.restaurant.name || "Nadhamuni Hotel"}
                className="h-full w-full rounded-2xl object-contain bg-black"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-stone-900">
                {data.restaurant.name || "Nadhamuni Hotel"}
              </h1>
              <p className="text-xs font-medium text-stone-500">{t.digitalMenu}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.openNow}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-500 font-normal">{t.hours}</span>
              </div>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:border-orange-300 hover:bg-orange-50/50 transition-all"
            >
              <HiOutlineGlobeAlt size={16} className="text-orange-600" />
              <span>
                {lang === "en" ? "EN" : lang === "te" ? "తెలుగు" : "العربية"}
              </span>
              <HiOutlineChevronDown size={12} className="text-stone-400" />
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute ${
                      lang === "ar" ? "left-0" : "right-0"
                    } top-full z-40 mt-1.5 w-36 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-xl shadow-stone-900/10`}
                  >
                    <button
                      onClick={() => {
                        setLang("en");
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        lang === "en" ? "bg-orange-50 text-orange-600 font-semibold" : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span>English</span>
                      <span className="text-[10px] text-stone-400">EN</span>
                    </button>
                    <button
                      onClick={() => {
                        setLang("te");
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        lang === "te" ? "bg-orange-50 text-orange-600 font-semibold" : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span>తెలుగు</span>
                      <span className="text-[10px] text-stone-400">TE</span>
                    </button>
                    <button
                      onClick={() => {
                        setLang("ar");
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        lang === "ar" ? "bg-orange-50 text-orange-600 font-semibold" : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span>العربية</span>
                      <span className="text-[10px] text-stone-400">AR</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-xl px-4 pt-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <HiOutlineMagnifyingGlass
            className={`pointer-events-none absolute ${
              lang === "ar" ? "right-3.5" : "left-3.5"
            } top-1/2 -translate-y-1/2 text-stone-400`}
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full rounded-2xl border border-stone-200/90 bg-white py-3 ${
              lang === "ar" ? "pr-10 pl-9" : "pl-10 pr-9"
            } text-sm text-stone-900 placeholder:text-stone-400 shadow-xs focus:border-orange-500 focus:bg-white focus:outline-none transition-all`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute ${lang === "ar" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600`}
            >
              <HiOutlineXMark size={18} />
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Category Cards (Reflects exact design from image) */}
        {!isSearching && (
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none">
            {data.categories.map((cat) => {
              const isActive = currentCategory === cat.id;
              const IconComponent = getCategoryIcon(cat.name);
              const title = getCategoryTitle(cat.name);

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex shrink-0 flex-col items-center justify-between rounded-2xl border p-2.5 transition-all duration-200 min-w-[96px] ${
                    isActive
                      ? "border-orange-500 bg-[#FFF7ED] shadow-sm ring-1 ring-orange-500/20"
                      : "border-stone-200/80 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100/60 text-orange-600 mb-1.5 overflow-hidden">
                    {cat.image ? (
                      <img src={resolveAssetUrl(cat.image)} alt="" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <IconComponent size={22} className={isActive ? "text-orange-600" : "text-amber-600"} />
                    )}
                  </div>
                  <span
                    className={`text-center text-xs font-semibold leading-tight max-w-[90px] line-clamp-2 ${
                      isActive ? "text-orange-700" : "text-stone-700"
                    }`}
                  >
                    {title}
                  </span>
                  {isActive && <div className="mt-1.5 h-1 w-8 rounded-full bg-orange-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Featured / Special Hero banner (Optional highlight) */}
        {!isSearching && heroSpecial && (
          <div
            onClick={() => setDetailItem(heroSpecial)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-3 shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              {heroSpecial.image ? (
                <img
                  src={resolveAssetUrl(heroSpecial.image)}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <FaUtensils size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700">
                  <HiOutlineSparkles size={11} /> {t.todaysSpecial}
                </span>
                <h3 className="mt-1 truncate font-bold text-stone-900 text-sm group-hover:text-orange-600 transition-colors">
                  {getItemDisplayName(heroSpecial)}
                </h3>
                <p className="mt-0.5 text-xs font-bold text-orange-600">
                  {currency} {formatPrice(heroSpecial.discountPrice ?? heroSpecial.price)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Header & View Mode Switcher */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-base font-bold text-stone-900 tracking-tight">
            {isSearching
              ? `"${search.trim()}"`
              : getCategoryTitle(data.categories.find((c) => c.id === currentCategory)?.name ?? "")}
          </h2>

          <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 border border-stone-200/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === "grid" ? "bg-white text-orange-600 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
              }`}
              aria-label="Grid View"
            >
              <HiOutlineSquares2X2 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === "list" ? "bg-white text-orange-600 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
              }`}
              aria-label="List View"
            >
              <HiOutlineBars3 size={16} />
            </button>
          </div>
        </div>

        {/* Menu Items List / Grid */}
        {currentItems.length === 0 ? (
          <EmptyState title={t.noItemsFound} description="" />
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {currentItems.map((item, i) => {
              const displayName = getItemDisplayName(item);
              const priceVal = item.discountPrice ?? item.price;
              const formattedPrice = `${currency} ${formatPrice(priceVal)}`;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => setDetailItem(item)}
                  className="group relative flex cursor-pointer gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 shadow-xs hover:border-orange-300 hover:shadow-md transition-all"
                >
                  {/* Left: Dish Image */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    {item.image ? (
                      <img
                        src={resolveAssetUrl(item.image)}
                        alt={displayName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
                        <FaBowlFood size={28} />
                      </div>
                    )}
                  </div>

                  {/* Right: Dish Content */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <VegDot isVeg={item.isVeg} />
                        <h3 className="truncate text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                          {displayName}
                        </h3>
                      </div>

                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-stone-500 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Rating & prep time */}
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span className="flex items-center gap-0.5 font-medium text-amber-600">
                          <FaStar size={11} /> 4.6
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-stone-400">
                          <HiOutlineClock size={12} /> {t.categoryNames["prepTime"] || "15-20 min"}
                        </span>
                      </div>

                      {/* Price (Clean, prominent) */}
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-orange-600 tracking-tight">
                          {formattedPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-2 gap-3">
            {currentItems.map((item, i) => {
              const displayName = getItemDisplayName(item);
              const priceVal = item.discountPrice ?? item.price;
              const formattedPrice = `${currency} ${formatPrice(priceVal)}`;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => setDetailItem(item)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-xs hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                    {item.image ? (
                      <img
                        src={resolveAssetUrl(item.image)}
                        alt={displayName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
                        <FaBowlFood size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs rounded-md p-1 shadow-xs">
                      <VegDot isVeg={item.isVeg} />
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="truncate text-xs sm:text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                        {displayName}
                      </h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-stone-500">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                        <FaStar size={10} /> 4.6
                      </span>
                      <span className="text-xs font-extrabold text-orange-600">
                        {formattedPrice}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Thank You Footer Card (Exact match to reference image bottom card) */}
        <div className="mt-6 rounded-2xl border border-orange-200/70 bg-[#FFF7ED] p-4 text-stone-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <FaUtensils size={20} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm tracking-tight">{t.thankYouTitle}</h3>
              <p className="mt-0.5 text-xs text-stone-600 font-medium">{t.thankYouSubtitle}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Item Detail Modal (View Only) */}
      <AnimatePresence>
        {detailItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setDetailItem(null)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-stone-200"
            >
              <button
                onClick={() => setDetailItem(null)}
                className={`absolute ${
                  lang === "ar" ? "left-4" : "right-4"
                } top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/60 text-white backdrop-blur-md hover:bg-stone-900 transition-colors`}
              >
                <HiOutlineXMark size={20} />
              </button>

              <div className="max-h-[82vh] overflow-y-auto p-5 text-stone-800 scrollbar-none">
                {/* Image */}
                <div className="relative mx-auto h-52 w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm">
                  {detailItem.image ? (
                    <img
                      src={resolveAssetUrl(detailItem.image)}
                      alt={getItemDisplayName(detailItem)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
                      <FaBowlFood size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-xs">
                    <VegDot isVeg={detailItem.isVeg} />
                    <span className="text-xs font-bold text-stone-700">
                      {detailItem.isVeg ? "VEG" : "NON-VEG"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-stone-900">{getItemDisplayName(detailItem)}</h2>
                  <p className="mt-1 text-2xl font-extrabold text-orange-600">
                    {currency} {formatPrice(detailItem.discountPrice ?? detailItem.price)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {detailItem.isBestseller && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        <FaStar size={11} /> {t.bestseller}
                      </span>
                    )}
                    {detailItem.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                        <HiOutlineSparkles size={12} /> {t.featured}
                      </span>
                    )}
                    {spicyDots[detailItem.spicyLevel] > 0 && (
                      <span className="text-xs text-red-500 font-bold">
                        {"🌶️".repeat(spicyDots[detailItem.spicyLevel])}
                      </span>
                    )}
                  </div>

                  {detailItem.description && (
                    <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                      {detailItem.description}
                    </p>
                  )}

                  {detailItem.ingredients.length > 0 && (
                    <div className="mt-4 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 text-center">
                        {t.ingredients}
                      </h4>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {detailItem.ingredients.map((ing) => (
                          <span
                            key={ing}
                            className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 border border-stone-200/60"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setDetailItem(null)}
                    className="mt-6 w-full rounded-2xl bg-stone-900 py-3.5 text-sm font-bold text-white hover:bg-stone-800 transition-colors shadow-md"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
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
      className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-2 ${
        isVeg ? "border-emerald-600" : "border-rose-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isVeg ? "bg-emerald-600" : "bg-rose-600"}`} />
    </span>
  );
}
