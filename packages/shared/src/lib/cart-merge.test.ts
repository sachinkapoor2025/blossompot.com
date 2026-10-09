import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeCartItems } from "./cart-merge";
import type { CartItem } from "../schemas/cart";

function line(partial: Partial<CartItem> & Pick<CartItem, "productSlug" | "quantity">): CartItem {
  return {
    name: partial.productSlug,
    price: 10,
    currency: "USD",
    ...partial,
  };
}

describe("mergeCartItems", () => {
  it("keeps guest lines when the account cart is empty", () => {
    const merged = mergeCartItems([], [line({ productSlug: "roses", quantity: 2, lineId: "g1" })]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.quantity, 2);
  });

  it("adds quantities for the same product line", () => {
    const merged = mergeCartItems(
      [line({ productSlug: "roses", quantity: 1, lineId: "a1" })],
      [line({ productSlug: "roses", quantity: 2, lineId: "g1" })]
    );
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.quantity, 3);
    assert.equal(merged[0]?.lineId, "a1");
  });

  it("appends distinct guest products", () => {
    const merged = mergeCartItems(
      [line({ productSlug: "roses", quantity: 1 })],
      [line({ productSlug: "cake", quantity: 1 })]
    );
    assert.deepEqual(
      merged.map((i) => i.productSlug).sort(),
      ["cake", "roses"]
    );
  });
});
