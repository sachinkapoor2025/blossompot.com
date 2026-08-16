"use client";

import { headerLocationLabel } from "@/lib/delivery-location";
import { useDeliveryLocation } from "@/lib/delivery-location-context";

export function DeliveryLocationChip({ compact = false }: { compact?: boolean }) {
  const { location, openSelector, checking } = useDeliveryLocation();

  return (
    <button
      type="button"
      onClick={openSelector}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-left hover:border-nav hover:bg-blue-50 transition ${
        compact ? "max-w-[11rem]" : "max-w-[16rem]"
      }`}
      aria-label={location ? `Change delivery location, currently ${location.postalDisplay}` : "Choose delivery location"}
    >
      <span aria-hidden>📍</span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] sm:text-xs font-semibold text-slate-800">
          {location ? headerLocationLabel(location) : "Deliver to…"}
        </span>
        <span className="block text-[10px] text-nav font-medium">
          {checking ? "Checking…" : "Change"}
        </span>
      </span>
    </button>
  );
}
