import type { InternationalLocation } from "./types";

const MIN_INTRO_WORDS = 80;
const MIN_FAQS = 3;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function assertInternationalComplete(loc: InternationalLocation): boolean {
  if (wordCount(loc.intro) < MIN_INTRO_WORDS) return false;
  if ((loc.faqs?.length ?? 0) < MIN_FAQS) return false;
  if (!loc.title.trim() || !loc.description.trim() || !loc.h1.trim()) return false;
  if (!loc.howItWorks.trim() || !loc.availability.trim() || !loc.localNotes.trim()) return false;
  if (!loc.timezoneLabel.trim() || !loc.currency.trim() || !loc.locale.trim()) return false;
  const hay = loc.intro.toLowerCase();
  const nameHits = hay.split(loc.name.toLowerCase()).length - 1;
  if (nameHits < 1) return false;
  if (loc.intro.includes("America/") || loc.intro.includes("Pacific/") || loc.intro.includes("Europe/")) {
    return false;
  }
  if (
    loc.faqs.some(
      (f) =>
        f.a.includes("America/") ||
        f.a.includes("Pacific/") ||
        f.q.includes("America/") ||
        f.a.includes("TODO") ||
        f.q.includes("TODO")
    )
  ) {
    return false;
  }
  if (loc.description.length > 170) return false;
  return true;
}

/** Cheap uniqueness check — first 80 characters of intros must be unique among published rows. */
export function findDuplicateIntroPrefixes(locations: InternationalLocation[]): string[] {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const loc of locations) {
    const key = loc.intro.slice(0, 80).toLowerCase().replace(/\s+/g, " ");
    const prev = seen.get(key);
    if (prev) dupes.push(`${loc.slug} ~ ${prev}`);
    else seen.set(key, loc.slug);
  }
  return dupes;
}
