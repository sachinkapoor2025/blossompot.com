import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { itemListJsonLd, onlineStoreJsonLd, organizationJsonLd } from "./seo";

const ORG_ONLY_INVALID = ["audience", "shippingDetails", "currenciesAccepted", "priceRange", "paymentAccepted"] as const;

describe("shared storefront structured data", () => {
  it("keeps Organization identity and omits properties that are not valid on Organization", () => {
    const org = organizationJsonLd();
    assert.equal(org["@type"], "Organization");
    assert.equal(org.name, "BlossomPot");
    assert.equal(typeof org.legalName, "string");
    assert.ok(org.url);
    assert.equal(org.logo["@type"], "ImageObject");
    assert.equal(typeof org.email, "string");
    assert.ok(Array.isArray(org.sameAs) && org.sameAs.length > 0);
    assert.ok(Array.isArray(org.contactPoint) && org.contactPoint.length > 0);
    for (const property of ORG_ONLY_INVALID) {
      assert.equal(property in org, false, property);
    }
  });

  it("does not put LocalBusiness or Offer-only fields on OnlineStore", () => {
    const store = onlineStoreJsonLd();
    assert.equal(store["@type"], "OnlineStore");
    assert.equal(store.name, "BlossomPot");
    assert.ok(store.url);
    assert.equal(store.parentOrganization["@id"].endsWith("#organization"), true);
    for (const property of ["shippingDetails", "currenciesAccepted", "priceRange", "paymentAccepted", "audience"]) {
      assert.equal(property in store, false, property);
    }
  });

  it("omits an ItemList when the page has no real entries", () => {
    assert.equal(itemListJsonLd("Mother's Day Gifts — BlossomPot", []), null);
  });

  it("builds ListItem entries from the supplied pages", () => {
    const list = itemListJsonLd("Flowers — BlossomPot", [
      { name: "Red Roses", path: "/products/red-roses" },
      { name: "Mixed Bouquet", path: "/products/mixed-bouquet" },
    ]);
    assert.ok(list);
    assert.equal(list["@type"], "ItemList");
    assert.equal(list.numberOfItems, 2);
    assert.equal(list.itemListElement.length, 2);
    assert.deepEqual(
      list.itemListElement.map((entry) => entry.position),
      [1, 2]
    );
    assert.equal(list.itemListElement[0].name, "Red Roses");
    assert.match(list.itemListElement[0].url, /\/products\/red-roses$/);
    assert.equal(list.itemListElement[1].name, "Mixed Bouquet");
  });
});
