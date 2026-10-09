import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Product } from "@blossompot/shared";
import { pickCountryProducts } from "../lib/country-flower-selection";

function product(slug: string, categorySlug: string): Product {
  return {
    slug,
    name: slug,
    categorySlug,
    price: 49,
    currency: "USD",
    published: true,
    images: ["https://example.com/flower.jpg"],
  } as Product;
}

describe("flower guide product selection", () => {
  it("keeps at most 24 cards for the USA and 10 for other guides", () => {
    const usa = Array.from({ length: 30 }, (_, i) => product(`usa-flower-${i}`, "flowers"));
    const local = Array.from({ length: 15 }, (_, i) => product(`local-flower-${i}`, "flowers"));
    assert.equal(pickCountryProducts(usa, "usa").length, 24);
    assert.equal(pickCountryProducts(local, "uk").length, 10);
    assert.equal(pickCountryProducts(local, "canada").length, 10);
    assert.equal(
      pickCountryProducts(
        Array.from({ length: 12 }, (_, i) => product(`gbo-gb-${i + 1}-gift`, "flowers")),
        "uk"
      ).length,
      0
    );
    assert.equal(
      pickCountryProducts(
        Array.from({ length: 12 }, (_, i) => product(`gbo-ca-${i + 1}-gift`, i < 4 ? "flowers" : "hampers")),
        "canada"
      ).length,
      0
    );
  });

  it("shows the US catalog on an international guide rail", () => {
    const rail = pickCountryProducts(
      [
        product("sunset-roses", "flowers"),
        product("gbo-gb-9-hamper", "flowers"),
        product("gbo-ca-3-basket", "hampers"),
      ],
      "uk"
    );
    assert.deepEqual(
      rail.map((item) => item.slug),
      ["sunset-roses"]
    );
  });

  it("uses a stable shuffle for the same guide", () => {
    const products = Array.from({ length: 20 }, (_, i) => product(`local-flower-${i}`, "flowers"));
    const first = pickCountryProducts(products, "uk").map((item) => item.slug);
    const second = pickCountryProducts(products, "uk").map((item) => item.slug);
    assert.deepEqual(first, second);
    assert.equal(new Set(first).size, 10);
  });
});
