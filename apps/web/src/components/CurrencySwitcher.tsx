"use client";

import { usePathname } from "next/navigation";
import { storefrontCurrenciesForDelivery } from "@blossompot/shared";
import { useCurrency, type DisplayCurrency } from "@/lib/currency-context";

export function CurrencySwitcher() {
  const pathname = usePathname();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const options = storefrontCurrenciesForDelivery();

  if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email")) return null;

  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/orders")
  ) {
    return null;
  }

  const value = options.includes(displayCurrency) ? displayCurrency : "USD";

  return (
    <div
      className="fixed right-0 top-[58%] md:top-1/2 -translate-y-1/2 z-30 shadow-lg rounded-l-md overflow-hidden pointer-events-auto bg-slate-900/95"
      aria-label="Currency"
    >
      <label className="sr-only" htmlFor="storefront-currency">
        Display currency
      </label>
      <select
        id="storefront-currency"
        value={value}
        onChange={(e) => setDisplayCurrency(e.target.value as DisplayCurrency)}
        title="Display currency"
        className="appearance-none bg-primary text-white font-bold text-[11px] sm:text-xs tracking-wide py-3 sm:py-3.5 pl-2.5 pr-7 w-[4.5rem] sm:w-[5.25rem] max-w-[30vw] border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='white' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.45rem center",
        }}
      >
        {options.map((code) => (
          <option key={code} value={code} className="bg-white text-slate-900">
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
