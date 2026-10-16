import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FNP_IMPORT_TAG } from "@blossompot/shared";
import {
  adminVendorFilterOptions,
  filterAdminProducts,
  type AdminVendorFilterProduct,
} from "./admin-product-vendor-filter";

function product(
  slug: string,
  extra: Partial<AdminVendorFilterProduct> = {}
): AdminVendorFilterProduct {
  return {
    slug,
    name: extra.name ?? slug,
    ...extra,
  };
}

const catalog = [
  product("owned-rose"),
  product("blank-cake", { vendorSlug: "  ", name: "Blank cake" }),
  product("fnp-bouquet", { vendorSlug: "fnp", name: "FNP bouquet" }),
  product("fnp-case", { vendorSlug: "FNP", name: "FNP case" }),
  product("tagged-fnp", { tags: [FNP_IMPORT_TAG], name: "Tagged FNP cake" }),
  product("tagged-blank", { vendorSlug: " ", tags: [FNP_IMPORT_TAG], name: "Tagged blank" }),
  product("oc-hamper", { vendorSlug: "orange-county", name: "OC hamper" }),
  product("gbo-basket", { slug: "gbo-us-101-basket", name: "Overseas basket" }),
  product("gbo-sku", { sku: "gbo:US:44", name: "Overseas sku" }),
  product("gbo-flag", { vendorSlug: "fnp", internationalDelivery: true, name: "Overseas flag" }),
  product("local-florist", { vendorSlug: "phase2-flowers", name: "Local florist" }),
];

describe("admin product vendor filter", () => {
  it("keeps every product when All vendors is selected", () => {
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "" }).map((item) => item.slug),
      catalog.map((item) => item.slug)
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "all" }).map((item) => item.slug),
      catalog.map((item) => item.slug)
    );
  });

  it("places missing and blank slugs under BlossomPot", () => {
    const slugs = filterAdminProducts(catalog, { vendor: "blossompot" }).map((item) => item.slug);
    assert.deepEqual(slugs, ["owned-rose", "blank-cake"]);
  });

  it("filters explicit vendors and the FNP import tag", () => {
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "fnp" }).map((item) => item.slug),
      ["fnp-bouquet", "fnp-case", "tagged-fnp", "tagged-blank"]
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "orange-county" }).map((item) => item.slug),
      ["oc-hamper"]
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "gift-baskets-overseas" }).map((item) => item.slug),
      ["gbo-us-101-basket", "gbo-sku", "gbo-flag"]
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "phase2-flowers" }).map((item) => item.slug),
      ["local-florist"]
    );
  });

  it("combines vendor identity with the existing name, slug, and SKU search", () => {
    const fnpCakes = filterAdminProducts(catalog, { vendor: "fnp", search: "cake" });
    assert.deepEqual(
      fnpCakes.map((item) => item.slug),
      ["tagged-fnp"]
    );
    const allCakes = filterAdminProducts(catalog, { vendor: "", search: "cake" });
    assert.deepEqual(
      allCakes.map((item) => item.slug),
      ["blank-cake", "tagged-fnp"]
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "fnp", search: "FNP-BOUQUET" }).map((item) => item.slug),
      ["fnp-bouquet"]
    );
    assert.deepEqual(
      filterAdminProducts(catalog, { vendor: "gift-baskets-overseas", search: "gbo:us:44" }).map((item) => item.slug),
      ["gbo-sku"]
    );
  });

  it("does not change product records while filtering", () => {
    const source = [product("owned-rose", { tags: ["birthday"] })];
    filterAdminProducts(source, { vendor: "blossompot" });
    assert.equal(source[0]?.vendorSlug, undefined);
    assert.deepEqual(source[0]?.tags, ["birthday"]);
  });

  it("lists configured vendors and keeps the built-in names", () => {
    const options = adminVendorFilterOptions([
      { vendorSlug: "fnp", vendorName: "FNP" },
      { vendorSlug: "phase2-flowers", vendorName: "Phase Two Flowers" },
      { vendorSlug: "FNP", vendorName: "Duplicate" },
    ]);
    assert.deepEqual(
      options.map((vendor) => `${vendor.vendorSlug}:${vendor.vendorName}`),
      [
        "fnp:FNP",
        "phase2-flowers:Phase Two Flowers",
        "blossompot:BlossomPot",
        "orange-county:Orange County",
        "gift-baskets-overseas:Gift Baskets Overseas",
      ]
    );
  });
});
