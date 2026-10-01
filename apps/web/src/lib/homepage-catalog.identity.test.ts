import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homepageCatalogDataSchema, type Product } from "@blossompot/shared";
import { buildHomeCategoryTiles } from "./home-category-carousel";
import { deriveHomepageCatalogData } from "./homepage-catalog";

describe("homepage catalog derivation", () => {
  it("keeps the current tile identity and uses the merged list length as the gift count", () => {
    const tiles = buildHomeCategoryTiles([], []);
    const parsed = homepageCatalogDataSchema.safeParse({
      country: "US",
      giftCount: 1,
      categoryCount: 0,
      tiles,
    });
    assert.equal(parsed.success, true, parsed.success ? "" : parsed.error.message);

    const products = [
      { slug: "classic-red-rose-bouquet", name: "Classic Red Rose Bouquet", categorySlug: "flowers", images: [] },
      { slug: "other-gift", name: "Other Gift", categorySlug: "plants", images: [] },
    ] as Product[];
    const derived = deriveHomepageCatalogData("GB", products, []);
    assert.equal(derived.giftCount, 2);
    assert.equal(derived.categoryCount, 0);
    assert.equal(derived.country, "GB");
    assert.deepEqual(
      derived.tiles.map((tile) => ({ slug: tile.slug, label: tile.label, href: tile.href })),
      tiles.map((tile) => ({ slug: tile.slug, label: tile.label, href: tile.href }))
    );
  });
});
