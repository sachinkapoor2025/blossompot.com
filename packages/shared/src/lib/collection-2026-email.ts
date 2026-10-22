/**
 * Short floral marketing email: Flowers, Cakes & Gifts Collection 2026.
 * Table layout + inline CSS for Gmail, Outlook, and Apple Mail.
 *
 * Products, prices, and image URLs match the live BlossomPot catalog
 * (FNP USA listings published on blossompot.com).
 */

const SITE = "https://www.blossompot.com";
const LOGO = `${SITE}/logo.png`;
const FB = `${SITE}/email-templates/icons/facebook.png`;
const IG = `${SITE}/email-templates/icons/instagram.png`;

const ROSE = "#C23A6B";
const ROSE_DARK = "#9E2D55";
const SAGE = "#2F6B52";
const PETAL = "#FFF6F8";
const CREAM = "#FBF7F2";
const PAGE = "#F4EEE8";
const INK = "#2C2428";
const MUTED = "#6A5C62";
const LINE = "#F0DDE4";
const WHITE = "#ffffff";
const FOOTER = "#1E3A32";

export type Collection2026Product = {
  eyebrow: string;
  name: string;
  priceLabel: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
};

export type Collection2026HeroTile = {
  imageUrl: string;
  imageAlt: string;
  href: string;
};

export const COLLECTION_2026_EMAIL_TEMPLATE_ID = "flowers-cakes-gifts-collection-2026";
export const COLLECTION_2026_EMAIL_NAME = "BlossomPot Flowers, Cakes & Gifts Collection 2026";
export const COLLECTION_2026_EMAIL_SUBJECT =
  "Make Every Moment Special with Flowers, Cakes & Beautiful Gifts";
export const COLLECTION_2026_EMAIL_PREVIEW =
  "Surprise your loved ones with stunning bouquets, delicious cakes, and thoughtful gift hampers from BlossomPot.";

