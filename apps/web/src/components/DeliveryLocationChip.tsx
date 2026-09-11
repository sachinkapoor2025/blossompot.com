"use client";

import { headerLocationLabel } from "@/lib/delivery-location";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { useGboDeliveryCountries } from "@/lib/gbo-delivery-countries";

export function DeliveryLocationChip({ compact = false }: { compact?: boolean }) {
  const { location, openSelector, checking } = useDeliveryLocation();
  const { countries } = useGboDeliveryCountries();
  const countryName = location
    ? countries.find((c) => c.countryCode === location.countryCode)?.countryName
    : undefined;
  const label = location ? headerLocationLabel(location, countryName) : "Deliver to…";
  const compactLabel = location
    ? location.postalCode || countryName || location.countryCode
    : "Deliver";

  return (
    <button
      type="button"
      onClick={() => openSelector()}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white text-left hover:border-nav hover:bg-blue-50 transition ${
        compact ? "max-w-[7rem] shrink-0 px-2 py-1.5" : "max-w-[16rem] px-2.5 py-1"
      }`}
      aria-label={location ? `Change delivery location, currently ${label}` : "Choose delivery location"}
    >
      <span aria-hidden>📍</span>
      <span className="min-w-0">
        {compact ? (
          <span className="block truncate text-[11px] font-semibold text-slate-800">
            {location ? (checking ? "Checking…" : compactLabel) : "Deliver"}
          </span>
        ) : (
          <>
            <span className="block truncate text-[11px] sm:text-xs font-semibold text-slate-800">
              {location ? label : "Deliver to…"}
            </span>
            <span className="block text-[10px] text-nav font-medium">
              {checking ? "Checking…" : "Change"}
            </span>
          </>
        )}
      </span>
    </button>
  );
}
