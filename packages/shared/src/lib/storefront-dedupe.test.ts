import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupeStorefrontProducts, groupStorefrontProductsOnce } from "./storefront-dedupe";

describe("dedupeStorefrontProducts", () => {
  it("keeps one row per slug and SKU", () => {
    const products = [
      { slug: "carrot-cake", name: "Carrot Cake", sku: "TFCC2608", categorySlug: "cakes", tags: ["tf-usa"] },
      { slug: "carrot-cake", name: "Carrot Cake", sku: "OLD-CAKE", categorySlug: "cakes" },
      { slug: "carrot-cake-copy", name: "Carrot Cake", sku: "TFCC2608", categorySlug: "cakes" },
    ];
    const out = dedupeStorefrontProducts(products);
    assert.equal(out.length, 1);
    assert.equal(out[0].sku, "TFCC2608");
  });

  it("does not drop distinct catalog SKUs that share a stock photo", () => {
    const products = [
      {
        slug: "peace-lily-plant",
        name: "Peace Lily Plant",
        sku: "BP-LILY",
        categorySlug: "plants",
        images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format"],
      },
      {
        slug: "succulent-garden-gift",
        name: "Succulent Garden Gift",
        sku: "BP-SUCC",
        categorySlug: "plants",
        images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format"],
      },
    ];
    const out = dedupeStorefrontProducts(products);
    assert.equal(out.length, 2);
  });

  it("drops a second TF card that shares the featured import image", () => {
    const products = [
      {
        slug: "sweet-moments-bouquet",
        name: "Sweet Moments Bouquet",
        sku: "TFFF2602",
        categorySlug: "flower-bouquets",
        images: ["/uploads/tf-usa/TFFF2602/TFFF2602.jpg"],
        tags: ["tf-usa"],
      },
      {
        slug: "sweet-moments-bouquet-2",
        name: "Sweet Moments",
        sku: "DUP-2602",
        categorySlug: "flower-bouquets",
        images: ["/uploads/tf-usa/TFFF2602/TFFF2602.jpg"],
      },
    ];
    const out = dedupeStorefrontProducts(products);
    assert.equal(out.length, 1);
    assert.equal(out[0].slug, "sweet-moments-bouquet");
  });
});

describe("groupStorefrontProductsOnce", () => {
  it("does not list a bouquet in both Flowers and Flower Bouquets", () => {
    const products = [
      {
        slug: "sweet-moments-bouquet",
        name: "Sweet Moments Bouquet",
        sku: "TFFF2602",
        categorySlug: "flower-bouquets",
        additionalCategorySlugs: ["flowers"],
      },
      {
        slug: "classic-red-rose-bouquet",
        name: "Classic Red Rose Bouquet",
        sku: "BP-ROSES",
        categorySlug: "flowers",
        additionalCategorySlugs: ["same-day-gifts"],
      },
    ];
    const groups = groupStorefrontProductsOnce(products, ["flowers", "flower-bouquets", "same-day-gifts"]);
    assert.deepEqual(
      groups.get("flowers")?.map((p) => p.slug),
      ["classic-red-rose-bouquet"]
    );
    assert.deepEqual(
      groups.get("flower-bouquets")?.map((p) => p.slug),
      ["sweet-moments-bouquet"]
    );
    assert.deepEqual(groups.get("same-day-gifts"), []);
  });
});
