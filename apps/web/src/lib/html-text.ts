import sanitizeHtml from "sanitize-html";

/** True when a product description looks like HTML (not plain prose). */
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

/** Strip tags for summaries, meta, and plain-text UI. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** First readable sentence/snippet from HTML or plain description. */
export function shortPlainDescription(description: string, maxLen = 220): string {
  const plain = looksLikeHtml(description) ? stripHtml(description) : description.trim();
  const first = plain.split(/(?<=\.)\s+/)[0]?.trim() ?? plain;
  if (first.length <= maxLen) return first;
  return `${first.slice(0, maxLen - 1).trim()}…`;
}

/**
 * Plain descriptions keep intentional blank-line paragraphs.
 * A period does not start a new paragraph, so "U.S." and "St." stay intact.
 */
export function plainDescriptionBlocks(description: string): string[] {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  return normalized
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

type SanitizeTag = { tagName: string; attribs: Record<string, string> };

function tableCell(tagName: string, attribs: Record<string, string>): SanitizeTag {
  const next: Record<string, string> = {};
  for (const key of ["colspan", "rowspan"] as const) {
    const value = attribs[key];
    if (value && /^\d{1,2}$/.test(value)) next[key] = value;
  }
  if (tagName === "th" && attribs.scope && /^(row|col|rowgroup|colgroup)$/.test(attribs.scope)) {
    next.scope = attribs.scope;
  }
  return { tagName, attribs: next };
}

/**
 * Product descriptions may contain vendor HTML. sanitize-html is the security
 * boundary: scripts, event handlers, inline styles, and unsafe URLs are removed.
 * Unknown tags such as <font> are unwrapped so the text remains.
 */
export function sanitizeProductHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "a",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "img",
      "blockquote",
      "hr",
      "span",
      "div",
      "sub",
      "sup",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    nonTextTags: [
      "script",
      "style",
      "textarea",
      "option",
      "noscript",
      "iframe",
      "object",
      "embed",
      "svg",
      "math",
      "template",
    ],
    transformTags: {
      th: tableCell,
      td: tableCell,
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "img" && !frame.attribs.src) return true;
      if (frame.tag === "a" && !frame.attribs.href) return "excludeTag";
      return false;
    },
  });
}
