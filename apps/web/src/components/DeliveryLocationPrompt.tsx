"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { classifyUserAgent } from "@/lib/crawler-policy";
import { wasLocationPromptDismissed } from "@/lib/delivery-location";
import { useDeliveryLocation } from "@/lib/delivery-location-context";

const HIDDEN = ["/admin", "/vendor", "/checkout", "/account", "/cart"];

export function DeliveryLocationPrompt() {
  const pathname = usePathname();
  const { location, ready, selectorOpen, openSelector } = useDeliveryLocation();

  useEffect(() => {
    if (!ready || location || selectorOpen) return;
    if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    if (wasLocationPromptDismissed()) return;
    if (typeof navigator !== "undefined") {
      const kind = classifyUserAgent(navigator.userAgent);
      if (kind.class !== "unknown") return;
    }
    openSelector();
  }, [ready, location, selectorOpen, pathname, openSelector]);

  return null;
}