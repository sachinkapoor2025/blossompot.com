import locationsData from "./seo-locations.data.json";
import keywordsData from "./seo-keywords.data.json";
import blogData from "./seo-blog-posts.data.json";

export type SeoLocationPriority = "High" | "Medium" | "Low";

export interface SeoLocation {
  slug: string;
  path: string;
  name: string;
  state: string | null;
  region: "city" | "state";
  isCaliforniaWarehouse: boolean;
  priority: SeoLocationPriority;
  keywords: string[];
}

export interface SeoBlogEntry {
  slug: string;
  title: string;
  keyword: string;
  description: string;
  excerpt: string;
}

export const seoLocations = locationsData as SeoLocation[];
export const seoCoreKeywords = keywordsData.core as string[];
export const seoOccasionKeywords = keywordsData.occasion as string[];
export const seoProductKeywordsByTarget = keywordsData.productByTarget as Record<string, string[]>;
export const seoBlogEntries = blogData as SeoBlogEntry[];

const locationBySlug = new Map(seoLocations.map((l) => [l.slug, l]));

export function getSeoLocation(slug: string): SeoLocation | undefined {
  return locationBySlug.get(slug);
}

export function allSeoLocationSlugs(): string[] {
  return seoLocations.map((l) => l.slug);
}

export function californiaWarehouseLocations(): SeoLocation[] {
  return seoLocations.filter((l) => l.isCaliforniaWarehouse);
}

export function locationPublicPath(slug: string): string {
  return `/send-rakhi-to-${slug}`;
}

export function getSeoBlogEntry(slug: string): SeoBlogEntry | undefined {
  return seoBlogEntries.find((b) => b.slug === slug);
}

/** Map category public path → internal slug for product keyword lookup. */
export const categoryPathToSlug: Record<string, string> = {
  "/single-rakhi-to-usa": "single-rakhi",
  "/2-set-rakhi-to-usa": "2-set-rakhi",
  "/3-set-rakhi-to-usa": "3-set-rakhi",
  "/4-set-rakhi-to-usa": "4-set-rakhi",
  "/bhaiya-bhabhi-rakhi-to-usa": "bhaiya-bhabhi-rakhi",
  "/kids-rakhi-to-usa": "kids-rakhi",
  "/lumba-rakhi-to-usa": "lumba-rakhi",
  "/rakhi-combo-to-usa": "rakhi-combo",
  "/rakhi-hampers-to-usa": "rakhi-hampers",
};

export function productKeywordsForCategory(slug: string): string[] {
  const path = Object.entries(categoryPathToSlug).find(([, s]) => s === slug)?.[0];
  return path ? (seoProductKeywordsByTarget[path] ?? []) : [];
}

/** Dedupe product-style labels from keyword sheet (e.g. "designer", "silver", "kundan"). */
export function extractProductStyleLabels(keywords: string[]): string[] {
  const styles = new Set<string>();
  for (const kw of keywords) {
    if (/raksha bandhan 2026/i.test(kw)) continue;
    const m = kw.match(/(?:buy|order|send)\s+(.+?)\s+rakhi(?:\s|$)/i);
    if (!m) continue;
    const raw = m[1]
      .replace(/\s+(online|to)\s+usa$/i, "")
      .replace(/\s+for\s+raksha bandhan$/i, "")
      .trim();
    if (!raw || raw.length > 40) continue;
    const label = raw
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    styles.add(label);
  }
  return [...styles];
}
