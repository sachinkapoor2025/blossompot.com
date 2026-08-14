/**
 * Geo display helpers — single source for how locations appear in UI/SEO.
 * Never concatenate name + state outside locationLabel().
 */
export type GeoLocationType = "state" | "city";

export type GeoFaq = { q: string; a: string };

/** Normalized geo record used by /gifts-to-* pages. */
export type GeoLocation = {
  type: GeoLocationType;
  /** Route slug without `gifts-to-` prefix (e.g. california). */
  slug: string;
  name: string;
  state: string;
  stateAbbr: string;
  timezone: string;
  cutoffTimeLocal: string;
  deliveryWindow: string;
  nearbyAreas: string[];
  zipPrefixes: string[];
  localFaqs: GeoFaq[];
  introParagraph: string;
  /** @deprecated prefer `type` */
  region: GeoLocationType;
  majorCities?: string[];
  cityPageSlugs?: string[];
  censusRegion?: string;
};

/**
 * State pages: "California". City pages: "San Jose, CA".
 * This is the only allowed place to format a location display name.
 */
export function locationLabel(loc: Pick<GeoLocation, "type" | "name" | "stateAbbr" | "region">): string {
  const kind = loc.type ?? loc.region;
  return kind === "state" ? loc.name : `${loc.name}, ${loc.stateAbbr}`;
}

/** Truncate on a word boundary at maxLen (default 155 for meta descriptions). */
export function truncateAtWordBoundary(text: string, maxLen = 155): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const slice = cleaned.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > Math.floor(maxLen * 0.6) ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[.,;:\-–—\s]+$/, "") + "…";
}

/** Evergreen meta description — no calendar date ranges. */
export function geoPageDescription(geo: GeoLocation): string {
  const place = locationLabel(geo);
  const raw = `Order flowers, cakes & gifts to ${place}. Same-day options before ${geo.cutoffTimeLocal} local in select ZIPs; nationwide standard delivery otherwise. Secure checkout on BlossomPot.`;
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
