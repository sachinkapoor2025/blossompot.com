/**
 * Nationwide geo SoT — loads locations.data.json (691 entries).
 * Display strings MUST go through locationLabel() only.
 */
import { locationPublicPath } from "@/lib/content/seo-data";
import rawLocations from "./locations.data.json";
import {
  type GeoFaq,
  type GeoLocation,
  type GeoLocationType,
  geoPageDescription,
  geoPageH1,
  geoPageTitle,
  locationLabel,
  tzDisplayName,
} from "./location-label";

export type { GeoFaq, GeoLocation, GeoLocationType };
export { geoPageDescription, geoPageH1, geoPageTitle, locationLabel, tzDisplayName };

export type GeoPublishWave = "states" | "cities-200" | "all";

type RawLocation = {
  type: GeoLocationType;
  slug: string;
  name: string;
  state: string;
  stateAbbr: string;
  region?: string;
  timezone: string;
  cutoffTimeLocal: string;
  majorCities?: string[];
  cityPageSlugs?: string[];
  nearbyAreas?: string[];
  nearbySlugs?: string[];
  zipPrefixes?: string[];
  localFaqs?: GeoFaq[];
  introParagraph?: string;
  primaryKeyword?: string;
  lat?: number;
  lng?: number;
};

function normalize(raw: RawLocation): GeoLocation {
  const abbr = (raw.stateAbbr ?? "").trim();
  if (!abbr) {
    throw new Error(`Geo location "${raw.slug}" is missing required stateAbbr`);
  }
  const deliveryWindow =
    raw.type === "state"
      ? `Same-day options before ${raw.cutoffTimeLocal} local in select ZIPs; otherwise standard USA shipping typically 5–7 business days`
      : `Same-day before ${raw.cutoffTimeLocal} local in select ${raw.name} ZIPs; otherwise standard USA shipping typically 5–7 business days`;
  return {
    type: raw.type,
    slug: raw.slug,
    name: raw.name,
    state: raw.state,
    stateAbbr: abbr,
    timezone: raw.timezone,
    cutoffTimeLocal: raw.cutoffTimeLocal,
    deliveryWindow,
    nearbyAreas: raw.nearbyAreas ?? [],
    nearbySlugs: raw.nearbySlugs,
    zipPrefixes: raw.zipPrefixes ?? [],
    localFaqs: raw.localFaqs ?? [],
    introParagraph: raw.introParagraph ?? "",
    region: raw.type,
    majorCities: raw.majorCities,
    cityPageSlugs: raw.cityPageSlugs,
    censusRegion: raw.region,
    primaryKeyword: raw.primaryKeyword,
    lat: raw.lat,
    lng: raw.lng,
  };
}

const allNormalized: GeoLocation[] = (rawLocations as RawLocation[]).map(normalize);
const bySlug = new Map(allNormalized.map((l) => [l.slug, l]));

// Fail fast if any record lacks stateAbbr (build-time hygiene).
for (const g of allNormalized) {
  if (!(g.stateAbbr || "").trim()) {
    throw new Error(`Geo location "${g.slug}" is missing required stateAbbr`);
  }
  locationLabel(g); // exercises city formatting
}

/** Prefer cities listed on state hubs first (approx. demand), then the rest. */
function topCitySlugs(limit: number): Set<string> {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const st of allNormalized) {
    if (st.type !== "state") continue;
    for (const s of st.cityPageSlugs ?? []) {
      if (!bySlug.has(s) || seen.has(s)) continue;
      seen.add(s);
      ordered.push(s);
    }
  }
  for (const c of allNormalized) {
    if (c.type !== "city" || seen.has(c.slug)) continue;
    seen.add(c.slug);
    ordered.push(c.slug);
  }
  return new Set(ordered.slice(0, limit));
}

const TOP_200_CITIES = topCitySlugs(200);

export function getGeoPublishWave(): GeoPublishWave {
  const raw = (process.env.GEO_PUBLISH_WAVE || "states").toLowerCase();
  if (raw === "all" || raw === "cities-200" || raw === "states") return raw;
  return "states";
}

