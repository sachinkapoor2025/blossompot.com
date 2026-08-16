# Delivery location & vendor serviceability

Customers pick **country + postal/ZIP only**. The backend decides which vendors (and therefore which products) can fulfill that destination.

## Customer ask

- First visit: modal “Where should we deliver?”
- Header chip: `Deliver to 90012` → Change
- Dismissing the modal does not block browsing. A banner asks them to choose a location.
- Search crawlers never see a hard wall (modal is client-only; catalog HTML stays indexable).

Cookie / localStorage token: `bp_dl=US:90012`.

## Matching rules

Stored in the config table:

- `PK=VCOV#{vendorSlug}`
- `SK=SAREA#{areaId}`

Scopes: `POSTAL_CODE` → `POSTAL_PREFIX` → `CITY` → `STATE` → `COUNTRY` → `RADIUS`.  
`DENY` beats `ALLOW`.

Built-in defaults (used until admin saves overrides):

- **blossompot** — entire United States
- **orange-county** — ZIP prefixes 926, 927, 928, 906, 907

Checkout still collects a US shipping address (existing USPS/Stripe flow). Non-US catalog destinations are valid for browsing; fulfillment remains US unless a vendor has real international rules.

## Admin

`/admin/service-areas` — CRUD, CSV import, tester, coverage summary.

Seed defaults:

```bash
npm run seed:serviceability
```

No new environment variables. Uses existing `CONFIG_TABLE`.
