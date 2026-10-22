import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const listingSources = [
  "components/ListingFilterBar.tsx",
  "components/ProductGrid.tsx",
  "app/combos/page.tsx",
  "app/categories/[slug]/page.tsx",
  "app/products/page.tsx",
];

describe("listing toolbar", () => {
  it("does not render minimum or maximum price controls", () => {
    for (const path of listingSources) {
      const file = source(path);
      assert.equal(file.includes("Min $"), false, path);
      assert.equal(file.includes("Max $"), false, path);
      assert.equal(file.includes("min-price"), false, path);
      assert.equal(file.includes("max-price"), false, path);
      assert.equal(file.includes("listingPriceBound"), false, path);
      assert.equal(file.includes("filterByListingPrice"), false, path);
    }
  });

  it("keeps the shared sort control and all five options", () => {
    const bar = source("components/ListingFilterBar.tsx");
    const sort = source("components/ProductSortBar.tsx");
    assert.equal(bar.includes("<ProductSortBar />"), true);
    for (const label of ["Featured", "Price: Low to High", "Price: High to Low", "Name: A → Z", "Name: Z → A"]) {
      assert.equal(sort.includes(label), true, label);
    }
  });
});