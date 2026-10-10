import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCatalogCountryEnabled, resolveDefaultShoppingCountry } from "@blossompot/shared";
import {
  countrySeoContent,
  countrySeoHrefs,
  hasApprovedCountrySeo,
} from "./country-seo-registry";

const USA_CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Dallas", "San Francisco", "Atlanta"];

function articleText(countryCode: string, page: "home" | "flowers" | "delivery-locations" = "home"): string {
  const article = countrySeoContent(countryCode, page);
  return JSON.stringify(article);
}

describe("country SEO registry", () => {
  it("uses the approved USA homepage wording", () => {
    const article = countrySeoContent("US", "home");
    assert.equal(article.availability, "approved");
    assert.equal(article.title, "Send Flowers & Cakes to USA | Online Gift Delivery – BlossomPot");
    assert.equal(article.heading, "Send Flowers, Cakes & Gifts Across the USA");
    assert.equal(article.faqs.length, 10);
    assert.match(article.faqs[4]?.a ?? "", /Same-day delivery may be available/);
    assert.match(articleText("US"), /support@blossompot\.com/);
    const hrefs = countrySeoHrefs(article);
    assert.equal(hrefs.includes("/gifts-to-los-angeles"), true);
    assert.equal(hrefs.includes("/gifts-to-new-york"), true);
    assert.equal(hrefs.includes("/gifts-to-san-diego"), false);
    assert.equal(hrefs.includes("/gifts-to-new-york-city"), false);
  });

  it("keeps approved USA flowers and delivery-location copy without enabling a country", () => {
    const flowers = countrySeoContent("US", "flowers");
    assert.equal(flowers.title, "Send Flowers to USA Online | Flower Delivery USA – BlossomPot");
    assert.equal(flowers.heading, "Send Flowers to the USA");
    assert.equal(flowers.faqs.length, 7);
    const locations = countrySeoContent("US", "delivery-locations");
    assert.equal(locations.heading, "Explore Our USA Delivery Locations");
    assert.equal(countrySeoHrefs(locations).includes("/gifts-to-new-jersey"), true);
    assert.equal(hasApprovedCountrySeo("US", "home"), true);

    const disabledUsa = [
      { countryCode: "US", enabled: false },
      { countryCode: "GB", enabled: true },
    ];
    assert.equal(isCatalogCountryEnabled(disabledUsa, "US"), false);
    assert.equal(hasApprovedCountrySeo("US"), true);
    assert.equal(resolveDefaultShoppingCountry(disabledUsa, "US"), "GB");
  });

  it("uses neutral copy for a country without approved content", () => {
    for (const page of ["home", "flowers", "delivery-locations"] as const) {
      const article = countrySeoContent("GB", page);
      assert.equal(article.availability, "neutral");
      assert.equal(hasApprovedCountrySeo("GB", page), false);
      const text = articleText("GB", page).toLowerCase();
      for (const city of USA_CITIES) {
        assert.equal(text.includes(city.toLowerCase()), false, city);
      }
      assert.equal(text.includes("same-day"), false);
      assert.equal(text.includes("all 50"), false);
      assert.equal(text.includes("nationwide"), false);
      assert.equal(text.includes("puerto rico"), false);
      assert.equal(countrySeoHrefs(article).some((href) => href.includes("gifts-to-")), false);
    }
    assert.equal(countrySeoContent("").availability, "neutral");
  });
});
