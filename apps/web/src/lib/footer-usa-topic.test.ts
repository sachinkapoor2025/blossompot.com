import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { footerUsaTopicHeading } from "./footer-usa-topic";

describe("USA footer topic heading", () => {
  it("maps the ten storefront pages", () => {
    assert.equal(footerUsaTopicHeading("/"), "Deliver in USA");
    assert.equal(footerUsaTopicHeading("/flowers-to-usa"), "Flowers Deliver in USA");
    assert.equal(footerUsaTopicHeading("/bouquets-to-usa"), "Bouquets Deliver in USA");
    assert.equal(footerUsaTopicHeading("/cakes-to-usa"), "Cakes Deliver in USA");
    assert.equal(footerUsaTopicHeading("/birthday-gifts-to-usa"), "Birthday Gifts Deliver in USA");
    assert.equal(footerUsaTopicHeading("/anniversary-gifts-to-usa"), "Anniversary Gifts Deliver in USA");
    assert.equal(footerUsaTopicHeading("/valentines-day-gifts-to-usa"), "Valentine's Gifts Deliver in USA");
    assert.equal(footerUsaTopicHeading("/hampers-to-usa"), "Hampers Deliver in USA");
    assert.equal(footerUsaTopicHeading("/combos"), "Combos Deliver in USA");
    assert.equal(footerUsaTopicHeading("/gift-catalog"), "Flower & Cake Combo Deliver in USA");
  });

  it("keeps the existing label on unrelated routes", () => {
    for (const path of [
      "/products",
      "/flowers",
      "/flowers-to-uk",
      "/cakes-to-uk",
      "/gifts-to-usa",
      "/about",
      "/cart",
      "/flower-delivery-usa",
      "/birthday-gifts-to-uk",
    ]) {
      assert.equal(footerUsaTopicHeading(path), null, path);
    }
  });
});
