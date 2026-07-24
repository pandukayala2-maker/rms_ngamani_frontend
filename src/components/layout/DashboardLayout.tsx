import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "framer-motion";
import { moduleForPath } from "../../config/modules";

const titles: Record<string, string> = {
  "/": "Modules",
  "/admin": "Dashboard",
  "/admin/branches": "Branches",
  "/admin/shifts": "Shift Slot",
  "/admin/departments": "Department",
  "/admin/designations": "Designation",
  "/admin/employees": "Employee",
  "/admin/role-management": "Role Management",
  "/admin/inventory": "Inventory",
  "/admin/settings": "Settings",
  "/pos": "POS Counter",
  "/menu": "Menu Items",
  "/menu/categories": "Category",
  "/menu/qr": "QR Screen",
  "/accounts": "POS Reports",
  "/accounts/orders": "Orders",
  "/accounts/profit-loss": "Profit & Loss",
  "/accounts/balance-sheet": "Balance Sheet",
  "/accounts/expenses": "Expenses",
  "/accounts/customers": "Customers",
  "/accounts/tables": "Tables",
  "/accounts/chart-of-accounts": "Chart of Accounts",
};

export function DashboardLayout() {
  const location = useLocation();
  const isHub = location.pathname === "/";
  const activeModule = moduleForPath(location.pathname);
  // Modules with a single nav item (e.g. POS Counter) skip the sidebar
  // entirely — a sidebar with one link is just wasted screen space.
  const showSidebar = !isHub && (activeModule?.items.length ?? 0) > 1;
  const title =
    titles[location.pathname] ??
    titles[`/${location.pathname.split("/")[1]}`] ??
    "Nagami Restaurant";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      {showSidebar && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="h-full min-h-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
