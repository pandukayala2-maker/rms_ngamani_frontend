import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  HiOutlineBanknotes,
  HiOutlineShoppingBag,
  HiOutlineChartBarSquare,
  HiOutlineCurrencyRupee,
  HiOutlineSquares2X2,
  HiOutlineEyeSlash,
  HiOutlineArchiveBox,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineTableCells,
} from "react-icons/hi2";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { SkeletonCards, Skeleton } from "../../components/ui/Skeleton";
import { useThemeStore } from "../../store/themeStore";
import {
  useCategorySales,
  useDailySales,
  useDashboardKpis,
  useMonthlySales,
  useTopSellingItems,
} from "../../hooks/useDashboard";
import { categorical, chartChrome } from "../../lib/chartColors";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Dashboard() {
  const { theme } = useThemeStore();
  const mode = theme === "dark" ? "dark" : "light";
  const chrome = chartChrome[mode];
  const colors = categorical[mode];

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: daily, isLoading: dailyLoading } = useDailySales();
  const { data: monthly, isLoading: monthlyLoading } = useMonthlySales();
  const { data: categorySales, isLoading: categoryLoading } = useCategorySales();
  const { data: topItems, isLoading: topLoading } = useTopSellingItems();

  return (
    <div className="space-y-6">
      {kpisLoading || !kpis ? (
        <SkeletonCards count={10} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Today's Sales" value={currency.format(kpis.todaySales)} icon={<HiOutlineBanknotes size={20} />} />
          <StatCard label="Orders Today" value={String(kpis.todayOrders)} icon={<HiOutlineShoppingBag size={20} />} />
          <StatCard label="Revenue" value={currency.format(kpis.revenue)} icon={<HiOutlineCurrencyRupee size={20} />} />
          <StatCard label="Profit (est.)" value={currency.format(kpis.profit)} icon={<HiOutlineChartBarSquare size={20} />} />
          <StatCard label="Active Menu Items" value={String(kpis.activeMenuItems)} icon={<HiOutlineSquares2X2 size={20} />} />
          <StatCard label="Hidden Items" value={String(kpis.hiddenMenuItems)} icon={<HiOutlineEyeSlash size={20} />} />
          <StatCard label="Inventory Value" value={currency.format(kpis.inventoryValue)} icon={<HiOutlineArchiveBox size={20} />} />
          <StatCard
            label="Low Stock"
            value={String(kpis.lowStock)}
            icon={<HiOutlineExclamationTriangle size={20} />}
            accent={kpis.lowStock > 0 ? "text-amber-500" : "text-brand-600"}
          />
          <StatCard label="Customers" value={String(kpis.customers)} icon={<HiOutlineUserGroup size={20} />} />
          <StatCard label="Tables" value={String(kpis.tables)} icon={<HiOutlineTableCells size={20} />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Sales (Last 7 Days)</CardTitle>
          </CardHeader>
          {dailyLoading || !daily ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[0]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
                <XAxis dataKey="date" stroke={chrome.axis} tick={{ fill: chrome.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke={chrome.axis} tick={{ fill: chrome.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: chrome.surface, border: `1px solid ${chrome.grid}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => currency.format(value)}
                />
                <Area type="monotone" dataKey="total" stroke={colors[0]} strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          {categoryLoading || !categorySales ? (
            <Skeleton className="h-64 w-full" />
          ) : categorySales.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--text-muted)]">No completed sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categorySales.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} stroke={chrome.surface} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: chrome.surface, border: `1px solid ${chrome.grid}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => currency.format(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {categorySales && categorySales.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {categorySales.map((c, i) => (
                <span key={c.category} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                  {c.category}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          {monthlyLoading || !monthly ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chrome.axis} tick={{ fill: chrome.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke={chrome.axis} tick={{ fill: chrome.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: chrome.surface, border: `1px solid ${chrome.grid}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => currency.format(value)}
                />
                <Bar dataKey="total" fill={colors[1]} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          {topLoading || !topItems ? (
            <Skeleton className="h-64 w-full" />
          ) : topItems.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--text-muted)]">No completed sales yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.menuItemId} className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: colors[i % colors.length] }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.quantitySold} sold</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{currency.format(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
