import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORY_PUBLIC_SLUG } from "@/lib/category-urls";
import { blogPosts } from "@/lib/content/blog-posts";
import { categoryRichContent } from "@/lib/content/category-rich-content";
import { countrySeoContent, countrySeoHrefs, type CountrySeoPage } from "@/lib/content/country-seo-registry";
import {
  flowerDeliveryCountryIso,
  getCountryFlowerDelivery,
  type CountryFlowerDeliverySlug,
} from "@/lib/content/country-flower-delivery";
import { occasionPages } from "@/lib/content/occasions";
import { cityMenuForCountry } from "@/lib/city-menu-for-location";
import { cityNavHref } from "@/lib/site";
import { flowerGuideNav, getPublishedGuide } from "@/lib/content/flower-guide";
import { publishedGeoLocations } from "@/lib/content/geo/locations";
import { internationalPath, publishedInternationalLocations } from "@/lib/content/geo/international";
import {
  blogPageInlineLinks,
  categoryPageInlineLinks,
  cityPageInlineLinks,
  countryPageInlineLinks,
  marketingPageInlineLinks,
  seoArticleInlineLinks,
} from "@/lib/content/page-inline-links";
import { locationPublicPath } from "@/lib/content/seo-data";
import { exploreMoreLinksForProduct } from "@/lib/explore-more-links";
import {
  MAX_INLINE_LINKS,
  MIN_INLINE_LINKS,
  planInlineLinks,
  planInlineLinksAcross,
  normalizeInternalPath,
  type PhraseLink,
} from "@/lib/inline-link-plan";

const STATIC = new Set([
  "/",
  "/products",
  "/about",
  "/about/team",
  "/shipping",
  "/faq",
  "/contact",
  "/corporate-gifting",
  "/press",
  "/privacy",
  "/returns",
  "/terms",
  "/blog",
  "/flower-guide",
  "/delivery-locations",
  "/locations",
  "/occasions",
  "/gifts",
  "/remember",
  "/forgot-occasion",
  "/combos",
  "/reviews",
  "/editorial-policy",
  "/become-a-vendor",
  "/gift-catalog",
  "/flower-delivery-usa",
  "/flower-delivery-uk",
  "/flower-delivery-canada",
  "/flower-delivery-australia",
  "/flower-delivery-uae",
]);

const categoryPaths = new Set(Object.values(CATEGORY_PUBLIC_SLUG).map((slug) => `/${slug}`));
const geoPaths = new Set(publishedGeoLocations().map((geo) => locationPublicPath(geo.slug)));
const intlPaths = new Set(publishedInternationalLocations().map((loc) => internationalPath(loc)));
const blogSlugs = new Set(blogPosts.map((post) => post.slug));
const occasionPaths = new Set(occasionPages.map((page) => `/occasions/${page.slug}`));
const flowerHubs = new Set(flowerGuideNav.map((item) => item.href));

function isLiveInternalPath(href: string): boolean {
  const path = normalizeInternalPath(href);
  if (STATIC.has(path) || categoryPaths.has(path) || geoPaths.has(path) || intlPaths.has(path)) return true;
  if (path.startsWith("/blog/")) return blogSlugs.has(path.slice("/blog/".length));
  if (occasionPaths.has(path)) return true;
  if (flowerHubs.has(path)) return true;
  if (path.startsWith("/flower-guide/")) {
    const slug = path.slice("/flower-guide/".length);
    if (slug.includes("/")) return flowerHubs.has(path) || path.startsWith("/flower-guide/flower-care/") || path.startsWith("/flower-guide/flowers-by-");
    return Boolean(getPublishedGuide(slug));
  }
  return false;
}

