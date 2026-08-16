/**
 * Documented crawler policy — verified against official provider docs.
 * Last verified: 2026-08-16.
 *
 * User-Agent is a hint, not proof of identity. Production WAF/CDN rules
 * should verify published IP ranges / reverse DNS where the provider
 * documents a method. Do not treat a spoofed UA as a trusted crawler.
 */

export type CrawlerVerification = "ip-ranges" | "reverse-dns" | "none-documented";

export type CrawlerPolicyEntry = {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  userAgents: string[];
  allowed: boolean;
  allowedPaths: string;
  blockedPaths: string;
  verification: CrawlerVerification;
  wafTreatment: "allow-public" | "default" | "challenge-unknown";
  rateLimit: string;
  docsUrl: string;
  verifiedOn: string;
  notes: string;
};

const PRIVATE_PATHS =
  "/admin/ /vendor/ /api/ /checkout /account /cart /wishlist /orders/ /email/ /unsubscribe/ /ses-email/";

export const CRAWLER_POLICY: CrawlerPolicyEntry[] = [
  {
    id: "googlebot",
    name: "Googlebot",
    provider: "Google",
    purpose: "Google Search, Images, and AI Search retrieval",
    userAgents: ["Googlebot", "Googlebot-Image", "Google-Extended"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "reverse-dns",
    wafTreatment: "allow-public",
    rateLimit: "Do not apply human-style bot challenges",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers",
    verifiedOn: "2026-08-16",
    notes: "Verify with reverse DNS (crawl-***googlebot.com) then forward DNS. IP ranges published by Google.",
  },
  {
    id: "bingbot",
    name: "Bingbot",
    provider: "Microsoft Bing",
    purpose: "Bing Search and Copilot retrieval",
    userAgents: ["bingbot", "BingPreview"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Do not apply human-style bot challenges",
    docsUrl: "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0",
    verifiedOn: "2026-08-16",
    notes: "Bing publishes crawler IP ranges. IndexNow is optional and key-based (env only).",
  },
  {
    id: "oai-searchbot",
    name: "OAI-SearchBot",
    provider: "OpenAI",
    purpose: "ChatGPT Search indexing",
    userAgents: ["OAI-SearchBot"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow normal crawl rates on public HTML",
    docsUrl: "https://platform.openai.com/docs/gptbot",
    verifiedOn: "2026-08-16",
    notes: "Allow when publishers want ChatGPT Search discovery. GPTBot is training; ChatGPT-User is user-initiated fetch.",
  },
  {
    id: "gptbot",
    name: "GPTBot",
    provider: "OpenAI",
    purpose: "Model training corpus (separate from Search)",
    userAgents: ["GPTBot"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow public HTML; block private paths at app layer",
    docsUrl: "https://platform.openai.com/docs/gptbot",
    verifiedOn: "2026-08-16",
    notes: "Allowed for discoverability. Can be disallowed later without affecting OAI-SearchBot.",
  },
  {
    id: "chatgpt-user",
    name: "ChatGPT-User",
    provider: "OpenAI",
    purpose: "On-demand fetch when a ChatGPT user requests a URL",
    userAgents: ["ChatGPT-User"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "User-initiated; treat as interactive",
    docsUrl: "https://platform.openai.com/docs/gptbot",
    verifiedOn: "2026-08-16",
    notes: "Not a sitewide crawler. Blocking reduces live citation when users ask ChatGPT to open a page.",
  },
  {
    id: "perplexitybot",
    name: "PerplexityBot",
    provider: "Perplexity",
    purpose: "Perplexity search index",
    userAgents: ["PerplexityBot"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow public HTML",
    docsUrl: "https://docs.perplexity.ai/guides/bots",
    verifiedOn: "2026-08-16",
    notes: "Perplexity-User is user-initiated fetch. Do not 403/429 legitimate published ranges.",
  },
  {
    id: "claude-searchbot",
    name: "Claude-SearchBot",
    provider: "Anthropic",
    purpose: "Claude search indexing",
    userAgents: ["Claude-SearchBot"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow public HTML; Crawl-delay supported by Anthropic",
    docsUrl:
      "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    verifiedOn: "2026-08-16",
    notes: "Official Anthropic search crawler (2025+). Do not use obsolete-only names like anthropic-ai as the primary allow.",
  },
  {
    id: "claude-user",
    name: "Claude-User",
    provider: "Anthropic",
    purpose: "Live fetch when a Claude user asks about a URL",
    userAgents: ["Claude-User"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "User-initiated",
    docsUrl:
      "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    verifiedOn: "2026-08-16",
    notes: "Blocking reduces visibility in user-directed Claude answers.",
  },
  {
    id: "claudebot",
    name: "ClaudeBot",
    provider: "Anthropic",
    purpose: "Model training data collection",
    userAgents: ["ClaudeBot"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow public HTML",
    docsUrl:
      "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    verifiedOn: "2026-08-16",
    notes: "Training crawler. Can be disallowed independently of Claude-SearchBot / Claude-User.",
  },
  {
    id: "applebot",
    name: "Applebot",
    provider: "Apple",
    purpose: "Spotlight / Siri / Apple Intelligence retrieval",
    userAgents: ["Applebot", "Applebot-Extended"],
    allowed: true,
    allowedPaths: "Public storefront",
    blockedPaths: PRIVATE_PATHS,
    verification: "ip-ranges",
    wafTreatment: "allow-public",
    rateLimit: "Allow public HTML",
    docsUrl: "https://support.apple.com/en-us/119829",
    verifiedOn: "2026-08-16",
    notes: "Applebot-Extended is the Apple Intelligence / training-adjacent agent.",
  },
];

export const UNKNOWN_BOT_POLICY = {
  treatment: "default" as const,
  notes:
    "Unknown bots inherit User-agent: * rules. They are not trusted as search engines. Private routes stay auth-protected. WAF should rate-limit abusive patterns without challenging verified search crawlers.",
};

export function classifyUserAgent(ua: string | null | undefined): {
  class: "verified-search" | "ai-search" | "unknown";
  crawlerId?: string;
} {
  const value = (ua ?? "").toLowerCase();
  if (!value) return { class: "unknown" };
  for (const entry of CRAWLER_POLICY) {
    if (entry.userAgents.some((agent) => value.includes(agent.toLowerCase()))) {
      const ai = ["oai-", "gptbot", "chatgpt", "perplexity", "claude"].some((p) =>
        entry.id.includes(p.replace("-", "")) || entry.userAgents.some((a) => a.toLowerCase().includes(p))
      );
      return {
        class: ai ? "ai-search" : "verified-search",
        crawlerId: entry.id,
      };
    }
  }
  return { class: "unknown" };
}
