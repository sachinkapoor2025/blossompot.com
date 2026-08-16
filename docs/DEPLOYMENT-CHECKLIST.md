# Deployment checklist

Push to `main` deploys via GitHub Actions. Do not deploy if USA geo or checkout is broken.

## Before merge

```bash
npm run assert:international-geo
npm run assert:geo-hygiene
npm run typecheck
npm run lint
npm run build
```

Optional against a preview URL:

```bash
AUDIT_SEO_BASE=https://<preview> npm run audit:seo
AUDIT_SEO_BASE=https://<preview> npm run audit:crawlers
AUDIT_SEO_BASE=https://<preview> npm run audit:seo-tech
```

## Routes to click

- `/` `/products` `/flowers` `/gifts-to-california` `/delivery-locations`
- `/locations/` `/locations/united-states/` `/locations/canada/` `/locations/canada/ontario/toronto/`
- `/locations/australia/new-south-wales/sydney/` `/locations/europe/united-kingdom/london/`
- `/locations/united-states/california` → 301 → `/gifts-to-california`
- `/admin` (must stay behind Cognito)
- `/robots.txt` `/sitemap.xml` `/sitemap-geo.xml` `/sitemap-locations.xml`

## Do not ship if

- Existing `/gifts-to-*` 404 or noindex
- International pages claim fake local florist delivery
- Secrets appear in the diff
- CSP was switched from Report-Only to enforcing without a full UI pass (Stripe, Razorpay, GTM, admin)