function assertBudget(label: string, matches: { phrase: string; href: string }[], minimum = 0) {
  assert.ok(matches.length <= MAX_INLINE_LINKS, `${label} has ${matches.length} inline links`);
  assert.ok(matches.length >= minimum, `${label} has only ${matches.length} inline links`);
  const anchors = matches.map((match) => match.phrase.toLowerCase());
  assert.equal(new Set(anchors).size, anchors.length, `${label} repeats an anchor: ${anchors.join(", ")}`);
  const hrefs = matches.map((match) => match.href);
  assert.equal(new Set(hrefs).size, hrefs.length, `${label} repeats a destination: ${hrefs.join(", ")}`);
  for (const match of matches) {
    assert.equal(isLiveInternalPath(match.href), true, `${label} links “${match.phrase}” to unknown ${match.href}`);
  }
}

describe("planInlineLinks", () => {
  it("links at most five unique phrases and skips words inside longer words", () => {
    const links: PhraseLink[] = [
      { phrase: "cake", href: "/cakes" },
      { phrase: "cakes", href: "/birthday-gifts" },
      { phrase: "flowers", href: "/flowers" },
      { phrase: "gift hampers", href: "/gift-hampers" },
      { phrase: "bouquets", href: "/bouquets" },
    ];
    const text = "Send cakes and flowers with gift hampers, not a single cake, plus bouquets.";
    const matches = planInlineLinks(text, links);
    assertBudget("sample", matches);
    const standaloneCake = matches.find((match) => match.phrase === "cake");
    assert.ok(standaloneCake);
    assert.equal(text.slice(standaloneCake.start - 1, standaloneCake.start), " ");
    assert.equal(matches.some((match) => match.phrase === "cakes"), true);
    assert.equal(matches.some((match) => match.href === "/gift-hampers"), true);
    assert.equal(matches.length, 5);
  });

  it("does not repeat an anchor or destination across paragraphs", () => {
    const links: PhraseLink[] = [
      { phrase: "flowers", href: "/flowers" },
      { phrase: "Flowers", href: "/bouquets" },
      { phrase: "cakes", href: "/cakes" },
    ];
    const matches = planInlineLinksAcross(["Shop flowers today.", "Flowers and cakes tomorrow."], links);
    assertBudget("paragraphs", matches);
    assert.equal(matches.filter((match) => match.phrase.toLowerCase() === "flowers").length, 1);
  });
});

