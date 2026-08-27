"use client";

import { usePathname } from "next/navigation";
import { useCurrency, type DisplayCurrency } from "@/lib/currency-context";

function CurrencyButton({
  label,
  active,
  onClick,
  activeClass,
}: {
  label: DisplayCurrency;
  active: boolean;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Show prices in ${label}`}
      className={`w-11 sm:w-12 py-3 sm:py-3.5 text-[11px] sm:text-xs font-bold tracking-wide text-white transition-colors ${
        active ? activeClass : "bg-slate-800/90 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

export function CurrencySwitcher() {
  const pathname = usePathname();
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email")) return null;

  // Hide on checkout/cart so the rail does not cover payment badges on mobile.
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/orders")
  ) {
    return null;
  }

  return (
    <div
      className="fixed right-0 top-[58%] md:top-1/2 -translate-y-1/2 z-30 flex flex-col shadow-lg rounded-l-md overflow-hidden pointer-events-auto"
      role="group"
      aria-label="Currency switcher"
    >
      <CurrencyButton
        label="USD"
        active={displayCurrency === "USD"}
        onClick={() => setDisplayCurrency("USD")}
        activeClass="bg-primary"
      />
      <CurrencyButton
        label="INR"
        active={displayCurrency === "INR"}
        onClick={() => setDisplayCurrency("INR")}
        activeClass="bg-[#f88379]"
      />
    </div>
  );
}
