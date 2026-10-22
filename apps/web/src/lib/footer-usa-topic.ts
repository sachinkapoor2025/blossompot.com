import { normalizePathname, parseLocationShopPath } from "./location-seo-urls";

/** Topic line inside the USA “Deliver to” footer. Null keeps the existing label. */
const CATEGORY_TOPIC: Record<string, string> = {
  flowers: "Flowers Deliver in USA",
  "flower-bouquets": "Bouquets Deliver in USA",
  cakes: "Cakes Deliver in USA",
  "birthday-gifts": "Birthday Gifts Deliver in USA",
  "anniversary-gifts": "Anniversary Gifts Deliver in USA",
  "valentines-day-gifts": "Valentine's Gifts Deliver in USA",
  "gift-hampers": "Hampers Deliver in USA",
};

export function footerUsaTopicHeading(pathname: string): string | null {
  const path = normalizePathname(pathname.split("?")[0] ?? pathname);
  if (path === "/") return "Deliver in USA";
  if (path === "/combos") return "Combos Deliver in USA";
  if (path === "/gift-catalog") return "Gifts Catalog Deliver in USA";

  const parsed = parseLocationShopPath(path);
  if (!parsed || parsed.kind !== "category" || parsed.countryIso !== "US") return null;
  return CATEGORY_TOPIC[parsed.internalSlug] ?? null;
}