export const COLLECTION_2026_EMAIL_CONFIG = {
  templateId: COLLECTION_2026_EMAIL_TEMPLATE_ID,
  name: COLLECTION_2026_EMAIL_NAME,
  subject: COLLECTION_2026_EMAIL_SUBJECT,
  preheader: COLLECTION_2026_EMAIL_PREVIEW,
  logoUrl: LOGO,
  logoHref: SITE,
  headline: "Make Someone Smile Today",
  message:
    "The right gift can turn an ordinary day into a moment they keep. Fresh flowers, a beautiful bouquet, a celebration cake, or a premium hamper — chosen with care for birthdays, anniversaries, and every reason to say you care.",
  shopNowText: "Shop Now",
  shopNowHref: `${SITE}/products`,
  hero: [
    {
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260530113728/garden-romance-premium.jpg",
      imageAlt: "Garden Romance Premium fresh flowers",
      href: `${SITE}/flowers`,
    },
    {
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260611145721/meant-to-be-bouquet-deluxe.jpg",
      imageAlt: "Meant To Be Bouquet Deluxe",
      href: `${SITE}/bouquets`,
    },
    {
      imageUrl: "https://static-assets-prod.fnp.com/images/pr/usa/m/v20250929214212/the-congrats-cake.jpg",
      imageAlt: "The CONGRATS Cake",
      href: `${SITE}/cakes`,
    },
    {
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260421165231/luxe-gold-collectible-sweet-treats-gift-hamper.jpg",
      imageAlt: "Luxe Gold Collectible Sweet Treats Gift Hamper",
      href: `${SITE}/gift-hampers`,
    },
  ] satisfies Collection2026HeroTile[],
  categoryButtons: [
    { text: "Shop Flowers", href: `${SITE}/flowers` },
    { text: "Order Cakes", href: `${SITE}/cakes` },
    { text: "Explore Gift Hampers", href: `${SITE}/gift-hampers` },
  ],
  productsHeading: "A Little Something Beautiful",
  products: [
    {
      eyebrow: "Fresh Flowers",
      name: "Garden Romance Premium",
      priceLabel: "$89.49",
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260530113728/garden-romance-premium.jpg",
      imageAlt: "Garden Romance Premium",
      href: `${SITE}/products/garden-romance-premium`,
    },
    {
      eyebrow: "Beautiful Flower Bouquets",
      name: "Meant To Be Bouquet Deluxe",
      priceLabel: "$89.49",
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260611145721/meant-to-be-bouquet-deluxe.jpg",
      imageAlt: "Meant To Be Bouquet Deluxe",
      href: `${SITE}/products/meant-to-be-bouquet-deluxe`,
    },
    {
      eyebrow: "Celebration Cakes",
      name: "The CONGRATS Cake",
      priceLabel: "$68.49",
      imageUrl: "https://static-assets-prod.fnp.com/images/pr/usa/m/v20250929214212/the-congrats-cake.jpg",
      imageAlt: "The CONGRATS Cake",
      href: `${SITE}/products/the-congrats-cake`,
    },
    {
      eyebrow: "Premium Gift Hampers",
      name: "Luxe Gold Collectible Sweet Treats Gift Hamper",
      priceLabel: "$97.49",
      imageUrl:
        "https://static-assets-prod.fnp.com/images/pr/usa/m/v20260421165231/luxe-gold-collectible-sweet-treats-gift-hamper.jpg",
      imageAlt: "Luxe Gold Collectible Sweet Treats Gift Hamper",
      href: `${SITE}/products/luxe-gold-collectible-sweet-treats-gift-hamper`,
    },
  ] satisfies Collection2026Product[],
  closing:
    "Birthdays, anniversaries, congratulations, or a simple “thinking of you” — visit BlossomPot and send a gift that feels personal.",
  footerTagline: "Flowers, cakes, and gifts for the moments that matter.",
  websiteLabel: "www.blossompot.com",
  contactEmail: "support@blossompot.com",
  facebookUrl: "https://www.facebook.com/profile.php?id=61594220485535",
  instagramUrl: "https://www.instagram.com/blossompot_official/",
  copyrightText: "© 2026 BlossomPot. All Rights Reserved.",
  unsubscribeLabel: "Unsubscribe",
} as const;

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

function pillButton(href: string, label: string, opts?: { fill?: string; text?: string; width?: number }): string {
  const fill = opts?.fill ?? ROSE;
  const text = opts?.text ?? WHITE;
  const width = opts?.width ?? 168;
  const safeHref = escAttr(href);
  const safeLabel = escapeHtml(label);
  return `
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:${width}px;" arcsize="50%" stroke="f" fillcolor="${fill}">
                      <w:anchorlock/>
                      <center style="color:${text};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;">${safeLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>
                        <td align="center" bgcolor="${fill}" style="background-color:${fill};border-radius:24px;">
                          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:18px;font-weight:bold;color:${text};text-decoration:none;border-radius:24px;">${safeLabel}</a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->`;
}

function heroGrid(tiles: readonly Collection2026HeroTile[]): string {
  const cell = (tile: Collection2026HeroTile) => `
                        <a href="${escAttr(tile.href)}" target="_blank" style="text-decoration:none;">
                          <img class="fluid" src="${escAttr(tile.imageUrl)}" width="300" alt="${escAttr(tile.imageAlt)}" style="display:block;width:100%;max-width:300px;height:auto;border:0;" />
                        </a>`;
  const row = (a: Collection2026HeroTile, b: Collection2026HeroTile) => `
              <tr>
                <td class="hero-col" width="50%" valign="top" style="width:50%;padding:0 2px 4px 0;line-height:0;font-size:0;">
                  ${cell(a)}
                </td>
                <td class="hero-col" width="50%" valign="top" style="width:50%;padding:0 0 4px 2px;line-height:0;font-size:0;">
                  ${cell(b)}
                </td>
              </tr>`;
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${row(tiles[0]!, tiles[1]!)}
                ${row(tiles[2]!, tiles[3]!)}
              </table>`;
}

function categoryButtons(
  buttons: readonly { text: string; href: string }[]
): string {
  const [flowers, cakes, hampers] = buttons;
  const cell = (button: { text: string; href: string }, width: number, pad: string) => `
                  <td class="stack-col" width="50%" valign="middle" align="center" style="width:50%;padding:${pad};">
                    ${pillButton(button.href, button.text, { fill: SAGE, width })}
                  </td>`;
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  ${cell(flowers!, 150, "0 6px 10px 0")}
                  ${cell(cakes!, 150, "0 0 10px 6px")}
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:2px 0 4px 0;">
                    ${pillButton(hampers!.href, hampers!.text, { fill: SAGE, width: 210 })}
                  </td>
                </tr>
              </table>`;
}

