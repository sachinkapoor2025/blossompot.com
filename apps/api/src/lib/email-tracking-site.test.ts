import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CELEBRATE_MOMENTS_IMAGE_HREF,
  CELEBRATE_MOMENTS_IMAGE_VERSION,
  buildCelebrateMomentsImageEmailHtml,
} from "@blossompot/shared";
import {
  DEVELOPMENT_TRACKING_SITE,
  LOCAL_TRACKING_SITE,
  PRODUCTION_TRACKING_SITE,
  applyEmailTracking,
  emailTrackingUrl,
  resolveEmailTrackingSiteUrl,
} from "./email-tracking-site";

function sentHtml(environment: string, imageOrigin: string, configuredSite?: string): string {
  const site = resolveEmailTrackingSiteUrl({
    ENVIRONMENT: environment,
    SITE_URL: configuredSite,
    EMAIL_TRACKING_SITE_URL: configuredSite,
  });
  const linkMap = new Map<string, string>();
  let html = buildCelebrateMomentsImageEmailHtml(imageOrigin);
  html = applyEmailTracking(html, {
    siteUrl: site,
    openToken: "open-token",
    linkMap,
    newClickToken: () => "click-token",
  });
  html = html.replace(
    /\{\{\s*unsubscribe\s*\}\}/gi,
    `<a href="${emailTrackingUrl(site, "unsubscribe", "unsub-token")}" target="_blank">Unsubscribe</a>`
  );
  assert.equal(linkMap.get("click-token"), CELEBRATE_MOMENTS_IMAGE_HREF);
  return html;
}

describe("email tracking site", () => {
  it("keeps each environment on its own tracking host", () => {
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "local",
        SITE_URL: "https://www.blossompot.com",
      }),
      LOCAL_TRACKING_SITE
    );
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "local",
        SITE_URL: "http://localhost:3000/",
      }),
      "http://localhost:3000"
    );
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "dev",
        SITE_URL: "https://www.blossompot.com",
      }),
      DEVELOPMENT_TRACKING_SITE
    );
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "dev",
        EMAIL_TRACKING_SITE_URL: DEVELOPMENT_TRACKING_SITE,
        SITE_URL: "https://www.blossompot.com",
      }),
      DEVELOPMENT_TRACKING_SITE
    );
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "prod",
        SITE_URL: "https://www.blossompot.com/",
      }),
      PRODUCTION_TRACKING_SITE
    );
    assert.equal(
      resolveEmailTrackingSiteUrl({
        ENVIRONMENT: "prod",
        EMAIL_TRACKING_SITE_URL: DEVELOPMENT_TRACKING_SITE,
      }),
      PRODUCTION_TRACKING_SITE
    );
  });

  it("versions the image and tracks on the local site", () => {
    const html = sentHtml("local", LOCAL_TRACKING_SITE, "https://www.blossompot.com");
    const image = `${LOCAL_TRACKING_SITE}/email-templates/celebrate-lifes-special-moments.jpg?v=${CELEBRATE_MOMENTS_IMAGE_VERSION}`;
    assert.match(html, new RegExp(`<a href="${LOCAL_TRACKING_SITE}/email/click/click-token"[^>]*>[\\s\\S]*src="${image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, /width="600"/);
    assert.match(html, /width:100%;max-width:600px;height:auto/);
    assert.match(html, new RegExp(`src="${LOCAL_TRACKING_SITE}/email/open/open-token"`));
    assert.match(html, new RegExp(`href="${LOCAL_TRACKING_SITE}/email/unsubscribe/unsub-token"`));
    assert.equal(html.includes(DEVELOPMENT_TRACKING_SITE), false);
    assert.equal(html.includes(`${PRODUCTION_TRACKING_SITE}/email/`), false);
  });

  it("versions the image and tracks on the development site", () => {
    const html = sentHtml("dev", DEVELOPMENT_TRACKING_SITE, "https://www.blossompot.com");
    const image = `${DEVELOPMENT_TRACKING_SITE}/email-templates/celebrate-lifes-special-moments.jpg?v=${CELEBRATE_MOMENTS_IMAGE_VERSION}`;
    assert.equal(CELEBRATE_MOMENTS_IMAGE_VERSION, "2");
    assert.match(html, new RegExp(`src="${image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, new RegExp(`<a href="${DEVELOPMENT_TRACKING_SITE}/email/click/click-token"[^>]*>[\\s\\S]*<img\\b`));
    assert.match(html, new RegExp(`src="${DEVELOPMENT_TRACKING_SITE}/email/open/open-token"`));
    assert.match(html, new RegExp(`href="${DEVELOPMENT_TRACKING_SITE}/email/unsubscribe/unsub-token"`));
    assert.match(html, />Unsubscribe<\/a>/);
    assert.equal(html.includes("localhost"), false);
    assert.equal(html.includes(`${PRODUCTION_TRACKING_SITE}/email/`), false);
    assert.equal(html.includes(PRODUCTION_TRACKING_SITE), false);
  });

  it("keeps production tracking on the production site", () => {
    const html = sentHtml("prod", PRODUCTION_TRACKING_SITE, PRODUCTION_TRACKING_SITE);
    assert.match(
      html,
      /src="https:\/\/www\.blossompot\.com\/email-templates\/celebrate-lifes-special-moments\.jpg\?v=2"/
    );
    assert.match(html, /src="https:\/\/www\.blossompot\.com\/email\/open\/open-token"/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/email\/click\/click-token"/);
    assert.match(html, /href="https:\/\/www\.blossompot\.com\/email\/unsubscribe\/unsub-token"/);
    assert.equal(html.includes("localhost"), false);
    assert.equal(html.includes("amplifyapp.com"), false);
  });

  it("still skips social links and leaves image sources alone", () => {
    const linkMap = new Map<string, string>();
    const html = applyEmailTracking(
      `<a href="https://facebook.com/blossompot">Facebook</a><img src="https://cdn.example/a.jpg" />`,
      {
        siteUrl: DEVELOPMENT_TRACKING_SITE,
        openToken: "pixel",
        linkMap,
        newClickToken: () => "should-not-exist",
      }
    );
    assert.match(html, /href="https:\/\/facebook\.com\/blossompot"/);
    assert.match(html, /src="https:\/\/cdn\.example\/a\.jpg"/);
    assert.equal(linkMap.size, 0);
    assert.match(html, new RegExp(`src="${DEVELOPMENT_TRACKING_SITE}/email/open/pixel"`));
  });
});
