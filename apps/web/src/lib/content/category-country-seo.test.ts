import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { categoryLocationHref } from "../location-seo-urls";
import { canonical } from "../seo";
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
    assert.equal(seo.title, "Send Flowers to USA Online | Flower Delivery – BlossomPot");
    assert.equal(seo.h1, "Send Flowers to USA");
    assert.equal(seo.article?.heading, "Send Flowers to USA");
    assert.equal(
      seo.description,
      "Send flowers to the USA with BlossomPot. Explore roses, lilies, orchids, and bouquets for birthdays, anniversaries, and special occasions. Check delivery options online."
    );
  });

  it("keeps neutral copy for a country category without approved content", () => {
    const flowers = resolveCategoryPageSeo("flowers", "/flowers-to-uk");
    const plants = resolveCategoryPageSeo("plants", "/plants-to-usa");
    assert.equal(flowers.source, "neutral");
    assert.equal(flowers.article, null);
    assert.equal(flowers.h1, "Flowers for UK");
    assert.equal(plants.source, "neutral");
    assert.equal(plants.h1, "Plants for USA");
    assertNeutral(`${flowers.title} ${flowers.description} ${flowers.h1}`);
    assertNeutral(`${plants.title} ${plants.description} ${plants.h1}`);
  });

  it("uses distinct approved USA copy for the six category routes", () => {
    const pages = [
      {
        slug: "flower-bouquets",
        path: "/bouquets-to-usa",
        title: "Flower Bouquets Delivery to USA | Order Bouquets Online | BlossomPot",
        h1: "Send Bouquets to USA",
        sections: [
          "Bouquet Delivery Across the USA",
          "Bouquet Styles to Choose From",
          "Bouquet Gifting Tips",
          "Why Order Bouquets from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Bouquets to USA",
      },
      {
        slug: "cakes",
        path: "/cakes-to-usa",
        title: "Order Cakes Online USA | Birthday & Anniversary Cake Delivery | BlossomPot",
        h1: "Send Cakes to USA",
        sections: [
          "Cake Delivery Across the USA",
          "Cake Favourites",
          "Sweet Moments, Shared from Far Away",
          "Why Order Cakes from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Cakes to USA",
      },
      {
        slug: "birthday-gifts",
        path: "/birthday-gifts-to-usa",
        title: "Birthday Gifts to USA | Send Birthday Flowers, Cakes & Combos | BlossomPot",
        h1: "Send Birthday Gifts to USA",
        sections: [
          "Birthday Gift Delivery in the USA",
          "Birthday Gift Ideas",
          "Make the Birthday Feel Close",
          "Why Order Birthday Gifts from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Birthday Gifts to USA",
      },
      {
        slug: "anniversary-gifts",
        path: "/anniversary-gifts-to-usa",
        title: "Anniversary Gifts to USA | Send Roses, Cakes & Gift Sets | BlossomPot",
        h1: "Send Anniversary Gifts to USA",
        sections: [
          "Anniversary Gift Delivery in the USA",
          "Anniversary Gift Ideas",
          'Gifts That Say More Than "Happy Anniversary"',
          "Why Order Anniversary Gifts from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Anniversary Gifts to USA",
      },
      {
        slug: "valentines-day-gifts",
        path: "/valentines-day-gifts-to-usa",
        title: "Valentine's Day Gifts to USA | Romantic Flowers & Gift Sets | BlossomPot",
        h1: "Send Valentine's Day Gifts to USA",
        sections: [
          "Valentine's Day Delivery to the USA",
          "Valentine's Gift Ideas",
          "Choosing the Right Valentine's Gift",
          "Why Order Valentine's Gifts from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Valentine's Day Gifts to USA",
      },
      {
        slug: "gift-hampers",
        path: "/hampers-to-usa",
        title: "Gift Hampers to USA | Gift Baskets & Curated Boxes | BlossomPot",
        h1: "Send Hampers to USA",
        sections: [
          "Gift Hamper Delivery in the USA",
          "What You Can Find in Our Hampers",
          "When a Hamper Is the Perfect Choice",
          "Why Order Hampers from BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions — Gift Hampers to USA",
      },
    ] as const;

    const titles = new Set<string>();
    const headings = new Set<string>();
    for (const page of pages) {
      assert.equal(categoryLocationHref(page.slug, "US"), page.path);
      const seo = resolveCategoryPageSeo(page.slug, page.path);
      assert.equal(seo.source, "approved");
      assert.equal(seo.title, page.title);
      assert.equal(seo.h1, page.h1);
      assert.equal(seo.article?.heading, page.h1);
      assert.equal(seo.description.includes("$75"), false);
      assert.equal(JSON.stringify(seo.article).includes("amplifyapp.com"), false);
      assert.deepEqual(seo.article?.sections.map((section) => section.heading), [...page.sections]);
      assert.equal(seo.article?.faqHeading, page.faqHeading);
      assert.equal(seo.article?.faqs.length, 6);
      assert.equal(canonical(page.path).endsWith(page.path), true);
      titles.add(page.title);
      headings.add(page.h1);
    }
    assert.equal(titles.size, pages.length);
    assert.equal(headings.size, pages.length);
  });

  it("renders the SEO article after the product listing", () => {
    const page = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../app/categories/[slug]/page.tsx"),
      "utf8"
    );
    const grid = page.indexOf("<ProductGrid");
    const article = page.indexOf("<CountrySeoArticle");
    const listingHeading = page.indexOf('<h1 className="text-3xl font-bold text-primary mb-8">{h1}</h1>');
    assert.ok(listingHeading >= 0);
    assert.ok(grid > listingHeading);
    assert.ok(article > grid);
    assert.equal(page.includes("pageSeo.article ? null : <h1"), false);
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
