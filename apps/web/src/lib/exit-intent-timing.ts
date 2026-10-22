export const EXIT_INTENT_STORAGE_KEY = "blossompot_daily_deal_shown_v20";
export const EXIT_INTENT_TIMER_START_KEY = "blossompot_daily_deal_timer_v20";
/** Wait after first landing before showing Discount of the Day. */
export const EXIT_INTENT_SHOW_AFTER_MS = 20_000;

export function exitIntentBlockedPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/ses-email") || pathname.startsWith("/checkout");
}
