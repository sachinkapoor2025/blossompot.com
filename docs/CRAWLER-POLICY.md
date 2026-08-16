# Crawler policy

Machine-readable copy: `apps/web/src/lib/crawler-policy.ts`  
Last verified: **2026-08-16** against official provider documentation.

User-Agent is a **hint**, not proof. A client can spoof `Googlebot`. Where a provider publishes IP ranges or reverse-DNS rules, verify those in WAF/CDN before treating traffic as a trusted crawler.

## Allowed on public HTML

| Crawler | Provider | Purpose | Official docs |
|---------|----------|---------|---------------|
| Googlebot / Google-Extended | Google | Search + AI Search | [Google crawlers](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| bingbot | Microsoft | Bing + Copilot | [Bing crawlers](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0) |
| OAI-SearchBot | OpenAI | ChatGPT Search | [OpenAI crawlers](https://platform.openai.com/docs/gptbot) |
| GPTBot / ChatGPT-User | OpenAI | Training / user fetch | same |
| PerplexityBot | Perplexity | Search index | [Perplexity bots](https://docs.perplexity.ai/guides/bots) |
| Claude-SearchBot | Anthropic | Claude search | [Anthropic help](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| Claude-User | Anthropic | User-directed fetch | same |
| ClaudeBot | Anthropic | Training | same |
| Applebot / Applebot-Extended | Apple | Spotlight / Apple Intelligence | [Applebot](https://support.apple.com/en-us/119829) |

## Always blocked at the application layer (not robots.txt)

`/admin`, `/vendor`, `/api` (storefront BFF), `/checkout`, `/account`, `/cart`, `/wishlist`, `/orders`, credentials, `.env`, backups.

robots.txt **advertises** disallow rules. It is not authentication. Admin uses Cognito; APIs use JWT / vendor keys.

## WAF treatment (when AWS WAF is attached)

There is **no WAF resource in `infrastructure/template.yaml` today**. When one is added:

1. Allow listed search crawlers on public `GET` HTML after IP/rDNS verification.
2. Rate-limit unknown bots and `POST` APIs separately.
3. Challenge credential stuffing on `/admin` and login — never put a JS challenge in front of verified Googlebot.
4. Do not allow a spoofed UA to bypass API auth.

See `docs/SECURITY.md`.

## How to add a crawler

1. Find **current** official documentation (not a blog post).
2. Record user-agent, purpose, verification method, and date in `crawler-policy.ts`.
3. Decide allow vs disallow (search vs training can differ).
4. Update `apps/web/src/app/robots.ts` only for verified agents.
5. Update this table and re-run `npm run audit:crawlers`.

## Troubleshooting 403 / 429

1. Confirm the request is a published crawler IP (Google reverse DNS, Bing/OpenAI/Perplexity ranges).
2. Check Amplify / CloudFront / future WAF logs — not robots.txt (robots does not return 403).
3. Public pages must not require login or CAPTCHA for verified crawlers.
4. API rate limits apply to `POST`/`admin`, not to storefront HTML GET.
