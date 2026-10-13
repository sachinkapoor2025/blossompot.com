import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartControlActions, cartControlMode } from "./AddToCartControl";

describe("listing cart control", () => {
  it("uses the add button for a product that is not in the cart", () => {
    const actions = cartControlActions(cartControlMode([{ quantity: 0 }]));
    assert.deepEqual(actions, { add: true, viewCart: false });
  });

  it("replaces the add button with View Cart after a product is added", () => {
    const actions = cartControlActions(cartControlMode([{ quantity: 1, lineId: "line-roses" }]));
    assert.deepEqual(actions, { add: false, viewCart: true });
  });

  it("keeps the combo on the add button until both components are in the cart", () => {
    const partial = cartControlActions(
      cartControlMode([
        { quantity: 1, lineId: "line-roses" },
        { quantity: 0 },
      ])
    );
    assert.deepEqual(partial, { add: true, viewCart: false });

    const added = cartControlActions(
      cartControlMode([
        { quantity: 1, lineId: "line-roses" },
        { quantity: 1, lineId: "line-cake" },
      ])
    );
    assert.deepEqual(added, { add: false, viewCart: true });
  });

  it("never shows Add to cart and View Cart together", () => {
    for (const mode of ["add", "in-cart"] as const) {
      const actions = cartControlActions(mode);
      assert.equal(actions.add && actions.viewCart, false);
    }
  });
});
