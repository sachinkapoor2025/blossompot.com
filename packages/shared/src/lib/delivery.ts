/** Single source of truth for storefront delivery promises. */

export type DeliveryPromise = {
  sameDayEligible: boolean;
  cutoffLocal: string | null;
  estimatedWindow: { start: Date; end: Date };
  copy: {
    short: string;
    label: string;
    banner: string;
  };
};

/** US standard transit estimate: 5–7 business days from today. */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date;
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function estimatedDeliveryRange(from = new Date()): { start: Date; end: Date } {
  return {
    start: addBusinessDays(from, 5),
    end: addBusinessDays(from, 7),
  };
}

export function estimatedDeliveryLabel(from = new Date()): string {
  const { start, end } = estimatedDeliveryRange(from);
  return `Arrives ${formatDeliveryDate(start)} – ${formatDeliveryDate(end)}`;
}

export function estimatedDeliveryShort(from = new Date()): string {
  const { start, end } = estimatedDeliveryRange(from);
  return `${formatDeliveryDate(start)} – ${formatDeliveryDate(end)}`;
}

/**
 * Unified delivery promise for banners, PDP, category, geo, and checkout.
 * Storefront copy uses the standard worldwide window — not same-day claims.
 */
export function getDeliveryPromise(
  _product?: { categorySlug?: string; tags?: string[] } | null,
  _zip?: string | null,
  from = new Date()
): DeliveryPromise {
  const estimatedWindow = estimatedDeliveryRange(from);
  return {
    sameDayEligible: false,
    cutoffLocal: null,
    estimatedWindow,
    copy: {
      short: `Est. ${estimatedDeliveryShort(from)}`,
      label: estimatedDeliveryLabel(from),
      banner: "Worldwide delivery · timing depends on destination",
    },
  };
}
