import { useEffect, useRef, useState } from "react";
import { speakOrder } from "../lib/receipt";
import type { Order } from "../types";

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
        speakOrder(order);
      }
    }
  }, [orders, enabled]);

  return {
    enabled,
    toggle: () => {
      setEnabled((prev) => {
        const next = !prev;
        if (next) {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Voice alerts enabled. Listening for new orders.");
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          }
        } else {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        }
        return next;
      });
    },
  };
}
