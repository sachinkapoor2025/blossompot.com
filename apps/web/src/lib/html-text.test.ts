import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainDescriptionBlocks, sanitizeProductHtml } from "./html-text";

describe("plainDescriptionBlocks", () => {
  it("keeps abbreviations in one paragraph", () => {
    const blocks = plainDescriptionBlocks("Ships across the U.S. and arrives in St. Louis by Friday.");
    assert.deepEqual(blocks, ["Ships across the U.S. and arrives in St. Louis by Friday."]);
  });

  it("preserves blank-line paragraphs and single line breaks", () => {
    const blocks = plainDescriptionBlocks("First paragraph.\n\nIncludes:\n- Roses\n- Cake");
    assert.deepEqual(blocks, ["First paragraph.", "Includes:\n- Roses\n- Cake"]);
  });

  it("returns nothing for blank text", () => {
    assert.deepEqual(plainDescriptionBlocks("  \n\n  "), []);
  });
});

describe("sanitizeProductHtml", () => {
  it("keeps headings, paragraphs, lists, links, tables, and safe images", () => {
    const html = [
      "<h2>What's included</h2>",
      "<p>Ships across the U.S. with <strong>care</strong>.</p>",
      "<ul><li>Roses</li><li>Cake</li></ul>",
      '<p>See <a href="https://blossompot.com/flowers">flowers</a> or <a href="/cakes">cakes</a>.</p>',
      "<table><tr><th scope=\"col\">Item</th><td>Roses</td></tr></table>",
      '<img src="https://cdn.example.com/rose.jpg" alt="Rose">',
    ].join("");
    const clean = sanitizeProductHtml(html);
    assert.match(clean, /<h2>What's included<\/h2>/);
    assert.match(clean, /<p>Ships across the U\.S\. with <strong>care<\/strong>\.<\/p>/);
    assert.match(clean, /<ul><li>Roses<\/li><li>Cake<\/li><\/ul>/);
    assert.match(clean, /href="https:\/\/blossompot\.com\/flowers"/);
    assert.match(clean, /href="\/cakes"/);
    assert.match(clean, /<table><tr><th scope="col">Item<\/th><td>Roses<\/td><\/tr><\/table>/);
    assert.match(clean, /src="https:\/\/cdn\.example\.com\/rose\.jpg"/);
    assert.match(clean, /alt="Rose"/);
  });

  it("removes scripts, event handlers, unsafe URLs, and inline font styles", () => {
    const html = [
      "<p style=\"font-family: Arial; font-size: 28px\" class=\"vendor\">Hello</p>",
      "<script>alert(1)</script>",
      '<img src="https://cdn.example.com/a.jpg" onerror="alert(1)">',
      '<a href="javascript:alert(1)">click</a>',
      '<a href="data:text/html,hi">data</a>',
      "<iframe src=\"https://evil.example\">hidden</iframe>",
    ].join("");
    const clean = sanitizeProductHtml(html);
    assert.equal(clean.includes("script"), false);
    assert.equal(clean.includes("onerror"), false);
    assert.equal(clean.includes("javascript:"), false);
    assert.equal(clean.includes("data:"), false);
    assert.equal(clean.includes("iframe"), false);
    assert.equal(clean.includes("font-family"), false);
    assert.equal(clean.includes("class="), false);
    assert.match(clean, /<p>Hello<\/p>/);
    assert.match(clean, /src="https:\/\/cdn\.example\.com\/a\.jpg"/);
    assert.match(clean, /click/);
    assert.match(clean, /data/);
    assert.equal(clean.includes("<a"), false);
    assert.equal(clean.includes("hidden"), false);
  });

  it("preserves existing entities", () => {
    assert.equal(sanitizeProductHtml("<p>Fish &amp; chips</p>"), "<p>Fish &amp; chips</p>");
  });

  it("unwraps font tags and closes broken markup without dropping the text", () => {
    const clean = sanitizeProductHtml('<font face="Arial"><p>Keep me');
    assert.match(clean, /<p>Keep me<\/p>/);
    assert.equal(clean.includes("<font"), false);
    assert.equal(clean.includes("Arial"), false);
  });
});
