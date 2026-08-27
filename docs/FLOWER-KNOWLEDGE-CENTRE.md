# Flower Knowledge Centre

Permanent educational section at `/flower-guide/`.

This is not a generic blog. It is a reusable encyclopedia: one flower data model, one detail template, pillar pages for seasons, occasions, colours, care, comparisons and glossary.

## URL

Prefer `/flower-guide/` (clean, parallel to `/blog`, distinct from the `/flowers` shop category).

## Content status

Statuses live on each flower record:

`draft` → `researching` → `reviewed` / `published` → `needs_update` → `archived`

Only `reviewed` and `published` guides are indexable and included in sitemaps.

## Adding a flower

1. Add a directory row in `apps/web/src/lib/content/flower-guide/catalog.ts`.
2. Write a full `FlowerGuide` in `published/` (research sources; do not invent vase-life numbers).
3. Set `status: "published"` only after review.
4. Link related flowers, colours, occasions and a care article where one exists.

Do not mass-produce flower + city pages. Link existing `/gifts-to-*` (USA destination) and `/locations/...` (international origin-to-USA) pages instead.

## Markets

Season copy must distinguish:

- local garden season
- commercial / greenhouse availability
- imported availability

Do not assume UK seasonality applies to the USA, Canada, Australia or the UAE.

## Images

Use licensed or Unsplash sources. Store `alt`, filename, attribution and license on each image object. Do not scrape competitor photos.

## Analytics

Page views already fire on `/flower-guide/*`. Internal searches use `trackSearch` with a `flower-guide:` prefix. Product clicks from guides use existing product cards / `/products?search=`.
