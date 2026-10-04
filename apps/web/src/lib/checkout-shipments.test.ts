import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USA_ONLY_DELIVERY_MESSAGE } from "@blossompot/shared";
import { emptyShippingAddress } from "./shipping-address";
import { validateDeliveryUnits, type DeliveryUnit } from "./checkout-shipments";

function unit(country: string): DeliveryUnit {
  return {
    key: "gift#0",
    productSlug: "sunset-roses",
    name: "Sunset roses",
    price: 49,
    useSameAddress: false,
    address: {
      ...emptyShippingAddress(),
      name: "Sam",
      email: "sam@example.com",
      phone: "+1 408 555 0100",
      line1: "10 Main St",
      city: "Toronto",
      state: "ON",
      postalCode: "M5H 2N2",
      country,
    },
  };
}

describe("extra recipient addresses", () => {
  it("rejects a second recipient in Canada", () => {
    const error = validateDeliveryUnits([unit("CA")], emptyShippingAddress());
    assert.match(error ?? "", new RegExp(USA_ONLY_DELIVERY_MESSAGE.replace(/[.]/g, "\\.")));
    assert.match(error ?? "", /Sunset roses/);
  });

  it("accepts a second recipient in the United States", () => {
    const error = validateDeliveryUnits(
      [
        unit("US"),
      ].map((item) => ({
        ...item,
        address: { ...item.address, city: "Los Angeles", state: "CA", postalCode: "90012", country: "US" },
      })),
      emptyShippingAddress()
    );
    assert.equal(error, null);
  });
});
