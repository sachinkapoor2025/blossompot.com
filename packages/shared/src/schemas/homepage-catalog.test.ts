import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOMEPAGE_TILE_IDENTITY,
  homepageCatalogDataSchema,
  isHomepageCatalogFresh,
} from "./homepage-catalog";

function sampleCatalog(overrides?: Partial<{ giftCount: number; image: string; slug: string }>) {
  return {
    country: "US",
    giftCount: overrides?.giftCount ?? 400,
    categoryCount: 14,
    tiles: HOMEPAGE_TILE_IDENTITY.map((tile, index) => ({
      ...tile,
      slug: index === 0 && overrides?.slug ? overrides.slug : tile.slug,
      image: overrides?.image ?? "https://cdn.example.com/tile.jpg",
      alt: tile.label,
    })),
  };
}

describe("homepage catalog schema", () => {
  it("accepts the 13-tile homepage record", () => {
    const parsed = homepageCatalogDataSchema.parse(sampleCatalog());
    assert.equal(parsed.tiles.length, 13);
    assert.equal(parsed.tiles[9].href, "/same-day-delivery");
    assert.equal(parsed.giftCount, 400);
  });

  it("rejects a reordered or rewritten tile", () => {
    const parsed = homepageCatalogDataSchema.safeParse(sampleCatalog({ slug: "other" }));
    assert.equal(parsed.success, false);
  });

  it("rejects a non-https tile image", () => {
    const parsed = homepageCatalogDataSchema.safeParse(sampleCatalog({ image: "http://cdn.example.com/tile.jpg" }));
    assert.equal(parsed.success, false);
  });

  it("treats a record as fresh only inside 45 seconds", () => {
    const now = Date.parse("2026-10-01T12:00:00.000Z");
    assert.equal(isHomepageCatalogFresh("2026-10-01T11:59:20.000Z", now), true);
    assert.equal(isHomepageCatalogFresh("2026-10-01T11:59:14.000Z", now), false);
    assert.equal(isHomepageCatalogFresh("not-a-date", now), false);
  });
});
