import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import {
  comboComponentSlugs,
  loadCombosPage,
  presentStorefrontCombo,
  sortStorefrontCombos,
  type ComboRecordView,
} from "./combos-page";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function product(slug: string, price: number, overrides: Partial<Product> = {}): Product {
  return {
    slug,
    name: slug,
    description: "A catalog product.",
    price,
    currency: "USD",
    categorySlug: slug.endsWith("cake") ? "cakes" : "flowers",
    images: [`https://example.com/${slug}.jpg`],
    sku: `TF${slug.toUpperCase()}`,
    inventory: 3,
    tags: ["tf-usa"],
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

function routeFetch(routes: { combos?: unknown; products?: unknown; fail?: "combos" | "products" }) {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/combos")) {
      if (routes.fail === "combos") return jsonResponse({ error: "unavailable" }, 503);
      return jsonResponse({ combos: routes.combos ?? [] });
    }
    if (url.includes("/products?")) {
      if (routes.fail === "products") return jsonResponse({ error: "unavailable" }, 503);
      return jsonResponse({ products: routes.products ?? [] });
    }
    return jsonResponse({ gifts: [] });
  }) as typeof fetch;
}

const roseAndCake: ComboRecordView = {
  slug: "roses-cake",
  name: "Roses and Cake",
  productSlugs: ["roses", "cake"],
  published: true,
  sortOrder: 0,
};

describe("combos page", () => {
  it("prices a combo from the current component prices", () => {
    const products = new Map<string, Product>([
      ["roses", product("roses", 20, { compareAtPrice: 24, name: "Roses" })],
      ["cake", product("cake", 15, { name: "Cake" })],
    ]);
    const combo = presentStorefrontCombo(roseAndCake, products);
    assert.equal(combo?.price, 35);
    assert.equal(combo?.compareAtPrice, 39);
    assert.equal(combo?.currency, "USD");
    assert.deepEqual(
      combo?.components.map((component) => component.slug),
      ["roses", "cake"]
    );
  });

  it("keeps each component image on its own half", () => {
    const sharedFirst = product("roses", 20, {
      name: "Roses",
      images: [" https://example.com/roses.jpg ", "", "https://example.com/roses-2.jpg"],
    });
    const products = new Map<string, Product>([
      ["roses", sharedFirst],
      ["cake", product("cake", 15, { name: "Cake", images: ["https://example.com/cake.jpg"] })],
      ["plant", product("plant", 18, { name: "Plant", images: [] })],
    ]);
    const withCake = presentStorefrontCombo(roseAndCake, products);
    const withPlant = presentStorefrontCombo(
      { slug: "roses-plant", name: "Roses and Plant", productSlugs: ["roses", "plant"], published: true },
      products
    );
    assert.deepEqual(
      withCake?.components.map((component) => component.image),
      ["https://example.com/roses.jpg", "https://example.com/cake.jpg"]
    );
    assert.deepEqual(
      withPlant?.components.map((component) => component.image),
      ["https://example.com/roses.jpg", null]
    );
    assert.notEqual(withCake?.components[0].image, withCake?.components[1].image);
    assert.notEqual(withPlant?.components[1].image, sharedFirst.images[0]);
  });

  it("hides a combo when a component is missing or the currencies differ", () => {
    const missing = new Map<string, Product>([["roses", product("roses", 20)]]);
    assert.equal(presentStorefrontCombo(roseAndCake, missing), null);
    const mixed = new Map<string, Product>([
      ["roses", product("roses", 20)],
      ["cake", product("cake", 15, { currency: "INR" })],
    ]);
    assert.equal(presentStorefrontCombo(roseAndCake, mixed), null);
  });

  it("loads combo records and keeps only components eligible for the shopper country", async () => {
    const seen: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return routeFetch({
        combos: [
          roseAndCake,
          { slug: "roses-gb", name: "Roses and GB Cake", productSlugs: ["roses", "gb-cake"], published: true },
        ],
        products: [
          product("roses", 20, { name: "Roses" }),
          product("cake", 15, { name: "Cake" }),
          product("gb-cake", 30, { deliveryCountries: ["GB"], name: "GB Cake" }),
        ],
      })(input);
    }) as typeof fetch;

    const view = await loadCombosPage("US");
    assert.equal(view.state, "combos");
    if (view.state !== "combos") return;
    assert.deepEqual(
      view.combos.map((combo) => combo.slug),
      ["roses-cake"]
    );
    assert.equal(view.combos[0]?.price, 35);
    assert.equal(seen.some((url) => url.includes("/combos")), true);
    const productUrl = seen.find((url) => url.includes("/products?"));
    assert.ok(productUrl);
    const requested = new URL(productUrl, "http://127.0.0.1:3001").searchParams;
    assert.equal(requested.get("country"), "US");
    assert.equal(requested.get("category"), null);
    assert.deepEqual(requested.get("slugs")?.split(",").sort(), ["cake", "gb-cake", "roses"]);
  });

  it("hides a combo whose component is absent from the eligible catalog", async () => {
    globalThis.fetch = routeFetch({
      combos: [roseAndCake],
      products: [product("roses", 20, { name: "Roses" })],
    });
    const view = await loadCombosPage("US");
    assert.equal(view.state, "empty");
  });

  it("does not request products when no published combo has both components", async () => {
    const seen: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return routeFetch({
        combos: [{ slug: "draft", name: "Draft", productSlugs: ["roses", "cake"], published: false }],
      })(input);
    }) as typeof fetch;
    const view = await loadCombosPage("US");
    assert.equal(view.state, "empty");
    assert.equal(seen.some((url) => url.includes("/products?")), false);
    assert.deepEqual(comboComponentSlugs([{ slug: "draft", name: "Draft", productSlugs: ["roses", "cake"], published: false }]), []);
  });

  it("leaves a successful catalog with no eligible combos empty", async () => {
    globalThis.fetch = routeFetch({ combos: [], products: [product("roses", 20)] });
    const view = await loadCombosPage("US");
    assert.equal(view.state, "empty");
    assert.deepEqual(view.combos, []);
  });

  it("treats a failed combo or catalog request as an error", async () => {
    globalThis.fetch = routeFetch({ fail: "combos", products: [product("roses", 20)] });
    assert.equal((await loadCombosPage("US")).state, "error");
    globalThis.fetch = routeFetch({ combos: [roseAndCake], fail: "products" });
    assert.equal((await loadCombosPage("GB")).state, "error");
  });
});

