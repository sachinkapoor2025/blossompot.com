/**
 * Premium Order Confirmed transactional email + WhatsApp copy.
 * Table + inline CSS for Gmail / Outlook / Apple Mail. No emoji.
 */

import type { CartItem } from "../schemas/cart";
import type { Order } from "../schemas/order";
import { cdnUploadUrl, resolveProductImageUrl } from "./image-url";
import { displayOrderRef } from "./order-number";

const SITE_NAME = "BlossomPot";
const PRIMARY = "#C23A6B";
const PRIMARY_DARK = "#9E2E57";
const BLUSH = "#F8EEF2";
const CREAM = "#FFF8F5";
const INK = "#2A1F24";
const MUTED = "#6B5560";
const LINE = "#EBD5DC";
const FOOTER_BG = "#1A3D34";

export const ORDER_CONFIRMED_HEADING = "Your Order is Confirmed!";
export const ORDER_CONFIRMED_FOLLOW_UP =
  "We will send you another email once your order is on the way.";
export const ORDER_DELIVERED_HEADING = "Your Order Has Been Delivered!";
export const ORDER_COMPLETE_HEADING = "Your Order is Complete!";
export const ORDER_REVIEW_HEADING = "We Value Your Feedback!";
export const ORDER_REVIEW_CTA = "Write a Review";
export const ORDER_SEO_BLURB =
  "BlossomPot is a premium USA gifting brand for fresh flowers, cakes, and thoughtfully curated gifts. Customers trust us for florist-quality arrangements, careful packing, and reliable on-time delivery that keeps celebrations personal.";

const TRUST_HIGHLIGHTS = [
  "100% Secure Payment",
  "Fresh & Premium Quality",
  "On-time Delivery",
] as const;

export function siteOrigin(): string {
  return (process.env.SITE_URL ?? "https://www.blossompot.com").replace(/\/$/, "");
}

function supportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "support@blossompot.com";
}

function orderEmail(): string {
  return process.env.NOTIFY_EMAIL?.trim()?.split(",")[0]?.trim() || "order@blossompot.com";
}

function isBlockedSupportPhone(raw: string): boolean {
  const compact = raw.replace(/\D/g, "");
  if (!compact) return true;
  return compact === "16692603819" || compact === "6692603819" || compact.replace(/^1/, "") === "6692603819";
}

function supportPhone(): string {
  const raw =
    process.env.SUPPORT_PHONE?.trim() || process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "";
  if (!raw || isBlockedSupportPhone(raw)) return "";
  return raw;
}

function supportPhoneHtmlRow(): string {
  const phone = supportPhone();
  if (!phone) return "";
  return `
                <tr>
                  <td align="center" style="padding:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#D7E4DF;">
                    Phone / WhatsApp: ${escapeHtml(phone)}
                  </td>
                </tr>`;
}

function supportPhoneTextLine(): string {
  const phone = supportPhone();
  return phone ? `Phone / WhatsApp: ${phone}` : "";
}

function logoUrl(): string {
  return `${siteOrigin()}/logo.png`;
}

export function orderReviewUrl(): string {
  return `${siteOrigin()}/reviews`;
}

/** Floral gifting banner — same editorial asset as the storefront hero. */
export function orderConfirmedBannerUrl(): string {
  return cdnUploadUrl("editorial/home-banner-flowers.jpg");
}

export const BLOSSOMPOT_SOCIAL_LINKS: { name: string; href: string; color: string; label: string }[] = [
  {
    name: "IG",
    href: "https://www.instagram.com/blossompot10/",
    color: "#C13584",
    label: "Instagram",
  },
  {
    name: "f",
    href: "https://www.facebook.com/profile.php?id=61594220485535",
    color: "#1877F2",
    label: "Facebook",
  },
  {
    name: "in",
    href: "https://www.linkedin.com/in/blossom-chary-13038b42b/",
    color: "#0A66C2",
    label: "LinkedIn",
  },
  {
    name: "X",
    href: "https://x.com/Blossompot10",
    color: "#111111",
    label: "X",
  },
  {
    name: "P",
    href: "https://in.pinterest.com/blossompot10/_profile/",
    color: "#E60023",
    label: "Pinterest",
  },
  {
    name: "YT",
    href: "https://www.youtube.com/@blossompot",
    color: "#FF0000",
    label: "YouTube",
  },
];

export function formatOrderMoney(amount: number, currency: string): string {
  const code = currency === "INR" ? "INR" : "USD";
  try {
    return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

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

function itemUnitPrice(item: CartItem): number {
  const addons = item.addons?.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) ?? 0;
  return item.price + addons;
}

export type ConfirmedOrderLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
  addons: string[];
};

