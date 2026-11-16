import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { specialDayArticle } from "./special-day-copy";
import { explicitShoppingSeoCountry } from "./location-seo-urls";
import { selectSpecialDayProducts } from "./special-day-match";
import { adjacentSpecialDays, SPECIAL_DAYS } from "./special-day-slugs";

const catalog = [
  { slug: "red-roses", name: "Classic Red Rose Bouquet", description: "A dozen red roses", categorySlug: "flowers", tags: ["rose"] },
  { slug: "pink-roses", name: "Pink Rose Bouquet", description: "Soft pink roses", categorySlug: "flowers", tags: ["rose"] },
  { slug: "mixed", name: "Mixed Flower Bouquet", description: "A cheerful mixed bunch", categorySlug: "flower-bouquets", tags: ["bouquet"] },
  { slug: "sunflower", name: "Sunshine Sunflower Bouquet", description: "Bright sunflowers", categorySlug: "flower-bouquets", tags: ["sunflower"] },
  { slug: "chocolate-cake", name: "Chocolate Truffle Cake", description: "Rich chocolate cake", categorySlug: "cakes", tags: ["chocolate"] },
  { slug: "teddy", name: "Teddy & Flower Combo", description: "Soft plush teddy with flowers", categorySlug: "birthday-gifts", tags: ["teddy"] },
  { slug: "personalized", name: "Personalized Love Cushion", description: "A keepsake you can personalize", categorySlug: "personalized-gifts", tags: ["personalized"] },
  { slug: "anniversary", name: "Anniversary Roses & Cake", description: "Romantic anniversary roses", categorySlug: "anniversary-gifts", tags: ["anniversary", "rose"] },
  { slug: "valentine-box", name: "Valentine's Rose Box", description: "Valentine roses", categorySlug: "valentines-day-gifts", tags: ["valentine"] },
];

describe("February special day pages", () => {
  it("gives every day its own public country URL", () => {
    assert.deepEqual(
      SPECIAL_DAYS.map((day) => day.publicSlug),
      [
        "rose-day-gifts",
        "propose-day-gifts",
        "chocolate-day-gifts",
        "teddy-day-gifts",
        "promise-day-gifts",
        "hug-day-gifts",
        "kiss-day-gifts",
        "valentines-day-gifts",
      ]
    );
    assert.equal(explicitShoppingSeoCountry("/rose-day-gifts-to-usa"), "US");
    assert.equal(explicitShoppingSeoCountry("/propose-day-gifts-to-uk"), "GB");
    assert.equal(explicitShoppingSeoCountry("/chocolate-day-gifts-to-uae"), "AE");
    assert.equal(explicitShoppingSeoCountry("/teddy-day-gifts-to-australia"), "AU");
    assert.equal(explicitShoppingSeoCountry("/valentines-day-gifts-to-canada"), "CA");
  });

  it("selects a different product set for each occasion", () => {
    const picks = Object.fromEntries(
      [
        "rose-day",
        "propose-day",
        "chocolate-day",
        "teddy-day",
        "promise-day",
        "hug-day",
        "kiss-day",
        "valentines-day",
      ].map((id) => [id, selectSpecialDayProducts(id, catalog).map((product) => product.slug)])
    );

    assert.ok(picks["rose-day"].includes("red-roses"));
    assert.ok(picks["rose-day"].includes("pink-roses"));
    assert.deepEqual(picks["chocolate-day"], ["chocolate-cake"]);
    assert.deepEqual(picks["teddy-day"], ["teddy"]);
    assert.deepEqual(picks["promise-day"], ["personalized"]);
    assert.ok(picks["hug-day"].includes("mixed"));
    assert.ok(picks["hug-day"].includes("sunflower"));
    assert.equal(picks["hug-day"].includes("red-roses"), false);
    assert.deepEqual(picks["kiss-day"], ["red-roses"]);
    assert.ok(picks["propose-day"].includes("anniversary"));
    assert.ok(picks["valentines-day"].includes("valentine-box"));
    assert.notDeepEqual(picks["rose-day"], picks["kiss-day"]);
    assert.notDeepEqual(picks["hug-day"], picks["rose-day"]);
  });

  it("uses the Valentine week article for each day", () => {
    const rose = specialDayArticle("rose-day", "US");
    assert.ok(rose);
    assert.equal(rose.title, "Rose Day Gifts to USA | Send Red Roses Online | BlossomPot");
    assert.equal(rose.h1, "Rose Day Gifts to the USA — Begin the Week of Love with Roses");
    assert.equal(rose.faqs.length, 5);
    assert.equal(JSON.stringify(rose).includes("$75"), false);
    assert.equal(rose.delivery.includes("$14"), true);
    const uk = specialDayArticle("rose-day", "GB");
    assert.equal(uk?.h1.includes("UK"), true);
    assert.equal(uk?.h1.includes("USA"), false);
    for (const day of SPECIAL_DAYS) {
      const article = specialDayArticle(day.id, "US");
      assert.equal(article?.faqs.length, 5);
      assert.equal(article?.ideas.length, 4);
    }
    assert.equal(adjacentSpecialDays("rose-day").next, "propose-day");
    assert.equal(adjacentSpecialDays("kiss-day").next, "valentines-day");
    assert.equal(adjacentSpecialDays("valentines-day").prev, "kiss-day");
    assert.equal(adjacentSpecialDays("rose-day").prev, null);
  });
});
