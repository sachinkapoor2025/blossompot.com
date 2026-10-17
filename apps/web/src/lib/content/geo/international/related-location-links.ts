import { getGeoLocation, isGeoPublished, locationLabel } from "../locations";
import { locationPublicPath } from "../../seo-data";
import {
  getInternationalLocation,
  internationalPath,
  isInternationalIndexable,
} from "./registry";
import type { InternationalLocation } from "./types";

/**
 * Server-only. This module loads `locations.data.json`.
 * Import it from international location pages, not from the header barrel or a client component.
 */
export function relatedLocationLinks(loc: InternationalLocation): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  const seen = new Set<string>();
  for (const slug of loc.relatedSlugs ?? []) {
    if (slug === loc.slug || seen.has(slug)) continue;
    const intl = getInternationalLocation(slug);
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
