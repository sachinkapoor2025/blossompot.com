import { CATEGORY_PUBLIC_SLUG, categoryHref } from "./category-urls";

/** Pretty country slugs for category URLs (`/flowers-to-usa`). ISO-2 lowercase is the fallback. */
const ISO_TO_SLUG: Record<string, string> = {
  US: "usa",
  GB: "uk",
  AE: "uae",
  CA: "canada",
  AU: "australia",
  IN: "india",
  NZ: "new-zealand",
  IE: "ireland",
  SG: "singapore",
  DE: "germany",
  FR: "france",
  IT: "italy",
  ES: "spain",
  NL: "netherlands",
  PK: "pakistan",
  BD: "bangladesh",
  NP: "nepal",
  LK: "sri-lanka",
  ZA: "south-africa",
  MX: "mexico",
  BR: "brazil",
  JP: "japan",
  PH: "philippines",
  MY: "malaysia",
  HK: "hong-kong",
  NG: "nigeria",
  KE: "kenya",
  SA: "saudi-arabia",
  QA: "qatar",
  KW: "kuwait",
  OM: "oman",
  BH: "bahrain",
};

const SLUG_TO_ISO: Record<string, string> = {
  usa: "US",
  us: "US",
  "united-states": "US",
  uk: "GB",
  gb: "GB",
  "united-kingdom": "GB",
  "great-britain": "GB",
  uae: "AE",
  ae: "AE",
  "united-arab-emirates": "AE",
  canada: "CA",
  ca: "CA",
  australia: "AU",
  au: "AU",
  india: "IN",
  "new-zealand": "NZ",
  ireland: "IE",
  singapore: "SG",
  germany: "DE",
  france: "FR",
  italy: "IT",
  spain: "ES",
  netherlands: "NL",
  pakistan: "PK",
  bangladesh: "BD",
  nepal: "NP",
  "sri-lanka": "LK",
  "south-africa": "ZA",
  mexico: "MX",
  brazil: "BR",
  japan: "JP",
  philippines: "PH",
  malaysia: "MY",
  "hong-kong": "HK",
  nigeria: "NG",
  kenya: "KE",
  "saudi-arabia": "SA",
  qatar: "QA",
  kuwait: "KW",
  oman: "OM",
  bahrain: "BH",
};

for (const [iso, slug] of Object.entries(ISO_TO_SLUG)) {
  SLUG_TO_ISO[slug] = iso;
}

/**
 * Country slugs that may use `/gifts-to-{slug}` for the shop catalog.
 * All other `/gifts-to-*` paths stay as existing city/state SEO pages.
 */
const GIFTS_CATALOG_COUNTRY_SLUGS = new Set([
  "usa",
  "us",
  "united-states",
  "uk",
  "gb",
  "united-kingdom",
  "great-britain",
  "uae",
  "ae",
  "united-arab-emirates",
  "canada",
  "australia",
  "india",
  "new-zealand",
  "ireland",
  "singapore",
  "germany",
  "france",
  "italy",
  "spain",
  "netherlands",
  "pakistan",
  "bangladesh",
  "nepal",
  "sri-lanka",
  "south-africa",
  "mexico",
  "brazil",
  "japan",
  "philippines",
  "malaysia",
  "hong-kong",
  "nigeria",
  "kenya",
  "saudi-arabia",
  "qatar",
  "kuwait",
  "oman",
  "bahrain",
]);

/** Public stem in `/hampers-to-usa` (not always the same as `categoryHref`). */
export const CATEGORY_LOCATION_STEM: Record<string, string> = {
  flowers: "flowers",
  "flower-bouquets": "bouquets",
  cakes: "cakes",
  "birthday-gifts": "birthday-gifts",
  "anniversary-gifts": "anniversary-gifts",
  "valentines-day-gifts": "valentines-day-gifts",
  "mothers-day-gifts": "mothers-day-gifts",
  "wedding-gifts": "wedding-gifts",
  "personalized-gifts": "personalized-gifts",
  "gift-hampers": "hampers",
  plants: "plants",
  "same-day-gifts": "same-day-delivery",
  "celebration-gifts": "celebration-gifts",
};

const STEM_TO_INTERNAL: Record<string, string> = {
  hampers: "gift-hampers",
  "gift-hampers": "gift-hampers",
  bouquets: "flower-bouquets",
  "flower-bouquets": "flower-bouquets",
  "same-day-delivery": "same-day-gifts",
  "same-day-gifts": "same-day-gifts",
};

