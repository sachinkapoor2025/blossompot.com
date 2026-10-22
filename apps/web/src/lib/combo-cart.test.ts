import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Cart } from "@blossompot/shared";
import { cartControlActions, cartControlMode } from "../components/AddToCartControl";
import {
  addComboComponentsToCart,
  comboComponentLine,
  comboQuantityChange,
  type ComboCartClient,
} from "./combo-cart";

const roses = { slug: "roses", name: "Roses" };
const cake = { slug: "cake", name: "Cake" };

function cartWith(slug: string, quantity: number): Cart {
  return {
    items: [
      {
        lineId: `line-${slug}`,
        productSlug: slug,
        name: slug,
        price: 10,
        currency: "USD",
        quantity,
      },
    ],
    updatedAt: "2026-05-01T00:00:00.000Z",
  };
}

describe("combo add to cart", () => {
  it("adds both component products as separate lines", async () => {
    const added: string[] = [];
    const client: ComboCartClient = {
      async addItem(productSlug) {
        added.push(productSlug);
        return cartWith(productSlug, 1);
      },
      async updateItem() {
        throw new Error("should not update");
      },
      async removeItem() {
        throw new Error("should not remove");
      },
    };
    const result = await addComboComponentsToCart([roses, cake], 0, client);
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(added, ["roses", "cake"]);
  });

  it("does not report success when the second product cannot be added", async () => {
    const removed: string[] = [];
    const client: ComboCartClient = {
      async addItem(productSlug) {
        if (productSlug === "cake") throw new Error("Insufficient inventory");
        return cartWith(productSlug, 1);
      },
      async updateItem() {
        throw new Error("should not update");
      },
      async removeItem(lineId) {
        removed.push(lineId);
      },
    };
    const result = await addComboComponentsToCart([roses, cake], 0, client);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.message.includes("Added"), false);
    assert.equal(result.message.includes("Insufficient inventory"), true);
    assert.deepEqual(removed, ["line-roses"]);
  });

  it("restores an existing first line when the second add fails", async () => {
    const updates: Array<{ lineId: string; quantity: number }> = [];
    const client: ComboCartClient = {
      async addItem(productSlug) {
        if (productSlug === "cake") throw new Error("Unavailable for this address");
        return cartWith(productSlug, 3);
      },
      async updateItem(lineId, quantity) {
        updates.push({ lineId, quantity });
      },
      async removeItem() {
        throw new Error("should not remove");
      },
    };
    const result = await addComboComponentsToCart([roses, cake], 2, client);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.message.includes("Added"), false);
    assert.deepEqual(updates, [{ lineId: "line-roses", quantity: 2 }]);
  });

  it("stops after the first product fails and does not add the second", async () => {
    const added: string[] = [];
    const client: ComboCartClient = {
      async addItem(productSlug) {
        added.push(productSlug);
        throw new Error("Out of stock");
      },
      async updateItem() {},
      async removeItem() {},
    };
    const result = await addComboComponentsToCart([roses, cake], 0, client);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.message.includes("Added"), false);
    assert.equal(result.message.includes("Roses"), true);
    assert.deepEqual(added, ["roses"]);
  });

  it("says when a failed second add cannot be undone", async () => {
    const client: ComboCartClient = {
      async addItem(productSlug) {
        if (productSlug === "cake") throw new Error("Insufficient inventory");
        return cartWith(productSlug, 1);
      },
      async updateItem() {},
      async removeItem() {
        throw new Error("remove failed");
      },
    };
    const result = await addComboComponentsToCart([roses, cake], 0, client);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.message.includes("Added"), false);
    assert.equal(result.message.includes("Roses is in your cart"), true);
    assert.equal(result.message.includes("Cake was not added"), true);
  });

  it("tracks the default shipping line and shows one combo quantity", () => {
    const cart: Cart = {
      items: [
        { ...cartWith("roses", 2).items[0]!, lineId: "line-roses" },
        {
          ...cartWith("cake", 2).items[0]!,
          lineId: "line-cake",
          shippingOptionLabel: "2nd Day",
        },
      ],
      updatedAt: "2026-05-01T00:00:00.000Z",
    };
    const lines = [comboComponentLine(cart, roses), comboComponentLine(cart, cake)];
    assert.deepEqual(cartControlActions(cartControlMode(lines)), { add: false, viewCart: true });
    assert.equal(Math.min(...lines.map((line) => line.quantity)), 2);
    assert.deepEqual(comboQuantityChange(lines, "decrease"), {
      kind: "update",
      updates: [
        { lineId: "line-roses", quantity: 1 },
        { lineId: "line-cake", quantity: 1 },
      ],
    });
    const single = lines.map((line) => ({ ...line, quantity: 1 }));
    assert.deepEqual(comboQuantityChange(single, "decrease"), {
      kind: "remove",
      lineIds: ["line-roses", "line-cake"],
    });
    assert.deepEqual(comboQuantityChange(single, "remove"), {
      kind: "remove",
      lineIds: ["line-roses", "line-cake"],
    });
  });

  it("does not show quantity controls for a different cake shipping line", () => {
    const cart: Cart = {
      items: [
        { ...cartWith("roses", 1).items[0]!, lineId: "line-roses" },
        {
          ...cartWith("cake", 1).items[0]!,
          lineId: "line-next-day",
          shippingOptionLabel: "Next Day",
        },
      ],
      updatedAt: "2026-05-01T00:00:00.000Z",
    };
    const lines = [comboComponentLine(cart, roses), comboComponentLine(cart, cake)];
    assert.equal(lines[1]?.quantity, 0);
    assert.deepEqual(cartControlActions(cartControlMode(lines)), { add: true, viewCart: false });
  });

  it("rolls back a default shipping line when the second component fails", async () => {
    const removed: string[] = [];
    const client: ComboCartClient = {
      async addItem(productSlug) {
        if (productSlug === "cake") throw new Error("Insufficient inventory");
        return {
          items: [
            {
              ...cartWith(productSlug, 1).items[0]!,
              lineId: "line-roses",
              shippingOptionLabel: "2nd Day",
            },
          ],
          updatedAt: "2026-05-01T00:00:00.000Z",
        };
      },
      async updateItem() {
        throw new Error("should not update");
      },
      async removeItem(lineId) {
        removed.push(lineId);
      },
    };
    const result = await addComboComponentsToCart([roses, cake], 0, client);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(removed, ["line-roses"]);
    const afterRollback = comboComponentLine(
      { items: [], updatedAt: "2026-05-01T00:00:00.000Z" },
      roses
    );
    assert.equal(afterRollback.quantity, 0);
    assert.deepEqual(
      cartControlActions(cartControlMode([afterRollback, { quantity: 0 }])),
      { add: true, viewCart: false }
    );
  });
});
