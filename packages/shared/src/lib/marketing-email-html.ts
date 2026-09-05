/**
 * Premium marketing email HTML builder (table + inline CSS for Gmail/Outlook).
 * Content is driven by MarketingEmailContent — edit fields in Admin, not the HTML.
 */

import { cdnUploadUrl } from "./image-url";

export type MarketingEmailCategory = {
  name: string;
  description: string;
  imageUrl: string;
  href: string;
  buttonText: string;
};

export type MarketingEmailPromise = {
  icon: string;
  title: string;
  description: string;
};

export type MarketingEmailContent = {
  preheader: string;
  logoUrl: string;
  logoHref: string;
  logoAlt: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroImageHref: string;
  heroOverlayTitle: string;
  heroOverlaySubtitle: string;
  heroButtonText: string;
  heroButtonHref: string;
  heading: string;
  description: string;
  categoriesHeading: string;
  categoriesSubheading: string;
  categories: MarketingEmailCategory[];
  promiseHeading: string;
  promiseSubheading: string;
  promises: MarketingEmailPromise[];
  midCtaHeading: string;
  midCtaDescription: string;
  midCtaButtonText: string;
  midCtaButtonHref: string;
  footerTagline: string;
  websiteUrl: string;
  websiteLabel: string;
  orderEmail: string;
  facebookUrl: string;
  facebookIconUrl: string;
  instagramUrl: string;
  instagramIconUrl: string;
  copyrightText: string;
  unsubscribeLabel: string;
};

const SITE = "https://www.blossompot.com";
const CDN_FB = `${SITE}/email-templates/icons/facebook.png`;
const CDN_IG = `${SITE}/email-templates/icons/instagram.png`;

export const DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT: MarketingEmailContent = {
  preheader:
    "Send love across the USA with premium gifts — ships from California. Free shipping above $7.",
  logoUrl: `${SITE}/logo.png`,
  logoHref: SITE,
  logoAlt: "BlossomPot — Connecting Hearts Across Borders",
  heroImageUrl: `${SITE}/banners/banner-independence-day-2026.png`,
  heroImageAlt: "Send Flowers & Gifts Across Miles — BlossomPot USA delivery",
  heroImageHref: `${SITE}/products`,
  heroOverlayTitle: "BlossomPot Gifts",
  heroOverlaySubtitle: "Premium gifts · Ships From Within the USA",
  heroButtonText: "Shop Now",
  heroButtonHref: `${SITE}/products`,
  heading: "Send Flowers & Gifts Across Miles",
  description:
    "Distance fades when love arrives on time. Send premium flowers, cakes, and curated hampers to anyone across America — fulfilled from California with 5–7 day domestic delivery.",
  categoriesHeading: "Featured Categories",
  categoriesSubheading: "Choose the perfect gift for every occasion.",
  categories: [
    {
      name: "Flowers",
      description: "Fresh arrangements for birthdays and thank-yous.",
      imageUrl: cdnUploadUrl("2026/05/pink-multi-stone-rakhi-to-usa.jpeg"),
      href: `${SITE}/flowers`,
      buttonText: "Shop Now",
    },
    {
      name: "Bhaiya Bhabhi",
      description: "Matching sets for brother and bhabhi.",
      imageUrl: cdnUploadUrl("2026/05/anniversary-gifts-e1779468666580.jpeg"),
      href: `${SITE}/anniversary-gifts`,
      buttonText: "Shop Now",
    },
    {
      name: "Cakes",
      description: "Playful designs little brothers adore.",
      imageUrl: cdnUploadUrl("2026/04/BRO-Kids-gift-e1775564401163.jpg"),
      href: `${SITE}/cakes`,
      buttonText: "Shop Now",
    },
    {
      name: "Gift Hampers",
      description: "Curated hampers for celebrations.",
      imageUrl: cdnUploadUrl("2026/05/fercho.png"),
      href: `${SITE}/gift-hampers`,
      buttonText: "Shop Now",
    },
  ],
  promiseHeading: "Our Promise",
  promiseSubheading: "Why sisters worldwide trust BlossomPot for USA delivery.",
  promises: [
    { icon: "🇺🇸", title: "Ships From USA", description: "Domestic fulfillment — no customs delays." },
    { icon: "🎁", title: "Free Shipping Above $7", description: "Fast checkout savings on every order." },
    { icon: "🚚", title: "5–7 Day USA Delivery", description: "Reliable shipping to all 50 states." },
    { icon: "🔒", title: "Secure Stripe & Razorpay", description: "Pay safely in USD or INR." },
    { icon: "📍", title: "California Fulfillment", description: "Packed by our dedicated US team." },
    { icon: "💬", title: "WhatsApp Support", description: "Real humans before & after delivery." },
    { icon: "📦", title: "Order Tracking", description: "Know when your gift is on the way." },
    { icon: "✨", title: "Premium Quality", description: "Gift-ready packaging and careful packing." },
  ],
  midCtaHeading: "Shop BlossomPot Today",
  midCtaDescription: "Explore our flower and gift collection and send love across the USA.",
  midCtaButtonText: "Shop Collection",
  midCtaButtonHref: `${SITE}/products`,
  footerTagline: "Connecting Hearts Across Borders",
  websiteUrl: SITE,
  websiteLabel: "www.blossompot.com",
  orderEmail: "order@blossompot.com",
  facebookUrl: "https://www.facebook.com/profile.php?id=61594220485535",
  facebookIconUrl: CDN_FB,
  instagramUrl: "https://www.instagram.com/blossompot10/",
  instagramIconUrl: CDN_IG,
  copyrightText: "© 2026 BlossomPot. All Rights Reserved.",
  unsubscribeLabel: "Unsubscribe",
};

