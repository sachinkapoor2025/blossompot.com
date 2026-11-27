/**
 * Campaign email for the Celebrate Life's Special Moments design.
 * Shop buttons are real links to blossompot.com. At send time each recipient
 * gets a different pair (cakes, flowers, birthday, and so on). Other templates
 * do not use these buttons.
 */

import { EMAIL_IMAGES, emailImgAttributes } from "./email-images";

const SITE = "https://www.blossompot.com";
const ROSE = "#C23A6B";
const INK = "#1A3D34";
const SCRIPT = "#C23A6B";
const PAGE = "#FFF0F5";
const CARD = "#FFFFFF";
const MUTED = "#5C4A52";
const WHITE = "#ffffff";

export const CELEBRATE_MOMENTS_EMAIL_TEMPLATE_ID = "celebrate-life-moments";
export const CELEBRATE_MOMENTS_EMAIL_NAME = "Celebrate Life's Special Moments";
export const CELEBRATE_MOMENTS_EMAIL_SUBJECT = "Celebrate life's special moments with BlossomPot";

export type CampaignShopButton = {
  label: string;
  href: string;
};

/** Buttons a recipient can be shown. Each one opens a live BlossomPot page. */
export const CAMPAIGN_SHOP_BUTTONS: readonly CampaignShopButton[] = [
  { label: "Shop Birthday", href: `${SITE}/birthday-gifts` },
  { label: "Shop Anniversary", href: `${SITE}/anniversary-gifts` },
  { label: "Shop Cakes", href: `${SITE}/cakes` },
  { label: "Shop Flowers", href: `${SITE}/flowers` },
  { label: "Shop Bouquets", href: `${SITE}/bouquets` },
  { label: "Shop Hampers", href: `${SITE}/gift-hampers` },
  { label: "Shop Christmas", href: `${SITE}/christmas-gifts` },
  { label: "Shop New Year", href: `${SITE}/new-year-gifts` },
  { label: "Shop Valentine's", href: `${SITE}/valentines-day-gifts` },
];