for (const [internal, pub] of Object.entries(CATEGORY_PUBLIC_SLUG)) {
  if (!STEM_TO_INTERNAL[pub]) STEM_TO_INTERNAL[pub] = internal;
  if (!STEM_TO_INTERNAL[internal]) STEM_TO_INTERNAL[internal] = internal;
}

export const LOCATION_SEO_HEADER = "x-bp-seo-path";

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function countrySeoSlug(countryIso: string): string {
  const iso = countryIso.trim().toUpperCase();
  return ISO_TO_SLUG[iso] ?? iso.toLowerCase();
}

export function isoFromCountrySeoSlug(slug: string): string | null {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  if (SLUG_TO_ISO[key]) return SLUG_TO_ISO[key];
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();
  return null;
}

export function isExistingGiftsToSeoPage(locationSlug: string): boolean {
  const slug = locationSlug.trim().toLowerCase();
  if (!slug) return false;
  if (GIFTS_CATALOG_COUNTRY_SLUGS.has(slug)) return false;
  if (/^[a-z]{2}$/.test(slug) && isoFromCountrySeoSlug(slug)) return false;
  return true;
}

export type ParsedLocationShopPath =
  | { kind: "category"; internalSlug: string; countryIso: string; stem: string }
  | { kind: "gifts-catalog"; countryIso: string; stem: "gifts" };

export function parseLocationShopPath(pathname: string): ParsedLocationShopPath | null {
  const p = normalizePathname(pathname);
  const match = p.match(/^\/([a-z0-9-]+)-to-([a-z0-9-]+)$/);
  if (!match) return null;
  const stem = match[1];
  const locSlug = match[2];
  const countryIso = isoFromCountrySeoSlug(locSlug);
  if (!countryIso) return null;

  if (stem === "gifts") {
    if (isExistingGiftsToSeoPage(locSlug)) return null;
    return { kind: "gifts-catalog", countryIso, stem: "gifts" };
  }

  const internalSlug = STEM_TO_INTERNAL[stem];
  if (!internalSlug) return null;
  return { kind: "category", internalSlug, countryIso, stem };
}

/** Internal rewrite target. Use public category paths so /categories/* 301s do not strip the SEO URL. */
export function locationShopRewritePath(parsed: ParsedLocationShopPath): string {
  if (parsed.kind === "gifts-catalog") return "/products";
  return categoryHref(parsed.internalSlug);
}

export function categoryLocationHref(internalSlug: string, countryIso: string): string {
  const stem = CATEGORY_LOCATION_STEM[internalSlug] ?? CATEGORY_PUBLIC_SLUG[internalSlug] ?? internalSlug;
  return `/${stem}-to-${countrySeoSlug(countryIso)}`;
}

export function giftsCatalogLocationHref(countryIso: string): string {
  return `/gifts-to-${countrySeoSlug(countryIso)}`;
}

export function internalSlugFromCategoryPath(pathname: string): string | null {
  const p = normalizePathname(pathname);
  for (const [internal, pub] of Object.entries(CATEGORY_PUBLIC_SLUG)) {
    if (p === `/${pub}` || p === `/${internal}`) return internal;
  }
  return null;
}

const ISO_DISPLAY_NAME: Record<string, string> = {
  US: "USA",
  GB: "UK",
  AE: "UAE",
  CA: "Canada",
  AU: "Australia",
  IN: "India",
  NZ: "New Zealand",
  IE: "Ireland",
  SG: "Singapore",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  PK: "Pakistan",
  BD: "Bangladesh",
  NP: "Nepal",
  LK: "Sri Lanka",
  ZA: "South Africa",
  MX: "Mexico",
  BR: "Brazil",
  JP: "Japan",
  PH: "Philippines",
  MY: "Malaysia",
  HK: "Hong Kong",
  NG: "Nigeria",
  KE: "Kenya",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  OM: "Oman",
  BH: "Bahrain",
};