/** Layout id for structured (form-editable) premium templates. */
export const PREMIUM_MARKETING_EMAIL_LAYOUT = "premium-marketing" as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(value: string): string {
  return escapeHtml(value);
}

function ctaButton(href: string, label: string, opts?: { width?: number; fill?: string; pad?: string; fontSize?: string }) {
  const fill = opts?.fill ?? "#183a68";
  const width = opts?.width ?? 180;
  const pad = opts?.pad ?? "14px 28px";
  const fontSize = opts?.fontSize ?? "15px";
  const safeHref = escAttr(href);
  const safeLabel = escapeHtml(label);
  return `
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="17%" stroke="f" fillcolor="${fill}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Georgia, 'Times New Roman', serif;font-size:${fontSize};font-weight:bold;">${safeLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        <td align="center" bgcolor="${fill}" style="background-color:${fill};border-radius:8px;box-shadow:0 4px 12px rgba(24,58,104,0.22);">
                          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:${pad};font-family:Georgia,'Times New Roman',serif;font-size:${fontSize};line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                            ${safeLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->`;
}

function categoryCard(cat: MarketingEmailCategory): string {
  const href = escAttr(cat.href);
  const img = escAttr(cat.imageUrl);
  const name = escapeHtml(cat.name);
  const desc = escapeHtml(cat.description);
  const btn = escapeHtml(cat.buttonText);
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#ffffff;border:1px solid #efe6d6;border-radius:12px;overflow:hidden;">
                      <tr>
                        <td align="center" style="padding:0;line-height:0;font-size:0;background-color:#fffaf2;">
                          <a href="${href}" target="_blank" style="text-decoration:none;">
                            <img class="category-img fluid" src="${img}" width="130" alt="${name}" style="display:block;width:100%;max-width:130px;height:auto;border:0;margin:0 auto;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:12px 10px 16px 10px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:18px;font-weight:bold;color:#183a68;padding-bottom:6px;">${name}</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#6b5e4e;padding-bottom:12px;">${desc}</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" bgcolor="#c9a227" style="background-color:#c9a227;border-radius:6px;">
                                <a href="${href}" target="_blank" style="display:inline-block;padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;font-weight:bold;color:#183a68;text-decoration:none;border-radius:6px;">${btn}</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`;
}

function categoriesGrid(categories: MarketingEmailCategory[]): string {
  const cats = categories.slice(0, 4);
  while (cats.length < 4) {
    cats.push({
      name: "Shop All",
      description: "Browse the full BlossomPot collection.",
      imageUrl: `${SITE}/logo.png`,
      href: `${SITE}/products`,
      buttonText: "Shop Now",
    });
  }

  const cells = cats
    .map(
      (cat, i) => `
                  <td class="stack-col-25" width="25%" valign="top" style="width:25%;padding:${i % 4 === 0 ? "0 4px 12px 0" : i % 4 === 3 ? "0 0 12px 4px" : "0 4px 12px 4px"};">
                    ${categoryCard(cat)}
                  </td>`
    )
    .join("");

  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  ${cells}
                </tr>
              </table>`;
}

