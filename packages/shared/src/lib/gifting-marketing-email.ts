/**
 * Simple gifting promo for Gmail, Outlook, and Apple Mail.
 * One site-hosted photo plus text buttons. Category photos on the CDN were
 * the images that arrived blank.
 *
 * Change copy, the hero image, links, and CTAs via GIFTING_MARKETING_EMAIL_CONFIG
 * or pass overrides into buildGiftingMarketingEmailHtml().
 */

import { EMAIL_IMAGES, emailImgAttributes } from "./email-images";
import { homePageBannerUrl } from "./home-page-banners";
import { BLOSSOMPOT_SOCIAL_LINKS } from "./order-confirmed-email";

const SITE = "https://www.blossompot.com";
const LOGO = `${SITE}/logo.png`;
const FB_ICON = `${SITE}/email-templates/icons/facebook.png`;
const IG_ICON = `${SITE}/email-templates/icons/instagram.png`;

const PRIMARY = "#C23A6B";
const PRIMARY_DARK = "#9E2D55";
const PETAL = "#FFF5F8";
const CREAM = "#F7FCF8";
const INK = "#243028";
const MUTED = "#5C6B63";
const LINE = "#E8D4DC";
const PAGE_BG = "#F3FAF5";
const WHITE = "#ffffff";
const FOOTER_BG = "#1A3D34";
const GOLD = "#E8C9A0";
const SAGE = "#2F8F6B";

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
  preheader: "Flowers, cakes and gift hampers. Send a surprise to 200+ countries with BlossomPot.",
  logoUrl: LOGO,
  logoHref: SITE,
  logoAlt: "BlossomPot",
  hero: {
    imageUrl: homePageBannerUrl("flowers"),
    imageAlt: "Fresh flowers and gifting from BlossomPot",
    imageHref: `${SITE}/flowers`,
    headline: "Send a Gift They'll Never Forget",
    message: "Fresh flowers, celebration cakes, and curated hampers, delivered with care for birthdays, anniversaries, and every day in between.",
    ctaText: "Shop Now",
    ctaHref: `${SITE}/products`,
  },
  categoriesHeading: "Shop Top Categories",
  categoriesSubheading: "Start with flowers, add a cake, or send a complete hamper.",
  categories: [
    {
      name: "Flowers",
      description: "Fresh bouquets for every occasion.",
      imageUrl: EMAIL_IMAGES.flowers.url,
      imageAlt: "Shop flowers",
      href: `${SITE}/flowers`,
      buttonText: "Shop Flowers",
    },
    {
      name: "Cakes",
      description: "Celebration cakes delivered fresh.",
      imageUrl: EMAIL_IMAGES.birthdayBanner.url,
      imageAlt: "Shop cakes",
      href: `${SITE}/cakes`,
      buttonText: "Shop Cakes",
    },
    {
      name: "Gift Hampers",
      description: "Curated treats in one beautiful gift.",
      imageUrl: EMAIL_IMAGES.gourmet.url,
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
    ctaHref: `${SITE}/gift-catalog`,
  },
  featured: {
    imageUrl: EMAIL_IMAGES.freshFlowers.url,
    imageAlt: "Fresh flowers from BlossomPot",
    name: "Classic Red Rose Bouquet",
    description:
      "A timeless dozen of premium red roses arranged with fresh greens and elegant wrapping, perfect for anniversaries and I-love-you moments.",
    priceLabel: "$49.99",
    href: `${SITE}/products/classic-red-rose-bouquet`,
    ctaText: "Shop Now",
  },
  footer: {
    tagline: "Flowers, Cakes and Gifts. Delivering Smiles.",
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
    copyrightText: "Copyright 2026 BlossomPot. All Rights Reserved.",
    unsubscribeLabel: "Unsubscribe",
    unsubscribeHref: "{{unsubscribe}}",
  },
};

