/** Contextual keyword links inside body copy. Navigation, product grids, and directories are separate. */
export const MIN_INLINE_LINKS = 3;
export const MAX_INLINE_LINKS = 5;

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
  /** Link every occurrence of each phrase, including repeated destinations. */
  allOccurrences?: boolean;
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

function eligibleLinks(links: readonly PhraseLink[]): PhraseLink[] {
  return [...links]
    .filter((link) => link.phrase.trim().length >= 3 && link.href)
    .sort((a, b) => b.phrase.length - a.phrase.length);
}

/**
 * Links every whole-word occurrence. Longer phrases claim their span first so
 * "gift hampers" is not also linked as "hampers".
 */
function planEveryOccurrence(
  text: string,
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): PlannedInlineLink[] {
  const max = options?.max;
  const blocked = options?.blockedHrefs ?? new Set<string>();
  const current = options?.currentPath ? normalizeInternalPath(options.currentPath) : "";
  const matches: PlannedInlineLink[] = [];
  const lowerText = text.toLowerCase();

  for (const { phrase, href } of eligibleLinks(links)) {
    if (max != null && matches.length >= max) break;
    const normalized = normalizeInternalPath(href);
    if (!normalized || normalized === current) continue;
    if (blocked.has(normalized)) continue;
    const needle = phrase.toLowerCase();
    let searchFrom = 0;
    while (searchFrom < text.length) {
      if (max != null && matches.length >= max) break;
      const index = lowerText.indexOf(needle, searchFrom);
      if (index === -1) break;
      const end = index + needle.length;
      const leftOk = !isWordChar(text[index - 1]);
      const rightOk = !isWordChar(text[end]);
      const overlaps = matches.some((match) => index < match.end && end > match.start);
      if (leftOk && rightOk && !overlaps) {
        matches.push({
          start: index,
          end,
          phrase: text.slice(index, end),
          href: normalized,
        });
      }
      searchFrom = index + 1;
    }
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}

/**
 * Picks between {@link MIN_INLINE_LINKS} and {@link MAX_INLINE_LINKS} non-overlapping phrases when the copy contains them.
 * Longer phrases win first so "gift hampers" is not split into "hampers".
 * The same anchor text and the same destination are used only once.
 */
export function planInlineLinks(
  text: string,
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): PlannedInlineLink[] {
  if (options?.allOccurrences) return planEveryOccurrence(text, links, options);
  const max = options?.max ?? MAX_INLINE_LINKS;
  const used = options?.usedHrefs ?? new Set<string>();
  const usedPhrases = options?.usedPhrases ?? new Set<string>();
  const blocked = options?.blockedHrefs ?? new Set<string>();
  const current = options?.currentPath ? normalizeInternalPath(options.currentPath) : "";
  if (used.size >= max) return [];

  const candidates = eligibleLinks(links);

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
