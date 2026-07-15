import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUtensils } from "react-icons/fa6";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl shadow-black/40"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/40">
            <FaUtensils className="text-neutral-950" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Nagami Hotel</p>
            <p className="text-xs text-neutral-400 leading-tight">Restaurant Management System</p>
          </div>
        </div>
        <div className="[&_h2]:text-white [&_p]:text-neutral-400 [&_label>span]:text-neutral-400 [&_input]:bg-neutral-800 [&_input]:border-white/10 [&_input]:text-white [&_input::placeholder]:text-neutral-500 [&_a]:text-amber-400">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