function hashEmail(email: string): number {
  let hash = 2166136261;
  for (let index = 0; index < email.length; index += 1) {
    hash ^= email.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable pair for one recipient. A missing address keeps the design defaults. */
export function shopButtonsForRecipient(email?: string): [CampaignShopButton, CampaignShopButton] {
  const first = CAMPAIGN_SHOP_BUTTONS[0]!;
  const second = CAMPAIGN_SHOP_BUTTONS[1]!;
  const key = email?.trim().toLowerCase();
  if (!key) return [first, second];
  const count = CAMPAIGN_SHOP_BUTTONS.length;
  const hash = hashEmail(key);
  const left = hash % count;
  let right = Math.floor(hash / count) % (count - 1);
  if (right >= left) right += 1;
  return [CAMPAIGN_SHOP_BUTTONS[left]!, CAMPAIGN_SHOP_BUTTONS[right]!];
}

function fillShopSlot(html: string, slot: "1" | "2", button: CampaignShopButton): string {
  return html.replace(
    new RegExp(`<a\\b(?=[^>]*\\bdata-shop-slot="${slot}")[^>]*>[\\s\\S]*?</a>`, "i"),
    (tag) => {
      const open = tag.slice(0, tag.indexOf(">") + 1).replace(/href="[^"]*"/i, `href="${button.href}"`);
      return `${open}${button.label} &#8250;</a>`;
    }
  );
}

/**
 * Rewrites only the Celebrate Moments shop buttons.
 * HTML without those buttons is returned unchanged.
 */
function fillHrefSlot(html: string, slot: "1" | "2", href: string): string {
  return html.replace(
    new RegExp(`<a\\b(?=[^>]*\\bdata-shop-href="${slot}")[^>]*>`, "gi"),
    (open) => open.replace(/href="[^"]*"/i, `href="${href}"`)
  );
}

export function applyCampaignShopButtons(html: string, email?: string): string {
  if (!html.includes("data-shop-slot=")) return html;
  const [left, right] = shopButtonsForRecipient(email);
  return fillHrefSlot(
    fillHrefSlot(fillShopSlot(fillShopSlot(html, "1", left), "2", right), "1", left.href),
    "2",
    right.href
  );
}

function shopButton(slot: "1" | "2", button: CampaignShopButton): string {
  return `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                            <tr>
                              <td align="center" bgcolor="${ROSE}" style="background-color:${ROSE};border-radius:24px;">
                                <a data-shop-slot="${slot}" href="${button.href}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;font-weight:bold;color:${WHITE};text-decoration:none;border-radius:24px;">${button.label} &#8250;</a>
                              </td>
                            </tr>
                          </table>`;
}

function card(input: {
  slot: "1" | "2";
  button: CampaignShopButton;
  title: string;
  message: string;
  imageUrl: string;
  imageAlt: string;
  tint: string;
}): string {
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${input.tint};border:1px solid #F3D5E0;border-radius:22px;">
                      <tr>
                        <td align="center" style="padding:22px 16px 8px 16px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:36px;color:${SCRIPT};font-style:italic;">${input.title}</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:0 18px 12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:${MUTED};">${input.message}</td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:0 12px 14px 12px;line-height:0;font-size:0;">
                          <a data-shop-href="${input.slot}" href="${input.button.href}" target="_blank" style="text-decoration:none;">
                            <img src="${input.imageUrl}" ${emailImgAttributes(input.imageUrl, 220)} alt="${input.imageAlt}" style="display:block;width:100%;max-width:220px;height:auto;border:0;margin:0 auto;border-radius:12px;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:0 12px 22px 12px;">
                          ${shopButton(input.slot, input.button)}
                        </td>
                      </tr>
                    </table>`;
}

export function buildCelebrateMomentsEmailHtml(): string {
  const [birthday, anniversary] = shopButtonsForRecipient();
  const logo = EMAIL_IMAGES.logo;
  const cake = EMAIL_IMAGES.cakes;
  const roses = EMAIL_IMAGES.anniversary;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Celebrate Life's Special Moments | BlossomPot</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Celebrate birthdays and anniversaries with cakes, flowers, and gifts from BlossomPot.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${PAGE};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr>
            <td align="center" style="padding:8px 0 6px 0;">
              <a href="${SITE}" target="_blank" style="text-decoration:none;">
                <img src="${logo.url}" ${emailImgAttributes(logo.url, 120)} alt="BlossomPot" style="display:block;width:120px;height:auto;border:0;margin:0 auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 16px 18px 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;color:${INK};font-style:italic;">Celebrate Life's Special Moments</td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td class="stack" width="50%" valign="top" style="width:50%;padding:0 8px 12px 0;">
                    ${card({
                      slot: "1",
                      button: birthday,
                      title: "Happy Birthday!",
                      message: "Send love with delicious cakes and beautiful gifts.",
                      imageUrl: cake.url,
                      imageAlt: "Birthday cake and flowers from BlossomPot",
                      tint: "#FFF7FA",
                    })}
                  </td>
                  <td class="stack" width="50%" valign="top" style="width:50%;padding:0 0 12px 8px;">
                    ${card({
                      slot: "2",
                      button: anniversary,
                      title: "Happy Anniversary!",
                      message: "Celebrate your love with cakes, flowers and more.",
                      imageUrl: roses.url,
                      imageAlt: "Anniversary roses from BlossomPot",
                      tint: CARD,
                    })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 16px 18px 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:${SCRIPT};font-style:italic;">Make Every Celebration Sweeter!</td>
          </tr>
          <tr>
            <td align="center" style="padding:0 16px 8px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">
              <a href="${SITE}" target="_blank" style="color:${ROSE};text-decoration:none;">www.blossompot.com</a>
              &nbsp;&middot;&nbsp;
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
