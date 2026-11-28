/**
 * Campaign email that shows the Celebrate Life's Special Moments artwork unchanged.
 * The JPEG is served from the same site that generated the HTML (local, development,
 * or production). The click always opens the public homepage.
 */

import { emailDisplayHeight, type EmailImageAsset } from "./email-images";

export const CELEBRATE_MOMENTS_IMAGE_TEMPLATE_ID = "celebrate-moments-image";
export const CELEBRATE_MOMENTS_IMAGE_EMAIL_NAME = "Celebrate Life's Special Moments (Image)";
export const CELEBRATE_MOMENTS_IMAGE_EMAIL_SUBJECT = "Celebrate Life's Special Moments — BlossomPot";

/** Public file shipped with the Next.js app. Not a CDN or base64 payload. */
export const CELEBRATE_MOMENTS_IMAGE_PATH = "/email-templates/celebrate-lifes-special-moments.jpg";

/**
 * Cache-buster for Gmail's image proxy. The JPEG bytes stay the same.
 * Increase this when a new file is published at the same path.
 */
export const CELEBRATE_MOMENTS_IMAGE_VERSION = "2";

/** Measured from the original JPEG. Do not crop or recompress that file. */
export const CELEBRATE_MOMENTS_IMAGE_INTRINSIC = { width: 959, height: 1024 } as const;

export const CELEBRATE_MOMENTS_IMAGE_HREF = "https://www.blossompot.com/";

const DISPLAY_WIDTH = 600;
const LOCAL_ASSET_ORIGIN = "http://localhost:3000";

function httpOrigin(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Host that is actually serving the email image.
 * The browser origin wins, so a local or development preview does not point at
 * production before that file has been deployed there.
 */
export function resolveCelebrateMomentsImageOrigin(input?: {
  windowOrigin?: string | null;
  siteUrl?: string | null;
}): string {
  return httpOrigin(input?.windowOrigin) ?? httpOrigin(input?.siteUrl) ?? LOCAL_ASSET_ORIGIN;
}

export function celebrateMomentsImageUrl(assetOrigin: string): string {
  const origin = httpOrigin(assetOrigin);
  if (!origin) {
    throw new Error("Celebrate Moments image email requires an http(s) asset origin");
  }
  const version = CELEBRATE_MOMENTS_IMAGE_VERSION.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(version)) {
    throw new Error("Celebrate Moments image version must be a simple token");
  }
  return `${origin}${CELEBRATE_MOMENTS_IMAGE_PATH}?v=${version}`;
}

export function buildCelebrateMomentsImageEmailHtml(assetOrigin: string): string {
  const imageUrl = celebrateMomentsImageUrl(assetOrigin);
  const image: EmailImageAsset = {
    url: imageUrl,
    intrinsicWidth: CELEBRATE_MOMENTS_IMAGE_INTRINSIC.width,
    intrinsicHeight: CELEBRATE_MOMENTS_IMAGE_INTRINSIC.height,
  };
  const displayHeight = emailDisplayHeight(image, DISPLAY_WIDTH);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Celebrate Life's Special Moments | BlossomPot</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Celebrate life's special moments with flowers, cakes, and gifts from BlossomPot.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${DISPLAY_WIDTH}" style="border-collapse:collapse;width:100%;max-width:${DISPLAY_WIDTH}px;">
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;">
              <a href="${CELEBRATE_MOMENTS_IMAGE_HREF}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:0;">
                <img src="${imageUrl}" width="${DISPLAY_WIDTH}" height="${displayHeight}" alt="Celebrate Life's Special Moments. Happy Birthday and Happy Anniversary from BlossomPot." border="0" style="display:block;width:100%;max-width:${DISPLAY_WIDTH}px;height:auto;border:0;outline:none;text-decoration:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:14px 16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a7080;">
              {{unsubscribe}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