export type ConfirmedOrderSummary = {
  customerName: string;
  orderRef: string;
  orderId: string;
  currency: string;
  lines: ConfirmedOrderLine[];
  subtotal: number;
  delivery: number;
  packaging: number;
  discount: number;
  tax: number;
  total: number;
  orderUrl: string;
};

export function packagingCharge(order: Order): number {
  const extra = (order as Order & { packaging?: number }).packaging;
  return typeof extra === "number" && Number.isFinite(extra) ? extra : 0;
}

export function summarizeConfirmedOrder(order: Order): ConfirmedOrderSummary {
  const currency = order.currency ?? "USD";
  const lines = (order.items ?? []).map((item) => {
    const unitPrice = itemUnitPrice(item);
    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      imageUrl: resolveProductImageUrl(item.image) || logoUrl(),
      addons: (item.addons ?? []).map((addon) =>
        addon.quantity > 1 ? `${addon.quantity}x ${addon.name}` : addon.name
      ),
    };
  });
  return {
    customerName: order.shippingAddress?.name?.trim() || "Valued customer",
    orderRef: displayOrderRef(order),
    orderId: order.orderId,
    currency,
    lines,
    subtotal: order.subtotal ?? 0,
    delivery: order.shipping ?? 0,
    packaging: packagingCharge(order),
    discount: order.discount ?? 0,
    tax: order.tax ?? 0,
    total: order.total ?? 0,
    orderUrl: `${siteOrigin()}/orders/${order.orderId}`,
  };
}

function moneyCell(amount: number, currency: string): string {
  return escapeHtml(formatOrderMoney(amount, currency));
}

