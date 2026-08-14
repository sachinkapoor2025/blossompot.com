# Orange County vendor order API

BlossomPot admin sees **all** orders in `/admin/orders`.  
Orange County only receives orders that include **their** hamper line items (`vendorSlug=orange-county`).

Customer storefront never shows the vendor name — only “Rakhi Hamper”.

## What to share with the vendor

| Item | Value |
|------|--------|
| Base API URL | Your live API (same as `NEXT_PUBLIC_API_URL`), e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com` |
| Auth header | `X-Vendor-Api-Key: <secret>` |
| API key | GitHub Actions secret / SAM param `ORANGE_COUNTY_VENDOR_API_KEY` (generate a long random string; do not commit it) |

### Generate a key (example)

```bash
openssl rand -hex 32
```

Set it as:

1. GitHub repo secret: `ORANGE_COUNTY_VENDOR_API_KEY`
2. Redeploy API (SAM) so Lambda env `ORANGE_COUNTY_VENDOR_API_KEY` is set

Share **only** the base URL + this key with Orange County (over a secure channel). Rotate if leaked.

## Endpoints

### List their orders

```http
GET {API_URL}/vendors/orange-county/orders
X-Vendor-Api-Key: <key>
```

Optional query params:

| Param | Description |
|-------|-------------|
| `limit` | Max orders (default 50, max 100) |
| `status` | Exact status, e.g. `paid`, `processing`, `shipped` |
| `since` | ISO date — only orders with `createdAt >= since` |

Example:

```bash
curl -sS \
  -H "X-Vendor-Api-Key: YOUR_KEY" \
  "https://YOUR_API_URL/vendors/orange-county/orders?limit=50"
```

Response shape (simplified):

```json
{
  "vendorSlug": "orange-county",
  "count": 2,
  "orders": [
    {
      "orderId": "…",
      "status": "paid",
      "createdAt": "…",
      "currency": "USD",
      "shippingAddress": { "name": "…", "line1": "…", "city": "…", "state": "…", "postalCode": "…", "country": "US", "phone": "…" },
      "trackingNumber": null,
      "carrier": null,
      "items": [
        { "productSlug": "…", "sku": "TFUSA001", "name": "…", "quantity": 1, "price": 57, "currency": "USD" }
      ],
      "vendorSubtotal": 57
    }
  ]
}
```

Notes:

- Unpaid / cancelled / refunded orders are **hidden** unless you pass `?status=…`
- `items` are **only** Orange County lines (BlossomPot-only SKUs on mixed carts are omitted)
- `vendorSubtotal` is the sum of those lines only

### Single order

```http
GET {API_URL}/vendors/orange-county/orders/{orderId}
X-Vendor-Api-Key: <key>
```

Returns `403` if the order has no Orange County items or the key is wrong.

## Admin portal (BlossomPot)

- `/admin/orders` — all orders
- Filter **Vendor → Orange County** to see only orders that include OC hampers
- Order detail shows an **Orange County** badge on the order and on each OC line item

## Requirements for tagging to work

1. Products imported with `vendorSlug: orange-county` (our Orange County import/catalog)
2. Customer adds those products to cart after import (cart stamps `vendorSlug` on the line)
3. Checkout writes `vendorSlugs` on the order

If an old order was placed before `vendorSlug` existed on products, it will not appear in the vendor feed.