export function countryDisplayName(countryIso: string): string {
  const iso = countryIso.trim().toUpperCase();
  if (ISO_DISPLAY_NAME[iso]) return ISO_DISPLAY_NAME[iso];
  return countrySeoSlug(iso)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function rewriteWorldwideCopy(value: string, country: string): string {
  return value
    .replace(/Worldwide Delivery/g, `Delivery to ${country}`)
    .replace(/worldwide delivery/g, `delivery to ${country}`)
    .replace(/Worldwide/g, country)
    .replace(/worldwide/g, country);
}

export function localizeShopText(path: string, text: string): string {
  const parsed = parseLocationShopPath(path);
  if (!parsed) return text;
  return rewriteWorldwideCopy(text, countryDisplayName(parsed.countryIso));
}

/** Keep location shop pages unique vs generic worldwide copy. Canonical path is unchanged. */
export function localizeShopCopy(
  path: string,
  copy: { title: string; description: string; h1?: string }
): { title: string; description: string; h1?: string } {
  const parsed = parseLocationShopPath(path);
  if (!parsed) return copy;
  const country = countryDisplayName(parsed.countryIso);
  return {
    title: rewriteWorldwideCopy(copy.title, country),
    description: rewriteWorldwideCopy(copy.description, country),
    h1: copy.h1 ? rewriteWorldwideCopy(copy.h1, country) : copy.h1,
  };
}

export function locationShopHeading(path: string, heading: string): string {
  const parsed = parseLocationShopPath(path);
  if (!parsed) return heading;
  const country = countryDisplayName(parsed.countryIso);
  const rewritten = rewriteWorldwideCopy(heading, country);
  if (rewritten !== heading) return rewritten;
  if (heading.toLowerCase().includes(country.toLowerCase())) return heading;
  return `${heading} to ${country}`;
}

export function isLocationUrlExemptPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (p === "/") return true;
  if (p === "/remember" || p.startsWith("/remember/")) return true;
  if (p === "/locations" || p.startsWith("/locations/")) return true;
  if (p === "/delivery-locations" || p.startsWith("/delivery-locations/")) return true;
  if (p.startsWith("/flower-delivery-")) return true;
  if (p === "/gift-catalog") return true;
  if (p === "/cities" || p.startsWith("/cities/")) return true;
  if (p === "/countries" || p.startsWith("/countries/")) return true;
  const giftsTo = p.match(/^\/gifts-to-([a-z0-9-]+)$/);
  if (giftsTo && isExistingGiftsToSeoPage(giftsTo[1])) return true;
  return false;
}

/** Map the current shop path to the location-aware (or plain) equivalent. */
export function shopPathForLocation(pathname: string, countryIso: string | null): string {
  const p = normalizePathname(pathname);
  if (isLocationUrlExemptPath(p)) return p;

  const parsed = parseLocationShopPath(p);
  if (parsed?.kind === "category") {
    return countryIso ? categoryLocationHref(parsed.internalSlug, countryIso) : categoryHref(parsed.internalSlug);
  }
  if (parsed?.kind === "gifts-catalog") {
    return countryIso ? giftsCatalogLocationHref(countryIso) : "/products";
  }

  const internal = internalSlugFromCategoryPath(p);
  if (internal) {
    return countryIso ? categoryLocationHref(internal, countryIso) : categoryHref(internal);
  }

  if (p === "/products") {
    return countryIso ? giftsCatalogLocationHref(countryIso) : "/products";
  }

  return p;
}

export function preserveShopQuery(path: string, search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("country");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const PRIMARY_LOCATION_SITEMAP_ISOS = ["US", "GB", "CA", "AU", "AE"] as const;

/** Country ISO if `/gifts-to-{slug}` is a shop catalog URL, not a city/state SEO page. */
export function giftsCatalogCountryIso(locationSlug: string): string | null {
  const parsed = parseLocationShopPath(`/gifts-to-${locationSlug.trim().toLowerCase()}`);
  return parsed?.kind === "gifts-catalog" ? parsed.countryIso : null;
}

/**
 * Specific `/gifts-to-{country}` rewrites must run before the generic city rewrite
 * (`/gifts-to-:slug` → `/locations/:slug`) so Shop All Gifts / All Products do not 500.
 */
export function giftsCatalogCountryRewrites(): { source: string; destination: string }[] {
  const seen = new Set<string>();
  const rules: { source: string; destination: string }[] = [];
  const add = (slug: string, iso: string) => {
    const key = slug.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    rules.push({ source: `/gifts-to-${key}`, destination: `/products?country=${iso}` });
  };
  for (const [iso, slug] of Object.entries(ISO_TO_SLUG)) add(slug, iso);
  for (const slug of GIFTS_CATALOG_COUNTRY_SLUGS) {
    const iso = isoFromCountrySeoSlug(slug);
    if (iso) add(slug, iso);
  }
  return rules;
}
