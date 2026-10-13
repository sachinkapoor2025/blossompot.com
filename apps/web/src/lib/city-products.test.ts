import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import { featuredLocationProducts, shuffleForCity } from "./city-products";

function product(slug: string, images: string[]): Product {
  return {
    slug,
    name: slug,
    description: "Gift",
    price: 29,
    currency: "USD",
    categorySlug: "flowers",
    images,
    inventory: 10,
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("featuredLocationProducts", () => {
  it("prefers products with real photos over empty galleries", () => {
    const catalog = [
      product("blank-one", []),
      product("rose-bouquet", ["https://example.com/rose.jpg"]),
      product("blank-two", []),
      product("hamper", ["https://example.com/hamper.jpg"]),
    ];
    const featured = featuredLocationProducts(catalog, "california", 4);
    assert.equal(featured.length, 2);
    assert.deepEqual(
      featured.map((p) => p.slug).sort(),
      ["hamper", "rose-bouquet"]
    );
    assert.ok(featured.every((p) => p.images.length > 0));
  });

  it("keeps a stable shuffle for the same location slug", () => {
    const catalog = Array.from({ length: 12 }, (_, i) =>
      product(`gift-${i}`, [`https://example.com/${i}.jpg`])
    );
    const a = featuredLocationProducts(catalog, "houston", 8).map((p) => p.slug);
    const b = featuredLocationProducts(catalog, "houston", 8).map((p) => p.slug);
    assert.deepEqual(a, b);
    assert.notEqual(shuffleForCity(catalog, "houston")[0]?.slug, undefined);
  });
});
