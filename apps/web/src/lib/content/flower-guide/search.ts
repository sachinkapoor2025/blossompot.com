import { flowerDirectory } from "./catalog";
import { careArticles } from "./care";
import { colourGuides } from "./colors";
import { flowerComparisons } from "./comparisons";
import { glossaryTerms } from "./glossary";
import { occasionGuides } from "./occasions";
import { publishedFlowerGuides } from "./published";
import { seasonPages } from "./seasons";
import type { FlowerDirectoryEntry } from "./types";

export type FlowerSearchHit = {
  type: "flower" | "occasion" | "colour" | "season" | "care" | "comparison" | "glossary";
  title: string;
  href: string;
  summary: string;
  score: number;
};

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function scoreText(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (h === term) score += 8;
    else if (h.startsWith(term)) score += 5;
    else if (h.includes(term)) score += 2;
  }
  return score;
}

const OCCASION_ALIASES: Record<string, string[]> = {
  anniversary: ["anniversary", "anniversaries"],
  birthday: ["birthday", "birthdays"],
  "valentines-day": ["valentine", "valentines", "valentinesday"],
  "mothers-day": ["mother", "mothers", "mothersday", "mum", "mom"],
  wedding: ["wedding", "bridal", "bride"],
  sympathy: ["sympathy", "sorry", "condolence"],
  funeral: ["funeral", "memorial"],
  romantic: ["romantic", "romance", "love"],
  "thank-you": ["thank", "thanks", "thankyou"],
  "get-well": ["getwell", "unwell", "hospital"],
};

export function searchFlowerKnowledge(query: string, limit = 24): FlowerSearchHit[] {
  const terms = tokens(query);
  if (terms.length === 0) return [];

  const hits: FlowerSearchHit[] = [];

  for (const flower of flowerDirectory) {
    const hay = [
      flower.name,
      flower.slug,
      flower.shortDescription,
      flower.meaning,
      ...flower.colours,
      ...flower.season,
      ...flower.occasions,
      ...flower.categories,
    ].join(" ");
    let score = scoreText(hay, terms);
    if (flower.status === "published" || flower.status === "reviewed") score += 1;
    if (score > 0) {
      hits.push({
        type: "flower",
        title: flower.name,
        href: isListed(flower) ? `/flower-guide/${flower.slug}` : "/flower-guide/flowers-a-z",
        summary: flower.shortDescription,
        score,
      });
    }
  }

  for (const occ of occasionGuides) {
    const aliases = OCCASION_ALIASES[occ.slug] ?? [occ.slug];
    const hay = [occ.name, occ.intro, occ.slug, ...aliases].join(" ");
    const score = scoreText(hay, terms);
    if (score > 0) {
      hits.push({
        type: "occasion",
        title: occ.name,
        href: `/flower-guide/flowers-by-occasion/${occ.slug}`,
        summary: occ.intro.slice(0, 160),
        score,
      });
    }
  }

  for (const colour of colourGuides) {
    const score = scoreText(`${colour.name} ${colour.slug} ${colour.intro}`, terms);
    if (score > 0) {
      hits.push({
        type: "colour",
        title: colour.name,
        href: `/flower-guide/flowers-by-colour/${colour.slug}`,
        summary: colour.association,
        score,
      });
    }
  }

  for (const season of seasonPages) {
    const score = scoreText(`${season.name} ${season.intro}`, terms);
    if (score > 0) {
      hits.push({
        type: "season",
        title: season.name,
        href: `/flower-guide/${season.slug}`,
        summary: season.intro.slice(0, 160),
        score,
      });
    }
  }

  for (const care of careArticles) {
    const score = scoreText(`${care.title} ${care.summary}`, terms);
    if (score > 0) {
      hits.push({
        type: "care",
        title: care.title,
        href: `/flower-guide/flower-care/${care.slug}`,
        summary: care.summary,
        score,
      });
    }
  }

  for (const cmp of flowerComparisons) {
    const score = scoreText(`${cmp.title} ${cmp.intro}`, terms);
    if (score > 0) {
      hits.push({
        type: "comparison",
        title: cmp.title,
        href: `/flower-guide/flower-comparisons/${cmp.slug}`,
        summary: cmp.intro,
        score,
      });
    }
  }

  for (const term of glossaryTerms) {
    const score = scoreText(`${term.term} ${term.definition}`, terms);
    if (score > 0) {
      hits.push({
        type: "glossary",
        title: term.term,
        href: `/flower-guide/flower-glossary#${term.slug}`,
        summary: term.definition.slice(0, 160),
        score,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const unique: FlowerSearchHit[] = [];
  for (const hit of hits) {
    if (seen.has(hit.href)) continue;
    seen.add(hit.href);
    unique.push(hit);
    if (unique.length >= limit) break;
  }
  return unique;
}

function isListed(flower: FlowerDirectoryEntry): boolean {
  return flower.status === "published" || flower.status === "reviewed";
}

export function filterDirectory(opts: {
  colour?: string;
  season?: string;
  occasion?: string;
  fragrance?: string;
  longevity?: string;
  petFriendly?: boolean;
  category?: string;
  q?: string;
}): FlowerDirectoryEntry[] {
  const q = opts.q?.trim().toLowerCase();
  return flowerDirectory.filter((f) => {
    if (opts.colour && !f.colours.includes(opts.colour as FlowerDirectoryEntry["colours"][number])) return false;
    if (opts.season && !f.season.includes(opts.season as FlowerDirectoryEntry["season"][number])) return false;
    if (opts.occasion && !f.occasions.includes(opts.occasion as FlowerDirectoryEntry["occasions"][number])) return false;
    if (opts.fragrance && f.fragrance !== opts.fragrance) return false;
    if (opts.longevity && f.longevity !== opts.longevity) return false;
    if (opts.petFriendly && f.petFriendly !== true) return false;
    if (opts.category && !f.categories.includes(opts.category)) return false;
    if (q) {
      const hay = `${f.name} ${f.shortDescription} ${f.meaning} ${f.colours.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function publishedGuidesForSlugs(slugs: string[]) {
  const set = new Set(slugs);
  return publishedFlowerGuides.filter((g) => set.has(g.slug));
}
