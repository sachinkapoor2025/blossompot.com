/** Contextual keyword links inside body copy. Navigation, product grids, and directories are separate. */
export const MAX_INLINE_LINKS = 3;

export type PhraseLink = { phrase: string; href: string };

export type PlannedInlineLink = {
  start: number;
  end: number;
  phrase: string;
  href: string;
};

export type InlineLinkOptions = {
  usedHrefs?: Set<string>;
  usedPhrases?: Set<string>;
  blockedHrefs?: Set<string>;
  currentPath?: string;
  max?: number;
};

export function normalizeInternalPath(href: string): string {
  const path = href.split(/[?#]/)[0] ?? href;
  if (path === "") return "/";
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

function isWordChar(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z0-9]/.test(char));
}

export function phraseKey(phrase: string): string {
  return phrase.trim().toLowerCase();
}

/**
 * Picks up to {@link MAX_INLINE_LINKS} non-overlapping phrases.
 * Longer phrases win first so "gift hampers" is not split into "hampers".
 * The same anchor text and the same destination are used only once.
 */
export function planInlineLinks(
  text: string,
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): PlannedInlineLink[] {
  const max = options?.max ?? MAX_INLINE_LINKS;
  const used = options?.usedHrefs ?? new Set<string>();
  const usedPhrases = options?.usedPhrases ?? new Set<string>();
  const blocked = options?.blockedHrefs ?? new Set<string>();
  const current = options?.currentPath ? normalizeInternalPath(options.currentPath) : "";
  if (used.size >= max) return [];

  const candidates = [...links]
    .filter((link) => link.phrase.trim().length >= 3 && link.href)
    .sort((a, b) => b.phrase.length - a.phrase.length);

  const matches: PlannedInlineLink[] = [];
  const lowerText = text.toLowerCase();

  for (const { phrase, href } of candidates) {
    if (used.size + matches.length >= max) break;
    const normalized = normalizeInternalPath(href);
    if (!normalized || normalized === current) continue;
    if (blocked.has(normalized)) continue;
    if (used.has(normalized) || matches.some((m) => m.href === normalized)) continue;

    const needle = phrase.toLowerCase();
    const anchorKey = phraseKey(phrase);
    if (usedPhrases.has(anchorKey) || matches.some((m) => phraseKey(m.phrase) === anchorKey)) continue;

    let searchFrom = 0;
    let found: number | null = null;
    while (searchFrom < text.length) {
      const index = lowerText.indexOf(needle, searchFrom);
      if (index === -1) break;
      const end = index + needle.length;
      const leftOk = !isWordChar(text[index - 1]);
      const rightOk = !isWordChar(text[end]);
      const overlaps = matches.some((m) => index < m.end && end > m.start);
      if (leftOk && rightOk && !overlaps) {
        found = index;
        break;
      }
      searchFrom = index + 1;
    }
    if (found == null) continue;
    matches.push({
      start: found,
      end: found + needle.length,
      phrase: text.slice(found, found + needle.length),
      href: normalized,
    });
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}

/** Applies the same shared budget the React helper uses, across several paragraphs. */
export function planInlineLinksAcross(
  paragraphs: readonly string[],
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): PlannedInlineLink[] {
  const usedHrefs = options?.usedHrefs ?? new Set<string>();
  const usedPhrases = options?.usedPhrases ?? new Set<string>();
  const planned: PlannedInlineLink[] = [];
  for (const paragraph of paragraphs) {
    const matches = planInlineLinks(paragraph, links, { ...options, usedHrefs, usedPhrases });
    for (const match of matches) {
      usedHrefs.add(match.href);
      usedPhrases.add(phraseKey(match.phrase));
      planned.push(match);
    }
  }
  return planned;
}
