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
    <div className="bg-ivory border-b border-line text-ink">
      <div className="store-wrap py-2 md:py-2.5 flex flex-wrap items-center justify-between gap-2 type-nav">
        <p>Select your delivery location to see products available near you.</p>
        <button
          type="button"
          onClick={() => openSelector()}
          className="font-semibold text-nav underline underline-offset-2"
        >
          Choose location
        </button>
      </div>
    </div>
  );
}
