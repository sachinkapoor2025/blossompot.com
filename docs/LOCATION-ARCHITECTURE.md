# Location architecture

One source of truth for **international** markets lives in `apps/web/src/lib/content/geo/international/`.

USA destination pages stay in `apps/web/src/lib/content/geo/locations.data.json` and keep canonical URLs `/gifts-to-{slug}`.

## URL rules

| Surface | Canonical URL | Notes |
|---------|---------------|--------|
| Hub | `/locations/` | Markets + USA examples |
| USA country | `/locations/united-states/` | Links to existing USA index |
| USA state/city | `/gifts-to-{slug}` | Unchanged, already indexed |
| USA hierarchy alias | `/locations/united-states/{state}/{city?}` | **301** to `/gifts-to-{slug}` |
| USA index | `/delivery-locations` | All 50 states + cities |
| Canada | `/locations/canada/{province}/{city?}` | Origin-market guides |
| Australia | `/locations/australia/{state}/{city?}` | Origin-market guides |
| Europe | `/locations/europe/{country}/{city?}` | Market + country hubs |

Do not create a second indexable copy of a USA city.

## Service modes

- `destination` — we deliver **to** this place (United States).
- `origin` — shoppers **here** send gifts **to the USA**.
- `expanding` — reserved for future real destination coverage. Do not publish as live local florist service.

Never invent local offices, reviews, or same-day vans abroad.

## Publish statuses

`draft` | `review` | `published` | `noindex` | `archived`

A page is indexable only when `status === "published"` **and** `assertInternationalComplete()` passes (intro ≥ 80 words, ≥ 3 FAQs, title/description/H1, no IANA timezone IDs, unique intro prefix).

## How to add a country

1. Add a unique `InternationalLocation` (`kind: "country"`) in the matching `content-*.ts` file.
2. Set `parents.market` to `europe` (or add a new market slug + `[[...path]]` route if it is a new continent).
3. Write unique intro, how-it-works, availability, local notes, and 3+ FAQs. Do not swap a city name into another country’s paragraph.
4. Link it from the market `childSlugs`.
5. Run `npm run assert:international-geo`.
6. Only set `status: "published"` when the quality gate passes and the business actually wants the URL indexed.

## How to add a state / province / region

Same as a country, with `kind: "region"` and `parents.country` set. Path is `/locations/{market}/{region}`.

## How to add a city

`kind: "city"` with `parents.region` (Canada/Australia) or `parents.country` (Europe). Path is `/locations/{market}/{region|country}/{city}`.

## Ready but unpublished

These exist in the architecture (add content + `published` when useful):

- Canada: New Brunswick, Newfoundland and Labrador, Prince Edward Island, Northwest Territories, Yukon, Nunavut
- Australia: Tasmania, Northern Territory
- Europe: additional cities (Rome, Madrid, Munich, Zurich, …) and future countries (Portugal, Poland, …)

## Localization

English-first. Do not add hreflang until a page is a true language/locale alternate. Gift-card text may be in the sender’s language.

## Data must not be duplicated

Sitemap, breadcrumbs, schema, nav, and page copy all read the same `InternationalLocation` records.
