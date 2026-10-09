import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productVisibleForDeliveryCountry, SHOPPING_COUNTRY_ISO, type Product } from "@blossompot/shared";
import { shoppingCatalogCountry, shoppingCatalogQuery } from "./shopping-catalog";

function product(slug: string): Product {
  return {
    slug,
    name: slug,
    categorySlug: "flowers",
    price: 49,
    currency: "USD",
    published: true,
    images: ["https://example.com/flower.jpg"],
  } as Product;
}

describe("shopping catalog country", () => {
  it("forwards a known country and lets the API apply the global list", () => {
    assert.equal(shoppingCatalogCountry("GB"), "GB");
    const query = shoppingCatalogQuery({ country: "GB", search: "roses" });
    assert.match(query, /country=GB/);
    assert.equal(shoppingCatalogCountry("ZZ"), SHOPPING_COUNTRY_ISO);
    const visible = [
      product("sunset-roses"),
      { ...product("gbo-us-9-hamper"), sku: "gbo:US:9", vendorSlug: "gift-baskets-overseas" },
    ].filter((item) => productVisibleForDeliveryCountry(item, shoppingCatalogCountry("GB")));
    assert.deepEqual(
      visible.map((item) => item.slug),
      ["sunset-roses"]
    );
  });
});