export function isGeoPublished(geo: GeoLocation, wave: GeoPublishWave = getGeoPublishWave()): boolean {
  if (!assertGeoLocationComplete(geo)) return false;
  if (wave === "all") return true;
  if (wave === "states") return geo.type === "state";
  // cities-200: all states + top 200 cities
  return geo.type === "state" || TOP_200_CITIES.has(geo.slug);
}

export function getGeoLocation(slug: string): GeoLocation | undefined {
  const key = slug.replace(/^gifts-to-/, "");
  return bySlug.get(key);
}

export function allGeoLocations(): GeoLocation[] {
  return allNormalized;
}

export function publishedGeoLocations(wave: GeoPublishWave = getGeoPublishWave()): GeoLocation[] {
  return allNormalized.filter((g) => isGeoPublished(g, wave));
}

export function geoStates(): GeoLocation[] {
  return allNormalized.filter((g) => g.type === "state");
}

export function geoCitiesInState(stateName: string): GeoLocation[] {
  return allNormalized.filter((g) => g.type === "city" && g.state === stateName);
}

export function neighboringStates(geo: GeoLocation, limit = 4): GeoLocation[] {
  const region = geo.censusRegion;
  return allNormalized
    .filter((g) => g.type === "state" && g.slug !== geo.slug && g.censusRegion === region)
    .slice(0, limit);
}

export function stateForCity(geo: GeoLocation): GeoLocation | undefined {
  if (geo.type === "state") return geo;
  return allNormalized.find((g) => g.type === "state" && g.name === geo.state);
}

/** Footer: top metros by hub priority. */
export function footerGeoLinks(limit = 12): { label: string; href: string }[] {
  const hubs = [
    "california",
    "texas",
    "florida",
    "new-york",
    "pennsylvania",
    "illinois",
    "ohio",
    "georgia",
    "north-carolina",
    "michigan",
    "new-jersey",
    "virginia",
    "washington",
    "arizona",
    "massachusetts",
  ];
  const out: { label: string; href: string }[] = [];
  for (const slug of hubs) {
    const g = bySlug.get(slug);
    if (!g) continue;
    out.push({ label: locationLabel(g), href: locationPublicPath(g.slug) });
    if (out.length >= limit) break;
  }
  return out;
}

export function exploreGeoLinksForProduct(productSlug: string, count = 8): { label: string; href: string }[] {
  const published = publishedGeoLocations();
  if (published.length === 0) return [];
  let hash = 0;
  for (let i = 0; i < productSlug.length; i++) hash = (hash * 31 + productSlug.charCodeAt(i)) >>> 0;
  const start = hash % published.length;
  const out: { label: string; href: string }[] = [];
  for (let i = 0; i < published.length && out.length < count; i++) {
    const g = published[(start + i) % published.length]!;
    out.push({ label: `Gifts to ${locationLabel(g)}`, href: locationPublicPath(g.slug) });
  }
  return out;
}

export function assertGeoLocationComplete(geo: GeoLocation): boolean {
  const intro = geo.introParagraph || "";
  const words = intro.trim().split(/\s+/).filter(Boolean).length;
  if (words < 120) return false;
  if ((geo.localFaqs?.length ?? 0) < 3) return false;
  if (!geo.cutoffTimeLocal || !geo.timezone?.includes("/")) return false;
  if (!(geo.stateAbbr || "").trim()) return false;
  const nameHits = intro.toLowerCase().split(geo.name.toLowerCase()).length - 1;
  if (nameHits < 2) return false;
  // Nearby is distance-gated: either ≥3 genuine neighbours, or empty (section suppressed).
  if (geo.type === "city") {
    const n = geo.nearbyAreas?.length ?? 0;
    if (n > 0 && n < 3) return false;
  }
  if (geo.type === "state" && (geo.cityPageSlugs?.length ?? 0) < 4) return false;
  // No raw IANA identifiers in user-facing copy.
  if (intro.includes("America/") || intro.includes("Pacific/")) return false;
  if ((geo.localFaqs ?? []).some((f) => f.a.includes("America/") || f.a.includes("Pacific/") || f.q.includes("America/") || f.q.includes("Pacific/"))) {
    return false;
  }
  return true;
}
