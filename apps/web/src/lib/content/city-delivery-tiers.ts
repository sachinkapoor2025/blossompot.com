/**
 * Delivery-tier classification for /gifts-to-{slug} pages.
 * Express metros keep individually maintained copy (city-pages.ts).
 * Secondary cities share one thin template driven by this data file.
 */

/** 2–3 day express metros — keep differentiated landing content. */
export const EXPRESS_METRO_SLUGS = [
  "new-york",
  "los-angeles",
  "chicago",
  "houston",
  "san-francisco",
  "new-jersey",
] as const;

export type ExpressMetroSlug = (typeof EXPRESS_METRO_SLUGS)[number];

export function isExpressMetro(slug: string): slug is ExpressMetroSlug {
  return (EXPRESS_METRO_SLUGS as readonly string[]).includes(slug);
}

export interface SecondaryCity {
  slug: string;
  name: string;
  state: string;
  /** Nearby express / major metro for internal linking (not a canonical target). */
  nearbyMetroSlug: ExpressMetroSlug | "san-jose";
  nearbyMetroLabel: string;
  /** Heuristic search-demand flag for editorial decisions (not from Search Console). */
  searchPotential: "moderate" | "low" | "very-low";
}

/**
 * Secondary city doorways that previously shared near-identical boilerplate.
 * Public URL is /gifts-to-{slug}; content uses SecondaryCityLanding.
 */
export const SECONDARY_CITIES: SecondaryCity[] = [
  { slug: "anaheim", name: "Anaheim", state: "California", nearbyMetroSlug: "los-angeles", nearbyMetroLabel: "Los Angeles", searchPotential: "low" },
  { slug: "berkeley", name: "Berkeley", state: "California", nearbyMetroSlug: "san-francisco", nearbyMetroLabel: "San Francisco Bay Area", searchPotential: "low" },
  { slug: "cupertino", name: "Cupertino", state: "California", nearbyMetroSlug: "san-francisco", nearbyMetroLabel: "San Francisco Bay Area", searchPotential: "very-low" },
  { slug: "dublin-california", name: "Dublin", state: "California", nearbyMetroSlug: "san-francisco", nearbyMetroLabel: "San Francisco Bay Area", searchPotential: "very-low" },
  { slug: "fremont", name: "Fremont", state: "California", nearbyMetroSlug: "san-francisco", nearbyMetroLabel: "San Francisco Bay Area", searchPotential: "low" },
  { slug: "fresno", name: "Fresno", state: "California", nearbyMetroSlug: "los-angeles", nearbyMetroLabel: "California", searchPotential: "low" },
  { slug: "dallas", name: "Dallas", state: "Texas", nearbyMetroSlug: "houston", nearbyMetroLabel: "Texas", searchPotential: "moderate" },
  { slug: "austin", name: "Austin", state: "Texas", nearbyMetroSlug: "houston", nearbyMetroLabel: "Texas", searchPotential: "moderate" },
  { slug: "atlanta", name: "Atlanta", state: "Georgia", nearbyMetroSlug: "chicago", nearbyMetroLabel: "Chicago", searchPotential: "moderate" },
  { slug: "seattle", name: "Seattle", state: "Washington", nearbyMetroSlug: "san-francisco", nearbyMetroLabel: "San Francisco Bay Area", searchPotential: "moderate" },
  { slug: "edison-nj", name: "Edison", state: "New Jersey", nearbyMetroSlug: "new-jersey", nearbyMetroLabel: "New Jersey", searchPotential: "moderate" },
  { slug: "jersey-city", name: "Jersey City", state: "New Jersey", nearbyMetroSlug: "new-jersey", nearbyMetroLabel: "New Jersey", searchPotential: "moderate" },
  { slug: "washington-dc", name: "Washington", state: "District of Columbia", nearbyMetroSlug: "new-york", nearbyMetroLabel: "New York", searchPotential: "moderate" },
  { slug: "fairfax-virginia", name: "Fairfax", state: "Virginia", nearbyMetroSlug: "new-york", nearbyMetroLabel: "New York / East Coast", searchPotential: "very-low" },
];

const secondaryBySlug = new Map(SECONDARY_CITIES.map((c) => [c.slug, c]));

export function getSecondaryCity(slug: string): SecondaryCity | undefined {
  return secondaryBySlug.get(slug);
}

export function isSecondaryCity(slug: string): boolean {
  return secondaryBySlug.has(slug);
}

export function allSecondaryCitySlugs(): string[] {
  return SECONDARY_CITIES.map((c) => c.slug);
}

/** Deterministic hash so the same city always gets the same intro variant. */
function slugVariantIndex(slug: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

/**
 * Rotating intro lines for secondary city doorways — reduces exact-duplicate
 * boilerplate across /gifts-to-{slug} without changing routes.
 */
export function secondaryCityIntro(slug: string, city: string, state: string): string {
  const place = `${city}, ${state}`;
  const variants = [
    `BlossomPot delivers flowers, cakes, and gifts to ${place} with clear USA shipping — order from anywhere in the world.`,
    `Sending a gift to ${place}? BlossomPot fulfills for USA delivery so your recipient gets a smooth domestic experience.`,
    `${place} gift delivery with premium flowers, cakes, and hampers — order online with Stripe (USD) or Razorpay (INR).`,
    `Celebrate someone in ${place} with flowers or cakes from BlossomPot. We ship across America with careful packaging.`,
  ];
  return variants[slugVariantIndex(slug, variants.length)]!;
}
