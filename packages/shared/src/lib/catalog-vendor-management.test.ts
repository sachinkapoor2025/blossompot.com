import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VENDOR_FNP } from "../constants";
import { CATALOG_VENDOR_SLUGS } from "../schemas/catalog-vendor";
import { defaultCatalogVendor, productAllowedForNewShopping } from "./catalog-vendors";

describe("catalog vendor management shopping rules", () => {
  const envOn = { GBO_STOREFRONT_ENABLED: "true" };
  const allOn = CATALOG_VENDOR_SLUGS.map((slug) => defaultCatalogVendor(slug));

  it("hides a trashed vendor without hiding the vendors that remain enabled", () => {
    const trashed = allOn.map((vendor) =>
      vendor.vendorSlug === VENDOR_FNP ? { ...vendor, enabled: false, trashedAt: "2026-10-07T00:00:00.000Z" } : vendor
    );
    const fnp = productAllowedForNewShopping({ slug: "fnp-cake", vendorSlug: VENDOR_FNP }, "US", trashed, envOn);
    assert.equal(fnp.available, false);
    assert.equal(productAllowedForNewShopping({ slug: "owned-rose" }, "US", trashed, envOn).available, true);
    assert.equal(
      productAllowedForNewShopping({ slug: "oc-hamper", vendorSlug: "orange-county" }, "US", trashed, envOn).available,
      true
    );
    assert.equal(
      productAllowedForNewShopping(
        { slug: "gbo-us-1", vendorSlug: "gift-baskets-overseas", sku: "gbo:US:1" },
        "US",
        trashed,
        envOn
      ).available,
      true
    );
  });

  it("gates a newly stored catalog vendor and still allows an unknown marketplace slug", () => {
    const registry = [
      ...allOn,
      { vendorSlug: "phase2-flowers", enabled: false, deliveryCountries: ["US"] as const },
    ];
    const blocked = productAllowedForNewShopping(
      { slug: "new-rose", vendorSlug: "phase2-flowers" },
      "US",
      registry,
      envOn
    );
    assert.equal(blocked.available, false);
    assert.equal(blocked.reason, "vendor_disabled");
    assert.equal(
      productAllowedForNewShopping({ slug: "fnp-cake", vendorSlug: VENDOR_FNP }, "US", registry, envOn).available,
      true
    );
    const unknown = productAllowedForNewShopping(
      { slug: "local-rose", vendorSlug: "sample-florist" },
      "US",
      registry,
      envOn
    );
    assert.equal(unknown.available, true);
    assert.equal(unknown.vendorSlug, "sample-florist");
  });
});
