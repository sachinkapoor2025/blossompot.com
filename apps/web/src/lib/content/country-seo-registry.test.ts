import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCatalogCountryEnabled, resolveDefaultShoppingCountry } from "@blossompot/shared";
import {
  countrySeoContent,
  countrySeoHrefs,
  hasApprovedCountrySeo,
  type CountrySeoPage,
} from "./country-seo-registry";

const USA_CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Dallas", "San Francisco", "Atlanta"];

function articleText(countryCode: string, page: CountrySeoPage = "home"): string {
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
    assert.equal(
      flowers.title,
      "Send Flowers to USA Online – Fresh Bouquets and Roses Delivered Across America | BlossomPot"
    );
    assert.equal(flowers.heading, "Send Flowers to USA Online – Fresh Bouquets and Roses Delivered Across America");
    assert.deepEqual(
      flowers.sections.map((section) => section.heading),
      [
        "Explore Our Collection of Flowers for Delivery in America",
        "Send Roses to USA – Red, Pink and White Rose Bouquets",
        "Flowers for Every Occasion in the USA",
        "Send Flowers to USA from India and Other Countries",
        "Floral Gifts Delivered to Popular US Cities and States",
        "Pair Your Flowers with Cakes, Hampers and Gifts",
        "Why Choose BlossomPot to Send Flowers to USA?",
      ]
    );
    assert.equal(flowers.faqHeading, "Frequently Asked Questions");
    assert.equal(flowers.faqBeforeClosing, false);
    assert.equal(flowers.faqs[0]?.q, "Can I send flowers to USA from India or another country?");
    assert.match(flowers.faqs[0]?.a ?? "", /browse BlossomPot from India/);
    const flowerHrefs = countrySeoHrefs(flowers);
    assert.equal(flowerHrefs.includes("/gifts-to-new-york"), true);
    assert.equal(flowerHrefs.includes("/gifts-to-boston"), true);
    assert.equal(flowerHrefs.some((href) => href.includes("amplifyapp.com")), false);
    assert.equal(flowers.faqs.length, 8);
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
    for (const page of [
      "home",
      "flowers",
      "delivery-locations",
      "bouquets",
      "cakes",
      "birthday-gifts",
      "anniversary-gifts",
      "valentines-day-gifts",
      "hampers",
      "combos",
    ] as const) {
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
