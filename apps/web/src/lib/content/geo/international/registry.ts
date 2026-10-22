import { getGeoLocation, isGeoPublished, locationLabel } from "../locations";
import { locationPublicPath } from "../../seo-data";
import { AUSTRALIA_LOCATIONS } from "./content-australia";
import { CANADA_LOCATIONS } from "./content-canada";
import { EUROPE_LOCATIONS } from "./content-europe";
import { HUB_LOCATIONS } from "./content-hubs";
import { assertInternationalComplete } from "./quality";
import type { InternationalLocation, LocationKind, ResolvedLocation } from "./types";

const ALL: InternationalLocation[] = [
  ...HUB_LOCATIONS,
  ...CANADA_LOCATIONS,
  ...AUSTRALIA_LOCATIONS,
  ...EUROPE_LOCATIONS,
];

const bySlug = new Map<string, InternationalLocation>();
for (const loc of ALL) {
  if (bySlug.has(loc.slug)) {
    throw new Error(`Duplicate international location slug: ${loc.slug}`);
  }
  bySlug.set(loc.slug, loc);
}

export const MARKET_SLUGS = ["united-states", "canada", "australia", "europe"] as const;
export type MarketSlug = (typeof MARKET_SLUGS)[number];

export function isMarketSlug(value: string): value is MarketSlug {
  return (MARKET_SLUGS as readonly string[]).includes(value);
}

export function allInternationalLocations(): InternationalLocation[] {
  return ALL;
}

export function getInternationalLocation(slug: string): InternationalLocation | undefined {
  return bySlug.get(slug);
}

export function internationalPath(loc: InternationalLocation): string {
  const { market, country, region } = loc.parents;
  if (loc.kind === "market") return `/locations/${loc.slug}`;
  if (loc.kind === "country") {
    return loc.slug === market ? `/locations/${loc.slug}` : `/locations/${market}/${loc.slug}`;
  }
  if (loc.kind === "region") return `/locations/${market}/${loc.slug}`;
  if (region) return `/locations/${market}/${region}/${loc.slug}`;
  if (country && country !== market) return `/locations/${market}/${country}/${loc.slug}`;
  return `/locations/${market}/${loc.slug}`;
}

export function isInternationalIndexable(loc: InternationalLocation): boolean {
  return loc.status === "published" && assertInternationalComplete(loc);
}

export function publishedInternationalLocations(): InternationalLocation[] {
  return ALL.filter(isInternationalIndexable);
}

export function resolveInternationalPath(
  market: string,
  segments: string[] = []
): InternationalLocation | undefined {
  if (!isMarketSlug(market)) return undefined;
  if (segments.length === 0) {
    const hub = bySlug.get(market);
    return hub && hub.parents.market === market ? hub : undefined;
  }
  if (segments.length === 1) {
    const loc = bySlug.get(segments[0]);
    if (!loc || loc.parents.market !== market) return undefined;
    if (loc.kind === "region" || loc.kind === "country") return loc;
    return undefined;
  }
  if (segments.length === 2) {
    const loc = bySlug.get(segments[1]);
    if (!loc || loc.kind !== "city" || loc.parents.market !== market) return undefined;
    if (loc.parents.region) {
      return loc.parents.region === segments[0] ? loc : undefined;
    }
    return loc.parents.country === segments[0] ? loc : undefined;
  }
  return undefined;
}

export function crumbsFor(loc: InternationalLocation): { label: string; path: string }[] {
  const crumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/" },
    { label: "Locations", path: "/locations" },
  ];
  const market = bySlug.get(loc.parents.market);
  if (market && market.slug !== loc.slug) {
    crumbs.push({ label: market.label, path: internationalPath(market) });
  }
  if (loc.kind === "city" && loc.parents.country && loc.parents.country !== loc.parents.market) {
    const country = bySlug.get(loc.parents.country);
    if (country) crumbs.push({ label: country.label, path: internationalPath(country) });
  }
  if (loc.kind === "city" && loc.parents.region) {
    const region = bySlug.get(loc.parents.region);
    if (region) crumbs.push({ label: region.label, path: internationalPath(region) });
  }
  if (loc.kind === "region") {
    const country = bySlug.get(loc.parents.country ?? loc.parents.market);
    if (country && country.slug !== loc.slug && country.slug !== loc.parents.market) {
      crumbs.push({ label: country.label, path: internationalPath(country) });
    }
  }
  crumbs.push({ label: loc.label, path: internationalPath(loc) });
  return crumbs;
}

export function resolveLocation(loc: InternationalLocation): ResolvedLocation {
  return { ...loc, path: internationalPath(loc), crumbs: crumbsFor(loc) };
}

export function childLocations(loc: InternationalLocation): InternationalLocation[] {
  return (loc.childSlugs ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((child): child is InternationalLocation => Boolean(child && isInternationalIndexable(child)));
}

export function relatedLocationLinks(loc: InternationalLocation): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  const seen = new Set<string>();
  for (const slug of loc.relatedSlugs ?? []) {
    if (slug === loc.slug || seen.has(slug)) continue;
    const intl = bySlug.get(slug);
    if (intl && isInternationalIndexable(intl)) {
      seen.add(slug);
      out.push({ label: intl.label, href: internationalPath(intl) });
      continue;
    }
    const usa = getGeoLocation(slug);
    if (usa && isGeoPublished(usa)) {
      seen.add(slug);
      out.push({ label: locationLabel(usa), href: locationPublicPath(usa.slug) });
    }
  }
  return out;
}

export function locationsByKind(kind: LocationKind): InternationalLocation[] {
  return ALL.filter((l) => l.kind === kind);
}

export function generateParamsForMarket(market: MarketSlug): { path: string[] }[] {
  const params: { path: string[] }[] = [{ path: [] }];
  for (const loc of publishedInternationalLocations()) {
    if (loc.parents.market !== market || loc.slug === market) continue;
    const path = internationalPath(loc)
      .replace(`/locations/${market}/`, "")
      .split("/")
      .filter(Boolean);
    if (path.length) params.push({ path });
  }
  return params;
}
