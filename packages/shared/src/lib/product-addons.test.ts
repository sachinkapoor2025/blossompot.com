import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRODUCT_ADDONS,
  cartAddonSignature,
  cartLineUnitTotal,
  getProductAddon,
  productAllowsAddons,
  resolveProductAddons,
  resolveProductAddonsFromIds,
  sumAddonPrices,
} from "./product-addons";
import { VENDOR_ORANGE_COUNTY, VENDOR_GBO } from "../constants";

describe("product-addons", () => {
  it("lists catalog with expected prices", () => {
    assert.equal(PRODUCT_ADDONS.length, 4);
    assert.equal(getProductAddon("badam-100g"), undefined);
    assert.equal(getProductAddon("cake-candle")?.priceUsd, 4);
    assert.equal(getProductAddon("name-printing")?.priceUsd, 8);
    assert.equal(getProductAddon("greeting-card")?.priceUsd, 5);
    assert.equal(getProductAddon("message-plaque")?.priceUsd, 6);
  });

  it("allows addons only for non–Orange County products", () => {
    assert.equal(productAllowsAddons({}), true);
    assert.equal(productAllowsAddons({ vendorSlug: undefined }), true);
    assert.equal(productAllowsAddons({ vendorSlug: VENDOR_ORANGE_COUNTY }), false);
    assert.equal(productAllowsAddons({ vendorSlug: VENDOR_GBO }), false);
    assert.equal(productAllowsAddons({ slug: "gbo-us-27-cheerful-plush-tan-bear" }), false);
    assert.equal(productAllowsAddons({ sku: "gbo:US:27" }), false);
  });

  it("sums addon prices and line unit totals", () => {
    const addons = [
      { id: "cake-candle", name: "Cake candle", price: 4, quantity: 2 },
      { id: "name-printing", name: "Name printing", price: 8, quantity: 1 },
    ];
    assert.equal(sumAddonPrices(addons), 16);
    assert.equal(cartLineUnitTotal({ price: 20, addons }), 36);
    assert.equal(cartLineUnitTotal({ price: 20 }), 20);
  });

  it("builds stable addon signatures including quantity", () => {
    assert.equal(cartAddonSignature([{ id: "b", quantity: 1 }, { id: "a", quantity: 2 }]), "a:2,b:1");
    assert.equal(cartAddonSignature([]), "");
    assert.notEqual(
      cartAddonSignature([{ id: "cake-candle", quantity: 1 }]),
      cartAddonSignature([{ id: "cake-candle", quantity: 2 }])
    );
  });

  it("resolves selections with quantities", () => {
    const ok = resolveProductAddons([
      { id: "greeting-card", quantity: 3 },
      { id: "name-printing", quantity: 2 },
    ]);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.addons.length, 2);
      assert.equal(ok.addons[0]!.id, "greeting-card");
      assert.equal(ok.addons[0]!.quantity, 3);
      assert.equal(ok.addons[1]!.quantity, 2);
    }
    const fromIds = resolveProductAddonsFromIds(["greeting-card", "name-printing"]);
    assert.equal(fromIds.ok, true);
    if (fromIds.ok) {
      assert.equal(fromIds.addons.every((a) => a.quantity === 1), true);
    }
    const bad = resolveProductAddons([{ id: "not-a-real-addon", quantity: 1 }]);
    assert.equal(bad.ok, false);
    const tooMany = resolveProductAddons([{ id: "cake-candle", quantity: 99 }]);
    assert.equal(tooMany.ok, false);
  });
});
