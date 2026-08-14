import Link from "next/link";
import type { ReactNode } from "react";

export const standardInlineLinkClass = "text-nav hover:underline";

export function linkPhraseInText(text: string, phrase: string, href: string): ReactNode {
  const index = text.indexOf(phrase);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <Link href={href} className={standardInlineLinkClass}>
        {phrase}
      </Link>
      {text.slice(index + phrase.length)}
    </>
  );
}

export function applyInlineLinks(
  text: string,
  links: readonly { phrase: string; href: string }[]
): ReactNode {
  let node: ReactNode = text;
  for (const { phrase, href } of links) {
    if (typeof node === "string") {
      node = linkPhraseInText(node, phrase, href);
    }
  }
  return node;
}
