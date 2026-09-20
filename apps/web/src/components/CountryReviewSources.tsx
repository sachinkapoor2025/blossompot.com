"use client";

import { reviewSourcesForCountry } from "@/lib/review-sources";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";

export function CountryReviewSources({
  countryCode,
  compact = false,
}: {
  countryCode?: string | null;
  compact?: boolean;
}) {
  const delivery = useOptionalDeliveryLocation();
  const iso = countryCode || delivery?.location?.countryCode || "US";
  const sources = reviewSourcesForCountry(iso);

  return (
    <div className={compact ? "mt-4" : "mt-6"}>
      <p className={`font-semibold text-primary ${compact ? "text-sm mb-2" : "text-base mb-3"}`}>
        Review BlossomPot in your country
      </p>
      <ul className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {sources.map((source) => (
          <li key={source.id}>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-xl border border-primary/15 bg-white px-4 py-3 hover:border-primary/40 hover:bg-petal/50"
            >
              <span className="font-semibold text-nav">{source.name}</span>
              <span className="mt-1 block text-xs text-slate-600 leading-relaxed">{source.blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