function pricedCombo(slug: string, name: string, price: number, sortOrder: number) {
  return { slug, name, price, sortOrder };
}

describe("combo listing sort", () => {
  const combos = [
    pricedCombo("bloom", "Bloom Box", 80, 2),
    pricedCombo("amber", "Amber Cake", 40, 0),
    pricedCombo("cedar", "Cedar Hamper", 120, 1),
  ];

  it("sorts by featured order, price, and name without changing the combo price", () => {
    assert.deepEqual(
      sortStorefrontCombos(combos, "featured").map((combo) => combo.slug),
      ["amber", "cedar", "bloom"]
    );
    assert.deepEqual(
      sortStorefrontCombos(combos, "price-asc").map((combo) => combo.price),
      [40, 80, 120]
    );
    assert.deepEqual(
      sortStorefrontCombos(combos, "price-desc").map((combo) => combo.price),
      [120, 80, 40]
    );
    assert.deepEqual(
      sortStorefrontCombos(combos, "name-asc").map((combo) => combo.name),
      ["Amber Cake", "Bloom Box", "Cedar Hamper"]
    );
    assert.deepEqual(
      sortStorefrontCombos(combos, "name-desc").map((combo) => combo.name),
      ["Cedar Hamper", "Bloom Box", "Amber Cake"]
    );
    const converted = combos.map((combo) => ({ ...combo, price: combo.price * 95 }));
    assert.deepEqual(
      sortStorefrontCombos(converted, "price-asc").map((combo) => combo.slug),
      sortStorefrontCombos(combos, "price-asc").map((combo) => combo.slug)
    );
  });
});
