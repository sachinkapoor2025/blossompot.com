import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import {
  presentCategoryPage,
  presentHomeCategoryRow,
  presentShopCatalog,
  runCatalogRetry,
} from "./catalog-load-state";
import { toListingCardProducts } from "./listing-card";
import {
  loadCategoryPageProducts,
  loadHomeCategoryProducts,
  loadProducts,
  loadStorefrontCatalog,
} from "./product-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function flower(slug: string, overrides: Partial<Product> = {}): Product {
  return {
    slug,
    name: "API rose",
    description: "Fresh roses.",
    price: 40,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://example.com/rose.jpg"],
    sku: slug.toUpperCase(),
    inventory: 4,
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

function mockCatalog(body: unknown, status = 200) {
  globalThis.fetch = (async () => jsonResponse(body, status)) as typeof fetch;
}

const ineligibleBundled = [
  flower("unpublished-rose", { published: false }),
  flower("out-of-stock-rose", { inventory: 0 }),
  flower("disabled-vendor-rose", { vendorSlug: "disabled-florist" }),
];

describe("homepage category visibility", () => {
  it("shows the products returned by a successful category response", () => {
    const apiRose = flower("api-rose");
    const view = presentHomeCategoryRow({
      ok: true,
      apiProductCount: 1,
      products: [apiRose],
    });
    assert.equal(view.state, "products");
    assert.deepEqual(
      view.products.map((product) => product.slug),
      ["api-rose"]
    );
  });

  it("does not refill a successful empty category from bundled JSON", () => {
    const view = presentHomeCategoryRow({
      ok: true,
      apiProductCount: 0,
      products: ineligibleBundled,
    });
    assert.equal(view.state, "empty");
    assert.deepEqual(view.products, []);
  });

  it("does not show bundled products when the category request fails", () => {
    const view = presentHomeCategoryRow({ ok: false });
    assert.equal(view.state, "error");
    assert.deepEqual(view.products, []);
  });

  it("keeps unpublished, out-of-stock, and disabled-vendor rows out of an empty or failed row", () => {
    const empty = presentHomeCategoryRow({
      ok: true,
      apiProductCount: 0,
      products: ineligibleBundled,
    });
    const failed = presentHomeCategoryRow({ ok: false });
    const shown = [...empty.products, ...failed.products].map((product) => product.slug);
    assert.deepEqual(shown, []);
  });
});

describe("category page visibility", () => {
  it("shows API products and keeps the product link slug", () => {
    const view = presentCategoryPage({
      ok: true,
      apiProductCount: 1,
      products: [flower("api-rose")],
    });
    assert.equal(view.state, "products");
    const [card] = toListingCardProducts(view.products);
    assert.equal(card.slug, "api-rose");
    assert.equal(`/products/${card.slug}`, "/products/api-rose");
  });

  it("keeps a successful empty category empty", () => {
    const view = presentCategoryPage({
      ok: true,
      apiProductCount: 0,
      products: ineligibleBundled,
    });
    assert.equal(view.state, "empty");
    assert.deepEqual(view.products, []);
  });

  it("treats a category request failure as an error, not an empty catalog", () => {
    const view = presentCategoryPage({ ok: false });
    assert.equal(view.state, "error");
    assert.notEqual(view.state, "empty");
    assert.deepEqual(view.products, []);
  });

  it("does not reintroduce unpublished, out-of-stock, or disabled-vendor bundled rows", () => {
    const empty = presentCategoryPage({
      ok: true,
      apiProductCount: 0,
      products: ineligibleBundled,
    });
    const failed = presentCategoryPage({ ok: false });
    assert.deepEqual(
      [...empty.products, ...failed.products].map((product) => product.slug),
      []
    );
  });
});

describe("shop catalog visibility", () => {
  it("keeps a successful empty catalog distinct from a failed request", () => {
    assert.equal(presentShopCatalog({ ok: true, products: [] }).state, "empty");
    assert.equal(presentShopCatalog({ ok: false }).state, "error");
    const ready = presentShopCatalog({ ok: true, products: [flower("api-rose")] });
    assert.equal(ready.state, "products");
    assert.equal(ready.products[0]?.slug, "api-rose");
  });

  it("retries by running the supplied page refresh once", () => {
    let calls = 0;
    runCatalogRetry(() => {
      calls += 1;
    });
    assert.equal(calls, 1);
  });
});

describe("catalog request status", () => {
  it("returns only the API products for a successful category page", async () => {
    mockCatalog({ products: [flower("api-rose")] });
    const view = await loadCategoryPageProducts("flowers", "US");
    assert.equal(view.state, "products");
    assert.deepEqual(
      view.products.map((product) => product.slug),
      ["api-rose"]
    );
  });

  it("leaves a successful empty category page empty", async () => {
    mockCatalog({ products: [] });
    const view = await loadCategoryPageProducts("cakes", "US");
    assert.equal(view.state, "empty");
    assert.deepEqual(view.products, []);
  });

  it("returns a category page error when the products API fails", async () => {
    mockCatalog({ error: "unavailable" }, 500);
    const view = await loadCategoryPageProducts("flowers", "US");
    assert.equal(view.state, "error");
    assert.deepEqual(view.products, []);
  });

  it("returns API products for a successful homepage category response", async () => {
    mockCatalog({ products: [flower("api-rose")] });
    const view = await loadHomeCategoryProducts("flowers", "US");
    assert.equal(view.state, "products");
    assert.ok(view.products.some((product) => product.slug === "api-rose"));
  });

  it("returns an empty homepage row when the category API succeeds with no products", async () => {
    mockCatalog({ products: [] });
    const view = await loadHomeCategoryProducts("flowers", "US");
    assert.equal(view.state, "empty");
    assert.deepEqual(view.products, []);
  });

  it("returns an error instead of bundled products when the category API fails", async () => {
    mockCatalog({ error: "database unavailable" }, 500);
    const view = await loadHomeCategoryProducts("flowers", "US");
    assert.equal(view.state, "error");
    assert.deepEqual(view.products, []);
  });

  it("treats an invalid product list as a shop failure and an empty list as success", async () => {
    mockCatalog({ products: [] });
    const empty = await loadStorefrontCatalog({ category: "flowers", country: "US" });
    assert.equal(empty.ok, true);

    mockCatalog({ unexpected: true });
    const invalid = await loadStorefrontCatalog({ category: "flowers", country: "US" });
    assert.equal(invalid.ok, false);

    mockCatalog({ error: "unavailable" }, 503);
    const failed = await loadStorefrontCatalog({ category: "cakes", country: "US" });
    assert.equal(failed.ok, false);
  });

  it("asks the products list for the card view and does not send that header to other paths", async () => {
    const seen: Array<{ url: string; view: string | null }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      seen.push({ url: String(input), view: headers.get("x-blossompot-listing-view") });
      return jsonResponse({ products: [flower("api-rose")] });
    }) as typeof fetch;

    const loaded = await loadStorefrontCatalog({ category: "flowers", country: "US" });
    assert.equal(loaded.ok, true);
    const productCalls = seen.filter((call) => call.url.includes("/products"));
    assert.equal(productCalls.length > 0, true);
    assert.equal(productCalls.every((call) => call.view === "card"), true);
    assert.equal(productCalls.some((call) => /\/products\/[^?]+/.test(call.url)), false);

    seen.length = 0;
    await loadProducts({ category: "flowers", country: "US" });
    const fullListCalls = seen.filter((call) => call.url.includes("/products"));
    assert.equal(fullListCalls.length > 0, true);
    assert.equal(fullListCalls.every((call) => call.view == null), true);

    for (const load of [loadCategoryPageProducts, loadHomeCategoryProducts]) {
      seen.length = 0;
      await load("flowers", "US");
      const calls = seen.filter((call) => call.url.includes("/products"));
      assert.equal(calls.length > 0, true);
      assert.equal(calls.every((call) => call.view === "card"), true);
    }
  });
});
