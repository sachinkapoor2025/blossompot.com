import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { categoryCountFromList, loadHomepageCategoryCount } from "./homepage-category-count";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("homepage category count", () => {
  it("counts /categories and does not request the uncategorized products list", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonResponse({
        categories: [{ slug: "flowers" }, { slug: "cakes" }, { slug: "gift-hampers" }],
      });
    }) as typeof fetch;

    assert.equal(await loadHomepageCategoryCount(), 3);
    assert.equal(urls.length, 1);
    assert.match(urls[0] ?? "", /\/categories$/);
    assert.equal(
      urls.some((url) => url.includes("/products") || url.includes("/homepage-catalog")),
      false
    );
  });

  it("returns null for an empty list and does not request products", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonResponse({ categories: [] });
    }) as typeof fetch;

    assert.equal(await loadHomepageCategoryCount(), null);
    assert.equal(categoryCountFromList([]), null);
    assert.equal(categoryCountFromList(undefined), null);
    assert.equal(urls.some((url) => url.includes("/products")), false);
  });

  it("does not request products when the categories request fails", async () => {
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonResponse({ error: "unavailable" }, 400);
    }) as typeof fetch;

    await assert.rejects(() => loadHomepageCategoryCount());
    assert.equal(urls.some((url) => url.includes("/products")), false);
  });
});
