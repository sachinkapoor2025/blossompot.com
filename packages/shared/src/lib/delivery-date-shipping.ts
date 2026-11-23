import {
  convertCurrency,
  roundDisplayAmount,
  type DisplayCurrency,
} from "./currency-display";
import {
  calendarDayKeyAmericaNy,
  isScheduleDeliveryClosedDay,
  scheduleDeliveryMaxDate,
  scheduleDeliveryMinDate,
} from "./early-bird";

/** Same calendar day as today in America/New_York. */
export const SAME_DAY_SHIPPING_USD = 20;
/** Tomorrow in America/New_York. */
export const NEXT_DAY_SHIPPING_USD = 18;
/** 2 or 3 calendar days from today. */
export const WITHIN_3_DAYS_SHIPPING_USD = 16;
/** 4 or 5 calendar days from today, and any later scheduled date. */
export const WITHIN_5_DAYS_SHIPPING_USD = 0;

export type DeliveryDateShippingTier =
  | "same_day"
  | "next_day"
  | "within_3_days"
  | "within_5_days"
  | "later";

function addIsoDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + days));
  return next.toISOString().slice(0, 10);
}

/** First weekday the existing calendar can select (tomorrow or the next open day). */
export function earliestOpenScheduleDeliveryDate(now = new Date()): string {
  let cursor = scheduleDeliveryMinDate(now);
  const max = scheduleDeliveryMaxDate(now);
  while (cursor <= max && isScheduleDeliveryClosedDay(cursor)) {
    cursor = addIsoDays(cursor, 1);
  }
  return cursor;
}

/**
 * Date used to price shipping. A valid calendar selection wins; otherwise the
 * soonest open weekday, which is what the picker offers first.
 */
export function effectiveScheduleDeliveryDate(selected: string, now = new Date()): string {
  const trimmed = selected.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || isScheduleDeliveryClosedDay(trimmed)) {
    return earliestOpenScheduleDeliveryDate(now);
  }
  const today = calendarDayKeyAmericaNy(now);
  const max = scheduleDeliveryMaxDate(now);
  // Today is same-day shipping. The picker still starts tomorrow.
  if (trimmed >= today && trimmed <= max) return trimmed;
  return earliestOpenScheduleDeliveryDate(now);
}

/** Calendar days from today (America/New_York) until `deliveryYmd`. */
export function calendarDaysUntilDelivery(deliveryYmd: string, now = new Date()): number {
  const today = calendarDayKeyAmericaNy(now);
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = deliveryYmd.split("-").map(Number);
  const from = Date.UTC(y1!, m1! - 1, d1!);
  const to = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((to - from) / 86_400_000);
}

export function deliveryDateShippingTier(daysFromToday: number): DeliveryDateShippingTier {
  if (daysFromToday <= 0) return "same_day";
  if (daysFromToday === 1) return "next_day";
  if (daysFromToday <= 3) return "within_3_days";
  if (daysFromToday <= 5) return "within_5_days";
  return "later";
}

export function deliveryDateShippingUsd(tier: DeliveryDateShippingTier): number {
  switch (tier) {
    case "same_day":
      return SAME_DAY_SHIPPING_USD;
    case "next_day":
      return NEXT_DAY_SHIPPING_USD;
    case "within_3_days":
      return WITHIN_3_DAYS_SHIPPING_USD;
    case "within_5_days":
    case "later":
      return WITHIN_5_DAYS_SHIPPING_USD;
  }
}

export function deliveryDateShippingLabel(tier: DeliveryDateShippingTier): string {
  switch (tier) {
    case "same_day":
      return "Same-day delivery";
    case "next_day":
      return "Next-day delivery";
    case "within_3_days":
      return "Delivery within 3 days";
    case "within_5_days":
      return "Delivery within 5 days";
    case "later":
      return "Scheduled delivery";
  }
}

/**
 * Shipping for every product in the cart, from the selected delivery date.
 * Each unit pays the same date fee. The product price is not changed.
 */
export function quoteCartDeliveryDateShipping(input: {
  items: Array<{ quantity: number }>;
  deliveryDate: string;
  currency: DisplayCurrency;
  usdInrRate: number;
  now?: Date;
}): {
  deliveryDate: string;
  daysFromToday: number;
  tier: DeliveryDateShippingTier;
  label: string;
  perUnitUsd: number;
  totalCharge: number;
} {
  const now = input.now ?? new Date();
  const deliveryDate = effectiveScheduleDeliveryDate(input.deliveryDate, now);
  const daysFromToday = calendarDaysUntilDelivery(deliveryDate, now);
  const tier = deliveryDateShippingTier(daysFromToday);
  const perUnitUsd = deliveryDateShippingUsd(tier);
  const units = input.items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
  const totalCharge = convertCurrency(perUnitUsd * units, "USD", input.currency, input.usdInrRate);
  return {
    deliveryDate,
    daysFromToday,
    tier,
    label: deliveryDateShippingLabel(tier),
    perUnitUsd,
    totalCharge: roundDisplayAmount(totalCharge, input.currency),
  };
}
