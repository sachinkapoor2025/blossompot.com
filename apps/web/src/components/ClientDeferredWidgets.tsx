"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { DeliveryLocationModal } from "@/components/DeliveryLocationModal";
import { DeliveryLocationPrompt } from "@/components/DeliveryLocationPrompt";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import {
  EXIT_INTENT_SHOW_AFTER_MS,
  EXIT_INTENT_STORAGE_KEY,
  EXIT_INTENT_TIMER_START_KEY,
  exitIntentBlockedPath,
} from "@/lib/exit-intent-timing";

const ChatWidget = dynamic(() => import("@/components/ChatWidget").then((m) => m.ChatWidget), {
  ssr: false,
  loading: () => null,
});

/** Loads the discount popup, and its phone metadata, only once it is allowed to open. */
function ExitIntentSlot() {
  const pathname = usePathname();
  const delivery = useOptionalDeliveryLocation();
  const [Popup, setPopup] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (Popup) return;
    if (exitIntentBlockedPath(pathname)) return;
    if (sessionStorage.getItem(EXIT_INTENT_STORAGE_KEY)) return;

    let startedAt = Number(sessionStorage.getItem(EXIT_INTENT_TIMER_START_KEY) || 0);
    if (!startedAt) {
      startedAt = Date.now();
      sessionStorage.setItem(EXIT_INTENT_TIMER_START_KEY, String(startedAt));
    }
    if (delivery?.selectorOpen) return;

    const remaining = Math.max(0, EXIT_INTENT_SHOW_AFTER_MS - (Date.now() - startedAt));
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(EXIT_INTENT_STORAGE_KEY)) return;
      if (exitIntentBlockedPath(window.location.pathname)) return;
      void import("@/components/ExitIntentPopup").then((mod) => {
        setPopup(() => mod.ExitIntentPopup);
      });
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [Popup, pathname, delivery?.selectorOpen]);

  if (!Popup) return null;
  return <Popup />;
}

/** Client-only widgets loaded after hydration (reduces initial JS). */
export function ClientDeferredWidgets() {
  return (
    <>
      <DeliveryLocationPrompt />
      <DeliveryLocationModal />
      <ChatWidget />
      <ExitIntentSlot />
    </>
  );
}