function productRows(summary: ConfirmedOrderSummary): string {
  if (!summary.lines.length) {
    return `
                    <tr>
                      <td style="padding:14px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${MUTED};">
                        Order items will appear on your order page.
                      </td>
                    </tr>`;
  }

  return summary.lines
    .map((line) => {
      const addons = line.addons.length
        ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};padding-top:4px;">${line.addons
            .map((a) => escapeHtml(a))
            .join("<br/>")}</div>`
        : "";
      return `
                    <tr>
                      <td valign="top" style="padding:14px 0;border-bottom:1px solid ${LINE};">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                          <tr>
                            <td valign="top" width="76" style="padding-right:14px;">
                              <img src="${escAttr(line.imageUrl)}" width="72" height="72" alt="${escAttr(line.name)}" style="display:block;width:72px;height:72px;border:0;border-radius:10px;object-fit:cover;background-color:${BLUSH};" />
                            </td>
                            <td valign="top">
                              <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:21px;font-weight:bold;color:${INK};">
                                ${escapeHtml(line.name)}
                              </div>
                              ${addons}
                              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${MUTED};padding-top:6px;">
                                Qty ${line.quantity} &nbsp;&middot;&nbsp; ${moneyCell(line.unitPrice, summary.currency)} each
                              </div>
                            </td>
                            <td valign="top" align="right" width="90" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;font-weight:bold;color:${INK};white-space:nowrap;">
                              ${moneyCell(line.lineTotal, summary.currency)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`;
    })
    .join("");
}

function totalsRows(summary: ConfirmedOrderSummary): string {
  const rows: { label: string; value: string; strong?: boolean; muted?: boolean }[] = [
    { label: "Subtotal", value: formatOrderMoney(summary.subtotal, summary.currency) },
    {
      label: "Delivery charges",
      value:
        summary.delivery <= 0 ? "Free" : formatOrderMoney(summary.delivery, summary.currency),
    },
    {
      label: "Packaging charges",
      value:
        summary.packaging <= 0 ? "Free" : formatOrderMoney(summary.packaging, summary.currency),
    },
  ];
  if (summary.discount > 0) {
    rows.push({
      label: "Discount",
      value: `-${formatOrderMoney(summary.discount, summary.currency)}`,
      muted: true,
    });
  }
  if (summary.tax > 0) {
    rows.push({ label: "Tax", value: formatOrderMoney(summary.tax, summary.currency) });
  }
  rows.push({
    label: "Total amount",
    value: formatOrderMoney(summary.total, summary.currency),
    strong: true,
  });

  return rows
    .map((row) => {
      const color = row.strong ? PRIMARY_DARK : row.muted ? PRIMARY : MUTED;
      const weight = row.strong ? "bold" : "normal";
      const size = row.strong ? "16px" : "14px";
      const pad = row.strong ? "12px 0 0 0" : "6px 0";
      const border = row.strong ? `border-top:1px solid ${LINE};` : "";
      return `
                    <tr>
                      <td style="padding:${pad};${border}font-family:Arial,Helvetica,sans-serif;font-size:${size};line-height:22px;color:${color};font-weight:${weight};">
                        ${escapeHtml(row.label)}
                      </td>
                      <td align="right" style="padding:${pad};${border}font-family:Arial,Helvetica,sans-serif;font-size:${size};line-height:22px;color:${color};font-weight:${weight};white-space:nowrap;">
                        ${escapeHtml(row.value)}
                      </td>
                    </tr>`;
    })
    .join("");
}

function socialIconsHtml(): string {
  const cells = BLOSSOMPOT_SOCIAL_LINKS.map(
    (social) => `
                          <td align="center" valign="middle" width="36" height="36" bgcolor="${social.color}" style="padding:0;width:36px;height:36px;background-color:${social.color};border-radius:18px;">
                            <a href="${escAttr(social.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escAttr(social.label)}" style="display:block;width:36px;height:36px;line-height:36px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#ffffff;text-decoration:none;text-align:center;">${escapeHtml(social.name)}</a>
                          </td>
                          <td width="8" style="font-size:0;line-height:0;">&nbsp;</td>`
  ).join("");
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                      <tr>${cells}</tr>
                    </table>`;
}

function orderItemTextLines(summary: ConfirmedOrderSummary, style: "email" | "whatsapp"): string {
  return summary.lines
    .map((line) => {
      const addon = line.addons.length ? ` (${line.addons.join(", ")})` : "";
      if (style === "email") {
        return `- ${line.name}${addon} x ${line.quantity} @ ${formatOrderMoney(line.unitPrice, summary.currency)} = ${formatOrderMoney(line.lineTotal, summary.currency)}`;
      }
      return `${line.name}${addon} x ${line.quantity} - ${formatOrderMoney(line.lineTotal, summary.currency)}`;
    })
    .join("\n");
}

function orderTotalsText(summary: ConfirmedOrderSummary): string {
  const discountLine =
    summary.discount > 0 ? `Discount: -${formatOrderMoney(summary.discount, summary.currency)}\n` : "";
  const taxLine = summary.tax > 0 ? `Tax: ${formatOrderMoney(summary.tax, summary.currency)}\n` : "";
  return `Subtotal: ${formatOrderMoney(summary.subtotal, summary.currency)}
Delivery charges: ${summary.delivery <= 0 ? "Free" : formatOrderMoney(summary.delivery, summary.currency)}
Packaging charges: ${summary.packaging <= 0 ? "Free" : formatOrderMoney(summary.packaging, summary.currency)}
${discountLine}${taxLine}Total amount: ${formatOrderMoney(summary.total, summary.currency)}`;
}

function ctaButtonHtml(href: string, label: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:8px;">
                    <a href="${escAttr(href)}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
                  </td>
                </tr>
              </table>`;
}

function trustHighlightsHtml(): string {
  return TRUST_HIGHLIGHTS.map(
    (line) => `
                      <tr>
                        <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:0.04em;text-transform:uppercase;color:#F3D5C2;padding:4px;">${escapeHtml(line)}</td>
                      </tr>`
  ).join("");
}

type PremiumOrderEmailCopy = {
  heading: string;
  intro: string;
  preheader: string;
  afterOrderHtml: string;
};

function buildPremiumOrderEmailHtml(order: Order, copy: PremiumOrderEmailCopy): string {
  const s = summarizeConfirmedOrder(order);
  const origin = siteOrigin();
  const banner = orderConfirmedBannerUrl();
  const logo = logoUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(copy.heading)} — ${escapeHtml(SITE_NAME)}</title>
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
    td, th, div, p, a, h1, h2, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .mobile-pad { padding-left: 18px !important; padding-right: 18px !important; }
      .heading { font-size: 24px !important; line-height: 30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BLUSH};width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(copy.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${BLUSH};">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:600px;max-width:600px;background-color:#ffffff;">

          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <a href="${escAttr(origin)}" target="_blank" style="text-decoration:none;">
                <img class="fluid" src="${escAttr(banner)}" width="600" alt="BlossomPot flowers and gifts" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
              </a>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" align="center" style="padding:28px 36px 8px 36px;background-color:${CREAM};">
              <a href="${escAttr(origin)}" target="_blank" style="text-decoration:none;">
                <img src="${escAttr(logo)}" width="168" alt="${SITE_NAME}" style="display:block;width:168px;max-width:58%;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" align="center" style="padding:12px 36px 6px 36px;background-color:${CREAM};">
              <h1 class="heading" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:36px;font-weight:bold;color:${PRIMARY};">
                ${escapeHtml(copy.heading)}
              </h1>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" style="padding:0 36px 24px 36px;background-color:${CREAM};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${MUTED};">
                ${escapeHtml(copy.intro)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:0 36px 8px 36px;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${BLUSH};border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};padding-bottom:4px;">Customer</td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};padding-bottom:4px;">Order ID</td>
                      </tr>
                      <tr>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:22px;font-weight:bold;color:${INK};">${escapeHtml(s.customerName)}</td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:bold;color:${PRIMARY_DARK};">${escapeHtml(s.orderRef)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:20px 36px 8px 36px;background-color:#ffffff;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${PRIMARY};font-weight:bold;padding-bottom:4px;">
                Order Details
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${productRows(s)}
              </table>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:8px 36px 16px 36px;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${totalsRows(s)}
              </table>
            </td>
          </tr>

          ${copy.afterOrderHtml}

          <tr>
            <td class="mobile-pad" style="padding:32px 28px 36px 28px;background-color:${FOOTER_BG};text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 16px 0;">
                    <a href="${escAttr(origin)}" target="_blank" style="text-decoration:none;">
                      <img src="${escAttr(logo)}" width="140" alt="${SITE_NAME}" style="display:block;width:140px;max-width:50%;height:auto;border:0;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:8px;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 16px 0;">
                    ${socialIconsHtml()}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#D7E4DF;">
                    Website:
                    <a href="${escAttr(origin)}" target="_blank" style="color:#F3D5C2;text-decoration:underline;">www.blossompot.com</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#D7E4DF;">
                    Support:
                    <a href="mailto:${escAttr(supportEmail())}" style="color:#F3D5C2;text-decoration:underline;">${escapeHtml(supportEmail())}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#D7E4DF;">
                    Orders:
                    <a href="mailto:${escAttr(orderEmail())}" style="color:#F3D5C2;text-decoration:underline;">${escapeHtml(orderEmail())}</a>
                  </td>
                </tr>
                ${supportPhoneHtmlRow()}
                <tr>
                  <td align="center" style="padding:0 0 16px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      ${trustHighlightsHtml()}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9BB5AC;">
                    &copy; ${year} ${SITE_NAME}. All rights reserved.
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

function confirmedAfterOrderHtml(orderUrl: string): string {
  return `
          <tr>
            <td class="mobile-pad" align="center" style="padding:8px 36px 12px 36px;background-color:#ffffff;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;font-style:italic;color:${INK};">
                ${escapeHtml(ORDER_CONFIRMED_FOLLOW_UP)}
              </p>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" style="padding:8px 36px 32px 36px;background-color:#ffffff;">
              ${ctaButtonHtml(orderUrl, "View your order")}
            </td>
          </tr>`;
}

function deliveredAfterOrderHtml(): string {
  const reviewHref = orderReviewUrl();
  return `
          <tr>
            <td class="mobile-pad" align="center" style="padding:12px 36px 8px 36px;background-color:${CREAM};">
              <h2 style="margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;font-weight:bold;color:${PRIMARY};">
                ${escapeHtml(ORDER_REVIEW_HEADING)}
              </h2>
              <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
                Your experience helps other customers choose BlossomPot with confidence. Please take a moment to share how your flowers and gifts arrived.
              </p>
              ${ctaButtonHtml(reviewHref, ORDER_REVIEW_CTA)}
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" align="center" style="padding:22px 36px 28px 36px;background-color:#ffffff;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${PRIMARY};font-weight:bold;padding-bottom:8px;">
                About BlossomPot
              </div>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
                ${escapeHtml(ORDER_SEO_BLURB)}
              </p>
            </td>
          </tr>`;
}

export function buildOrderConfirmedEmailText(order: Order): string {
  const s = summarizeConfirmedOrder(order);
  const itemLines = orderItemTextLines(s, "email") || "- See your order page for item details";
  return `Hi ${s.customerName},

Thank you for choosing ${SITE_NAME}. ${ORDER_CONFIRMED_HEADING}

Customer: ${s.customerName}
Order ID: ${s.orderRef}

Order Details
${itemLines}

${orderTotalsText(s)}

${ORDER_CONFIRMED_FOLLOW_UP}

View your order: ${s.orderUrl}

Customer support
Email: ${supportEmail()}
Orders: ${orderEmail()}
${supportPhoneTextLine()}

${TRUST_HIGHLIGHTS.join("  |  ")}

${SITE_NAME}
${siteOrigin()}`.replace(/\n{3,}/g, "\n\n");
}

export function buildOrderConfirmedWhatsAppMessage(order: Order): string {
  const s = summarizeConfirmedOrder(order);
  const itemLines = orderItemTextLines(s, "whatsapp") || "See your order page for item details";
  return `Hi ${s.customerName},

Your ${SITE_NAME} order is confirmed.

Customer: ${s.customerName}
Order ID: ${s.orderRef}

Order details:
${itemLines}

${orderTotalsText(s)}

We will send you another message once your order is on the way.

${s.orderUrl}`.replace(/\n{3,}/g, "\n\n");
}

export function buildOrderConfirmedEmailHtml(order: Order): string {
  const s = summarizeConfirmedOrder(order);
  return buildPremiumOrderEmailHtml(order, {
    heading: ORDER_CONFIRMED_HEADING,
    intro: `Thank you for choosing ${SITE_NAME}. We are preparing your gift with care.`,
    preheader: `${ORDER_CONFIRMED_HEADING} Order ${s.orderRef} — thank you for choosing ${SITE_NAME}.`,
    afterOrderHtml: confirmedAfterOrderHtml(s.orderUrl),
  });
}

export type DeliveredNotifyKind = "delivered" | "complete";

function deliveredCopy(kind: DeliveredNotifyKind): { heading: string; intro: string; statusLine: string } {
  if (kind === "complete") {
    return {
      heading: ORDER_COMPLETE_HEADING,
      intro: "Thank you for celebrating with BlossomPot. We hope your gift arrived beautifully and on time.",
      statusLine: `Your ${SITE_NAME} order is complete.`,
    };
  }
  return {
    heading: ORDER_DELIVERED_HEADING,
    intro: "Your gift has arrived. We hope it brought a smile and made the occasion feel special.",
    statusLine: `Your ${SITE_NAME} order has been delivered.`,
  };
}

export function buildOrderDeliveredEmailText(order: Order, kind: DeliveredNotifyKind = "delivered"): string {
  const s = summarizeConfirmedOrder(order);
  const copy = deliveredCopy(kind);
  const itemLines = orderItemTextLines(s, "email") || "- See your order page for item details";
  return `Hi ${s.customerName},

${copy.heading}

${copy.intro}

Customer: ${s.customerName}
Order ID: ${s.orderRef}

Order Details
${itemLines}

${orderTotalsText(s)}

${ORDER_REVIEW_HEADING}
Your experience helps other customers choose BlossomPot with confidence. Please share how your flowers and gifts arrived.
${ORDER_REVIEW_CTA}: ${orderReviewUrl()}

${ORDER_SEO_BLURB}

Customer support
Email: ${supportEmail()}
Orders: ${orderEmail()}
${supportPhoneTextLine()}
Website: ${siteOrigin()}

${TRUST_HIGHLIGHTS.join("  |  ")}

${SITE_NAME}
${siteOrigin()}`.replace(/\n{3,}/g, "\n\n");
}

export function buildOrderDeliveredWhatsAppMessage(
  order: Order,
  kind: DeliveredNotifyKind = "delivered"
): string {
  const s = summarizeConfirmedOrder(order);
  const copy = deliveredCopy(kind);
  const itemLines = orderItemTextLines(s, "whatsapp") || "See your order page for item details";
  return `Hi ${s.customerName},

${copy.statusLine}

Customer: ${s.customerName}
Order ID: ${s.orderRef}

Order details:
${itemLines}

${orderTotalsText(s)}

We would love your feedback. Please write a short review:
${orderReviewUrl()}`.replace(/\n{3,}/g, "\n\n");
}

export function buildOrderDeliveredEmailHtml(
  order: Order,
  kind: DeliveredNotifyKind = "delivered"
): string {
  const s = summarizeConfirmedOrder(order);
  const copy = deliveredCopy(kind);
  return buildPremiumOrderEmailHtml(order, {
    heading: copy.heading,
    intro: copy.intro,
    preheader: `${copy.heading} Order ${s.orderRef} — thank you for choosing ${SITE_NAME}.`,
    afterOrderHtml: deliveredAfterOrderHtml(),
  });
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/u;

export function containsEmoji(value: string): boolean {
  return EMOJI_RE.test(value);
}
