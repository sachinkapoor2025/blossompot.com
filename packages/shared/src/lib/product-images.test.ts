import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRODUCT_IMAGE_MIN_EDGE_PX,
  isProductStorefrontVisible,
  isSampleCatalogProduct,
  mergeProductImages,
  resolveProductImagesForUpsert,
  selectDisplayableProductImages,
} from "./product-images";
import { resolveProductImageUrl, getProductCdnBase } from "./image-url";

describe("selectDisplayableProductImages", () => {
  it("drops tiny thumbnails when sharper frames exist", () => {
    const urls = selectDisplayableProductImages([
      { url: "/a.jpg", width: 500, height: 500 },
      { url: "/a-thumb.jpg", width: 100, height: 100 },
      { url: "/a-b.jpg", width: 100, height: 100 },
      { url: "/a2.jpg", width: 1500, height: 1500 },
    ]);
    assert.deepEqual(urls, ["/a.jpg", "/a2.jpg"]);
  });

  it("keeps the largest frame when all are below the min edge", () => {
    const urls = selectDisplayableProductImages([
      { url: "/tiny-a.jpg", width: 100, height: 100 },
      { url: "/tiny-b.jpg", width: 120, height: 120 },
    ]);
    assert.deepEqual(urls, ["/tiny-b.jpg"]);
  });

  it("keeps 300px masters used as the sole product image", () => {
    const urls = selectDisplayableProductImages([{ url: "/only.jpg", width: 300, height: 300 }]);
    assert.deepEqual(urls, ["/only.jpg"]);
    assert.ok(300 >= PRODUCT_IMAGE_MIN_EDGE_PX);
  });
});

describe("mergeProductImages / resolveProductImagesForUpsert", () => {
  it("keeps admin gallery images when import only has the featured image", () => {
    const imported = ["https://cdn.example/uploads/featured.jpeg"];
    const existing = [
      "https://cdn.example/uploads/featured.jpeg",
      "https://cdn.example/products/a.png",
      "https://cdn.example/products/b.jpeg",
      "https://cdn.example/products/c.jpeg",
    ];
    const merged = mergeProductImages(imported, existing);
    assert.equal(merged.length, 4);
    const safe = resolveProductImagesForUpsert(imported, existing);
    assert.equal(safe.images.length, 4);
    assert.equal(safe.preservedExisting, false);
  });

  it("never shrinks an existing gallery unless allowShrink is set", () => {
    const incoming = ["https://cdn.example/uploads/only.jpeg"];
    const existing = [
      "https://cdn.example/products/1.jpeg",
      "https://cdn.example/products/2.jpeg",
      "https://cdn.example/products/3.jpeg",
    ];
    // Default: merge keeps all existing + new featured
    const safe = resolveProductImagesForUpsert(incoming, existing);
    assert.equal(safe.images.length, 4);
    assert.equal(safe.preservedExisting, false);

    // Empty incoming must not wipe gallery
    const empty = resolveProductImagesForUpsert([], existing);
    assert.deepEqual(empty.images, existing);
    assert.equal(empty.preservedExisting, true);

    // Explicit replace may shrink
    const forced = resolveProductImagesForUpsert(incoming, existing, { allowShrink: true });
    assert.deepEqual(forced.images, incoming);
    assert.equal(forced.preservedExisting, false);
  });
});

describe("resolveProductImageUrl", () => {
  it("rewrites relative /uploads paths to the product CDN", () => {
    const cdn = getProductCdnBase();
    assert.equal(
      resolveProductImageUrl("/uploads/orange-county/TFUSA007/TFUSA007.jpg"),
      `${cdn}/uploads/orange-county/TFUSA007/TFUSA007.jpg`
    );
  });

  it("keeps TF USA photos on the storefront origin instead of CloudFront", () => {
    const cdn = getProductCdnBase();
    assert.equal(
      resolveProductImageUrl("/uploads/tf-usa/TFFF2602/TFFF2602.png"),
      "/uploads/tf-usa/TFFF2602/TFFF2602.png"
    );
    assert.equal(
      resolveProductImageUrl(`${cdn}/uploads/tf-usa/TFFF2602/TFFF2602.png`),
      "/uploads/tf-usa/TFFF2602/TFFF2602.png"
    );
  });

  it("rewrites legacy WordPress upload URLs to the CDN", () => {
    const cdn = getProductCdnBase();
    assert.equal(
      resolveProductImageUrl("https://blossompot.com/wp-content/uploads/2026/03/photo.jpg"),
      `${cdn}/uploads/2026/03/photo.jpg`
    );
  });
});

describe("sample catalog visibility", () => {
  it("treats flagged, tagged, vendor, and SMP SKUs as samples", () => {
    assert.equal(isSampleCatalogProduct({ isSampleProduct: true }), true);
    assert.equal(isSampleCatalogProduct({ tags: ["sample-product"] }), true);
    assert.equal(isSampleCatalogProduct({ vendorSlug: "sample-la-florist" }), true);
    assert.equal(isSampleCatalogProduct({ fulfilledByName: "SAMPLE VENDOR — Demo" }), true);
    assert.equal(isSampleCatalogProduct({ sku: "SMP-00012" }), true);
    assert.equal(isSampleCatalogProduct({ slug: "sample-blush-rose-bouquet" }), true);
    assert.equal(isSampleCatalogProduct({ slug: "classic-red-rose-bouquet", sku: "BP-ROSES" }), false);
    assert.equal(
      isSampleCatalogProduct({
        slug: "classic-red-rose-bouquet",
        images: ["https://images.unsplash.com/photo-1518895949257-7621c3c786d7"],
      }),
      true
    );
    assert.equal(
      isSampleCatalogProduct({
        sku: "TFFF2601",
        tags: ["tf-usa"],
        images: ["/uploads/tf-usa/TFFF2601/TFFF2601.jpg"],
      }),
      false
    );
    assert.equal(
      isSampleCatalogProduct({ sku: "gbo:US:3", images: ["https://www.giftbasketsoverseas.com/x.webp"] }),
      false
    );
  });

  it("keeps sample SKUs off the public storefront", () => {
    assert.equal(isProductStorefrontVisible({ isSampleProduct: true, published: true }), false);
    assert.equal(isProductStorefrontVisible({ sku: "SMP-00001", published: true }), false);
    assert.equal(
      isProductStorefrontVisible({
        slug: "classic-red-rose-bouquet",
        images: ["https://images.unsplash.com/photo-x"],
        published: true,
      }),
      false
    );
    assert.equal(isProductStorefrontVisible({ slug: "classic-red-rose-bouquet", sku: "BP-ROSES", published: true }), true);
  });
});
