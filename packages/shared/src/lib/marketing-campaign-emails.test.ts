import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ANNIVERSARY_EMAIL_CONFIG,
  BIRTHDAY_EMAIL_CONFIG,
  buildAnniversaryEmailHtml,
  buildBirthdayEmailHtml,
} from "./marketing-campaign-emails";

const PUBLIC_ANNIVERSARY_HTML = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../apps/web/public/email-templates/anniversary-gifts.html"
);
const PUBLIC_BIRTHDAY_HTML = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../apps/web/public/email-templates/birthday-gifts.html"
);

describe("anniversary marketing email", () => {
  it("includes subject-aligned headline, CTA, and anniversary collection links", () => {
    const html = buildAnniversaryEmailHtml();
    assert.equal(ANNIVERSARY_EMAIL_CONFIG.subject.length > 20, true);
    assert.match(html, /Celebrate Your Love Story/);
    assert.match(html, /Shop Anniversary Gifts/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/anniversary-gifts/);
    assert.match(html, /{{unsubscribe}}/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/logo\.png/);
    assert.match(html, /email-templates\/icons\/facebook\.png/);
    assert.match(html, /email-templates\/icons\/instagram\.png/);
    assert.match(html, /uploads\/editorial\/tile-anniversary\.jpg/);
    assert.match(html, /uploads\/editorial\/tile-bouquets\.jpg/);
    assert.match(html, /uploads\/editorial\/tile-cakes\.jpg/);
    assert.match(html, /uploads\/editorial\/tile-hampers\.jpg/);
    assert.doesNotMatch(html, /uploads\/catalog\//);
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /\+1 \(669\) 260-3819/);
    assert.equal(
      readFileSync(PUBLIC_ANNIVERSARY_HTML, "utf8").replace(/\r\n/g, "\n"),
      html
    );
  });
});

describe("birthday marketing email", () => {
  it("includes subject-aligned headline, CTA, and birthday collection links", () => {
    const html = buildBirthdayEmailHtml();
    assert.equal(BIRTHDAY_EMAIL_CONFIG.subject.length > 20, true);
    assert.match(html, /Make Their Birthday Bloom/);
    assert.match(html, /Shop Birthday Gifts/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/birthday-gifts/);
    assert.match(html, /{{unsubscribe}}/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/logo\.png/);
    assert.match(html, /banners\/home-banner-birthday\.jpg/);
    assert.match(html, /email-templates\/icons\/facebook\.png/);
    assert.match(html, /email-templates\/icons\/instagram\.png/);
    assert.doesNotMatch(html, /uploads\/catalog\//);
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /\+1 \(669\) 260-3819/);
    assert.equal(readFileSync(PUBLIC_BIRTHDAY_HTML, "utf8").replace(/\r\n/g, "\n"), html);
  });
});
