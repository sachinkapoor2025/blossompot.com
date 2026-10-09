import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VENDOR_BLOSSOMPOT, VENDOR_FNP } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = "blossompot-products-catalog-vendor-test";

describe("bundled catalog vendor identity", () => {
  it("stores FNP for the import tag and BlossomPot for the rest of this catalog", async () => {
    const { catalogProductToDbItem } = await import("./blossompot-catalog");
    const fnp = catalogProductToDbItem(
      {
        name: "Pastel",
        slug: "perfectly-pastel-premium",
        description: "FNP",
        price: 20,
        currency: "USD",
        categorySlug: "flowers",
        images: [],
        tags: ["fnp-usa-import"],
      },
      "2026-10-09T00:00:00.000Z"
    );
    assert.equal(fnp.vendorSlug, VENDOR_FNP);

    const owned = catalogProductToDbItem(
      {
        name: "Roses",
        slug: "classic-red-rose-bouquet",
        description: "Owned",
        price: 20,
        currency: "USD",
        categorySlug: "flowers",
        images: [],
        tags: ["roses", "birthday"],
        sku: "TFFF2601",
      },
      "2026-10-09T00:00:00.000Z"
    );
    assert.equal(owned.vendorSlug, VENDOR_BLOSSOMPOT);
    assert.equal("vendorCost" in owned, false);
  });
});