describe("configured contextual links", () => {
  const groups: { label: string; links: readonly PhraseLink[] }[] = [
    ...Object.entries(categoryPageInlineLinks).map(([key, links]) => ({ label: `category:${key}`, links })),
    ...Object.entries(countryPageInlineLinks).map(([key, links]) => ({ label: `country:${key}`, links })),
    ...Object.entries(marketingPageInlineLinks).map(([key, links]) => ({ label: `page:${key}`, links })),
    ...Object.entries(seoArticleInlineLinks).map(([key, links]) => ({ label: `seo:${key}`, links })),
    ...Object.entries(blogPageInlineLinks).map(([key, links]) => ({ label: `blog-config:${key}`, links })),
  ];

  for (const group of groups) {
    it(`${group.label} points at live pages`, () => {
      for (const link of group.links) {
        assert.equal(isLiveInternalPath(link.href), true, `${group.label} “${link.phrase}” -> ${link.href}`);
      }
    });
  }

  it("keeps each blog article within three to five unique contextual links", () => {
    const problems: string[] = [];
    for (const post of blogPosts) {
      const paragraphs = post.sections.flatMap((section) => section.paragraphs);
      const matches = planInlineLinksAcross(paragraphs, blogPageInlineLinks[post.slug] ?? [], {
        currentPath: `/blog/${post.slug}`,
      });
      if (matches.length < MIN_INLINE_LINKS || matches.length > MAX_INLINE_LINKS) {
        problems.push(`${post.slug}: ${matches.length} links (${matches.map((match) => match.phrase).join(", ")})`);
      }
      const anchors = matches.map((match) => match.phrase.toLowerCase());
      if (new Set(anchors).size !== anchors.length) problems.push(`${post.slug}: duplicate anchor`);
      const hrefs = matches.map((match) => match.href);
      if (new Set(hrefs).size !== hrefs.length) problems.push(`${post.slug}: duplicate href`);
      for (const match of matches) {
        if (!isLiveInternalPath(match.href)) problems.push(`${post.slug}: bad ${match.href}`);
      }
    }
    assert.deepEqual(problems, []);
  });

  it("keeps USA SEO articles within three to five contextual links", () => {
    const pages: CountrySeoPage[] = [
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
    ];
    for (const page of pages) {
      const article = countrySeoContent("US", page);
      const paragraphs = [
        ...article.intro,
        ...article.sections.flatMap((section) => [...section.paragraphs, ...(section.paragraphsAfter ?? [])]),
        ...article.closing.paragraphs,
      ];
      const blocked = new Set(countrySeoHrefs(article).map(normalizeInternalPath));
      const matches = planInlineLinksAcross(paragraphs, seoArticleInlineLinks[page] ?? [], { blockedHrefs: blocked });
      assertBudget(`seo:${page}`, matches, MIN_INLINE_LINKS);
    }
  });

  it("keeps country, category, and location copy within three to five contextual links", () => {
    const countries: CountryFlowerDeliverySlug[] = ["usa", "uk", "canada", "australia", "uae"];
    for (const country of countries) {
      const page = getCountryFlowerDelivery(country);
      const blocked = new Set(
        [
          ...page.categories,
          ...cityMenuForCountry(flowerDeliveryCountryIso(country)).links.map((city) => ({ href: cityNavHref(city) })),
          page.primaryCta,
          page.secondaryCta,
          ...page.relatedHubs,
        ].map((link) => normalizeInternalPath(link.href))
      );
      const matches = planInlineLinksAcross(
        [page.intro, page.howItWorks, page.categoriesIntro, page.citiesIntro, ...page.occasions.map((item) => item.text)],
        countryPageInlineLinks[country] ?? [],
        { blockedHrefs: blocked, currentPath: page.href }
      );
      assertBudget(`country:${country}`, matches, MIN_INLINE_LINKS);
    }

    for (const [slug, content] of Object.entries(categoryRichContent)) {
      const matches = planInlineLinksAcross(
        [
          ...content.intro,
          ...content.delivery.paragraphs,
          ...content.highlights.items,
          ...(content.tradition?.paragraphs ?? []),
        ],
        categoryPageInlineLinks[slug] ?? [],
        { currentPath: `/${slug === "flower-bouquets" ? "bouquets" : slug}` }
      );
      assertBudget(`category:${slug}`, matches, MIN_INLINE_LINKS);
    }

    const thinGeo: string[] = [];
    for (const geo of publishedGeoLocations()) {
      const matches = planInlineLinksAcross([geo.introParagraph], cityPageInlineLinks, {
        currentPath: locationPublicPath(geo.slug),
      });
      if (matches.length < MIN_INLINE_LINKS || matches.length > MAX_INLINE_LINKS) {
        thinGeo.push(`${geo.slug}:${matches.length}`);
      }
    }
    assert.deepEqual(thinGeo, []);
  });

  it("caps product explore-more links at five live destinations", () => {
    for (const slug of ["flowers", "cakes", "gift-hampers", "anniversary-gifts", "mothers-day-gifts", undefined]) {
      const links = exploreMoreLinksForProduct("sample-roses", slug, "birthday");
      assert.ok(links.length >= MIN_INLINE_LINKS && links.length <= MAX_INLINE_LINKS, `${slug ?? "default"} explore more has ${links.length}`);
      assert.equal(new Set(links.map((link) => link.href)).size, links.length);
      assert.equal(new Set(links.map((link) => link.label.toLowerCase())).size, links.length);
      for (const link of links) {
        assert.equal(isLiveInternalPath(link.href), true, link.href);
      }
    }
  });
});
