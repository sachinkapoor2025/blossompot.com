# Search / crawl readiness — BlossomPot

Technical foundation for Google, Bing, and AI crawlers. **This does not guarantee rankings.**

## Canonical host

- Official: `https://www.blossompot.com`
- Apex `blossompot.com` → **301** to www (`apps/web/src/middleware.ts`)
- All canonicals, sitemaps, OG URLs, and JSON-LD use `NEXT_PUBLIC_SITE_URL` (forced www in prod)

## Google Search Console — configure once

1. Verify property for `https://www.blossompot.com` (DNS TXT or HTML tag — `GOOGLE_SITE_VERIFICATION` / layout metadata if used).
2. Submit sitemaps:
   - `https://www.blossompot.com/sitemap.xml`
   - `https://www.blossompot.com/sitemap-geo.xml`
   - `https://www.blossompot.com/sitemap-locations.xml`
3. Confirm `https://www.blossompot.com/robots.txt` allows `/` and lists those sitemaps.
4. Monitor: Coverage / Pages, Product rich results, Core Web Vitals, Mobile usability.
5. Do **not** request indexing for `/admin`, `/vendor`, `/cart`, `/checkout`, `/account`.

## Sample products

- Field: `isSampleProduct` (shared schema)
- Gate: `SAMPLE_PRODUCT_INDEXABLE` env (default **off**)
- When off: samples are excluded from public `GET /products`, PDP (404), sitemap, and `llms-full.txt`
- Convert real inventory: admin **convert-from-sample** → `isSampleProduct=false`

## Private / noindex surfaces

| Area | robots.txt | Meta robots |
|------|------------|-------------|
| `/admin/*` | Disallow | noindex |
| `/vendor/*` | Disallow | noindex |
| `/cart`, `/checkout`, `/account` | Disallow | noindex |
| `/wishlist`, `/unsubscribe/*` | Disallow | noindex |
| `/products?search=` | Disallow | noindex + canonical `/products` |

## Automated audit

```bash
npm run audit:seo
npm run audit:seo-tech
npm run audit:crawlers
npm run assert:international-geo
AUDIT_SEO_BASE=https://www.blossompot.com npm run audit:seo
```

Report written to `docs/seo-audit-latest.json` (gitignored if desired).

## Bing / others

Same sitemaps + robots; no engine-specific hacks. Bing Webmaster Tools: submit the same sitemap URLs after verification.
