import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import { productVisibleForDeliveryCountry } from "@blossompot/shared";
import { productAvailabilityNotice } from "./product-availability-copy";
import { loadProductForCountry } from "./product-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function product(overrides: Partial<Product> & Pick<Product, "slug" | "name">): Product {
  return {
    description: "A gift.",
    price: 49,
    currency: "USD",
    categorySlug: "flowers",
    images: [],
    sku: overrides.slug.toUpperCase(),
    inventory: 5,
    tags: [],
    published: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("loadProductForCountry availability", () => {
  it("keeps a verified available product purchasable", async () => {
    const item = product({ slug: "verified-rose", name: "Verified rose" });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: true, reason: "matched" },
      })) as typeof fetch;

    const loaded = await loadProductForCountry(item.slug, "US");
    assert.equal(loaded?.deliverable, true);
    assert.equal(loaded?.reason, "matched");
    assert.equal(loaded?.product.name, item.name);
  });

  it("returns not found for a disabled-vendor product from the product API", async () => {
    const item = product({
      slug: "disabled-vendor-rose",
      name: "Disabled vendor rose",
      vendorSlug: "blossompot",
    });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: false, reason: "vendor_disabled" },
      })) as typeof fetch;

    assert.equal(await loadProductForCountry(item.slug, "US"), null);
  });

  it("preserves an Orange County ZIP failure from the product API", async () => {
    const item = product({
      slug: "oc-zip-hamper",
      name: "Orange County hamper",
      vendorSlug: "orange-county",
      categorySlug: "gift-hampers",
    });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: false, reason: "no_matching_service_area" },
      })) as typeof fetch;

    const loaded = await loadProductForCountry(item.slug, "US");
    assert.equal(loaded?.deliverable, false);
    assert.equal(loaded?.reason, "no_matching_service_area");
    const notice = productAvailabilityNotice({
      productName: loaded?.product.name ?? "",
      countryName: "United States",
      reason: loaded?.reason,
      visibleForCountry: true,
    });
    assert.equal(notice.countryMismatch, false);
    assert.match(notice.body, /ZIP code/);
  });

  it("does not treat a blocking reason as deliverable when the flag is true", async () => {
    const item = product({
      slug: "contradictory-disabled-vendor",
      name: "Contradictory disabled rose",
      vendorSlug: "blossompot",
    });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: true, reason: "vendor_disabled" },
      })) as typeof fetch;

    const loaded = await loadProductForCountry(item.slug, "US");
    assert.equal(loaded, null);
  });

  it("does not render a disabled-vendor product from a direct URL", async () => {
    const item = product({
      slug: "direct-disabled-vendor",
      name: "Hidden rose",
      vendorSlug: "fnp",
    });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: false, reason: "vendor_disabled" },
      })) as typeof fetch;

    assert.equal(await loadProductForCountry(item.slug, "US"), null);
  });

  it("does not resurrect a bundled product after the product API says it is missing", async () => {
    globalThis.fetch = (async () => jsonResponse({ error: "Product not found" }, 404)) as typeof fetch;
    assert.equal(await loadProductForCountry("perfectly-pastel-premium", "US"), null);
  });

  it("does not treat a missing availability payload as deliverable", async () => {
    const item = product({ slug: "missing-availability-rose", name: "Unchecked rose" });
    globalThis.fetch = (async () => jsonResponse({ product: item })) as typeof fetch;

    const loaded = await loadProductForCountry(item.slug, "US");
    assert.equal(loaded?.deliverable, false);
    assert.equal(productVisibleForDeliveryCountry(item, "US"), true);
  });

  it("keeps an enabled-vendor ZIP miss on the unavailable page", async () => {
    const item = product({
      slug: "enabled-oc-zip-miss",
      name: "Orange County hamper",
      vendorSlug: "orange-county",
      categorySlug: "gift-hampers",
    });
    globalThis.fetch = (async () =>
      jsonResponse({
        product: item,
        availability: { deliverable: false, reason: "no_matching_service_area" },
      })) as typeof fetch;

    const loaded = await loadProductForCountry(item.slug, "US");
    assert.equal(loaded?.deliverable, false);
    assert.equal(loaded?.reason, "no_matching_service_area");
    assert.equal(productVisibleForDeliveryCountry(item, "US"), true);
  });

  it("does not bring a disabled vendor product back from a later API failure", async () => {
    const item = product({
      slug: "disabled-then-offline",
      name: "Disabled rose",
      vendorSlug: "blossompot",
    });
    let productCalls = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.includes("/products/")) return jsonResponse({ error: "not found" }, 404);
      productCalls += 1;
      if (productCalls === 1) {
        return jsonResponse({
          product: item,
          availability: { deliverable: false, reason: "vendor_disabled" },
        });
      }
      return jsonResponse({ error: "upstream unavailable" }, 400);
    }) as typeof fetch;

    assert.equal(await loadProductForCountry(item.slug, "US"), null);
    assert.equal(await loadProductForCountry(item.slug, "US"), null);
  });
});
