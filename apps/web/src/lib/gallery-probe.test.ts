import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

describe("listing gallery probes", () => {
  it("waits for visibility on category, shop, and related-product cards", () => {
    const grids = [
      "components/ProductGrid.tsx",
      "components/LocationFilteredProducts.tsx",
      "app/products/[slug]/page.tsx",
    ];
    for (const file of grids) {
      assert.match(source(file), /loadGalleryWhenVisible/, file);
    }
  });

  it("renders the product page before related products resolve", () => {
    const page = source("app/products/[slug]/page.tsx");
    const content = page.slice(
      page.indexOf("async function ProductPageContent"),
      page.indexOf("async function RelatedProducts")
    );
    assert.equal(content.includes("await loadRelatedProducts"), false);
    assert.match(page.slice(page.indexOf("async function RelatedProducts")), /await loadRelatedProducts/);
    assert.match(page, /<Suspense fallback=\{null\}>\s*<RelatedProducts/);
    assert.match(page, /You might also like/);
  });

  it("keeps extra gallery frames behind shopper intent and the measured-image fallback", () => {
    const rotator = source("components/ProductImageRotator.tsx");
    const card = source("components/HomeProductCard.tsx");
    assert.match(rotator, /if \(!galleryReady \|\| resolved\.length === 0\) return/);
    assert.match(rotator, /rootMargin: "80px", threshold: 0\.15/);
    assert.match(rotator, /picked\.length > 0 \? picked : resolved\.slice\(0, MAX_FRAMES\)/);
    assert.match(rotator, /loadWhenVisible && !galleryReady/);
    assert.doesNotMatch(rotator, /setSeen\(true\)/);
    assert.match(card, /onPointerDown=\{\(\) => setGalleryEngaged\(true\)\}/);
    assert.match(card, /galleryEngaged=\{galleryEngaged\}/);
  });
});
