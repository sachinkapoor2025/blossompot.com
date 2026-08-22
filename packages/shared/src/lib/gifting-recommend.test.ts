import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickSurpriseGift, recommendGifts, type RecommendableProduct } from "./gifting-recommend";
import type { GiftRecipient } from "../schemas/gifting";

const products: RecommendableProduct[] = [
  {
    slug: "pink-rose-bouquet",
    name: "Pink Rose Bouquet",
    price: 59,
    categorySlug: "flower-bouquets",
    tags: ["rose", "pink", "romantic"],
    inventory: 8,
    unitsSold: 40,
    ratingAggregate: { average: 4.8 },
  },
  {
    slug: "chocolate-truffle-box",
    name: "Chocolate Truffle Box",
    price: 32,
    categorySlug: "chocolates",
    tags: ["chocolate"],
    inventory: 12,
    unitsSold: 10,
  },
  {
    slug: "premium-hamper",
    name: "Premium Flower + Cake Combo",
    price: 89,
    categorySlug: "gift-hampers",
    tags: ["combo", "hamper", "cake"],
    inventory: 4,
    unitsSold: 6,
  },
  {
    slug: "out-of-stock-roses",
    name: "Sold Out Roses",
    price: 40,
    categorySlug: "flowers",
    tags: ["rose"],
    inventory: 0,
  },
];

const recipient: GiftRecipient = {
  id: "r1",
  userId: "u1",
  name: "Sarah",
  relationship: "wife",
  preferences: {
    favouriteFlower: "rose",
    favouriteColour: "pink",
    preferredGiftCategory: "flowers",
    budgetMin: 50,
    budgetMax: 75,
  },
  createdAt: "",
  updatedAt: "",
};

describe("gifting recommendations", () => {
  it("scores favourite flowers and budget ahead of unrelated gifts", () => {
    const recs = recommendGifts(products, {
      recipient,
      occasionType: "anniversary",
      limit: 3,
    });
    assert.equal(recs[0]?.slug, "pink-rose-bouquet");
    assert.ok(recs[0]!.score > (recs[1]?.score ?? 0));
    assert.ok(recs.some((r) => r.reasons.some((x) => /favourite flower/i.test(x))));
    assert.ok(!recs.some((r) => r.slug === "out-of-stock-roses"));
  });

  it("does not pick randomly for Surprise Me", () => {
    const pick = pickSurpriseGift(products, { recipient, occasionType: "anniversary" });
    assert.equal(pick?.slug, "pink-rose-bouquet");
  });

  it("avoids previously disliked products", () => {
    const recs = recommendGifts(products, {
      recipient,
      history: [
        {
          id: "h1",
          userId: "u1",
          recipientId: "r1",
          giftDate: "2025-03-15",
          productSlug: "pink-rose-bouquet",
          productName: "Pink Rose Bouquet",
          feedback: "not_suitable",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });
    assert.notEqual(recs[0]?.slug, "pink-rose-bouquet");
  });
});
