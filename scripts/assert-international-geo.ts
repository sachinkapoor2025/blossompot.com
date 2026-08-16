/**
 * Hygiene for international location SoT (no Next path aliases).
 *   npx tsx scripts/assert-international-geo.ts
 */
import { AUSTRALIA_LOCATIONS } from "../apps/web/src/lib/content/geo/international/content-australia";
import { CANADA_LOCATIONS } from "../apps/web/src/lib/content/geo/international/content-canada";
import { EUROPE_LOCATIONS } from "../apps/web/src/lib/content/geo/international/content-europe";
import { HUB_LOCATIONS } from "../apps/web/src/lib/content/geo/international/content-hubs";
import {
  assertInternationalComplete,
  findDuplicateIntroPrefixes,
  wordCount,
} from "../apps/web/src/lib/content/geo/international/quality";
import type { InternationalLocation } from "../apps/web/src/lib/content/geo/international/types";

const ALL: InternationalLocation[] = [
  ...HUB_LOCATIONS,
  ...CANADA_LOCATIONS,
  ...AUSTRALIA_LOCATIONS,
  ...EUROPE_LOCATIONS,
];

function pathFor(loc: InternationalLocation): string {
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

const errors: string[] = [];
const published = ALL.filter((l) => l.status === "published" && assertInternationalComplete(l));

if (published.length < 20) {
  errors.push(`Expected at least 20 indexable international pages, got ${published.length}`);
}

const slugs = new Set<string>();
const paths = new Set<string>();
for (const loc of ALL) {
  if (slugs.has(loc.slug)) errors.push(`Duplicate slug ${loc.slug}`);
  slugs.add(loc.slug);
}

for (const loc of published) {
  if (!assertInternationalComplete(loc)) {
    errors.push(`${loc.slug}: failed quality gate (words=${wordCount(loc.intro)} faqs=${loc.faqs.length})`);
  }
  const path = pathFor(loc);
  if (paths.has(path)) errors.push(`Duplicate path ${path}`);
  paths.add(path);
  if (!path.startsWith("/locations/")) errors.push(`${loc.slug}: path ${path} is not under /locations/`);
}

for (const loc of ALL) {
  if (loc.status === "published" && !assertInternationalComplete(loc)) {
    errors.push(
      `${loc.slug}: status=published but quality failed (words=${wordCount(loc.intro)} descLen=${loc.description.length})`
    );
  }
}

const dupes = findDuplicateIntroPrefixes(published);
if (dupes.length) errors.push(`Duplicate intro prefixes: ${dupes.join(", ")}`);

const required = [
  "united-states",
  "canada",
  "australia",
  "europe",
  "toronto",
  "sydney",
  "london",
  "united-kingdom",
];
for (const slug of required) {
  if (!published.some((l) => l.slug === slug)) errors.push(`Missing published location: ${slug}`);
}

if (errors.length) {
  console.error("assert-international-geo FAIL");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log(
  `assert-international-geo: OK (${published.length} indexable / ${ALL.length} total, ${paths.size} unique paths)`
);
