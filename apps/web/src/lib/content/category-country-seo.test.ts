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
    assert.equal(seo.h1, "Send Flowers to USA Online");
    assert.equal(seo.article?.heading, "Send Flowers to USA Online");
    assert.equal(
      seo.description,
      "Send flowers to USA with BlossomPot. Explore flower bouquets, rose arrangements, and floral gifts for birthdays, anniversaries, Valentine's Day, and other special occasions."
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
        title: "Send Beautiful Flower Bouquets to USA Online | BlossomPot",
        h1: "Send Beautiful Flower Bouquets to USA Online",
        sections: [
          "Explore Beautiful Flower Bouquets for USA Delivery",
          "Send Flower Bouquets to USA for Every Special Occasion",
          "Send Rose Bouquets and Mixed Flowers to USA",
          "Send Flower Bouquets to USA from Worldwide",
          "Pair Flower Bouquets with Cakes and Gifts",
          "Why Choose BlossomPot to Send Bouquets to USA?",
        ],
        faqHeading: "Frequently Asked Questions About Flower Bouquets to USA",
        faqs: 6,
      },
      {
        slug: "cakes",
        path: "/cakes-to-usa",
        title: "Send Cakes to USA Online | BlossomPot",
        h1: "Send Cakes to USA Online",
        sections: [
          "Explore Our Collection of Cakes for USA Delivery",
          "Send Birthday Cakes to USA for Special Celebrations",
          "Send Chocolate Cakes and Other Cake Varieties to USA",
          "Anniversary Cakes and Celebration Cakes in USA",
          "Send Cakes to USA from Worldwide",
          "Make Your Gift Special with Cakes, Flowers and Hampers",
          "Why Choose BlossomPot to Send Cakes to USA?",
        ],
        faqHeading: "Frequently Asked Questions About Cakes to USA",
        faqs: 7,
      },
      {
        slug: "birthday-gifts",
        path: "/birthday-gifts-to-usa",
        title: "Send Birthday Gifts to USA | BlossomPot",
        h1: "Send Birthday Gifts to USA to Make Every Celebration Special",
        sections: [
          "Explore the Best Birthday Gift Ideas for Your Loved Ones in USA",
          "Send Birthday Gifts to Everyone Special in Your Life",
        ],
        faqHeading: "Frequently Asked Questions",
        faqs: 4,
      },
      {
        slug: "anniversary-gifts",
        path: "/anniversary-gifts-to-usa",
        title: "Send Anniversary Gifts to USA | BlossomPot",
        h1: "Send Anniversary Gifts to USA to Celebrate Your Love",
        sections: [
          "Explore Beautiful Anniversary Gifts for Your Loved Ones in USA",
          "Find the Perfect Anniversary Gift for Your Partner",
          "Celebrate Every Milestone with Thoughtful Anniversary Gifts",
          "How to Order Anniversary Gifts Online for Delivery in USA",
          "Why Choose BlossomPot to Send Anniversary Gifts to USA?",
        ],
        faqHeading: "Frequently Asked Questions",
        faqs: 6,
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
        title: "Send Gift Hampers to USA | BlossomPot",
        h1: "Send Gift Hampers to USA",
        sections: [
          "Send Beautiful Gift Hampers for Every Occasion",
          "Explore Different Types of Gift Hampers in the USA",
          "Send Gift Hampers to the USA from India and Other Countries",
          "Send Gift Hampers Across Major Cities in the USA",
          "Why Choose BlossomPot for Gift Hampers to the USA?",
          "How to Order Gift Hampers Online for Delivery in the USA",
          "Make Every Celebration Memorable with BlossomPot",
        ],
        faqHeading: "Frequently Asked Questions – Gift Hampers to USA",
        faqs: 10,
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
      assert.equal(seo.article?.faqs.length, "faqs" in page ? page.faqs : 6);
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
    const content = page.slice(
      page.indexOf("async function CategoryPageContent"),
      page.indexOf("async function CategoryProductListing")
    );
    const grid = content.indexOf("<CategoryProductListing");
    const article = content.indexOf("<CountrySeoArticle");
    const listingHeading = content.indexOf('<h1 className="text-3xl font-bold text-primary mb-8">{h1}</h1>');
    assert.ok(listingHeading >= 0);
    assert.ok(grid > listingHeading);
    assert.ok(article > grid);
    assert.equal(content.includes("loadCategoryPageProducts"), false);
    assert.match(page.slice(page.indexOf("async function CategoryProductListing")), /await loadCategoryPageProducts/);
    assert.match(page, /<ProductGrid /);
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
