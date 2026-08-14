# SEO / AEO rebuild — Part 1–4 changes

Prepared: 2026-08-14 · BlossomPot.com

## Why

Remove Rakhi vertical leakage from the flower/gift experience, fix geo canonical conflict, restore trust signals, and scaffold programmatic SEO/AEO pages.

## Files touched (high level)

### Canonical / geo
- `apps/web/src/lib/content/seo-data.ts` — `locationPublicPath` → `/gifts-to-{slug}`
- `apps/web/src/lib/content/geo/locations.ts` — **new** geo config with cutoff, nearby, FAQs, intros
- `apps/web/src/app/locations/[slug]/page.tsx` — gift-first template, self-canonical metadata
- `apps/web/src/app/sitemap.ts` — gift geo URLs; drop redirected Rakhi landings from index priority set
- `apps/web/src/lib/explore-more-links.ts` — gift city/category links
- `apps/web/src/lib/content/home-seo.ts` — gifts city labels (via agent soft-rewrite)

### PDP / product content
- `apps/web/src/lib/product-includes.ts` — no Rakhi/Roli/Chawal defaults on flower/cake/gift SKUs
- `apps/web/src/lib/content/product-faqs.ts` — per-category FAQ sets
- `apps/web/src/app/products/[slug]/page.tsx` — category FAQs in JSON-LD; remove rakhi keywords meta
- `apps/web/src/app/products/[slug]/ProductDetailClient.tsx` — dynamic FAQ + schedule noun
- `apps/web/src/components/ScheduleDeliveryPicker.tsx` — dynamic product noun
- `apps/web/src/app/products/page.tsx` — gift-first default shop copy

### Trust / delivery / schema
- `apps/web/src/lib/site.ts` — real phone via `NEXT_PUBLIC_SUPPORT_PHONE` (DGV US line default)
- `packages/shared/src/lib/delivery.ts` — `getDeliveryPromise()` single source
- `apps/web/src/lib/seo.ts` — drop meta keywords; Organization without fake AggregateRating; PNG logo
- `apps/web/src/app/page.tsx` / `reviews/page.tsx` — hide placeholder Google reviews
- `apps/web/src/components/CategoryContentSection.tsx` — remove sisters/rakhi help copy
- `apps/web/src/components/ExploreMoreSection.tsx` — gift explore copy
- `apps/web/src/app/llms.txt/route.ts` — consistent `/gifts-to-*`, real phone, no fake legitimacy pitch
- `apps/web/src/app/robots.ts` — disallow sort query duplicates
- `apps/web/.env.example` — document support phone

### Programmatic pages (Part 3/4 scaffolds)
- `apps/web/src/lib/content/occasions.ts` + `app/occasions/[slug]/page.tsx`
- `apps/web/src/lib/content/recipients.ts` + `app/gifts/[slug]/page.tsx`
- `apps/web/src/app/corporate-gifting/*`
- `apps/web/src/app/about/team/page.tsx`
- `apps/web/src/app/editorial-policy/page.tsx`
- `apps/web/src/components/AnswerBlock.tsx`

### Docs
- `docs/SEO_REDIRECT_MAP.csv`
- `CHANGES.md` (this file)

## Intentionally preserved
- Rakhi blog posts under `/blog/*`
- Rakhi category SEO keys where those categories still exist
- `next.config` 301s from `/send-rakhi-to-*` → `/gifts-to-*` (seasonal URLs redirect unless unique Rakhi content is added later)

## Not fully completed in this pass (follow-ups)
- Full split sitemap index files (`sitemap-products.xml` etc.)
- Dynamic `@vercel/og` 1200×630 per page type
- Build-time duplicate title test
- Moving all Unsplash images to owned CDN
- Full 40 occasions / 25 recipients / colour collections from keyword workbook
- Trustpilot/Yotpo integration + AggregateRating flag flip
- `/admin/seo-health` dashboard
- Lighthouse before/after report

## Redirect map
See `docs/SEO_REDIRECT_MAP.csv`.
