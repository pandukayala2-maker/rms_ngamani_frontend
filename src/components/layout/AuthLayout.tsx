import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-card relative z-10 w-full max-w-md bg-[var(--bg-surface)] p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            Q
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">QR Menu POS</p>
            <p className="text-xs text-[var(--text-muted)] leading-tight">Restaurant Management System</p>
          </div>
        </div>
        <Outlet />
      </motion.div>
    </div>
  );
}
