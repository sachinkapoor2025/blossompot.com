import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { canonical } from "../seo";
import { countrySeoContent } from "./country-seo-registry";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "../../app/combos/page.tsx");

describe("combos SEO article", () => {
  const article = countrySeoContent("US", "combos");

  it("uses the approved metadata and one page heading", () => {
    assert.equal(article.title, "Combo Gifts to USA | Flower, Cake & Gift Combos | BlossomPot");
    assert.equal(
      article.description,
      "Shop gift combos for delivery in the USA. Pair beautiful flower bouquets with cakes, treats and curated gifts to make every celebration special."
    );
    assert.equal(article.heading, "Combo Gifts Delivered to the USA — Make Every Gift More Special");
    assert.equal(canonical("/combos").endsWith("/combos"), true);
  });

  it("keeps the approved sections, steps, six FAQs, and closing copy", () => {
    assert.deepEqual(
      article.sections.map((section) => section.heading),
      [
        "Gift Combos for Every Celebration",
        "Choose a Combo That Matches the Moment",
        "Combo Gift Delivery Across the USA",
        "Why Choose BlossomPot Gift Combos?",
      ]
    );
    assert.deepEqual(
      article.sections[0]?.items?.map((item) => item.title),
      ["Flowers and Cake Combos", "Flowers and Treats", "Cake and Gift Combos", "Thoughtful Gift Pairings"]
    );
    assert.equal(article.stepsHeading, "How to Order a Gift Combo Online");
    assert.deepEqual(
      article.steps.map((step) => step.text),
      [
        "Browse the available combos on this page.",
        "Choose a combination that suits your occasion and budget.",
        "Add the combo to your cart and review its items.",
        "Enter the recipient's address and check the available delivery options.",
        "Review your order and complete checkout.",
      ]
    );
    assert.equal(article.faqHeading, "Frequently Asked Questions About Gift Combos");
    assert.equal(article.faqBeforeClosing, true);
    assert.equal(article.faqs.length, 6);
    assert.equal(article.faqs[0]?.q, "What is included in a BlossomPot gift combo?");
    assert.equal(article.closing.heading, "Make Their Day Extra Special with BlossomPot");
    assert.equal(article.callsToAction.length, 0);
    assert.equal(JSON.stringify(article).includes("same-day"), false);
    assert.equal(JSON.stringify(article).includes("$75"), false);
  });

  it("renders the article after the combo grid and keeps a single page H1", () => {
    const page = readFileSync(pagePath, "utf8");
    const grid = page.indexOf("combos.map");
    const empty = page.indexOf("No combos are currently available");
    const article = page.indexOf("<CountrySeoArticle");
    assert.ok(grid > 0);
    assert.ok(empty > grid);
    assert.ok(article > empty);
    assert.equal(page.includes("<h1"), false);
    assert.equal(page.includes('countrySeoContent("US", "combos")'), true);
    assert.equal(page.includes("combosArticle.title"), true);
    assert.equal(page.includes("absoluteTitle: true"), true);
  });
});
