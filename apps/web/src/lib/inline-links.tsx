import Link from "next/link";
import type { ReactNode } from "react";
import {
  phraseKey,
  planInlineLinks,
  type InlineLinkOptions,
  type PhraseLink,
} from "@/lib/inline-link-plan";

export {
  MAX_INLINE_LINKS,
  normalizeInternalPath,
  phraseKey,
  planInlineLinks,
  planInlineLinksAcross,
} from "@/lib/inline-link-plan";
export type { InlineLinkOptions, PhraseLink, PlannedInlineLink } from "@/lib/inline-link-plan";

export const standardInlineLinkClass = "text-nav hover:underline";

export function applyInlineLinks(
  text: string,
  links: readonly PhraseLink[],
  options?: InlineLinkOptions
): ReactNode {
  const used = options?.usedHrefs ?? new Set<string>();
  const usedPhrases = options?.usedPhrases ?? new Set<string>();
  const matches = planInlineLinks(text, links, { ...options, usedHrefs: used, usedPhrases });
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

/** @deprecated Prefer applyInlineLinks with shared usedHrefs. */
export function linkPhraseInText(text: string, phrase: string, href: string): ReactNode {
  return applyInlineLinks(text, [{ phrase, href }]);
}