function productCard(product: Collection2026Product): string {
  const href = escAttr(product.href);
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${WHITE};border:1px solid ${LINE};border-radius:14px;">
                      <tr>
                        <td align="center" style="padding:0;line-height:0;font-size:0;background-color:${PETAL};border-radius:14px 14px 0 0;">
                          <a href="${href}" target="_blank" style="text-decoration:none;">
                            <img class="card-img fluid" src="${escAttr(product.imageUrl)}" width="268" alt="${escAttr(product.imageAlt)}" style="display:block;width:100%;max-width:268px;height:auto;border:0;margin:0 auto;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:14px 14px 16px 14px;">
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;letter-spacing:1.2px;text-transform:uppercase;font-weight:bold;color:${SAGE};padding-bottom:6px;">${escapeHtml(product.eyebrow)}</div>
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:21px;font-weight:bold;color:${INK};padding-bottom:6px;">${escapeHtml(product.name)}</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:bold;color:${ROSE};padding-bottom:12px;">${escapeHtml(product.priceLabel)}</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" bgcolor="${ROSE}" style="background-color:${ROSE};border-radius:20px;">
                                <a href="${href}" target="_blank" style="display:inline-block;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:16px;font-weight:bold;color:${WHITE};text-decoration:none;border-radius:20px;">View Product</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`;
}

function productRow(left: Collection2026Product, right: Collection2026Product): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td class="stack-col" width="50%" valign="top" style="width:50%;padding:0 6px 12px 0;">
                    ${productCard(left)}
                  </td>
                  <td class="stack-col" width="50%" valign="top" style="width:50%;padding:0 0 12px 6px;">
                    ${productCard(right)}
                  </td>
                </tr>
              </table>`;
}

