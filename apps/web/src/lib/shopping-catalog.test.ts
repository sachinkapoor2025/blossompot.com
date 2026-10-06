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
  it("loads a GB request as the United States catalog", () => {
    assert.equal(shoppingCatalogCountry("GB"), "US");
    const query = shoppingCatalogQuery({ country: "GB", search: "roses" });
    assert.match(query, /country=US/);
    assert.equal(query.includes("country=GB"), false);
    const visible = [product("sunset-roses"), product("gbo-gb-9-hamper")].filter((item) =>
      productVisibleForDeliveryCountry(item, shoppingCatalogCountry("GB"))
    );
    assert.deepEqual(
      visible.map((item) => item.slug),
      ["sunset-roses"]
    );
    assert.equal(shoppingCatalogCountry("CA"), SHOPPING_COUNTRY_ISO);
  });
});
