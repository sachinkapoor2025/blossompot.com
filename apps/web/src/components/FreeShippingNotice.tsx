"use client";

import {
  FREE_SHIPPING_MIN_SUBTOTAL_USD,
  REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
  type FreeShippingQuote,
} from "@blossompot/shared";
import type { DisplayCurrency } from "@/lib/currency-context";

type Props = {
  quote: FreeShippingQuote;
  formatMoney: (amount: number, currency: DisplayCurrency) => string;
  currency: DisplayCurrency;
  className?: string;
};

function moneyLabel(
  usdAmount: number,
  amountInCurrency: number,
  currency: DisplayCurrency,
  formatMoney: Props["formatMoney"]
): string {
  return currency === "USD" ? `$${usdAmount}` : formatMoney(amountInCurrency, currency);
}

/** Upsell when cart is below the free-shipping threshold. */
export function FreeShippingNotice({ quote, formatMoney, currency, className = "" }: Props) {
  if (quote.qualifiesForFreeShipping) {
    return (
      <div
        className={`text-xs text-green-800 bg-green-50 border border-green-100 rounded-md px-3 py-2 ${className}`}
      >
        <p className="font-semibold">Free shipping unlocked on this order.</p>
      </div>
    );
  }

  const freeLabel = moneyLabel(
    FREE_SHIPPING_MIN_SUBTOTAL_USD,
    quote.thresholdInCurrency,
    currency,
    formatMoney
  );
  const reducedLabel = moneyLabel(
    REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
    quote.reducedThresholdInCurrency,
    currency,
    formatMoney
  );
  const lowFee = formatMoney(quote.lowTierFeeInCurrency, currency);
  const midFee = formatMoney(quote.midTierFeeInCurrency, currency);

  if (quote.tier === "mid") {
    return (
      <div
        className={`text-xs text-amber-950 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 ${className}`}
      >
        <p className="font-semibold mb-1">Shipping today: {midFee}</p>
        <ul className="list-disc pl-4 space-y-0.5 leading-snug">
          <li>
            Add {formatMoney(quote.amountAwayFromFreeShipping, currency)} more to get{" "}
            <strong>free shipping</strong> ({freeLabel}+)
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`text-xs text-amber-950 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 ${className}`}
    >
      <p className="font-semibold mb-1">Shipping today: {lowFee}</p>
      <ul className="list-disc pl-4 space-y-0.5 leading-snug">
        <li>
          Add {formatMoney(quote.amountAwayFromReducedShipping, currency)} more → shipping drops to{" "}
          <strong>{midFee}</strong> ({reducedLabel}+)
        </li>
        <li>
          Add {formatMoney(quote.amountAwayFromFreeShipping, currency)} more →{" "}
          <strong>free shipping</strong> ({freeLabel}+)
        </li>
      </ul>
    </div>
  );
}
