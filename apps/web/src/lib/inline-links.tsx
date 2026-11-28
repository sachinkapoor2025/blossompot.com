import Link from "next/link";
import type { ReactNode } from "react";
import { storefrontPageNameLinks } from "@/lib/content/page-inline-links";
import {
  normalizeInternalPath,
  phraseKey,
  planInlineLinks,
  type InlineLinkOptions,
  type PhraseLink,
} from "@/lib/inline-link-plan";

export {
  MIN_INLINE_LINKS,
  MAX_INLINE_LINKS,
  normalizeInternalPath,
  phraseKey,
  planInlineLinks,
  planInlineLinksAcross,
} from "@/lib/inline-link-plan";
export type { InlineLinkOptions, PhraseLink, PlannedInlineLink } from "@/lib/inline-link-plan";

export const standardInlineLinkClass = "text-nav hover:underline";

function withPageNameLinks(links: readonly PhraseLink[]): PhraseLink[] {
  const seen = new Set<string>();
  const merged: PhraseLink[] = [];
  for (const link of [...links, ...storefrontPageNameLinks]) {
    const key = `${phraseKey(link.phrase)}|${normalizeInternalPath(link.href)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(link);
  }
  return merged;
}

export function applyInlineLinks(
  text: string,
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): ReactNode {
  const used = options?.usedHrefs ?? new Set<string>();
  const usedPhrases = options?.usedPhrases ?? new Set<string>();
  const matches = planInlineLinks(text, withPageNameLinks(links), {
    ...options,
    usedHrefs: used,
    usedPhrases,
    allOccurrences: options?.allOccurrences ?? true,
  });
  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    used.add(match.href);
    usedPhrases.add(phraseKey(match.phrase));
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

/** Turns shop and occasion names in sanitized HTML into internal links. Leaves existing tags alone. */
export function linkPageNamesInHtml(html: string, currentPath?: string): string {
  return html.replace(/>([^<]+)</g, (_full, text: string) => `>${splicePageNameAnchors(text, currentPath)}<`);
}

function splicePageNameAnchors(text: string, currentPath?: string): string {
  const matches = planInlineLinks(text, [...storefrontPageNameLinks], {
    allOccurrences: true,
    currentPath,
  });
  if (matches.length === 0) return text;
  let cursor = 0;
  let out = "";
  for (const match of matches) {
    out += text.slice(cursor, match.start);
    out += `<a href="${match.href}" class="${standardInlineLinkClass}">${text.slice(match.start, match.end)}</a>`;
    cursor = match.end;
  }
  return out + text.slice(cursor);
}

/** @deprecated Prefer applyInlineLinks with shared usedHrefs. */
export function linkPhraseInText(text: string, phrase: string, href: string): ReactNode {
  return applyInlineLinks(text, [{ phrase, href }]);
}
