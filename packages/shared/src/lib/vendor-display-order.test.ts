import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG_VENDOR_SLUGS, catalogVendorSchema, createCatalogVendorSchema, reorderCatalogVendorsSchema } from "../schemas/catalog-vendor";
import { defaultCatalogVendor, parseStoredCatalogVendor } from "./catalog-vendors";
import {
  annotateStorefrontListing,
  applyStoredDisplayOrder,
  arrangeStorefrontProducts,
  moveVendorToPosition,
  nextDisplayOrder,
  orderProductsByVendor,
  planVendorDisplaySequence,
  sortStorefrontProducts,
  sortVendorsForDisplay,
  type VendorDisplaySource,
} from "./vendor-display-order";

const vendors: VendorDisplaySource[] = [
  { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 },
  { vendorSlug: "orange-county", vendorName: "Orange County", displayOrder: 2 },
  { vendorSlug: "gift-baskets-overseas", vendorName: "Gift Baskets Overseas", displayOrder: 3 },
  { vendorSlug: "fnp", vendorName: "FNP", displayOrder: 4 },
];

function product(slug: string, vendorSlug: string, price: number, name = slug) {
  return { slug, vendorSlug, name, price };
}

describe("vendor display sequence", () => {
  it("orders products by displayOrder ascending", () => {
    const ordered = orderProductsByVendor(
      [
        product("fnp-a", "fnp", 40),
        product("bp-a", "blossompot", 30),
        product("gbo-a", "gift-baskets-overseas", 5, "gbo"),
        product("oc-a", "orange-county", 10),
      ],
      vendors
    );
    assert.deepEqual(
      ordered.map((item) => item.vendorSlug),
      ["blossompot", "orange-county", "gift-baskets-overseas", "fnp"]
    );
  });

  it("places a vendor with displayOrder before a vendor without one", () => {
    const ordered = sortVendorsForDisplay([
      { vendorSlug: "fnp", vendorName: "FNP" },
      { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 2 },
    ]);
    assert.deepEqual(
      ordered.map((vendor) => vendor.vendorSlug),
      ["blossompot", "fnp"]
    );
  });

  it("sorts unordered vendors by name, then slug", () => {
    const ordered = sortVendorsForDisplay([
      { vendorSlug: "zeta", vendorName: "Zeta" },
      { vendorSlug: "alpha-b", vendorName: "Alpha" },
      { vendorSlug: "alpha-a", vendorName: "Alpha" },
    ]);
    assert.deepEqual(
      ordered.map((vendor) => vendor.vendorSlug),
      ["alpha-a", "alpha-b", "zeta"]
    );
  });

  it("skips a disabled vendor without changing its stored order", () => {
    const stored = vendors.map((vendor) =>
      vendor.vendorSlug === "gift-baskets-overseas" ? { ...vendor, enabled: false } : vendor
    );
    const available = stored.filter((vendor) => vendor.enabled !== false);
    const ordered = orderProductsByVendor(
      [
        product("gbo-a", "gift-baskets-overseas", 5),
        product("bp-a", "blossompot", 30),
        product("fnp-a", "fnp", 40),
      ].filter((item) => available.some((vendor) => vendor.vendorSlug === item.vendorSlug)),
      available
    );
    assert.deepEqual(
      ordered.map((item) => item.slug),
      ["bp-a", "fnp-a"]
    );
    assert.equal(stored.find((vendor) => vendor.vendorSlug === "gift-baskets-overseas")?.displayOrder, 3);
  });

  it("skips a vendor that does not deliver to the selected country", () => {
    const country = "GB";
    const delivery: Record<string, string[]> = {
      blossompot: ["US"],
      "orange-county": ["US"],
      "gift-baskets-overseas": ["GB"],
      fnp: ["US", "GB"],
    };
    const available = vendors.filter((vendor) => delivery[vendor.vendorSlug]?.includes(country));
    const ordered = orderProductsByVendor(
      [product("bp-a", "blossompot", 30), product("gbo-a", "gift-baskets-overseas", 5), product("fnp-a", "fnp", 40)].filter(
        (item) => available.some((vendor) => vendor.vendorSlug === item.vendorSlug)
      ),
      available
    );
    assert.deepEqual(
      ordered.map((item) => item.slug),
      ["gbo-a", "fnp-a"]
    );
  });

  it("keeps vendor order ahead of price sorting", () => {
    const ordered = sortStorefrontProducts(
      [
        product("a", "blossompot", 30, "A"),
        product("b", "blossompot", 10, "B"),
        product("c", "blossompot", 20, "C"),
        product("x", "orange-county", 5, "X"),
        product("y", "orange-county", 15, "Y"),
      ],
      "price-asc",
      vendors
    );
    assert.deepEqual(
      ordered.map((item) => item.slug),
      ["b", "c", "a", "x", "y"]
    );
  });

  it("keeps vendor order ahead of name sorting", () => {
    const ordered = sortStorefrontProducts(
      [product("c", "fnp", 1, "C"), product("a", "blossompot", 1, "A"), product("b", "blossompot", 1, "B")],
      "name-asc",
      vendors
    );
    assert.deepEqual(
      ordered.map((item) => item.slug),
      ["a", "b", "c"]
    );
  });

  it("slices only after vendor ordering", () => {
    const ordered = orderProductsByVendor(
      [
        product("fnp-cheap", "fnp", 1),
        product("bp-a", "blossompot", 30),
        product("bp-b", "blossompot", 40),
        product("oc-a", "orange-county", 2),
      ],
      vendors
    );
    assert.deepEqual(ordered.slice(0, 2).map((item) => item.slug), ["bp-a", "bp-b"]);
  });

  it("preserves the existing product order inside a vendor", () => {
    const ordered = sortStorefrontProducts(
      [product("c", "blossompot", 5, "C"), product("a", "blossompot", 50, "A"), product("b", "blossompot", 20, "B")],
      "featured",
      vendors
    );
    assert.deepEqual(
      ordered.map((item) => item.slug),
      ["c", "a", "b"]
    );
  });

  it("moves the fourth vendor to position 1 and shifts the others", () => {
    const current = ["blossompot", "orange-county", "gift-baskets-overseas", "fnp"];
    const moved = moveVendorToPosition(current, "fnp", 1);
    assert.deepEqual(moved, ["fnp", "blossompot", "orange-county", "gift-baskets-overseas"]);
    const planned = planVendorDisplaySequence(current, moved ?? []);
    assert.equal(planned.ok, true);
    if (planned.ok) {
      assert.deepEqual(
        planned.assignments.map((row) => `${row.vendorSlug}:${row.displayOrder}`),
        ["fnp:1", "blossompot:2", "orange-county:3", "gift-baskets-overseas:4"]
      );
    }
  });

  it("gives a new vendor max + 1, or 1 when none are ordered", () => {
    assert.equal(nextDisplayOrder(vendors), 5);
    assert.equal(nextDisplayOrder([{ displayOrder: undefined }, {}]), 1);
  });

  it("rejects a duplicate or incomplete sequence", () => {
    const known = vendors.map((vendor) => vendor.vendorSlug);
    const duplicate = planVendorDisplaySequence(known, ["fnp", "fnp", "blossompot", "orange-county"]);
    assert.equal(duplicate.ok, false);
    const missing = planVendorDisplaySequence(known, ["fnp", "blossompot", "orange-county"]);
    assert.equal(missing.ok, false);
    const unknown = planVendorDisplaySequence(known, ["fnp", "blossompot", "orange-county", "sample-florist"]);
    assert.equal(unknown.ok, false);
    assert.equal(reorderCatalogVendorsSchema.safeParse({ vendorSlugs: ["fnp", "fnp"] }).success, true);
  });

  it("restores a re-enabled vendor to its stored position", () => {
    const stored = vendors.map((vendor) =>
      vendor.vendorSlug === "gift-baskets-overseas" ? { ...vendor, enabled: false } : { ...vendor }
    );
    const hidden = orderProductsByVendor(
      [product("bp-a", "blossompot", 30), product("fnp-a", "fnp", 10)].filter((item) =>
        stored.some((vendor) => vendor.enabled !== false && vendor.vendorSlug === item.vendorSlug)
      ),
      stored.filter((vendor) => vendor.enabled !== false)
    );
    assert.deepEqual(
      hidden.map((item) => item.slug),
      ["bp-a", "fnp-a"]
    );
    const reenabled = stored.map((vendor) =>
      vendor.vendorSlug === "gift-baskets-overseas" ? { ...vendor, enabled: true } : vendor
    );
    assert.equal(reenabled.find((vendor) => vendor.vendorSlug === "gift-baskets-overseas")?.displayOrder, 3);
    const shown = orderProductsByVendor(
      [product("bp-a", "blossompot", 30), product("gbo-a", "gift-baskets-overseas", 1), product("fnp-a", "fnp", 10)],
      reenabled
    );
    assert.deepEqual(
      shown.map((item) => item.slug),
      ["bp-a", "gbo-a", "fnp-a"]
    );
  });

  it("gives built-in vendors their historical default order", () => {
    assert.deepEqual(
      CATALOG_VENDOR_SLUGS.map((slug) => [slug, defaultCatalogVendor(slug).displayOrder]),
      [
        ["blossompot", 1],
        ["orange-county", 2],
        ["gift-baskets-overseas", 3],
        ["fnp", 4],
      ]
    );
    const ordered = sortVendorsForDisplay(CATALOG_VENDOR_SLUGS.map((slug) => defaultCatalogVendor(slug)));
    assert.deepEqual(
      ordered.map((vendor) => vendor.vendorSlug),
      ["blossompot", "orange-county", "gift-baskets-overseas", "fnp"]
    );
  });

  it("accepts an existing vendor record that has no displayOrder", () => {
    const stored = parseStoredCatalogVendor("fnp", {
      vendorSlug: "fnp",
      vendorName: "FNP",
      enabled: true,
      integrationType: "excel",
      deliveryCountries: ["US"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    assert.ok(stored);
    assert.equal(catalogVendorSchema.safeParse(stored).success, true);
    assert.equal(stored.displayOrder, undefined);
    assert.equal(catalogVendorSchema.safeParse({ ...stored, displayOrder: 0 }).success, false);
    assert.equal(catalogVendorSchema.safeParse({ ...stored, displayOrder: 2 }).success, true);
    assert.equal(createCatalogVendorSchema.safeParse({ ...stored, displayPosition: 1 }).success, true);
    const unchanged = applyStoredDisplayOrder(stored, undefined);
    assert.equal(unchanged.displayOrder, undefined);
    assert.equal(applyStoredDisplayOrder(stored, 0).displayOrder, undefined);
    assert.equal(applyStoredDisplayOrder(defaultCatalogVendor("fnp"), undefined).displayOrder, 4);
  });

  it("annotates a public listing without the stored vendor slug", () => {
    const [annotated] = annotateStorefrontListing(
      [{ slug: "rose", name: "Rose", price: 10, vendorSlug: "blossompot", vendorCost: 4 }],
      vendors
    );
    assert.ok(annotated);
    assert.equal(annotated.listingVendorSlug, "blossompot");
    assert.equal(annotated.listingVendorName, "BlossomPot");
    assert.equal(annotated.listingDisplayOrder, 1);
    assert.equal(annotated.slug, "rose");
    assert.equal("vendorSlug" in annotated, false);
    assert.equal("vendorCost" in annotated, false);
  });

  it("inserts live extras into the vendor group before a later slice", () => {
    const arranged = arrangeStorefrontProducts(
      [product("bp-a", "blossompot", 30), product("fnp-a", "fnp", 40)],
      [
        { vendorSlug: "blossompot", count: 1 },
        { vendorSlug: "fnp", count: 1 },
      ],
      [product("gbo-a", "gift-baskets-overseas", 5)],
      vendors
    );
    assert.deepEqual(arranged.slice(0, 2).map((item) => item.slug), ["bp-a", "gbo-a"]);
  });
});
