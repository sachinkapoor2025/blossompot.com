import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import { dedupeStorefrontProducts } from "@blossompot/shared";
import { toListingCardProducts } from "./listing-card";

function sample(description: string): Product {
  return {
    slug: "rose-bouquet",
    name: "Rose bouquet",
    description,
    price: 49,
    compareAtPrice: 59,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    sku: "TFFF-1",
    inventory: 4,
    tags: ["tf-usa"],
    couponExcluded: true,
    unitsSold: 12,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    seoDescription: "A very long SEO description that listing cards do not render.",
    shippingOptions: [{ label: "Ground", price: 6.99 }],
  };
}

describe("listing card payload", () => {
  it("drops detail-only fields and keeps card, price, and image data", () => {
    const [card] = toListingCardProducts([sample("x".repeat(400))]);
    assert.equal(card.slug, "rose-bouquet");
    assert.equal(card.price, 49);
    assert.equal(card.compareAtPrice, 59);
    assert.equal(card.images?.length, 2);
    assert.equal(card.inventory, 4);
    assert.equal(card.unitsSold, 12);
    assert.equal(card.seoDescription, undefined);
    assert.equal(card.shippingOptions, undefined);
    assert.ok((card.description ?? "").length > 80);
    assert.ok((card.description ?? "").length < 400);
  });

  it("keeps the same dedupe winner after the description is shortened", () => {
    const rich = sample("y".repeat(200));
    const thin = { ...sample("short"), slug: "other", sku: "TFFF-1" };
    const before = dedupeStorefrontProducts([thin, rich]).map((p) => p.slug);
    const after = dedupeStorefrontProducts(toListingCardProducts([thin, rich])).map((p) => p.slug);
    assert.deepEqual(after, before);
  });
});
