import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG_VENDOR_SLUGS, defaultCatalogVendor, type Product, type ShoppingVendorRecord } from "@blossompot/shared";
import {
  bundledHiddenForDisabledVendor,
  bundledShoppingVendorSlug,
  rememberStorefrontShoppingVendors,
  getCatalogProduct,
  getCatalogProducts,
  getCatalogProductsByCategory,
  mergeProductsForCountry,
  mergeProductsPreferExisting,
} from "./catalog-fallback";

describe("bundled catalog fallback", () => {
  it("includes published FNP USA products with name, image, price, and category", () => {
    const products = getCatalogProducts();
    const fnp = products.filter((product) => (product.tags ?? []).includes("fnp-usa-import"));
    // 23 FNP rows are Rakhi gifts and stay off the public storefront by existing filter.
    assert.equal(fnp.length, 748);
    const pastel = getCatalogProduct("perfectly-pastel-premium");
    assert.ok(pastel);
    assert.equal(pastel?.name, "Perfectly Pastel Premium");
    assert.equal(pastel?.categorySlug, "flowers");
    assert.ok(typeof pastel?.price === "number" && pastel.price > 0);
    assert.ok((pastel?.images ?? []).some((url) => String(url).includes("fnp.com")));
  });

  it("keeps live API prices when filling missing bundled SKUs", () => {
    const apiRow = {
      slug: "perfectly-pastel-premium",
      name: "API name",
      description: "live",
      price: 1,
      currency: "USD",
      categorySlug: "flowers",
      images: ["https://cdn.example.com/live.jpg"],
      sku: "TFFF9999",
      tags: ["tf-usa"],
      published: true,
    } as Product;
    const merged = mergeProductsPreferExisting([apiRow], getCatalogProducts());
    const winner = merged.find((product) => product.slug === "perfectly-pastel-premium");
    assert.equal(winner?.price, 1);
    assert.equal(winner?.name, "API name");
    assert.ok(merged.some((product) => product.slug === "florist-choice-bouquet"));
  });

  it("lists gift-hampers SKUs for the Gift Hampers page", () => {
    const hampers = getCatalogProductsByCategory("gift-hampers");
    assert.ok(hampers.length > 0);
    assert.ok(hampers.some((product) => product.slug === "festive-flavors-collection"));
    assert.ok(hampers.every((product) => (product.images ?? []).length > 0 && product.price > 0));
  });

  it("connects FNP products to existing storefront categories", () => {
    const bouquets = getCatalogProductsByCategory("flower-bouquets");
    assert.ok(bouquets.some((product) => (product.tags ?? []).includes("fnp-usa-import")));
    const cakes = getCatalogProductsByCategory("cakes");
    assert.ok(cakes.some((product) => (product.tags ?? []).includes("fnp-usa-import")));
  });

  it("injects missing catalog SKUs for the shopping country", () => {
    const merged = mergeProductsForCountry([], "US");
    assert.ok(merged.length >= 771);
    assert.ok(merged.some((product) => product.slug === "perfectly-pastel-premium"));
  });

  it("does not inject US-only bundled products for Serbia", () => {
    const merged = mergeProductsForCountry([], "RS");
    assert.equal(merged.length, 0);
    assert.equal(
      merged.some((product) => product.slug === "perfectly-pastel-premium"),
      false
    );
  });

  it("hides bundled FNP products when that vendor is disabled and keeps them when it is enabled", () => {
    const pastel = getCatalogProduct("perfectly-pastel-premium");
    assert.ok(pastel);
    assert.equal(bundledShoppingVendorSlug(pastel), "fnp");
    const vendors = defaultVendors();
    assert.equal(bundledHiddenForDisabledVendor(pastel, "US", vendors), false);
    const disabled = vendors.map((vendor) =>
      vendor.vendorSlug === "fnp" ? { ...vendor, enabled: false } : vendor
    );
    assert.equal(bundledHiddenForDisabledVendor(pastel, "US", disabled), true);
    rememberStorefrontShoppingVendors(disabled);
    assert.equal(
      mergeProductsForCountry([], "US").some((product) => product.slug === "perfectly-pastel-premium"),
      false
    );
    assert.equal(
      getCatalogProductsByCategory("cakes").some((product) => product.slug === "perfectly-pastel-premium") ||
        getCatalogProducts().some((product) => product.slug === "perfectly-pastel-premium"),
      false
    );
    rememberStorefrontShoppingVendors(null);
    assert.equal(
      mergeProductsForCountry([], "US").some((product) => product.slug === "perfectly-pastel-premium"),
      true
    );
  });

  it("hides a disabled Orange County product and leaves an enabled one to the ZIP rules", () => {
    const product = {
      slug: "oc-hamper",
      name: "Orange County hamper",
      description: "Hamper",
      price: 40,
      currency: "USD",
      categorySlug: "gift-hampers",
      images: [],
      sku: "OC-1",
      inventory: 3,
      tags: [],
      vendorSlug: "orange-county",
      published: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Product;
    const vendors = defaultVendors();
    assert.equal(bundledHiddenForDisabledVendor(product, "US", vendors), false);
    const disabled = vendors.map((vendor) =>
      vendor.vendorSlug === "orange-county" ? { ...vendor, enabled: false } : vendor
    );
    assert.equal(bundledHiddenForDisabledVendor(product, "US", disabled), true);
  });
});

function defaultVendors(): ShoppingVendorRecord[] {
  return CATALOG_VENDOR_SLUGS.map((slug) => defaultCatalogVendor(slug));
}
