import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { diagnoseCatalogSkuReservations } from "./catalog-sku";

describe("catalog sku reservation diagnosis", () => {
  it("reports missing, duplicate, orphaned, and mismatched reservations without changing them", () => {
    const items = [
      { PK: "PRODUCT#rose", SK: "META", slug: "rose", sku: "Rose-1" },
      { PK: "PRODUCT#lily", SK: "META", slug: "lily", sku: "Lily-1" },
      { PK: "PRODUCT#tulip", SK: "META", slug: "tulip", sku: " lily-1 " },
      { PK: "PRODUCT#blank", SK: "META", slug: "blank", sku: "  " },
      { PK: "SKU#orchid-1", SK: "META", sku: "Orchid-1", productSlug: "missing-orchid" },
      { PK: "SKU#daisy-1", SK: "META", sku: "Daisy-1", productSlug: "daisy" },
      { PK: "PRODUCT#daisy", SK: "META", slug: "daisy", sku: "Other-Daisy" },
    ];
    const before = JSON.stringify(items);
    const report = diagnoseCatalogSkuReservations(items);
    assert.equal(JSON.stringify(items), before);
    assert.deepEqual(report.productsWithSkuAndNoReservation, [
      { slug: "rose", sku: "rose-1" },
      { slug: "lily", sku: "lily-1" },
      { slug: "tulip", sku: "lily-1" },
      { slug: "daisy", sku: "other-daisy" },
    ]);
    assert.deepEqual(report.duplicateNormalizedSkus, [{ sku: "lily-1", slugs: ["lily", "tulip"] }]);
    assert.deepEqual(report.reservationsMissingOwner, [{ sku: "orchid-1", productSlug: "missing-orchid" }]);
    assert.deepEqual(report.reservationsWithDifferentSku, [
      { sku: "daisy-1", productSlug: "daisy", productSku: "other-daisy" },
    ]);
  });

  it("reports local catalog files only and does not query a live table", () => {
    const files = [
      "apps/api/src/data/blossompot-catalog.json",
      "apps/api/src/data/orange-county-hampers.json",
      "scripts/data/fnp-usa-catalog.json",
    ];
    const roots = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];
    for (const file of files) {
      const path = roots.map((root) => resolve(root, file)).find((candidate) => existsSync(candidate));
      if (!path) {
        console.log(`local sku diagnosis ${file} skipped (file not found)`);
        continue;
      }
      const parsed = JSON.parse(readFileSync(path, "utf8")) as { products?: Array<Record<string, unknown>> };
      const products = parsed.products ?? [];
      const items = products.map((product) => ({
        PK: `PRODUCT#${String(product.slug ?? "")}`,
        SK: "META",
        slug: product.slug,
        sku: product.sku,
      }));
      const report = diagnoseCatalogSkuReservations(items);
      console.log(
        `local sku diagnosis ${file} products=${products.length} missingReservation=${report.productsWithSkuAndNoReservation.length} duplicates=${report.duplicateNormalizedSkus.length} orphans=${report.reservationsMissingOwner.length} mismatched=${report.reservationsWithDifferentSku.length}`
      );
      assert.equal(report.reservationsMissingOwner.length, 0);
      assert.equal(report.reservationsWithDifferentSku.length, 0);
    }
  });
});
