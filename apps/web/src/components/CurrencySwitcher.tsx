"use client";

import { usePathname } from "next/navigation";
import { displayCurrenciesForCountry } from "@blossompot/shared";
import { useCurrency } from "@/lib/currency-context";
import { useStorefrontCountryIso } from "@/lib/use-storefront-country";

export function CurrencySwitcher() {
  const pathname = usePathname();
  const countryIso = useStorefrontCountryIso();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const options = displayCurrenciesForCountry(countryIso || "US");

  if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email")) return null;

  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/orders")
  ) {
    return null;
  }

  const value = options.includes(displayCurrency) ? displayCurrency : options[0];

  return (
    <div
      className="fixed right-0 z-30 overflow-hidden rounded-l-xl shadow-[0_8px_18px_rgba(74,21,44,0.18)] pointer-events-auto bottom-[9.25rem] md:bottom-auto md:top-1/2 md:-translate-y-1/2"
      role="group"
      aria-label="Display currency"
    >
      {options.map((code) => {
        const selected = code === value;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => setDisplayCurrency(code)}
            className={`relative block h-11 w-[4.5rem] border-0 px-2 text-center text-xs font-bold tracking-wide cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
              selected ? "bg-[var(--primary-deep)] text-white" : "bg-[#f8e4ee] text-[var(--primary-deep)]"
            }`}
          >
            {code}
            {selected ? (
              <span
                className="pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
