import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productSkuKeys } from "../db/keys";
import { catalogSkuReservationItem, normalizeCatalogSku } from "./catalog-sku";

describe("catalog sku identity", () => {
  it("trims and lowercases the reservation identity", () => {
    assert.equal(normalizeCatalogSku("  Rose-1 "), "rose-1");
    assert.equal(normalizeCatalogSku("   "), null);
    assert.equal(normalizeCatalogSku(undefined), null);
  });

  it("keeps the trimmed spelling on the reservation item", () => {
    const item = catalogSkuReservationItem(" Rose-1 ", "red-rose");
    assert.equal(item?.PK, productSkuKeys.pk("rose-1"));
    assert.equal(item?.sku, "Rose-1");
    assert.equal(item?.productSlug, "red-rose");
  });
});
