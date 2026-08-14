import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BELOW_THRESHOLD_SHIPPING_USD,
  FREE_SHIPPING_MIN_SUBTOTAL_USD,
  REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
  REDUCED_SHIPPING_USD,
  quoteAddressShipmentShipping,
  quoteFreeShippingThreshold,
  quoteShipmentsShipping,
} from "./free-shipping";

describe("quoteFreeShippingThreshold", () => {
  it("charges $6.99 when cart is under $8", () => {
    const quote = quoteFreeShippingThreshold({
      subtotal: 3.99,
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(quote.qualifiesForFreeShipping, false);
    assert.equal(quote.tier, "low");
    assert.equal(quote.charge, BELOW_THRESHOLD_SHIPPING_USD);
    assert.ok(Math.abs(quote.amountAwayFromFreeShipping - (14 - 3.99)) < 0.001);
    assert.ok(Math.abs(quote.amountAwayFromReducedShipping - (8 - 3.99)) < 0.001);
  });

  it("charges $3.99 from $8 through $13.99", () => {
    const atEight = quoteFreeShippingThreshold({
      subtotal: REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(atEight.qualifiesForFreeShipping, false);
    assert.equal(atEight.tier, "mid");
    assert.equal(atEight.charge, REDUCED_SHIPPING_USD);
    assert.equal(atEight.amountAwayFromReducedShipping, 0);

    const atThirteenNinetyNine = quoteFreeShippingThreshold({
      subtotal: 13.99,
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(atThirteenNinetyNine.qualifiesForFreeShipping, false);
    assert.equal(atThirteenNinetyNine.charge, REDUCED_SHIPPING_USD);
  });

  it("is free at $14 (above $13.99)", () => {
    const quote = quoteFreeShippingThreshold({
      subtotal: FREE_SHIPPING_MIN_SUBTOTAL_USD,
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(quote.qualifiesForFreeShipping, true);
    assert.equal(quote.charge, 0);
    assert.equal(quote.amountAwayFromFreeShipping, 0);
  });

  it("applies the same USD threshold for INR carts", () => {
    const rate = 100;
    const quote = quoteFreeShippingThreshold({
      subtotal: 600,
      currency: "INR",
      usdInrRate: rate,
    });
    assert.equal(quote.qualifiesForFreeShipping, false);
    assert.equal(quote.charge, Math.round(BELOW_THRESHOLD_SHIPPING_USD * rate));
    assert.equal(quote.thresholdInCurrency, FREE_SHIPPING_MIN_SUBTOTAL_USD * rate);
  });
});

describe("quoteShipmentsShipping", () => {
  it("applies tiers per delivery bucket", () => {
    const { totalCharge, perShipment } = quoteShipmentsShipping({
      shipmentSubtotals: [15, 8, 3],
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(perShipment[0].charge, 0);
    assert.equal(perShipment[1].charge, REDUCED_SHIPPING_USD);
    assert.equal(perShipment[2].charge, BELOW_THRESHOLD_SHIPPING_USD);
    assert.equal(totalCharge, REDUCED_SHIPPING_USD + BELOW_THRESHOLD_SHIPPING_USD);
  });
});

describe("quoteAddressShipmentShipping", () => {
  it("charges per vendor when BlossomPot and Orange County share an address", () => {
    const { totalCharge, perVendor } = quoteAddressShipmentShipping({
      items: [
        { price: 3.99, quantity: 1 }, // blossompot under $8 → $6.99
        { price: 3.99, quantity: 1, vendorSlug: "orange-county" },
        { price: 50, quantity: 1, vendorSlug: "orange-county" },
      ],
      currency: "USD",
      usdInrRate: 96,
    });
    // BlossomPot $3.99 → $6.99; Orange County $53.99 → free
    assert.equal(perVendor.length, 2);
    assert.equal(totalCharge, BELOW_THRESHOLD_SHIPPING_USD);
  });

  it("charges $6.99 twice when both vendors are under $8", () => {
    const { totalCharge } = quoteAddressShipmentShipping({
      items: [
        { price: 3.99, quantity: 1 },
        { price: 3, quantity: 1, vendorSlug: "orange-county" },
      ],
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(totalCharge, BELOW_THRESHOLD_SHIPPING_USD * 2);
  });

  it("charges $3.99 when a vendor bucket is between $8 and $13.99", () => {
    const { totalCharge } = quoteAddressShipmentShipping({
      items: [{ price: 8, quantity: 1 }],
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(totalCharge, REDUCED_SHIPPING_USD);
  });

  it("charges flat $0.99 shipping for flash-combo-only buckets", () => {
    const { totalCharge, perVendor } = quoteAddressShipmentShipping({
      items: [
        {
          price: 12.97,
          quantity: 1,
          productSlug: "blue-beads-om-pista-flash-combo",
        },
      ],
      currency: "USD",
      usdInrRate: 96,
    });
    assert.equal(totalCharge, 0.99);
    assert.equal(perVendor[0]?.charge, 0.99);
  });

  it("counts add-ons toward free-shipping threshold", () => {
    const { totalCharge } = quoteAddressShipmentShipping({
      items: [
        {
          price: 3.99,
          quantity: 1,
          addons: [{ price: 20, quantity: 1 }],
        },
      ],
      currency: "USD",
      usdInrRate: 96,
    });
    // $3.99 alone would ship for $6.99; with $20 addon → free
    assert.equal(totalCharge, 0);
  });
});
