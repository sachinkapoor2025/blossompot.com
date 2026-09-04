# Gift Baskets Overseas (GBO) API

Dedicated wrapper around the [Gift Baskets Overseas partner API](https://gboapi.readme.io/reference/getting-started).

GBO is a **dropship** partner: BlossomPot sells, GBO fulfills internationally (200+ countries). This is the inverse of Orange County (where the vendor pulls orders from us).

**Do not store the GBO partner portal password in git or env files.** The API uses a separate **authorization token** issued by GBO support.

## When the API token arrives (next step)

Do **not** paste the token into git, `.env` committed files, or chat if you can use GitHub Secrets / 1Password instead.

1. In GitHub → repo **Settings → Secrets and variables → Actions**, set:
   - `GBO_API_TOKEN` = the partner authorization token from GBO email
   - `GBO_INTERNAL_API_KEY` = a long random string we generate (this is *our* wrapper key, not GBO’s)
   - Optional: `GBO_SANDBOX=true` for first tests, `GBO_PAYMENT_TYPE=monthlyBilling` or `balance`, `GBO_AUTH_SCHEME=bearer`
2. Redeploy (push to `dev`/`main` or run **Deploy** workflow) so SAM writes the token onto Lambda.
3. Verify: Admin → **Vendor Management → GBO API → Run Health**. Expect `tokenConfigured: true` and a country count. Then list countries / gifts for `US`.
4. If Health is 401/403, set `GBO_AUTH_SCHEME` to `basic` (or `basic-b64` / `header`) and redeploy.
5. After Health works: storefront catalog + add-to-cart for GBO gifts (`GET /gbo/gifts`, SKU `gbo:US:{id}`), then a test sandbox order.

ACE Baskets **My Account** is not where the token lives. Ask `Resellers@GiftBasketsOverseas.com` if it was never emailed.

## What you must provide

1. **Partner API token** from `support@GiftBasketsOverseas.com` (or the token they emailed after the contract). Portal login is not the API token.
2. Add GitHub Actions secrets:
   - `GBO_API_TOKEN` — partner token
   - `GBO_INTERNAL_API_KEY` — a long random key we mint for *our* dedicated wrapper (`X-Gbo-Api-Key`)
3. Confirm billing mode with GBO: `monthlyBilling` (default) or `balance`.
4. Optional: start in sandbox (`GBO_SANDBOX=true`) until the first live order is approved.
5. Optional custom domain: point `gbo.blossompot.com` at the `GboApiUrl` CloudFormation output (same pattern as `orange-county.blossompot.com`).
6. If catalog calls return 401, ask GBO whether the token is sent as `Authorization: Bearer` (default) or `Authorization: Basic`. Set `GBO_AUTH_SCHEME` to `bearer`, `basic`, `basic-b64`, or `header`.

## Dedicated wrapper API

Separate API Gateway (`GboHttpApi` / `GboApiUrl`) — **not** the storefront API.

Auth header on every route except `/health`:

```http
X-Gbo-Api-Key: <GBO_INTERNAL_API_KEY>
```

| Method | Path | GBO upstream |
|--------|------|----------------|
| GET | `/health` | Token check + `POST /countries/get` |
| GET/POST | `/countries` | `POST /countries/get` |
| GET/POST | `/categories?country=US` | `POST /categories/get?country_iso_alpha2=` |
| GET/POST | `/gifts?country=US&price_min=&price_max=&category=` | `POST /gifts/get` |
| GET/POST | `/gifts/{productId}?country=US` | `POST /gift/get` |
| POST | `/orders` | `POST /order/create` (JSON body per GBO docs) |
| GET | `/orders/{orderId}` | `POST /order/get?order_id=` |

Upstream base: `https://www.giftbasketsoverseas.com/api/v1`  
Sandbox prefix: `/sandbox` (documented for categories; used for all routes when `GBO_SANDBOX=true`).

## Storefront / admin API (main Lambda)

Public (no GBO key; token stays on the server):

- `GET /gbo/health`
- `GET /gbo/countries`
- `GET /gbo/categories?country=US`
- `GET /gbo/gifts?country=US`
- `GET /gbo/gifts/{productId}?country=US`

Admin (Cognito):

- `GET /admin/gbo/health` … same catalog proxies
- `POST /admin/gbo/orders` — raw GBO create
- `GET /admin/gbo/orders/{orderId}` — raw GBO get
- `POST /admin/gbo/orders/{orderId}/place` — send a **BlossomPot** paid order to GBO (`?force=1` to retry)
- `POST /admin/gbo/orders/{orderId}/sync` — pull GBO status/tracking onto the BlossomPot order

UI: **Admin → Vendor Management → GBO API**.

## Checkout integration

Cart lines for GBO gifts use:

- `vendorSlug`: `gift-baskets-overseas`
- `sku`: `gbo:US:10215` (country + GBO product id)

After Stripe/Razorpay marks the order **paid**, the API places the GBO order (`payment.type` from `GBO_PAYMENT_TYPE`). USPS auto-label is skipped for GBO-only carts.

The 15-minute tracking cron also:

1. Retries GBO placement if a paid GBO order has no invoice yet
2. Polls `order/get` and maps GBO status IDs onto our order (queue → accepted, processing, local office → out for delivery, paused → on hold, delivered → delivered). GBO **cancelled (3)** maps to **on hold** so we never auto-cancel a paid order.

## GBO status IDs

| IDs | GBO meaning | Our status |
|-----|-------------|------------|
| 0, 5, 14, 17 | Received, in queue | `accepted` |
| 13, 2, 18 | Being processed | `processing` |
| 4, 19 | Passed to local office | `out_for_delivery` |
| 12, 16, 20, 21 | Paused / more info | `on_hold` |
| 3 | Cancelled | `on_hold` (manual review) |
| 1, 15 | Delivered | `delivered` |

## Not in this pass

Storefront PDP / add-to-cart for the live GBO catalog is not wired yet. Catalog is available via `/gbo/*` so the shop can be built next without changing the partner contract.

## Support

GBO: [gboapi.readme.io](https://gboapi.readme.io/reference/getting-started) · `Resellers@GiftBasketsOverseas.com` / `support@GiftBasketsOverseas.com`
