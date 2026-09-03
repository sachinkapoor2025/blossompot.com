import Link from "next/link";
import type { ReactNode } from "react";

export const standardInlineLinkClass = "text-nav hover:underline";

export type PhraseLink = { phrase: string; href: string };

export function normalizeInternalPath(href: string): string {
  const path = href.split(/[?#]/)[0] ?? href;
  if (path === "") return "/";
  return path === "/" ? "/" : path.replace(/\/+$/, "");
}

export function applyInlineLinks(
  text: string,
  links: readonly PhraseLink[],
  options?: {
    usedHrefs?: Set<string>;
    currentPath?: string;
    max?: number;
  }
): ReactNode {
  const max = options?.max ?? 4;
  const used = options?.usedHrefs ?? new Set<string>();
  const current = options?.currentPath ? normalizeInternalPath(options.currentPath) : "";
  if (used.size >= max) return text;

  const candidates = [...links]
    .filter((link) => link.phrase && link.href)
    .sort((a, b) => b.phrase.length - a.phrase.length);

  type Match = { start: number; end: number; phrase: string; href: string };
  const matches: Match[] = [];

  for (const { phrase, href } of candidates) {
    if (used.size + matches.length >= max) break;
    const normalized = normalizeInternalPath(href);
    if (!normalized || normalized === current) continue;
    if (used.has(normalized) || matches.some((m) => m.href === normalized)) continue;

    let searchFrom = 0;
    let found: number | null = null;
    while (searchFrom < text.length) {
      const index = text.indexOf(phrase, searchFrom);
      if (index === -1) break;
      const end = index + phrase.length;
      const overlaps = matches.some((m) => index < m.end && end > m.start);
      if (!overlaps) {
        found = index;
        break;
      }
      searchFrom = index + 1;
    }
    if (found == null) continue;
    matches.push({ start: found, end: found + phrase.length, phrase, href: normalized });
  }

  if (matches.length === 0) return text;

  matches.sort((a, b) => a.start - b.start);
  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    used.add(match.href);
    if (match.start > cursor) parts.push(text.slice(cursor, match.start));
    parts.push(
      <Link key={`${match.href}-${i}`} href={match.href} className={standardInlineLinkClass}>
        {match.phrase}
      </Link>
    );
    cursor = match.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** @deprecated Prefer applyInlineLinks with shared usedHrefs. */
export function linkPhraseInText(text: string, phrase: string, href: string): ReactNode {
  return applyInlineLinks(text, [{ phrase, href }]);
}
