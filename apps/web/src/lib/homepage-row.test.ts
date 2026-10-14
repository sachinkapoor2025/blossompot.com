import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  arrangeStorefrontProducts,
  isProductStorefrontVisible,
  productVisibleForDeliveryCountry,
  VENDOR_GBO,
  type Product,
} from "@blossompot/shared";
import { presentHomeCategoryRow } from "./catalog-load-state";
import {
  productsForHomepageRow,
  productsForHomeSection,
  selectHomepageRowProducts,
  toHomepageRowCards,
} from "./homepage-row";
import { toListingCardProducts } from "./listing-card";
import { loadHomeCategoryProducts } from "./product-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function product(slug: string, categorySlug: string, overrides: Partial<Product> = {}): Product {
  return {
    slug,
    name: slug,
    description: `<p>Long description for ${slug} that is much longer than eighty characters so a listing stub would replace it.</p>`,
    price: 40,
    currency: "USD",
    categorySlug,
    images: [`https://example.com/${slug}.jpg`],
    sku: slug.toUpperCase(),
    inventory: 4,
    tags: [],
    published: true,
    seoTitle: `SEO ${slug}`,
    seoDescription: `SEO body ${slug}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function numbered(categorySlug: string, count: number, prefix = categorySlug): Product[] {
  return Array.from({ length: count }, (_, index) => product(`${prefix}-${index + 1}`, categorySlug));
}

function slugs(products: Product[]): string[] {
  return products.map((item) => item.slug);
}

/** Checks listProducts applies before the homepage row slices. */
function eligibleCatalog(
  products: Product[],
  options: { disabledVendors?: string[]; undeliverable?: string[] } = {}
): Product[] {
  const disabled = new Set(options.disabledVendors ?? []);
  const undeliverable = new Set(options.undeliverable ?? []);
  return products.filter((item) => {
    if (item.published === false) return false;
    if ((item.inventory ?? 0) <= 0) return false;
    if (!isProductStorefrontVisible(item)) return false;
    if (!productVisibleForDeliveryCountry(item, "US")) return false;
    if (item.vendorSlug && disabled.has(item.vendorSlug)) return false;
    if (undeliverable.has(item.slug)) return false;
    return true;
  });
}

function currentRow(section: string, loaded: Product[]): string[] {
  return slugs(productsForHomeSection(section, loaded).slice(0, 8));
}

describe("homepage row selection", () => {
  it("keeps the same ordered eight for each homepage section", () => {
    for (const section of ["flowers", "flower-bouquets", "cakes", "gift-hampers"] as const) {
      const loaded = numbered(section, 10);
      const expected = loaded.slice(0, 8).map((item) => item.slug);
      assert.deepEqual(slugs(selectHomepageRowProducts(section, loaded)), expected);
      assert.deepEqual(slugs(selectHomepageRowProducts(section, loaded)), currentRow(section, loaded));
    }
  });

  it("drops a leading Rakhi hamper before taking eight flowers", () => {
    const hamper = product("rakhi-hamper", "rakhi-hampers", {
      additionalCategorySlugs: ["flowers"],
    });
    const flowers = numbered("flowers", 10, "flower");
    const loaded = [hamper, ...flowers];
    const expected = flowers.slice(0, 8).map((item) => item.slug);
    assert.deepEqual(slugs(selectHomepageRowProducts("flowers", loaded)), expected);
    assert.deepEqual(slugs(selectHomepageRowProducts("flowers", loaded)), currentRow("flowers", loaded));
    assert.notDeepEqual(slugs(loaded.slice(0, 8)), expected);
  });

  it("does not show a product on a homepage row only because of an additional category", () => {
    const flowers = numbered("flowers", 3, "flower");
    const cake = product("occasion-cake", "cakes", { additionalCategorySlugs: ["flowers"] });
    const row = slugs(selectHomepageRowProducts("flowers", [cake, ...flowers]));
    assert.equal(row.includes("occasion-cake"), false);
    assert.deepEqual(row, flowers.map((item) => item.slug));
  });

  it("keeps only primary gift hampers when a hamper and a flower lead the list", () => {
    const hamper = product("rakhi-hamper", "rakhi-hampers", {
      additionalCategorySlugs: ["gift-hampers"],
    });
    const flower = product("loose-flower", "flowers");
    const hampers = numbered("gift-hampers", 10, "hamper");
    const loaded = [hamper, flower, ...hampers];
    const expected = hampers.slice(0, 8).map((item) => item.slug);
    assert.deepEqual(slugs(selectHomepageRowProducts("gift-hampers", loaded)), expected);
    assert.deepEqual(
      slugs(selectHomepageRowProducts("gift-hampers", loaded)),
      currentRow("gift-hampers", loaded)
    );
  });

  it("matches the full row after vendor, stock, country, and ZIP exclusions", () => {
    const flowers = numbered("flowers", 10, "flower");
    const raw = [
      product("unpublished-rose", "flowers", { published: false }),
      product("out-of-stock-rose", "flowers", { inventory: 0 }),
      product("disabled-vendor-rose", "flowers", { vendorSlug: "closed-florist" }),
      product("uk-only-rose", "flowers", { deliveryCountries: ["GB"] }),
      product("zip-blocked-rose", "flowers"),
      ...flowers,
    ];
    const loaded = eligibleCatalog(raw, {
      disabledVendors: ["closed-florist"],
      undeliverable: ["zip-blocked-rose"],
    });
    const expected = flowers.slice(0, 8).map((item) => item.slug);
    assert.deepEqual(slugs(selectHomepageRowProducts("flowers", loaded)), expected);
    assert.deepEqual(slugs(selectHomepageRowProducts("flowers", loaded)), currentRow("flowers", loaded));
    assert.equal(expected.includes("zip-blocked-rose"), false);
    assert.equal(expected.includes("unpublished-rose"), false);
  });

  it("places an enabled GBO gift before the eighth flower and omits it when disabled", () => {
    const flowers = numbered("flowers", 10, "flower").map((item) => ({
      ...item,
      vendorSlug: "blossompot",
    }));
    const gbo = product("gbo-basket", "flowers", {
      internationalDelivery: true,
      vendorSlug: VENDOR_GBO,
      listingVendorSlug: VENDOR_GBO,
    });
    const vendors = [
      { vendorSlug: VENDOR_GBO, vendorName: "Gift Baskets Overseas", displayOrder: 1 },
      { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 2 },
    ];
    const enabled = arrangeStorefrontProducts(flowers, undefined, [gbo], vendors);
    const disabled = arrangeStorefrontProducts(flowers, undefined, [], vendors);
    assert.deepEqual(slugs(selectHomepageRowProducts("flowers", enabled)), [
      "gbo-basket",
      "flower-1",
      "flower-2",
      "flower-3",
      "flower-4",
      "flower-5",
      "flower-6",
      "flower-7",
    ]);
    assert.deepEqual(
      slugs(selectHomepageRowProducts("flowers", enabled)),
      currentRow("flowers", enabled)
    );
    assert.deepEqual(
      slugs(selectHomepageRowProducts("flowers", disabled)),
      flowers.slice(0, 8).map((item) => item.slug)
    );
  });

  it("returns no cards for an empty success or a failed request", () => {
    const bundled = [product("bundled-rose", "flowers")];
    const empty = presentHomeCategoryRow({ ok: true, apiProductCount: 0, products: bundled });
    const failed = presentHomeCategoryRow({ ok: false });
    assert.deepEqual(productsForHomepageRow("flowers", empty), []);
    assert.deepEqual(productsForHomepageRow("flowers", failed), []);
  });

  it("keeps card slug order and drops listing fields the homepage card does not read", () => {
    const selected = selectHomepageRowProducts("flowers", numbered("flowers", 10, "flower"));
    const cards = toHomepageRowCards(selected);
    assert.deepEqual(
      slugs(cards),
      selected.map((item) => item.slug)
    );
    const encoded = JSON.stringify(cards[0]);
    assert.equal(encoded.includes("seoDescription"), false);
    assert.equal(encoded.includes("seoTitle"), false);
    assert.equal(encoded.includes("shippingOptions"), false);
    assert.equal(encoded.includes("variants"), false);
    assert.equal(JSON.parse(encoded).description, "");
    assert.equal(toListingCardProducts(numbered("flowers", 12, "flower")).length, 12);
  });
});

describe("homepage row loader", () => {
  it("uses the category response and still excludes a leading hamper and ineligible rows", async () => {
    const hamper = product("rakhi-hamper", "rakhi-hampers", {
      additionalCategorySlugs: ["flowers"],
    });
    const flowers = numbered("flowers", 9, "flower");
    const body = {
      products: [
        hamper,
        product("unpublished-rose", "flowers", { published: false }),
        product("rakhi-special", "flowers", { name: "Rakhi special bouquet" }),
        product("uk-only-rose", "flowers", { deliveryCountries: ["GB"] }),
        ...flowers,
      ],
      listingVendors: [{ vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 }],
    };
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const loaded = await loadHomeCategoryProducts("flowers", "US");
    const row = slugs(productsForHomepageRow("flowers", loaded));
    assert.deepEqual(
      row,
      flowers.slice(0, 8).map((item) => item.slug)
    );
    assert.equal(row.includes("rakhi-hamper"), false);
    assert.equal(row.includes("unpublished-rose"), false);
    assert.equal(row.includes("rakhi-special"), false);
    assert.equal(row.includes("uk-only-rose"), false);
  });
});
