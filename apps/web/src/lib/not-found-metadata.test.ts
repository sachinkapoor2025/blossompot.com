import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { notFoundMetadata } from "./not-found-metadata";
import { pageMetadata } from "./seo";

describe("not-found metadata", () => {
  it("keeps the 404 noindex and does not use the homepage canonical", () => {
    assert.equal(notFoundMetadata.alternates?.canonical, null);
    assert.deepEqual(notFoundMetadata.robots, {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
    assert.equal(notFoundMetadata.openGraph && "url" in notFoundMetadata.openGraph, false);
  });

  it("still gives the homepage its own canonical", () => {
    const home = pageMetadata({
      title: "Home",
      description: "Home",
      path: "/",
      absoluteTitle: true,
    });
    assert.match(String(home.alternates?.canonical), /\/$/);
    assert.notEqual(home.alternates?.canonical, null);
  });
});
