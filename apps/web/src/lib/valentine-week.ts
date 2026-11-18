import { countrySeoSlug } from "./location-seo-urls";
import { specialDayIdFromPublicSlug, specialDayPublicSlug } from "./special-day-slugs";

export type ValentineWeekDay = {
  id: string;
  name: string;
  date: string;
  emoji: string;
};

export const VALENTINE_WEEK_IMAGE = "/banners/valentine-week-promo.jpg";

export const VALENTINE_WEEK_DAYS: readonly ValentineWeekDay[] = [
  { id: "rose-day", name: "Rose Day", date: "7 February", emoji: "🌹" },
  { id: "propose-day", name: "Propose Day", date: "8 February", emoji: "💍" },
  { id: "chocolate-day", name: "Chocolate Day", date: "9 February", emoji: "🍫" },
  { id: "teddy-day", name: "Teddy Day", date: "10 February", emoji: "🧸" },
  { id: "promise-day", name: "Promise Day", date: "11 February", emoji: "🤝" },
  { id: "hug-day", name: "Hug Day", date: "12 February", emoji: "🫂" },
  { id: "kiss-day", name: "Kiss Day", date: "13 February", emoji: "💋" },
  { id: "valentines-day", name: "Valentine's Day", date: "14 February", emoji: "❤️" },
];

/** Country shop URL for a February special day, same shape as the rest of the header. */
export function valentineWeekHref(day: ValentineWeekDay, countryIso: string): string {
  const publicSlug = specialDayPublicSlug(day.id);
  if (!publicSlug) return "/valentines-day-gifts";
  return `/${publicSlug}-to-${countrySeoSlug(countryIso)}`;
}

export function valentineWeekShopHref(countryIso: string): string {
  return valentineWeekHref(
    VALENTINE_WEEK_DAYS.find((day) => day.id === "valentines-day") ?? VALENTINE_WEEK_DAYS[7],
    countryIso
  );
}

/** The February occasion behind a public or country shop URL. Other pages return null. */
export function valentineWeekDayFromPath(pathname: string): ValentineWeekDay | null {
  const path = (pathname.split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  const internal = path.match(/^\/special-days\/([a-z0-9-]+)$/);
  const id = internal
    ? internal[1]
    : specialDayIdFromPublicSlug(path.replace(/^\//, "").replace(/-to-[a-z0-9-]+$/, ""));
  if (!id) return null;
  return VALENTINE_WEEK_DAYS.find((day) => day.id === id) ?? null;
}

/** Nav label for the current page. Occasion pages use that day’s name. */
export function valentineWeekNavLabel(pathname: string): string {
  return valentineWeekDayFromPath(pathname)?.name ?? "Valentine's";
}
