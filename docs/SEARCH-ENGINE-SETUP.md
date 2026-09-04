# Search engine setup (manual)

Do not put verification secrets in git beyond the existing public meta tokens in `analytics-config.ts`.

## Google Search Console

1. Property: `https://www.blossompot.com` (URL-prefix or Domain).
2. Verification: DNS TXT **or** the meta tag in the global layout (`analyticsConfig.googleSiteVerification`).
3. Submit sitemaps:
   - `https://www.blossompot.com/sitemap.xml`
   - `https://www.blossompot.com/sitemap-geo.xml`
   - `https://www.blossompot.com/sitemap-locations.xml`
4. Confirm `https://www.blossompot.com/robots.txt` lists those sitemaps and does not disallow `/locations/`.
5. Use URL Inspection on `/`, `/locations/`, `/locations/canada/`, `/gifts-to-california`.
6. Monitor: Pages, Enhancement (Product / FAQ), Core Web Vitals, Security issues.
7. Do not request indexing for `/admin`, `/vendor`, `/cart`, `/checkout`, `/account`.

## Bing Webmaster Tools

1. Import from Google Search Console or verify with `NEXT_PUBLIC_BING_SITE_VERIFICATION` (`msvalidate.01`).
2. Submit the same three sitemap URLs.
3. Optional IndexNow: set `INDEXNOW_KEY` in Amplify, confirm `https://www.blossompot.com/indexnow-key.txt` returns the key, then POST via `submitIndexNow()` in `apps/web/src/lib/indexnow.ts`.

## ChatGPT Search / Perplexity / Claude

No webmaster console equivalent that we configure in-repo. Allow the official bots in robots.txt (already done). Inclusion is not guaranteed.

## Checklist after each production deploy

- [ ] `https://www.blossompot.com/robots.txt` 200
- [ ] Sitemaps 200 and contain `/locations/`
- [ ] `/locations/canada` and `/gifts-to-california` 200, indexable, one H1, canonical
- [ ] `/admin` still requires auth
- [ ] No new noindex on money pages
