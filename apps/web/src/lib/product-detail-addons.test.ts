import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const detailPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../app/products/[slug]/ProductDetailClient.tsx"
);

describe("product detail add-ons", () => {
  const source = readFileSync(detailPath, "utf8");

  it("does not render the Make it personal section", () => {
    assert.equal(source.includes("Make it personal"), false);
    assert.equal(source.includes("ProductAddonsPicker"), false);
    assert.equal(source.includes("CAKE EXTRAS"), false);
    assert.equal(source.includes("PERSONALIZATION"), false);
  });

  it("keeps the main product actions", () => {
    assert.equal(source.includes("<AddToCartControl"), true);
    assert.equal(source.includes("<WishlistButton"), true);
    assert.equal(source.includes("<ShareButton"), true);
    assert.equal(source.includes("addons={"), false);
  });
});
