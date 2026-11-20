import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildCollection2026EmailHtml } from "./collection-2026-email";
import { EMAIL_IMAGE_ALLOWLIST } from "./email-images";
import { buildGiftingMarketingEmailHtml } from "./gifting-marketing-email";
import {
  buildAnniversaryEmailHtml,
  buildBirthdayEmailHtml,
  buildFreeShippingEmailHtml,
  buildShopMoreSaveMoreEmailHtml,
} from "./marketing-campaign-emails";
import {
  DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT,
  buildPremiumMarketingEmailHtml,
} from "./marketing-email-html";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../../apps/web/public/email-templates");

function assertInstalledEmail(html: string, links: RegExp[]) {
  assert.doesNotMatch(html, /uploads\/catalog\//);
  assert.doesNotMatch(html, /placehold\.co|via\.placeholder|placeholder\.com|dummyimage\.com/i);
  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  assert.ok(images.length > 0);
  for (const [tag] of images) {
    const src = /(?:^|\s)src="([^"]+)"/.exec(tag)?.[1];
    const alt = /(?:^|\s)alt="([^"]*)"/.exec(tag)?.[1];
    const width = /(?:^|\s)width="(\d+)"/.exec(tag)?.[1];
    const height = /(?:^|\s)height="(\d+)"/.exec(tag)?.[1];
    assert.ok(src, tag);
    assert.equal(src.startsWith("https://"), true, src);
    assert.equal(EMAIL_IMAGE_ALLOWLIST.includes(src), true, src);
    assert.ok(alt && alt.trim().length > 1, tag);
    assert.ok(width && Number(width) > 0, tag);
    assert.ok(height && Number(height) > 0, tag);
    assert.equal(src.includes("/email/click/"), false, src);
  }
  assert.match(html, /\{\{unsubscribe\}\}/);
  for (const link of links) assert.match(html, link);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1] ?? "";
    if (href === "{{unsubscribe}}" || href.startsWith("mailto:")) continue;
    assert.equal(href.startsWith("https://"), true, href);
  }
}

describe("installed marketing email images", () => {
  it("keeps anniversary images on the verified allowlist", () => {
    const html = buildAnniversaryEmailHtml();
    assertInstalledEmail(html, [/https:\/\/www\.blossompot\.com\/anniversary-gifts/]);
    assert.equal(readFileSync(join(PUBLIC_DIR, "anniversary-gifts.html"), "utf8").replace(/\r\n/g, "\n"), html);
  });

  it("keeps birthday images on the verified allowlist and matches the public copy", () => {
    const html = buildBirthdayEmailHtml();
    assertInstalledEmail(html, [
      /https:\/\/www\.blossompot\.com\/birthday-gifts/,
      /https:\/\/www\.blossompot\.com\/cakes/,
      /https:\/\/www\.blossompot\.com\/flowers/,
      /https:\/\/www\.blossompot\.com\/gift-hampers/,
    ]);
    assert.equal(readFileSync(join(PUBLIC_DIR, "birthday-gifts.html"), "utf8").replace(/\r\n/g, "\n"), html);
  });

  it("keeps free-shipping images on the verified allowlist", () => {
    assertInstalledEmail(buildFreeShippingEmailHtml(), [
      /https:\/\/www\.blossompot\.com\/products/,
      /https:\/\/www\.blossompot\.com\/flowers/,
      /https:\/\/www\.blossompot\.com\/cakes/,
      /https:\/\/www\.blossompot\.com\/gift-hampers/,
    ]);
  });

  it("keeps shop-more images on the verified allowlist", () => {
    const html = buildShopMoreSaveMoreEmailHtml();
    assertInstalledEmail(html, [
      /https:\/\/blossompot\.com/,
      /https:\/\/www\.blossompot\.com\/products\/blue-sapphire-pearl-single-rakhi/,
      /https:\/\/www\.blossompot\.com\/products\/pearl-single-rakhi/,
      /https:\/\/www\.blossompot\.com\/products\/bhai-bhabhi-lumba-rakhi-set/,
      /https:\/\/www\.blossompot\.com\/products\/bro-kids-rakhi-for-little-brother/,
      /https:\/\/www\.blossompot\.com\/products\/designer-peach-lumba-rakhi-for-bhabhi/,
      /https:\/\/www\.blossompot\.com\/products\/festive-om-shree-rakhi-chocolate-gift-set/,
    ]);
  });

  it("keeps premium gifts images on the verified allowlist", () => {
    assertInstalledEmail(buildPremiumMarketingEmailHtml(DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT), [
      /https:\/\/www\.blossompot\.com\/products/,
      /https:\/\/www\.blossompot\.com\/flowers/,
      /https:\/\/www\.blossompot\.com\/cakes/,
      /https:\/\/www\.blossompot\.com\/gift-hampers/,
    ]);
  });

  it("keeps the gifting promo images on the verified allowlist", () => {
    assertInstalledEmail(buildGiftingMarketingEmailHtml(), [
      /https:\/\/www\.blossompot\.com\/flowers/,
      /https:\/\/www\.blossompot\.com\/cakes/,
      /https:\/\/www\.blossompot\.com\/gift-hampers/,
      /https:\/\/www\.blossompot\.com\/products\/classic-red-rose-bouquet/,
    ]);
  });

  it("keeps the 2026 collection images on the verified allowlist", () => {
    assertInstalledEmail(buildCollection2026EmailHtml(), [
      /https:\/\/www\.blossompot\.com\/products/,
      /https:\/\/www\.blossompot\.com\/flowers/,
      /https:\/\/www\.blossompot\.com\/cakes/,
      /https:\/\/www\.blossompot\.com\/gift-hampers/,
    ]);
  });
});
