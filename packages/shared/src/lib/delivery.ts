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
  return `Arrives ${formatDeliveryDate(start)} – ${formatDeliveryDate(end)} (USA)`;
}

export function estimatedDeliveryShort(from = new Date()): string {
  const { start, end } = estimatedDeliveryRange(from);
  return `${formatDeliveryDate(start)} – ${formatDeliveryDate(end)}`;
}

const SAME_DAY_CATEGORY_SLUGS = new Set([
  "same-day-gifts",
  "flowers",
  "flower-bouquets",
  "cakes",
  "celebration-gifts",
]);

/**
 * Unified delivery promise for banners, PDP, category, geo, and checkout.
 * Same-day is only claimed when the product/category supports it AND a zip is in a same-day market
 * (zip lookup is optional — without zip we never claim same-day).
 */
export function getDeliveryPromise(
  product?: { categorySlug?: string; tags?: string[] } | null,
  zip?: string | null,
  from = new Date()
): DeliveryPromise {
  const estimatedWindow = estimatedDeliveryRange(from);
  const category = product?.categorySlug ?? "";
  const tags = product?.tags ?? [];
  const categoryAllowsSameDay =
    SAME_DAY_CATEGORY_SLUGS.has(category) ||
    tags.some((t) => /same-?day/i.test(t));

  // Conservative: only mark same-day eligible when a ZIP is provided AND category allows it.
  // City-level cutoffs live in geo config; without ZIP we advertise standard USA window.
  const sameDayEligible = Boolean(zip && categoryAllowsSameDay && /^\d{5}/.test(zip.trim()));

  if (sameDayEligible) {
    return {
      sameDayEligible: true,
      cutoffLocal: "14:00",
      estimatedWindow: { start: from, end: from },
      copy: {
        short: "Same-day delivery available for this ZIP",
        label: "Same-day delivery (order before local cut-off)",
        banner: "Same-day gifting in select cities when you order before the local cut-off",
      },
    };
  }

  return {
    sameDayEligible: false,
    cutoffLocal: null,
    estimatedWindow,
    copy: {
      short: `Est. ${estimatedDeliveryShort(from)}`,
      label: estimatedDeliveryLabel(from),
      banner: "USA delivery typically 5–7 business days · same-day in select cities",
    },
  };
}
