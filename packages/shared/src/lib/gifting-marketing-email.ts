/**
 * Reusable storefront gifting promo email (hero, 3 categories, worldwide CTA,
 * featured product, footer). Table + inline CSS for Gmail / Outlook / Apple Mail.
 *
 * Change copy, images, links, and CTAs via GIFTING_MARKETING_EMAIL_CONFIG or
 * pass overrides into buildGiftingMarketingEmailHtml().
 */

import { catalogImagesForProduct } from "./catalog-images";
import { cdnUploadUrl } from "./image-url";
import { BLOSSOMPOT_SOCIAL_LINKS } from "./order-confirmed-email";

const SITE = "https://www.blossompot.com";
const LOGO = `${SITE}/logo.png`;
const FB_ICON = `${SITE}/email-templates/icons/facebook.png`;
const IG_ICON = `${SITE}/email-templates/icons/instagram.png`;

const PRIMARY = "#C23A6B";
const PRIMARY_DARK = "#9E2E57";
const BLUSH = "#F8EEF2";
const CREAM = "#FFF8F5";
const INK = "#2A1F24";
const MUTED = "#6B5560";
const LINE = "#EBD5DC";
const PAGE_BG = "#F4E8EC";
const WHITE = "#ffffff";
const FOOTER_BG = "#1A3D34";
const GOLD = "#E8C9A0";

const FEATURED_ROSES = catalogImagesForProduct({
  name: "Classic Red Rose Bouquet",
  slug: "classic-red-rose-bouquet",
  categorySlug: "flowers",
});

export type GiftingEmailCategory = {
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  buttonText: string;
};

export type GiftingEmailNavLink = {
  label: string;
  href: string;
};

export type GiftingEmailSocial = {
  label: string;
  href: string;
  color: string;
  badge: string;
  iconUrl?: string;
};

export type GiftingMarketingEmailConfig = {
  preheader: string;
  logoUrl: string;
  logoHref: string;
  logoAlt: string;
  hero: {
    imageUrl: string;
    imageAlt: string;
    imageHref: string;
    headline: string;
    message: string;
    ctaText: string;
    ctaHref: string;
  };
  categoriesHeading: string;
  categoriesSubheading: string;
  categories: readonly GiftingEmailCategory[];
  worldwide: {
    heading: string;
    message: string;
    ctaText: string;
    ctaHref: string;
  };
  featured: {
    imageUrl: string;
    imageAlt: string;
    name: string;
    description: string;
    priceLabel: string;
    href: string;
    ctaText: string;
  };
  footer: {
    tagline: string;
    websiteUrl: string;
    websiteLabel: string;
    contactEmail: string;
    navLinks: readonly GiftingEmailNavLink[];
    socials: readonly GiftingEmailSocial[];
    copyrightText: string;
    unsubscribeLabel: string;
    unsubscribeHref: string;
  };
};

