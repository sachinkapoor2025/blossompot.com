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
    assert.equal(flowers.title, "Send Flowers to USA Online | Flower Delivery – BlossomPot");
    assert.equal(flowers.heading, "Send Flowers to USA");
    assert.deepEqual(
      flowers.sections.map((section) => section.heading),
      [
        "Shop Flowers by Occasion",
        "Explore Popular Flowers Online",
        "Flower Delivery Across the USA",
        "Why Choose BlossomPot for Flower Delivery?",
      ]
    );
    assert.equal(flowers.stepsHeading, "How to Order Flowers Online in the USA");
    assert.equal(flowers.faqHeading, "Frequently Asked Questions");
    assert.equal(flowers.faqBeforeClosing, true);
    assert.equal(flowers.closing.heading, "Make Every Moment Special with BlossomPot");
    assert.deepEqual(
      flowers.faqs.map((faq) => faq.q),
      [
        "Can I send flowers to the USA from another country?",
        "Does BlossomPot offer same-day flower delivery in the USA?",
        "Which flowers can I send through BlossomPot?",
        "Can I send flowers for birthdays and anniversaries?",
        "How can I check flower delivery availability?",
        "Can I include a message with my flower delivery?",
        "How long does flower delivery take in the USA?",
      ]
    );
    assert.match(flowers.faqs[1]?.a ?? "", /Same-day delivery may be available/);
    const flowerHrefs = countrySeoHrefs(flowers);
    assert.equal(flowerHrefs.includes("/gifts-to-new-york"), true);
    assert.equal(flowerHrefs.includes("/gifts-to-boston"), true);
    assert.equal(flowerHrefs.some((href) => href.includes("amplifyapp.com")), false);
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
