import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "framer-motion";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/pos": "POS Counter",
  "/orders": "Orders",
  "/menu": "Menu Management",
  "/qr-codes": "QR Menu Management",
  "/tables": "Tables",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/staff": "Staff",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export function DashboardLayout() {
  const location = useLocation();
  const title =
    titles[location.pathname] ??
    titles[`/${location.pathname.split("/")[1]}`] ??
    "QR Menu POS";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
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
