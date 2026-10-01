import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homepageCatalogDataSchema, HOMEPAGE_TILE_IDENTITY, type HomepageCatalogData, type Product } from "@blossompot/shared";
import { buildHomeCategoryTiles } from "./home-category-carousel";
import { deriveHomepageCatalogData, resolveHomepageCatalogData } from "./homepage-catalog";

function record(country: string, giftCount: number): HomepageCatalogData {
  return {
    country,
    giftCount,
    categoryCount: 14,
    tiles: HOMEPAGE_TILE_IDENTITY.map((tile) => ({
      slug: tile.slug,
      label: tile.label,
      href: tile.href,
      image: "https://cdn.example.com/tile.jpg",
      alt: tile.label,
    })),
  };
}

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
    const parsedDerived = homepageCatalogDataSchema.safeParse(derived);
    assert.equal(parsedDerived.success, true);
    assert.equal(derived.tiles.length, 13);
  });

  it("reuses the shared country record and does not rebuild it", async () => {
    const store = new Map<string, HomepageCatalogData>();
    let builds = 0;
    const memory = new Map<string, { at: number; data: HomepageCatalogData }>();
    const deps = {
      readShared: async (country: string) => store.get(country) ?? null,
      writeShared: async (data: HomepageCatalogData) => {
        store.set(data.country, data);
        return true;
      },
      compute: async (country: string) => {
        builds += 1;
        return record(country, country === "US" ? 259 : 248);
      },
    };

    const first = await resolveHomepageCatalogData("US", deps, memory);
    assert.equal(first.source, "miss");
    assert.equal(builds, 1);
    assert.equal(store.get("US")?.giftCount, 259);

    const second = await resolveHomepageCatalogData("US", deps, memory);
    assert.equal(second.source, "shared");
    assert.equal(builds, 1);
    assert.equal(second.data.giftCount, 259);
    assert.equal(second.data.tiles.length, 13);
  });

  it("keeps US and GB records separate", async () => {
    const store = new Map<string, HomepageCatalogData>();
    const memory = new Map<string, { at: number; data: HomepageCatalogData }>();
    const deps = {
      readShared: async (country: string) => store.get(country) ?? null,
      writeShared: async (data: HomepageCatalogData) => {
        store.set(data.country, data);
        return true;
      },
      compute: async (country: string) => record(country, country === "US" ? 259 : 248),
    };

    const us = await resolveHomepageCatalogData("us", deps, memory);
    const gb = await resolveHomepageCatalogData("GB", deps, memory);
    assert.equal(us.data.country, "US");
    assert.equal(us.data.giftCount, 259);
    assert.equal(gb.data.country, "GB");
    assert.equal(gb.data.giftCount, 248);

    const usAgain = await resolveHomepageCatalogData("US", deps, memory);
    const gbAgain = await resolveHomepageCatalogData("gb", deps, memory);
    assert.equal(usAgain.source, "shared");
    assert.equal(usAgain.data.giftCount, 259);
    assert.equal(gbAgain.source, "shared");
    assert.equal(gbAgain.data.giftCount, 248);
  });

  it("rebuilds when the shared record is no longer fresh", async () => {
    const memory = new Map<string, { at: number; data: HomepageCatalogData }>();
    let shared: HomepageCatalogData | null = null;
    let builds = 0;
    const deps = {
      readShared: async () => shared,
      writeShared: async (data: HomepageCatalogData) => {
        shared = data;
        return true;
      },
      compute: async (country: string) => {
        builds += 1;
        return record(country, 100 + builds);
      },
    };

    const first = await resolveHomepageCatalogData("CA", deps, memory);
    assert.equal(first.source, "miss");
    assert.equal(first.data.giftCount, 101);

    shared = null;
    const entry = memory.get("CA");
    assert.ok(entry);
    entry.at = Date.now() - 46_000;

    const rebuilt = await resolveHomepageCatalogData("CA", deps, memory);
    assert.equal(rebuilt.source, "miss");
    assert.equal(builds, 2);
    assert.equal(rebuilt.data.giftCount, 102);
  });
});
