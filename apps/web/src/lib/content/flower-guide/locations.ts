import { cityLinks, cityNavHref } from "@/lib/site";
import {
  getInternationalLocation,
  internationalPath,
  isInternationalIndexable,
} from "@/lib/content/geo/international";

export type FlowerGuideLocationLink = {
  label: string;
  href: string;
  market: string;
};

function intlCity(slug: string, label: string, market: string): FlowerGuideLocationLink | null {
  const loc = getInternationalLocation(slug);
  if (!loc || !isInternationalIndexable(loc)) return null;
  return { label, href: internationalPath(loc), market };
}

/**
 * Only destinations / origin cities that already have public BlossomPot pages.
 * USA `/gifts-to-*` pages are delivery destinations.
 * Canada / Australia / Europe city pages are origin guides (send to the USA).
 */
export const flowerGuideLocations: FlowerGuideLocationLink[] = [
  ...cityLinks.map((c) => ({
    label: `Flower delivery in ${c.label}`,
    href: cityNavHref(c),
    market: "United States",
  })),
  ...[
    intlCity("toronto", "Send flowers from Toronto to the USA", "Canada"),
    intlCity("vancouver", "Send flowers from Vancouver to the USA", "Canada"),
    intlCity("sydney", "Send flowers from Sydney to the USA", "Australia"),
    intlCity("melbourne", "Send flowers from Melbourne to the USA", "Australia"),
    intlCity("london", "Send flowers from London to the USA", "United Kingdom"),
    intlCity("manchester", "Send flowers from Manchester to the USA", "United Kingdom"),
    intlCity("dublin", "Send flowers from Dublin to the USA", "Ireland"),
    intlCity("paris", "Send flowers from Paris to the USA", "France"),
    intlCity("berlin", "Send flowers from Berlin to the USA", "Germany"),
    intlCity("amsterdam", "Send flowers from Amsterdam to the USA", "Netherlands"),
  ].filter((x): x is FlowerGuideLocationLink => x !== null),
];

export function featuredFlowerLocations(limit = 8): FlowerGuideLocationLink[] {
  return flowerGuideLocations.slice(0, limit);
}

export function usaFlowerLocations(limit = 8): FlowerGuideLocationLink[] {
  return flowerGuideLocations.filter((l) => l.market === "United States").slice(0, limit);
}
