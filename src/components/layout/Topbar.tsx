import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineMoon, HiOutlineSun, HiOutlineArrowRightOnRectangle, HiOutlineBanknotes } from "react-icons/hi2";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useAuth";
import { useCurrentSession, useCloseSession } from "../../hooks/usePosSessions";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { getErrorMessage } from "../../lib/axios";
import { useNavigate } from "react-router-dom";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function Topbar({ title }: { title: string }) {
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const { data: currentSession } = useCurrentSession();
  const closeSession = useCloseSession();
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingCash, setClosingCash] = useState("");

  const handleClose = () => {
    if (!currentSession) return;
    const amount = Number(closingCash);
    if (Number.isNaN(amount) || amount < 0) return toast.error("Enter a valid closing cash amount");
    closeSession.mutate(
      { id: currentSession.id, closingCash: amount },
      {
        onSuccess: (result) => {
          toast.success(
            result.variance === 0
              ? "Counter closed — cash matched exactly"
              : `Counter closed — ${result.variance > 0 ? "over" : "short"} by ${currency.format(Math.abs(result.variance))}`
          );
          setCloseModalOpen(false);
          setClosingCash("");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)]/70 px-6 backdrop-blur-xl">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {currentSession && (
          <Button size="sm" variant="outline" onClick={() => setCloseModalOpen(true)}>
            <HiOutlineBanknotes size={14} className="mr-1" /> Close Counter
          </Button>
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium">{user?.name}</span>
          <span className="text-xs text-[var(--text-muted)]">{user?.role}</span>
        </div>
        <button
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/login") })}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          aria-label="Logout"
          title="Logout"
        >
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>

      <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Close Counter" maxWidth="max-w-sm">
        <div className="space-y-4">
          {currentSession && (
            <p className="text-sm text-[var(--text-secondary)]">
              Opened with {currency.format(currentSession.openingCash)}. Count the cash drawer and enter the total below.
            </p>
          )}
          <Input
            label="Closing Cash"
            type="number"
            min={0}
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            placeholder="0"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose} isLoading={closeSession.isPending}>
              Close Counter
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
