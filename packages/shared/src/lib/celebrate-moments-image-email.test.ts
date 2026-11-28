import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { renderSesTemplate } from "../schemas/ses-email";
import { buildCelebrateMomentsEmailHtml } from "./celebrate-moments-email";
import { emailDisplayHeight } from "./email-images";
import {
  CELEBRATE_MOMENTS_IMAGE_HREF,
  CELEBRATE_MOMENTS_IMAGE_INTRINSIC,
  CELEBRATE_MOMENTS_IMAGE_PATH,
  CELEBRATE_MOMENTS_IMAGE_VERSION,
  buildCelebrateMomentsImageEmailHtml,
  celebrateMomentsImageUrl,
  resolveCelebrateMomentsImageOrigin,
} from "./celebrate-moments-image-email";

const IMAGE_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../apps/web/public/email-templates/celebrate-lifes-special-moments.jpg"
);

const ORIGINAL_SHA256 = "d7ad491ebf8663625a63ec3ef9f6b392edec9f6da6367a4414752d203f9dbac7";

function jpegSize(buf: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1] ?? 0;
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    const length = buf.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  throw new Error("JPEG size marker not found");
}

describe("celebrate moments image email", () => {
  it("keeps the uploaded JPEG byte for byte", () => {
    const file = readFileSync(IMAGE_FILE);
    assert.equal(file.subarray(0, 3).toString("hex"), "ffd8ff");
    assert.equal(file.length, 257599);
    assert.equal(createHash("sha256").update(file).digest("hex"), ORIGINAL_SHA256);
    assert.deepEqual(jpegSize(file), {
      width: CELEBRATE_MOMENTS_IMAGE_INTRINSIC.width,
      height: CELEBRATE_MOMENTS_IMAGE_INTRINSIC.height,
    });
  });

  it("loads the image from the environment that is serving it", () => {
    const cases = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://dev.dsjdlmcsa1pdc.amplifyapp.com",
      "https://www.blossompot.com",
    ];
    for (const origin of cases) {
      const html = buildCelebrateMomentsImageEmailHtml(origin);
      const src = `${origin}${CELEBRATE_MOMENTS_IMAGE_PATH}?v=${CELEBRATE_MOMENTS_IMAGE_VERSION}`;
      assert.equal(celebrateMomentsImageUrl(origin), src);
      assert.match(html, new RegExp(`src="${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
      if (origin !== "https://www.blossompot.com") {
        assert.equal(html.includes("https://www.blossompot.com/email-templates/"), false);
      }
    }
  });

  it("prefers the open site over a configured production URL", () => {
    assert.equal(
      resolveCelebrateMomentsImageOrigin({
        windowOrigin: "http://localhost:3001",
        siteUrl: "https://www.blossompot.com",
      }),
      "http://localhost:3001"
    );
    assert.equal(
      resolveCelebrateMomentsImageOrigin({
        windowOrigin: "https://dev.dsjdlmcsa1pdc.amplifyapp.com/admin/email",
        siteUrl: "https://www.blossompot.com",
      }),
      "https://dev.dsjdlmcsa1pdc.amplifyapp.com"
    );
    assert.equal(
      resolveCelebrateMomentsImageOrigin({ siteUrl: "https://www.blossompot.com/" }),
      "https://www.blossompot.com"
    );
    assert.equal(resolveCelebrateMomentsImageOrigin({ siteUrl: "javascript:alert(1)" }), "http://localhost:3000");
    assert.equal(resolveCelebrateMomentsImageOrigin(), "http://localhost:3000");
  });

  it("wraps the whole image in one homepage link and leaves the shop-button template alone", () => {
    const html = buildCelebrateMomentsImageEmailHtml("http://localhost:3001");
    const anchors = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => match[0]);
    assert.equal(anchors.length, 1);
    assert.match(anchors[0] ?? "", new RegExp(`href="${CELEBRATE_MOMENTS_IMAGE_HREF}"`));
    assert.match(anchors[0] ?? "", /target="_blank"/);
    assert.match(anchors[0] ?? "", /rel="noopener noreferrer"/);
    assert.match(anchors[0] ?? "", /<img\b/);
    assert.equal([...(html.matchAll(/<img\b/gi))].length, 1);
    assert.match(html, /width="600"/);
    assert.match(
      html,
      new RegExp(
        `height="${emailDisplayHeight(
          {
            url: "http://localhost:3001/email-templates/celebrate-lifes-special-moments.jpg",
            intrinsicWidth: 959,
            intrinsicHeight: 1024,
          },
          600
        )}"`
      )
    );
    assert.match(html, /width:100%;max-width:600px;height:auto/);
    assert.match(html, new RegExp(`\\?v=${CELEBRATE_MOMENTS_IMAGE_VERSION}`));
    assert.match(html, /\{\{unsubscribe\}\}/);
    assert.equal(html.includes("data-shop-slot"), false);
    assert.equal(html.includes("base64,"), false);
    assert.doesNotMatch(html, /\.webp/i);

    const rendered = renderSesTemplate(html, { email: "avery@example.com", name: "Avery" });
    assert.match(rendered, new RegExp(`href="${CELEBRATE_MOMENTS_IMAGE_HREF}"`));
    assert.equal(rendered.includes("/birthday-gifts"), false);

    const existing = buildCelebrateMomentsEmailHtml();
    assert.match(existing, /Shop Birthday/);
    assert.match(existing, /data-shop-slot="1"/);
    assert.equal(existing.includes(CELEBRATE_MOMENTS_IMAGE_PATH), false);
  });
});