export const GIFTING_MARKETING_EMAIL_CONFIG: GiftingMarketingEmailConfig = {
  preheader: "Flowers, cakes & gift hampers — send a surprise to 200+ countries with BlossomPot.",
  logoUrl: LOGO,
  logoHref: SITE,
  logoAlt: "BlossomPot",
  hero: {
    imageUrl: cdnUploadUrl("editorial/home-banner-flowers.jpg"),
    imageAlt: "Fresh flowers and gifting from BlossomPot",
    imageHref: `${SITE}/flowers`,
    headline: "Send a Gift They'll Never Forget",
    message: "Fresh flowers, celebration cakes, and curated hampers — delivered with care for birthdays, anniversaries, and every day in between.",
    ctaText: "Shop Now",
    ctaHref: `${SITE}/products`,
  },
  categoriesHeading: "Shop Top Categories",
  categoriesSubheading: "Start with flowers, add a cake, or send a complete hamper.",
  categories: [
    {
      name: "Flowers",
      description: "Fresh bouquets for every occasion.",
      imageUrl: cdnUploadUrl("editorial/tile-flowers.jpg"),
      imageAlt: "Shop flowers",
      href: `${SITE}/flowers`,
      buttonText: "Shop Flowers",
    },
    {
      name: "Cakes",
      description: "Celebration cakes delivered fresh.",
      imageUrl: cdnUploadUrl("editorial/tile-cakes.jpg"),
      imageAlt: "Shop cakes",
      href: `${SITE}/cakes`,
      buttonText: "Shop Cakes",
    },
    {
      name: "Gift Hampers",
      description: "Curated treats in one beautiful gift.",
      imageUrl: cdnUploadUrl("editorial/tile-hampers.jpg"),
      imageAlt: "Shop gift hampers",
      href: `${SITE}/gift-hampers`,
      buttonText: "Shop Hampers",
    },
  ],
  worldwide: {
    heading: "Send a Surprise Anywhere in the World",
    message:
      "Make someone's day special with a thoughtful gift. We deliver beautiful gifts to 200+ countries worldwide.",
    ctaText: "Send a Gift",
    ctaHref: `${SITE}/#gift-catalog`,
  },
  featured: {
    imageUrl: FEATURED_ROSES[0] ?? cdnUploadUrl("catalog/roses-red-1.jpg"),
    imageAlt: "Classic Red Rose Bouquet",
    name: "Classic Red Rose Bouquet",
    description:
      "A timeless dozen of premium red roses arranged with fresh greens and elegant wrapping — perfect for anniversaries and I-love-you moments.",
    priceLabel: "$49.99",
    href: `${SITE}/products/classic-red-rose-bouquet`,
    ctaText: "Shop Now",
  },
  footer: {
    tagline: "Flowers ♥ Cakes ♥ Gifts — Delivering Smiles",
    websiteUrl: SITE,
    websiteLabel: "www.blossompot.com",
    contactEmail: "support@blossompot.com",
    navLinks: [
      { label: "Shop", href: `${SITE}/products` },
      { label: "Flowers", href: `${SITE}/flowers` },
      { label: "Cakes", href: `${SITE}/cakes` },
      { label: "Gift Hampers", href: `${SITE}/gift-hampers` },
      { label: "Blog", href: `${SITE}/blog` },
    ],
    socials: BLOSSOMPOT_SOCIAL_LINKS.map((s) => ({
      label: s.label,
      href: s.href,
      color: s.color,
      badge: s.name,
      iconUrl: s.label === "Facebook" ? FB_ICON : s.label === "Instagram" ? IG_ICON : undefined,
    })),
    copyrightText: "© 2026 BlossomPot. All Rights Reserved.",
    unsubscribeLabel: "Unsubscribe",
    unsubscribeHref: "{{unsubscribe}}",
  },
};

export const GIFTING_MARKETING_EMAIL_TEMPLATE_ID = "gifting-promo";
export const GIFTING_MARKETING_EMAIL_NAME = "Gifting Promo (Worldwide)";
export const GIFTING_MARKETING_EMAIL_SUBJECT =
  "Send a surprise anywhere in the world — flowers, cakes & hampers";

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

function ctaButton(href: string, label: string, opts?: { width?: number; fill?: string }) {
  const fill = opts?.fill ?? PRIMARY;
  const width = opts?.width ?? 180;
  const safeHref = escAttr(href);
  const safeLabel = escapeHtml(label);
  return `
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="17%" stroke="f" fillcolor="${fill}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Georgia, 'Times New Roman', serif;font-size:15px;font-weight:bold;">${safeLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        <td align="center" bgcolor="${fill}" style="background-color:${fill};border-radius:8px;">
                          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                            ${safeLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->`;
}

