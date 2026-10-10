import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCategoryRichContent } from "./category-rich-content";
import { catalogShopSeo, resolveCategoryPageSeo } from "./category-country-seo";

const UNSUPPORTED = [/worldwide/i, /same-day/i, /all 50/i, /nationwide/i, /puerto rico/i, /new york/i, /los angeles/i];

function assertNeutral(text: string) {
  for (const pattern of UNSUPPORTED) {
    assert.equal(pattern.test(text), false, `${pattern} in ${text}`);
  }
}

describe("category country SEO", () => {
  it("uses the approved USA flowers article on /flowers-to-usa", () => {
    const seo = resolveCategoryPageSeo("flowers", "/flowers-to-usa");
    assert.equal(seo.source, "approved");
    assert.equal(seo.title, "Send Flowers to USA Online | Flower Delivery USA – BlossomPot");
    assert.equal(seo.h1, "Send Flowers to the USA");
    assert.equal(seo.article?.heading, "Send Flowers to the USA");
    assert.match(seo.description, /ZIP code/);
  });

  it("keeps neutral copy for a country category without approved content", () => {
    const flowers = resolveCategoryPageSeo("flowers", "/flowers-to-uk");
    const cakes = resolveCategoryPageSeo("cakes", "/cakes-to-usa");
    assert.equal(flowers.source, "neutral");
    assert.equal(flowers.article, null);
    assert.equal(flowers.h1, "Flowers for UK");
    assert.equal(cakes.source, "neutral");
    assert.equal(cakes.h1, "Cakes for USA");
    assertNeutral(`${flowers.title} ${flowers.description} ${flowers.h1}`);
    assertNeutral(`${cakes.title} ${cakes.description} ${cakes.h1}`);
  });

  it("does not follow a shopper country on the generic category URL", () => {
    const seo = resolveCategoryPageSeo("flowers", "/flowers");
    assert.equal(seo.source, "neutral");
    assert.equal(seo.h1, "Flowers");
    assert.equal(seo.article, null);
    assertNeutral(`${seo.title} ${seo.description} ${seo.h1}`);
  });

  it("uses neutral catalog copy and names the route country without a delivery promise", () => {
    const usa = catalogShopSeo("/gifts-to-usa");
    const plain = catalogShopSeo("/products");
    assert.match(usa.title, /USA/);
    assert.match(usa.intro, /USA/);
    assertNeutral(usa.description);
    assertNeutral(usa.intro.replace(/USA/g, ""));
    assert.equal(plain.title.includes("USA"), false);
    assertNeutral(`${plain.title} ${plain.description} ${plain.intro}`);
  });

  it("removes worldwide and same-day claims from category body copy", () => {
    for (const slug of ["flowers", "cakes", "gift-hampers", "birthday-gifts"]) {
      const content = getCategoryRichContent(slug);
      assert.ok(content, slug);
      assertNeutral(JSON.stringify(content));
    }
  });
});
