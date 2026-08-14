# Orange County vendor order API

Dedicated Vendor API Gateway (`VendorApiUrl`) — **not** the website/storefront API (`ApiUrl` / foqu2ap4qi).

**Infra note:** `VendorHttpApi` / `VendorApiFunction` use CloudFormation `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` so a stack update does not wipe the vendor API Gateway. Do not rename those logical IDs in `infrastructure/template.yaml`.

Auth header on every request:

```http
X-Vendor-Api-Key: <ORANGE_COUNTY_VENDOR_API_KEY>
```

Base URL (prod custom domain):

`https://orange-county.blossompot.com`

(Legacy execute-api URL still works: `https://xp9lzxeg40.execute-api.us-east-1.amazonaws.com/prod`)

---

## 1. List orders (import feed) — with pagination

```http
GET {VENDOR_API_URL}/vendors/orange-county/orders
```

### Query params

| Param | Default | Description |
|-------|---------|-------------|
| `days` | **15** | Only orders with `createdAt` in the last N days (max 90). Prevents re-importing old history. |
| `since` | *(derived from `days`)* | ISO timestamp override for createdAt lower bound |
| `updatedSince` | — | Optional ISO — only orders with `updatedAt >= updatedSince` (incremental sync) |
| `limit` | **50** | Page size (max **200**) |
| `cursor` | — | Opaque token from previous response `nextCursor` for the next page |
| `status` | — | Exact status filter. Default (omit) = all **post-payment** stages (`paid`, `processing`, `shipped`, `delivered`, …). Unpaid / cancelled / refunded are hidden unless you pass `status`. |

By default the import feed returns every Orange County order from **paid through complete** so vendors can track fulfillment. Use `?status=paid` for new-only import.

### Pagination (more than 50 orders)

Yes — use cursor pagination. Each response includes:

| Field | Meaning |
|-------|---------|
| `count` | Orders in this page |
| `limit` | Page size used |
| `hasMore` | `true` if another page exists |
| `nextCursor` | Pass as `?cursor=` on the next request (null when done) |

**Example loop:**

```bash
# Page 1
curl -sS -H "X-Vendor-Api-Key: YOUR_KEY" \
  "$BASE/vendors/orange-county/orders?days=15&limit=50"

# Page 2 (use nextCursor from previous JSON)
curl -sS -H "X-Vendor-Api-Key: YOUR_KEY" \
  "$BASE/vendors/orange-county/orders?days=15&limit=50&cursor=OPAQUE_CURSOR"
```

Keep calling while `hasMore === true`. You can also use `limit=200` for fewer round-trips.

### Duplicate prevention (recommended)

1. Always call with default **last 15 days** (or pass `days=15`).
2. Store each `orderId` / `orderNumber` (e.g. `OC10001`) locally; skip ids you already imported.
3. For incremental sync, pass `updatedSince` = last successful poll time.

> **Note:** `orderId` in this API is the human-readable number (`OC#####`). `internalOrderId` remains the UUID if you need a stable internal key.

### Example

```bash
curl -sS \
  -H "X-Vendor-Api-Key: YOUR_KEY" \
  "https://orange-county.blossompot.com/vendors/orange-county/orders?days=15&limit=50"
```

### Response fields (order)

| Field | Meaning |
|-------|---------|
| `orderId` / `orderNumber` | **Human-readable** id — `OC10001`, `OC10002`, … for Orange County fulfill orders |
| `internalOrderId` | Internal UUID (support only; prefer `orderNumber` for tracking) |
| `orderDate` / `createdAt` | When order was placed |
| `senderName` | Gift sender name |
| `recipientName` | Ship-to name |
| `recipientAddressLine1` | Street |
| `recipientAddressLine2` | Apt / suite (nullable) |
| `city` / `state` / `country` / `zipCode` | Address (same fields on **list** and **get**) |
| `recipientPhoneNumber` | **Full** recipient phone (never masked — required for USPS). Same on list and get. |
| `orderValue` | **Total fulfill** = sum of item vendor costs × qty (USD). Not retail. |
| `orderValueCurrency` | `USD` |
| `deliveryDate` | Requested / estimated delivery (nullable) |
| `giftMessage` | Greeting text for the shipment |
| `status` | BlossomPot status |
| `trackingNumber` / `carrier` | If already set |

### Response fields (each item)

| Field | Meaning |
|-------|---------|
| `sku` / `productCode` | Vendor SKU (e.g. `TFUSRH2026-16`) |
| `productName` | Title |
| `price` | Vendor purchase / fulfill unit price (`vendorCost`). Not website retail. |
| `quantity` | Units |
| `productImageUrl` | Absolute image URL |
| `weight` / `weightUnit` | Package weight in **oz** (from product data, or category defaults: single ≈ 6 oz, set-of-2 ≈ 16 oz, hamper ≈ 32 oz) |

---

## 2. Get one order

```http
GET {VENDOR_API_URL}/vendors/orange-county/orders/{orderId}
```

`{orderId}` accepts `OC10001` or the internal UUID.

---

## 3. Update AWB when shipped

Call either style (same body fields).

### Option A — body only (recommended for your system)

```http
POST {VENDOR_API_URL}/vendors/orange-county/shipment
Content-Type: application/json
X-Vendor-Api-Key: YOUR_KEY
```

```json
{
  "orderNumber": "OC10001",
  "courierName": "USPS",
  "awb": "9400111899223344556677"
}
```

### Option B — order number in the URL

```http
POST {VENDOR_API_URL}/vendors/orange-county/orders/OC10001/shipment
```

```json
{
  "orderNumber": "OC10001",
  "courierName": "USPS",
  "awb": "9400111899223344556677"
}
```

Effects:

- Saves `trackingNumber` = `awb`, `carrier` = `courierName`
- Moves order to `shipped` when allowed
- Notifies the customer

```bash
curl -sS -X POST \
  -H "X-Vendor-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"OC10001","courierName":"USPS","awb":"9400111899223344556677"}' \
  "https://orange-county.blossompot.com/vendors/orange-county/shipment"
```

---

## 4. Update tracking / shipment status

### Option A — body only (recommended)

```http
POST {VENDOR_API_URL}/vendors/orange-county/tracking
Content-Type: application/json
X-Vendor-Api-Key: YOUR_KEY
```

```json
{
  "orderNumber": "OC10001",
  "currentShipmentStatus": "in_transit"
}
```

`currentStatus` is also accepted as an alias of `currentShipmentStatus`.

### Option B — order number in the URL

```http
POST {VENDOR_API_URL}/vendors/orange-county/orders/OC10001/tracking
```

```json
{
  "orderNumber": "OC10001",
  "currentShipmentStatus": "delivered",
  "note": "optional free text"
}
```

Accepted status examples (case-insensitive):  
`processing`, `packed`, `shipped`, `in_transit`, `dispatched`, `out_for_delivery`, `delivered`, `complete`

```bash
curl -sS -X POST \
  -H "X-Vendor-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"OC10001","currentShipmentStatus":"delivered"}' \
  "https://orange-county.blossompot.com/vendors/orange-county/tracking"
```

---

## Admin (BlossomPot)

- `/admin/orders` — filter Vendor → Orange County  
- Storefront API host does **not** expose these routes
