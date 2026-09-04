import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANNIVERSARY_EMAIL_CONFIG,
  BIRTHDAY_EMAIL_CONFIG,
  buildAnniversaryEmailHtml,
  buildBirthdayEmailHtml,
} from "./marketing-campaign-emails";

describe("anniversary marketing email", () => {
  it("includes subject-aligned headline, CTA, and anniversary collection links", () => {
    const html = buildAnniversaryEmailHtml();
    assert.equal(ANNIVERSARY_EMAIL_CONFIG.subject.length > 20, true);
    assert.match(html, /Celebrate Your Love Story/);
    assert.match(html, /Shop Anniversary Gifts/);
    assert.match(html, /https:\/\/www\.blossompot\.com\/anniversary-gifts/);
    assert.match(html, /{{unsubscribe}}/);
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /\+1 \(669\) 260-3819/);
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
    assert.doesNotMatch(html, /16692603819/);
    assert.doesNotMatch(html, /\+1 \(669\) 260-3819/);
  });
});
