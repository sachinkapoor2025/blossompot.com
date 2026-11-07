"use client";

import dynamic from "next/dynamic";
import { DeliveryLocationModal } from "@/components/DeliveryLocationModal";
import { DeliveryLocationPrompt } from "@/components/DeliveryLocationPrompt";

const ChatWidget = dynamic(() => import("@/components/ChatWidget").then((m) => m.ChatWidget), {
  ssr: false,
  loading: () => null,
});

const ExitIntentPopup = dynamic(
  () => import("@/components/ExitIntentPopup").then((m) => m.ExitIntentPopup),
  { ssr: false, loading: () => null }
);

/** Client-only widgets loaded after hydration (reduces initial JS). */
export function ClientDeferredWidgets() {
  return (
    <>
      <DeliveryLocationPrompt />
      <DeliveryLocationModal />
      <ChatWidget />
      <ExitIntentPopup />
    </>
  );
}
