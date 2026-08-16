"use client";

import { usePathname } from "next/navigation";
import { useDeliveryLocation } from "@/lib/delivery-location-context";

const HIDDEN = ["/admin", "/vendor", "/checkout"];

export function DeliveryLocationBanner() {
  const pathname = usePathname();
  const { location, ready, openSelector } = useDeliveryLocation();
  if (!ready || location) return null;
  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-100 text-amber-950">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>Select your delivery location to see products available near you.</p>
        <button
          type="button"
          onClick={openSelector}
          className="font-semibold text-nav underline underline-offset-2"
        >
          Choose location
        </button>
      </div>
    </div>
  );
}
