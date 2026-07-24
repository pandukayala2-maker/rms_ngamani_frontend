import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl shadow-black/40"
      >
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="Nadhamuni Restaurant" className="h-11 w-11 rounded-xl object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Nadhamuni Restaurant</p>
            <p className="text-xs text-neutral-400 leading-tight">Good Food, Good Mood</p>
          </div>
        </div>
        <div className="[&_h2]:text-white [&_p]:text-neutral-400 [&_label>span]:text-neutral-400 [&_input]:bg-neutral-800 [&_input]:border-white/10 [&_input]:text-white [&_input::placeholder]:text-neutral-500 [&_a]:text-brand-400">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
