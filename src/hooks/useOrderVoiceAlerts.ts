import { useEffect, useRef, useState } from "react";
import type { Order } from "../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// Speaks a short announcement whenever a PENDING order appears that wasn't
// there on the previous poll. Voice starts muted until the user opts in,
// since browsers require a user gesture before speech synthesis is allowed
// to run reliably.
export function useOrderVoiceAlerts(orders: Order[] | undefined) {
  const [enabled, setEnabled] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!orders) return;

    if (seenIds.current === null) {
      // First load: remember what's already there without announcing it.
      seenIds.current = new Set(orders.map((o) => o.id));
      return;
    }

    const newPending = orders.filter((o) => o.status === "PENDING" && !seenIds.current!.has(o.id));
    for (const order of orders) seenIds.current.add(order.id);

    if (enabled && newPending.length > 0) {
      for (const order of newPending) {
        speak(
          `New order received. Order number ${order.orderNumber.split("-").pop()}, ${order.items.length} items, total ${currency.format(order.total)}.`
        );
      }
    }
  }, [orders, enabled]);

  return {
    enabled,
    toggle: () => {
      setEnabled((prev) => {
        const next = !prev;
        if (next) speak("Voice alerts enabled.");
        else window.speechSynthesis?.cancel();
        return next;
      });
    },
  };
}