export function buildCollection2026EmailHtml(): string {
  const cfg = COLLECTION_2026_EMAIL_CONFIG;
  const [flowers, bouquet, cake, hamper] = cfg.products;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(cfg.headline)} | BlossomPot</title>
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
      .stack-col { display: block !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      .hero-col { width: 50% !important; max-width: 50% !important; }
      .mobile-pad { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 28px !important; line-height: 34px !important; }
      .card-img { width: 100% !important; max-width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(cfg.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAGE};">
    <tr>
      <td align="center" style="padding:16px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="border-collapse:collapse;width:600px;max-width:600px;background-color:${WHITE};border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="${CREAM}" style="padding:18px 24px 14px 24px;background-color:${CREAM};">
              <a href="${escAttr(cfg.logoHref)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(cfg.logoUrl)}" width="156" alt="BlossomPot" style="display:block;width:156px;max-width:62%;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td width="62%" height="4" bgcolor="${ROSE}" style="background-color:${ROSE};font-size:0;line-height:4px;">&nbsp;</td>
                  <td width="38%" height="4" bgcolor="${SAGE}" style="background-color:${SAGE};font-size:0;line-height:4px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;background-color:${PETAL};">
              ${heroGrid(cfg.hero)}
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" bgcolor="${CREAM}" style="padding:28px 28px 8px 28px;background-color:${CREAM};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:${ROSE};padding-bottom:8px;">Flowers, Cakes &amp; Gifts</div>
              <h1 class="hero-title" style="margin:0;padding:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:38px;font-weight:bold;color:${INK};">
                ${escapeHtml(cfg.headline)}
              </h1>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${MUTED};padding:0 4px 18px 4px;">
                ${escapeHtml(cfg.message)}
              </div>
              ${pillButton(cfg.shopNowHref, cfg.shopNowText, { fill: ROSE, width: 160 })}
              <div style="height:18px;line-height:18px;font-size:0;">&nbsp;</div>
              ${categoryButtons(cfg.categoryButtons)}
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" style="padding:8px 18px 6px 18px;background-color:${WHITE};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${INK};text-align:center;padding:8px 8px 14px 8px;">
                ${escapeHtml(cfg.productsHeading)}
              </div>
              ${productRow(flowers!, bouquet!)}
              ${productRow(cake!, hamper!)}
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" style="padding:6px 28px 28px 28px;background-color:${WHITE};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:24px;color:${INK};padding-bottom:16px;">
                ${escapeHtml(cfg.closing)}
              </div>
              ${pillButton(cfg.shopNowHref, cfg.shopNowText, { fill: ROSE_DARK, width: 160 })}
            </td>
          </tr>
          <tr>
            <td align="center" bgcolor="${FOOTER}" style="padding:26px 22px 22px 22px;background-color:${FOOTER};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:20px;color:#F3E6D8;padding-bottom:12px;">
                ${escapeHtml(cfg.footerTagline)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;padding-bottom:8px;">
                <a href="${escAttr(SITE)}" target="_blank" style="color:#F6D7E2;text-decoration:none;">${escapeHtml(cfg.websiteLabel)}</a>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;padding-bottom:14px;">
                <a href="mailto:${escAttr(cfg.contactEmail)}" style="color:#F6D7E2;text-decoration:none;">${escapeHtml(cfg.contactEmail)}</a>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;padding-bottom:14px;">
                <a href="${escAttr(`${SITE}/products`)}" target="_blank" style="color:#E7C9A4;text-decoration:none;">Shop</a>
                <span style="color:#8EAA9E;padding:0 6px;">·</span>
                <a href="${escAttr(`${SITE}/flowers`)}" target="_blank" style="color:#E7C9A4;text-decoration:none;">Flowers</a>
                <span style="color:#8EAA9E;padding:0 6px;">·</span>
                <a href="${escAttr(`${SITE}/bouquets`)}" target="_blank" style="color:#E7C9A4;text-decoration:none;">Bouquets</a>
                <span style="color:#8EAA9E;padding:0 6px;">·</span>
                <a href="${escAttr(`${SITE}/cakes`)}" target="_blank" style="color:#E7C9A4;text-decoration:none;">Cakes</a>
                <span style="color:#8EAA9E;padding:0 6px;">·</span>
                <a href="${escAttr(`${SITE}/gift-hampers`)}" target="_blank" style="color:#E7C9A4;text-decoration:none;">Gift Hampers</a>
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td style="padding:0 8px 14px 8px;">
                    <a href="${escAttr(cfg.facebookUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                      <img src="${escAttr(FB)}" width="32" height="32" alt="Facebook" style="display:block;border:0;width:32px;height:32px;" />
                    </a>
                  </td>
                  <td style="padding:0 8px 14px 8px;">
                    <a href="${escAttr(cfg.instagramUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                      <img src="${escAttr(IG)}" width="32" height="32" alt="Instagram" style="display:block;border:0;width:32px;height:32px;" />
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#C9D7D0;padding-bottom:8px;">
                ${escapeHtml(cfg.copyrightText)}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">
                <a href="{{unsubscribe}}" target="_blank" style="color:#F6D7E2;text-decoration:underline;">${escapeHtml(cfg.unsubscribeLabel)}</a>
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
