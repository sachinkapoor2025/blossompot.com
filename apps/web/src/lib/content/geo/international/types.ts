/**
 * International location architecture — one source of truth for
 * markets, countries, regions, and cities outside the existing USA geo SoT.
 *
 * USA destination pages remain in `locations.data.json` + `/gifts-to-{slug}`.
 * This module models country hubs and origin markets (shoppers abroad
 * sending gifts into the United States).
 */

export type PublishStatus = "draft" | "review" | "published" | "noindex" | "archived";

/** How BlossomPot actually relates to this place. Never invent destination coverage. */
export type ServiceMode = "destination" | "origin" | "expanding";

export type LocationKind = "market" | "country" | "region" | "city";

export type LocationFaq = { q: string; a: string };

export type LocationParents = {
  market: string;
  country?: string;
  region?: string;
};

export type InternationalLocation = {
  kind: LocationKind;
  slug: string;
  name: string;
  /** Display name for breadcrumbs / links (may include region hint). */
  label: string;
  parents: LocationParents;
  status: PublishStatus;
  serviceMode: ServiceMode;
  isoCountry?: string;
  iso3?: string;
  currency: string;
  language: string;
  locale: string;
  timezoneLabel: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  howItWorks: string;
  availability: string;
  localNotes: string;
  faqs: LocationFaq[];
  /** Child slugs (regions or cities or countries). */
  childSlugs?: string[];
  /** Related location slugs (same kind or nearby). */
  relatedSlugs?: string[];
};

export type ResolvedLocation = InternationalLocation & {
  path: string;
  crumbs: { label: string; path: string }[];
};