function promiseCard(item: MarketingEmailPromise): string {
  const icon = escapeHtml(item.icon);
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.description);
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#ffffff;border:1px solid #efe6d6;border-radius:12px;">
                      <tr>
                        <td align="center" style="padding:18px 12px;">
                          <div style="width:44px;height:44px;line-height:44px;border-radius:22px;background:linear-gradient(145deg,#fff8e7,#f5e6c0);border:1px solid #e8d5a3;font-size:20px;margin:0 auto 10px auto;">${icon}</div>
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:17px;font-weight:bold;color:#183a68;padding-bottom:4px;">${title}</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;color:#6b5e4e;">${desc}</div>
                        </td>
                      </tr>
                    </table>`;
}

function promisesGrid(promises: MarketingEmailPromise[]): string {
  const items = promises.slice(0, 8);
  const rows: string[] = [];
  for (let r = 0; r < items.length; r += 4) {
    const slice = items.slice(r, r + 4);
    const cells = slice
      .map((item, i) => {
        const globalI = r + i;
        const pad =
          globalI % 4 === 0
            ? "0 4px 10px 0"
            : globalI % 4 === 3
              ? "0 0 10px 4px"
              : "0 4px 10px 4px";
        return `
                  <td class="stack-col-25" width="25%" valign="top" style="width:25%;padding:${pad};">
                    ${promiseCard(item)}
                  </td>`;
      })
      .join("");
    // Pad incomplete rows for Outlook table layout
    const missing = 4 - slice.length;
    const fillers = Array.from({ length: missing }, () => `<td class="stack-col-25" width="25%" style="width:25%;"></td>`).join(
      ""
    );
    rows.push(`<tr>${cells}${fillers}</tr>`);
  }
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${rows.join("\n")}
              </table>`;
}

