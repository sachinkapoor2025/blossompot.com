# Security

Layered controls. Public SEO pages stay crawlable. Secrets and admin stay protected.

```
Internet → CDN (CloudFront / Amplify) → (optional WAF) → Next.js / API Gateway → Lambda → DynamoDB
```

## What exists today

| Control | Where |
|---------|--------|
| Apex → www 301 | `apps/web/src/middleware.ts` |
| Storefront security headers | `apps/web/src/lib/security-headers.ts` via `next.config.ts` |
| CSP Report-Only | Same (do not enforce until GTM/Stripe/Razorpay are proven clean) |
| Admin noindex | `apps/web/src/app/admin/layout.tsx` + robots.txt |
| Admin UI auth | Cognito (`admin` group) |
| API auth | `apps/api/src/lib/auth.ts` (`requireAdmin`, vendor keys) |
| API security headers | `apps/api/src/lib/response.ts` |
| API write rate limits | `apps/api/src/lib/rate-limit.ts` (per Lambda instance) |
| Upload allowlist | `apps/api/src/handlers/uploads.ts` (jpg/png/webp/gif only, no SVG) |
| Sample/private products | Shared `isProductSearchIndexable` |

## What does not exist yet

- AWS WAF WebACL in SAM (`infrastructure/template.yaml` has no WAF).
- Global API Gateway usage plans.
- Malware scanning of uploads (rely on type allowlist + admin-only presign).

Recommended WAF (when added): AWS managed common-rule + known-bad-inputs, **separate** rate rules for `/admin` and `/checkout`, IP-set allow for verified Google/Bing crawlers on `GET` HTML only. Never “allow all bots.”

## Rate limits

| Class | Typical limit | Applies to |
|-------|---------------|------------|
| Public HTML GET | None in app (CDN) | Storefront, locations, products |
| Public write | 40/min/IP | `/leads`, `/events` |
| Checkout / cart POST | 30/min/IP | Checkout, payments, cart writes |
| Auth | 10/min/IP | Login-style routes |
| Admin | 60/min/IP | `/admin/*`, marketing email |

These are in-memory per Lambda and can reset across instances. Use WAF for a hard edge.

## File / server exposure

Amplify/OpenNext should not serve `.env`, `.git`, or `node_modules`. robots.txt lists private paths for crawlers only. Do not commit secrets.

## Uploads

Admin-only presigned PUT. Allowed: JPEG, PNG, WebP, GIF. SVG is rejected (XSS). Files are renamed to UUID keys under `products/`, `blog/`, or `expenses/`.

## Crawler vs security

Public marketing HTML: allow verified search/AI search crawlers.  
Unknown bots: default `*` robots + CDN rate limits.  
Private APIs: auth required regardless of User-Agent.
