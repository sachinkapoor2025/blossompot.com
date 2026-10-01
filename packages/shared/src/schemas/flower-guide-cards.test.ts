import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flowerGuideCardsSchema,
  flowerGuideCardLimit,
  isFlowerGuideCardsFresh,
  FLOWER_GUIDE_CARDS_TTL_SECONDS,
} from "./flower-guide-cards";

function card(slug: string) {
  return {
    slug,
    name: slug,
    price: 49,
    currency: "USD" as const,
    categorySlug: "flowers",
    images: ["https://cdn.example.com/flower.jpg"],
    inventory: 4,
    published: true as const,
  };
}

function record(slug: "usa" | "uk", count: number) {
  return {
    country: slug === "usa" ? "US" : "GB",
    slug,
    products: Array.from({ length: count }, (_, i) => card(`${slug}-${i}`)),
  };
}

describe("flower guide card cache schema", () => {
  it("accepts 24 USA cards and 10 UK cards, and rejects a larger list", () => {
    assert.equal(flowerGuideCardLimit("usa"), 24);
    assert.equal(flowerGuideCardLimit("uk"), 10);
    assert.equal(flowerGuideCardsSchema.safeParse(record("usa", 24)).success, true);
    assert.equal(flowerGuideCardsSchema.safeParse(record("uk", 10)).success, true);
    assert.equal(flowerGuideCardsSchema.safeParse(record("usa", 25)).success, false);
    assert.equal(flowerGuideCardsSchema.safeParse(record("uk", 11)).success, false);
  });

  it("rejects a country that does not match the guide and an unsafe image", () => {
    const crossed = record("uk", 1);
    crossed.country = "US";
    assert.equal(flowerGuideCardsSchema.safeParse(crossed).success, false);

    const unsafe = record("uk", 1);
    unsafe.products[0] = { ...unsafe.products[0], images: ["http://cdn.example.com/flower.jpg"] };
    assert.equal(flowerGuideCardsSchema.safeParse(unsafe).success, false);

    const privateField = {
      ...record("uk", 1).products[0],
      vendorCost: 12,
    };
    const withPrivate = record("uk", 1);
    withPrivate.products[0] = privateField;
    assert.equal(flowerGuideCardsSchema.safeParse(withPrivate).success, false);
  });

  it("expires on the same 45-second window as the catalog fetch", () => {
    const now = Date.now();
    assert.equal(FLOWER_GUIDE_CARDS_TTL_SECONDS, 45);
    assert.equal(isFlowerGuideCardsFresh(new Date(now - 44_000).toISOString(), now), true);
    assert.equal(isFlowerGuideCardsFresh(new Date(now - 46_000).toISOString(), now), false);
  });
});
