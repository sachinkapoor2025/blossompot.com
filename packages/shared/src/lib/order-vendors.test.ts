import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VENDOR_ORANGE_COUNTY, VENDOR_BLOSSOMPOT, VENDOR_GBO } from "../constants";
import {
  allVendorsHaveTracking,
  ensureVendorFulfillments,
  isMultiVendorOrder,
  orderHasGbo,
  orderIsGboOnly,
  orderVendorKeys,
  upsertVendorFulfillment,
  vendorDisplayLabel,
} from "./order-vendors";

describe("order-vendors", () => {
  it("detects mixed OC + BlossomPot carts", () => {
    const order = {
      items: [
        { vendorSlug: VENDOR_ORANGE_COUNTY },
        { name: "plain" },
      ],
    };
    assert.deepEqual(orderVendorKeys(order), [VENDOR_ORANGE_COUNTY, VENDOR_BLOSSOMPOT]);
    assert.equal(isMultiVendorOrder(order), true);
  });

  it("backfills legacy tracking onto sole vendor", () => {
    const rows = ensureVendorFulfillments({
      items: [{ vendorSlug: VENDOR_ORANGE_COUNTY }],
      trackingNumber: "AWB1",
      carrier: "UPS",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.trackingNumber, "AWB1");
    assert.equal(rows[0]?.carrier, "UPS");
  });

  it("labels Gift Baskets Overseas and detects GBO-only carts", () => {
    assert.equal(vendorDisplayLabel(VENDOR_GBO), "Gift Baskets Overseas");
    assert.equal(orderHasGbo({ items: [{ vendorSlug: VENDOR_GBO }] }), true);
    assert.equal(orderIsGboOnly({ items: [{ vendorSlug: VENDOR_GBO }] }), true);
    assert.equal(
      orderIsGboOnly({ items: [{ vendorSlug: VENDOR_GBO }, { vendorSlug: VENDOR_BLOSSOMPOT }] }),
      false
    );
  });

  it("requires all vendors for full ship", () => {
    let rows = ensureVendorFulfillments({
      items: [{ vendorSlug: VENDOR_ORANGE_COUNTY }, {}],
    });
    rows = upsertVendorFulfillment(rows, {
      vendorSlug: VENDOR_ORANGE_COUNTY,
      trackingNumber: "OC-1",
    });
    assert.equal(allVendorsHaveTracking(rows), false);
    rows = upsertVendorFulfillment(rows, {
      vendorSlug: VENDOR_BLOSSOMPOT,
      trackingNumber: "US-1",
    });
    assert.equal(allVendorsHaveTracking(rows), true);
  });
});