export const GIFTING_MARKETING_EMAIL_TEMPLATE_ID = "gifting-promo";
export const GIFTING_MARKETING_EMAIL_NAME = "Gifting Promo (Worldwide)";
export const GIFTING_MARKETING_EMAIL_SUBJECT =
  "Send a surprise anywhere in the world: flowers, cakes and hampers";

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
  const width = opts?.width ?? 200;
  const safeHref = escAttr(href);
  const safeLabel = escapeHtml(label);
  return `
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="50%" stroke="f" fillcolor="${fill}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:bold;">${safeLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        <td align="center" bgcolor="${fill}" style="background-color:${fill};border-radius:28px;">
                          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:bold;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:28px;">
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
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${WHITE};border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
                      <tr>
                        <td align="center" style="padding:0;line-height:0;font-size:0;background-color:${PETAL};">
                          <a href="${href}" target="_blank" style="text-decoration:none;">
                            <img class="fluid" src="${escAttr(cat.imageUrl)}" ${emailImgAttributes(cat.imageUrl, 188)} alt="${escAttr(cat.imageAlt)}" style="display:block;width:100%;max-width:188px;height:auto;border:0;margin:0 auto;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:16px 14px 20px 14px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:22px;font-weight:bold;color:${INK};padding-bottom:6px;">${escapeHtml(cat.name)}</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-bottom:14px;">${escapeHtml(cat.description)}</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:22px;">
                                <a href="${href}" target="_blank" style="display:inline-block;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:22px;">${escapeHtml(cat.buttonText)}</a>
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
    const sep = i < links.length - 1 ? `<span style="color:#8aa399;padding:0 6px;">|</span>` : "";
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
  const { hero, featured, footer } = cfg;
  const price = featured.priceLabel
    ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${PRIMARY};padding-bottom:14px;">${escapeHtml(featured.priceLabel)}</div>`
    : "";
  const buttons = cfg.categories
    .slice(0, 3)
    .map(
      (cat) => `
                        <td align="center" style="padding:6px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:24px;">
                                <a href="${escAttr(cat.href)}" target="_blank" style="display:inline-block;padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:24px;">${escapeHtml(cat.buttonText)}</a>
                              </td>
                            </tr>
                          </table>
                        </td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(hero.headline)} | BlossomPot</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(cfg.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:600px;max-width:600px;background-color:${WHITE};">

          <tr>
            <td align="center" style="padding:28px 24px 16px 24px;">
              <a href="${escAttr(cfg.logoHref)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(cfg.logoUrl)}" ${emailImgAttributes(cfg.logoUrl, 160)} alt="${escAttr(cfg.logoAlt)}" style="display:block;width:160px;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;">
              <a href="${escAttr(hero.imageHref)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(hero.imageUrl)}" ${emailImgAttributes(hero.imageUrl, 600)} alt="${escAttr(hero.imageAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 28px 8px 28px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;font-weight:bold;color:${INK};padding-bottom:12px;">
                ${escapeHtml(hero.headline)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:${MUTED};padding-bottom:22px;">
                ${escapeHtml(hero.message)}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:24px;">
                    <a href="${escAttr(hero.ctaHref)}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(hero.ctaText)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 16px 8px 16px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${INK};padding-bottom:6px;">
                ${escapeHtml(cfg.categoriesHeading)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${MUTED};padding-bottom:16px;">
                ${escapeHtml(cfg.categoriesSubheading)}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  ${buttons}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 28px 8px 28px;background-color:${PETAL};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${INK};padding:8px 0 8px 0;">
                ${escapeHtml(cfg.worldwide.heading)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${MUTED};padding-bottom:18px;">
                ${escapeHtml(cfg.worldwide.message)}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto 8px auto;">
                <tr>
                  <td align="center" bgcolor="${SAGE}" style="background-color:${SAGE};border-radius:24px;">
                    <a href="${escAttr(cfg.worldwide.ctaHref)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(cfg.worldwide.ctaText)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 28px 32px 28px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${INK};padding-bottom:8px;">
                <a href="${escAttr(featured.href)}" target="_blank" style="color:${INK};text-decoration:none;">${escapeHtml(featured.name)}</a>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${MUTED};padding-bottom:12px;">
                ${escapeHtml(featured.description)}
              </div>
              ${price}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:24px;">
                    <a href="${escAttr(featured.href)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(featured.ctaText)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 20px 32px 20px;background-color:${FOOTER_BG};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:22px;color:${GOLD};padding-bottom:12px;">
                ${escapeHtml(footer.tagline)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:24px;padding-bottom:10px;">
                <a href="${escAttr(footer.websiteUrl)}" target="_blank" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.websiteLabel)}</a>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:24px;padding-bottom:14px;">
                <a href="mailto:${escAttr(footer.contactEmail)}" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.contactEmail)}</a>
              </div>
              <div style="padding-bottom:14px;">
                <a href="${escAttr(footer.socials.find((s) => s.label === "Facebook")?.href ?? "https://www.facebook.com/profile.php?id=61594220485535")}" target="_blank" style="text-decoration:none;">
                  <img src="${escAttr(FB_ICON)}" width="32" height="32" alt="Facebook" style="display:inline-block;border:0;width:32px;height:32px;" />
                </a>
                &nbsp;
                <a href="${escAttr(footer.socials.find((s) => s.label === "Instagram")?.href ?? "https://www.instagram.com/blossompot_official/")}" target="_blank" style="text-decoration:none;">
                  <img src="${escAttr(IG_ICON)}" width="32" height="32" alt="Instagram" style="display:inline-block;border:0;width:32px;height:32px;" />
                </a>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#c5d5cc;padding-bottom:8px;">
                ${escapeHtml(footer.copyrightText)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">
                <a href="${escAttr(footer.unsubscribeHref)}" target="_blank" style="color:${GOLD};text-decoration:underline;">${escapeHtml(footer.unsubscribeLabel)}</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
