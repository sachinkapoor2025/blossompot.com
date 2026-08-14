/**
 * Geo display helpers — single source for how locations appear in UI/SEO.
 * Never concatenate name + state outside locationLabel().
 * Never interpolate raw IANA timezone IDs into user-facing copy — use tzDisplayName().
 */
export type GeoLocationType = "state" | "city";

export type GeoFaq = { q: string; a: string };

/** Normalized geo record used by /gifts-to-* pages. */
export type GeoLocation = {
  type: GeoLocationType;
  /** Route slug without `gifts-to` prefix (e.g. california). */
  slug: string;
  name: string;
  state: string;
  /** Required for every location (states and cities). */
  stateAbbr: string;
  timezone: string;
  cutoffTimeLocal: string;
  deliveryWindow: string;
  nearbyAreas: string[];
  /** Distance-ranked neighbour slugs when available. */
  nearbySlugs?: string[];
  zipPrefixes: string[];
  localFaqs: GeoFaq[];
  introParagraph: string;
  /** @deprecated prefer `type` */
  region: GeoLocationType;
  majorCities?: string[];
  cityPageSlugs?: string[];
  censusRegion?: string;
  primaryKeyword?: string;
  lat?: number;
  lng?: number;
};

const TZ_DISPLAY: Record<string, string> = {
  "America/Los_Angeles": "Pacific Time",
  "America/Denver": "Mountain Time",
  "America/Phoenix": "Mountain Time (Arizona)",
  "America/Chicago": "Central Time",
  "America/New_York": "Eastern Time",
  "America/Anchorage": "Alaska Time",
  "America/Adak": "Hawaii-Aleutian Time",
  "Pacific/Honolulu": "Hawaii Time",
  "America/Puerto_Rico": "Atlantic Time",
  "America/Boise": "Mountain Time",
  "America/Detroit": "Eastern Time",
  "America/Indiana/Indianapolis": "Eastern Time",
  "America/Kentucky/Louisville": "Eastern Time",
  "America/North_Dakota/Center": "Central Time",
};

/**
 * Human timezone label for prose. Never return a raw IANA id.
 * America/Los_Angeles → "Pacific Time"
 */
export function tzDisplayName(iana: string): string {
  const key = iana.trim();
  if (TZ_DISPLAY[key]) return TZ_DISPLAY[key]!;
  // Fallback: last path segment with underscores → spaces, never the full IANA string.
  const leaf = key.includes("/") ? key.slice(key.lastIndexOf("/") + 1) : key;
  const pretty = leaf.replace(/_/g, " ").trim();
  if (!pretty || pretty.includes("/")) return "local time";
  return `${pretty} Time`;
}

/**
 * State pages: "California". City pages: "San Jose, CA".
 * This is the only allowed place to format a location display name.
 * `type` is preferred; `region` is optional legacy fallback.
 * stateAbbr is required for cities — empty/undefined fails loudly.
 */
export function locationLabel(
  loc: Pick<GeoLocation, "type" | "name" | "stateAbbr"> & Partial<Pick<GeoLocation, "region">>
): string {
  const kind = loc.type ?? loc.region;
  const abbr = (loc.stateAbbr ?? "").trim();
  if (!abbr) {
    throw new Error(`locationLabel: missing stateAbbr for "${loc.name}"`);
  }
  return kind === "state" ? loc.name : `${loc.name}, ${abbr}`;
}

/**
 * Truncate on a word boundary at maxLen (default 155 for meta descriptions).
 * Never cuts mid-word; prefers a complete clause; omits ellipsis when the cut
 * already ends on sentence punctuation.
 */
export function truncateAtWordBoundary(text: string, maxLen = 155): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const slice = cleaned.slice(0, maxLen + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > Math.floor(maxLen * 0.55) ? slice.slice(0, lastSpace).trimEnd() : cleaned.slice(0, maxLen).trimEnd();
  const normalized = cut.replace(/[.,;:\-–—\s]+$/u, "");
  if (/[.!?]$/.test(normalized)) return normalized;
  // Prefer ending on a complete word without advertising a mid-sentence cut.
  return normalized;
}

/** Evergreen meta description — fits ≤155 chars without mid-sentence ellipsis. */
export function geoPageDescription(geo: GeoLocation): string {
  const place = locationLabel(geo);
  const raw = `Order flowers, cakes & gifts to ${place}. Same-day in select ZIPs before ${geo.cutoffTimeLocal} local; otherwise standard USA delivery in 5–7 business days.`;
  return truncateAtWordBoundary(raw, 155);
}

export function geoPageTitle(geo: GeoLocation): string {
  const place = locationLabel(geo);
  if (geo.type === "state" || geo.region === "state") {
    return `Send Flowers, Cakes & Gifts to ${place} | Same-Day Delivery | BlossomPot`;
  }
  return `Send Flowers, Cakes & Gifts to ${place} | Same-Day | BlossomPot`;
}

export function geoPageH1(geo: GeoLocation): string {
  return `Send Flowers, Cakes & Gifts to ${locationLabel(geo)}`;
}