function categoryCard(cat: GiftingEmailCategory): string {
  const href = escAttr(cat.href);
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${WHITE};border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
                      <tr>
                        <td align="center" style="padding:0;line-height:0;font-size:0;background-color:${BLUSH};">
                          <a href="${href}" target="_blank" style="text-decoration:none;">
                            <img class="fluid" src="${escAttr(cat.imageUrl)}" width="180" alt="${escAttr(cat.imageAlt)}" style="display:block;width:100%;max-width:180px;height:auto;border:0;margin:0 auto;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:14px 12px 18px 12px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:20px;font-weight:bold;color:${INK};padding-bottom:6px;">${escapeHtml(cat.name)}</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;color:${MUTED};padding-bottom:12px;">${escapeHtml(cat.description)}</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:6px;">
                                <a href="${href}" target="_blank" style="display:inline-block;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(cat.buttonText)}</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`;
}

function categoriesRow(categories: readonly GiftingEmailCategory[]): string {
  const cats = categories.slice(0, 3);
  const cells = cats
    .map((cat, i) => {
      const pad = i === 0 ? "0 6px 0 0" : i === cats.length - 1 ? "0 0 0 6px" : "0 6px";
      return `
                  <td class="stack-col" width="33%" valign="top" style="width:33.33%;padding:${pad};">
                    ${categoryCard(cat)}
                  </td>`;
    })
    .join("");
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  ${cells}
                </tr>
              </table>`;
}

function navLinksRow(links: readonly GiftingEmailNavLink[]): string {
  const parts = links.map((link, i) => {
    const sep = i < links.length - 1 ? `<span style="color:#8aa399;padding:0 6px;">·</span>` : "";
    return `<a href="${escAttr(link.href)}" target="_blank" style="color:${GOLD};text-decoration:none;">${escapeHtml(link.label)}</a>${sep}`;
  });
  return parts.join("");
}

function socialRow(socials: readonly GiftingEmailSocial[]): string {
  const cells = socials
    .map((s) => {
      const inner = s.iconUrl
        ? `<img src="${escAttr(s.iconUrl)}" width="32" height="32" alt="${escAttr(s.label)}" style="display:block;border:0;width:32px;height:32px;" />`
        : `<span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:16px;background-color:${escAttr(s.color)};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#ffffff;text-align:center;">${escapeHtml(s.badge)}</span>`;
      return `
                        <td style="padding:0 5px;">
                          <a href="${escAttr(s.href)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                            ${inner}
                          </a>
                        </td>`;
    })
    .join("");
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        ${cells}
                      </tr>
                    </table>`;
}

function mergeConfig(overrides?: Partial<GiftingMarketingEmailConfig>): GiftingMarketingEmailConfig {
  const base = GIFTING_MARKETING_EMAIL_CONFIG;
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    hero: { ...base.hero, ...overrides.hero },
    worldwide: { ...base.worldwide, ...overrides.worldwide },
    featured: { ...base.featured, ...overrides.featured },
    footer: { ...base.footer, ...overrides.footer },
    categories: overrides.categories ?? base.categories,
  };
}

export function buildGiftingMarketingEmailHtml(
  overrides?: Partial<GiftingMarketingEmailConfig>
): string {
  const cfg = mergeConfig(overrides);
  const { hero, worldwide, featured, footer } = cfg;
  const priceRow = featured.priceLabel
    ? `
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${PRIMARY};padding-bottom:16px;">
                ${escapeHtml(featured.priceLabel)}
              </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(hero.headline)}</title>
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
    td, th, div, p, a, h1, h2, h3, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .stack-col { display: block !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; padding-bottom: 12px !important; }
      .mobile-pad { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 26px !important; line-height: 32px !important; }
      .section-title { font-size: 22px !important; line-height: 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(cfg.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="border-collapse:collapse;width:600px;max-width:600px;background-color:${WHITE};border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="${CREAM}" style="padding:20px 24px 14px 24px;background-color:${CREAM};">
              <a href="${escAttr(cfg.logoHref)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(cfg.logoUrl)}" width="168" alt="${escAttr(cfg.logoAlt)}" style="display:block;width:168px;max-width:70%;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td height="5" style="height:5px;line-height:5px;font-size:0;background-color:${PRIMARY};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td width="70%" height="5" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};font-size:0;line-height:5px;">&nbsp;</td>
                  <td width="30%" height="5" bgcolor="${PRIMARY_DARK}" style="background-color:${PRIMARY_DARK};font-size:0;line-height:5px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero banner -->
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;">
              <a href="${escAttr(hero.imageHref)}" target="_blank" style="text-decoration:none;">
                <img class="fluid" src="${escAttr(hero.imageUrl)}" width="600" alt="${escAttr(hero.imageAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" bgcolor="${BLUSH}" style="padding:32px 28px 30px 28px;background-color:${BLUSH};">
              <div class="hero-title" style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;font-weight:bold;color:${INK};padding-bottom:10px;">
                ${escapeHtml(hero.headline)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:${MUTED};padding:0 4px 20px 4px;">
                ${escapeHtml(hero.message)}
              </div>
              ${ctaButton(hero.ctaHref, hero.ctaText, { width: 160 })}
            </td>
          </tr>

          <!-- Top categories -->
          <tr>
            <td class="mobile-pad" style="padding:32px 20px 28px 20px;background-color:${WHITE};">
              <div class="section-title" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;font-weight:bold;color:${INK};text-align:center;padding-bottom:6px;">
                ${escapeHtml(cfg.categoriesHeading)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${MUTED};text-align:center;padding-bottom:20px;">
                ${escapeHtml(cfg.categoriesSubheading)}
              </div>
              ${categoriesRow(cfg.categories)}
            </td>
          </tr>

          <!-- Worldwide delivery -->
          <tr>
            <td class="mobile-pad" align="center" bgcolor="${PRIMARY}" style="padding:36px 28px 34px 28px;background-color:${PRIMARY};">
              <div class="section-title" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;font-weight:bold;color:#ffffff;padding-bottom:10px;">
                ${escapeHtml(worldwide.heading)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#FDECF2;padding:0 4px 20px 4px;">
                ${escapeHtml(worldwide.message)}
              </div>
              ${ctaButton(worldwide.ctaHref, worldwide.ctaText, { fill: PRIMARY_DARK, width: 170 })}
            </td>
          </tr>

          <!-- Featured product -->
          <tr>
            <td class="mobile-pad" align="center" style="padding:32px 24px 36px 24px;background-color:${CREAM};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${PRIMARY};font-weight:bold;padding-bottom:12px;">
                Featured Gift
              </div>
              <a href="${escAttr(featured.href)}" target="_blank" style="text-decoration:none;">
                <img class="fluid" src="${escAttr(featured.imageUrl)}" width="520" alt="${escAttr(featured.imageAlt)}" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:12px;margin:0 auto 18px auto;" />
              </a>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${INK};padding-bottom:8px;">
                ${escapeHtml(featured.name)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${MUTED};padding:0 8px 12px 8px;">
                ${escapeHtml(featured.description)}
              </div>
              ${priceRow}
              ${ctaButton(featured.href, featured.ctaText, { width: 160 })}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-pad" style="padding:32px 24px 36px 24px;background-color:${FOOTER_BG};text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 14px 0;">
                    <a href="${escAttr(footer.websiteUrl)}" target="_blank" style="text-decoration:none;">
                      <img src="${escAttr(cfg.logoUrl)}" width="140" alt="${escAttr(cfg.logoAlt)}" style="display:block;width:140px;max-width:55%;height:auto;border:0;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:8px;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:20px;color:${GOLD};">
                    ${escapeHtml(footer.tagline)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#d5e4dc;">
                    ${navLinksRow(footer.navLinks)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#d5e4dc;">
                    <a href="mailto:${escAttr(footer.contactEmail)}" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.contactEmail)}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8aa399;">
                    Follow us
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 16px 0;">
                    ${socialRow(footer.socials)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8aa399;">
                    Website:
                    <a href="${escAttr(footer.websiteUrl)}" target="_blank" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.websiteLabel)}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8aa399;">
                    ${escapeHtml(footer.copyrightText)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">
                    <a href="${escAttr(footer.unsubscribeHref)}" target="_blank" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.unsubscribeLabel)}</a>
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