/** Build a full HTML email document from editable content fields. */
export function buildPremiumMarketingEmailHtml(content: MarketingEmailContent): string {
  const c = content;
  const title = escapeHtml(c.heading);
  const preheader = escapeHtml(c.preheader);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${title} | BlossomPot</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    table { border-collapse: collapse; }
    td, th, div, p, a, h1, h2, h3, span { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .stack-col-25 { display: inline-block !important; width: 50% !important; max-width: 50% !important; box-sizing: border-box !important; }
      .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .hero-heading { font-size: 26px !important; line-height: 34px !important; }
      .section-heading { font-size: 22px !important; line-height: 30px !important; }
      .category-img { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .hero-overlay-pad { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3eee6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f3eee6;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 10px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="border-collapse:collapse;width:600px;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(24,58,104,0.08);">

          <!-- Logo -->
          <tr>
            <td align="center" bgcolor="#fffdf8" style="padding:22px 24px 16px 24px;background-color:#fffdf8;">
              <a href="${escAttr(c.logoHref)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(c.logoUrl)}" width="168" alt="${escAttr(c.logoAlt)}" style="display:block;width:168px;max-width:70%;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>

          <!-- Navy + gold accent bar -->
          <tr>
            <td height="5" style="height:5px;line-height:5px;font-size:0;background-color:#183a68;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td width="70%" height="5" bgcolor="#183a68" style="background-color:#183a68;font-size:0;line-height:5px;">&nbsp;</td>
                  <td width="30%" height="5" bgcolor="#c9a227" style="background-color:#c9a227;font-size:0;line-height:5px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero banner + CTA -->
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;">
              <a href="${escAttr(c.heroImageHref)}" target="_blank" style="text-decoration:none;">
                <img class="fluid" src="${escAttr(c.heroImageUrl)}" width="600" alt="${escAttr(c.heroImageAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="hero-overlay-pad" align="center" bgcolor="#fff8ef" style="padding:28px 32px 32px 32px;background-color:#fff8ef;border-bottom:1px solid #efe6d6;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#c9a227;font-weight:bold;padding-bottom:8px;">
                ${escapeHtml(c.heroOverlayTitle)}
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:26px;color:#183a68;font-weight:bold;padding-bottom:18px;">
                ${escapeHtml(c.heroOverlaySubtitle)}
              </div>
              ${ctaButton(c.heroButtonHref, c.heroButtonText, { fill: "#e67e22", width: 168 })}
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td class="mobile-pad" style="padding:40px 36px 28px 36px;background-color:#ffffff;text-align:center;">
              <div class="hero-heading" style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:bold;color:#183a68;padding-bottom:14px;">
                ${escapeHtml(c.heading)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#5c5348;max-width:480px;margin:0 auto;">
                ${escapeHtml(c.description)}
              </div>
            </td>
          </tr>

          <!-- Featured Categories -->
          <tr>
            <td class="mobile-pad" style="padding:12px 24px 20px 24px;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" class="section-heading" style="padding:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;font-weight:bold;color:#183a68;">
                    ${escapeHtml(c.categoriesHeading)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#6b5e4e;">
                    ${escapeHtml(c.categoriesSubheading)}
                  </td>
                </tr>
              </table>
              ${categoriesGrid(c.categories)}
            </td>
          </tr>

          <!-- Our Promise -->
          <tr>
            <td class="mobile-pad" style="padding:28px 24px 16px 24px;background-color:#fffaf2;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" class="section-heading" style="padding:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;font-weight:bold;color:#183a68;">
                    ${escapeHtml(c.promiseHeading)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#6b5e4e;">
                    ${escapeHtml(c.promiseSubheading)}
                  </td>
                </tr>
              </table>
              ${promisesGrid(c.promises)}
            </td>
          </tr>

          <!-- Mid CTA -->
          <tr>
            <td class="mobile-pad" style="padding:28px 28px 40px 28px;background-color:#ffffff;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:linear-gradient(180deg,#183a68,#1f4a7a);background-color:#183a68;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:36px 24px;">
                    <div class="section-heading" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;font-weight:bold;color:#ffffff;padding-bottom:10px;">
                      ${escapeHtml(c.midCtaHeading)}
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#e8e0d0;padding-bottom:22px;">
                      ${escapeHtml(c.midCtaDescription)}
                    </div>
                    ${ctaButton(c.midCtaButtonHref, c.midCtaButtonText, { fill: "#c9a227", width: 200, pad: "14px 32px", fontSize: "16px" })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-pad" style="padding:32px 28px 36px 28px;background-color:#183a68;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:20px;color:#f0d78c;">
                    ${escapeHtml(c.footerTagline)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#d7dde8;">
                    Website:
                    <a href="${escAttr(c.websiteUrl)}" target="_blank" style="color:#f0d78c;text-decoration:underline;">${escapeHtml(c.websiteLabel)}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#d7dde8;">
                    Orders:
                    <a href="mailto:${escAttr(c.orderEmail)}" style="color:#f0d78c;text-decoration:underline;">${escapeHtml(c.orderEmail)}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:#9aa8c0;">
                    Follow us
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 18px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="padding:0 8px;">
                          <a href="${escAttr(c.facebookUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:0;">
                            <img src="${escAttr(c.facebookIconUrl)}" width="36" height="36" alt="Facebook" style="display:block;width:36px;height:36px;border:0;" />
                          </a>
                        </td>
                        <td align="center" valign="middle" style="padding:0 8px;">
                          <a href="${escAttr(c.instagramUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:0;">
                            <img src="${escAttr(c.instagramIconUrl)}" width="36" height="36" alt="Instagram" style="display:block;width:36px;height:36px;border:0;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9aa8c0;">
                    ${escapeHtml(c.copyrightText)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9aa8c0;">
                    <a href="{{unsubscribe}}" target="_blank" style="color:#f0d78c;text-decoration:underline;">${escapeHtml(c.unsubscribeLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
