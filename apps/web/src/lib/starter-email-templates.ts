/** Starter marketing templates installed into Admin → Marketing Emails → Templates. */

import {
  DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT,
  PREMIUM_MARKETING_EMAIL_LAYOUT,
  buildPremiumMarketingEmailHtml,
  buildFreeShippingEmailHtml,
  buildShopMoreSaveMoreEmailHtml,
  FREE_SHIPPING_EMAIL_CONFIG,
  SHOP_MORE_SAVE_MORE_EMAIL_CONFIG,
  type MarketingEmailContent,
} from "@blossompot/shared";

export type StarterEmailTemplateMeta = {
  templateId: string;
  name: string;
  subject: string;
  htmlPath?: string;
  layout?: typeof PREMIUM_MARKETING_EMAIL_LAYOUT;
  contentFields?: MarketingEmailContent;
  buildHtml?: () => string;
  preserveAdminEdits?: boolean;
};

export const PREMIUM_GIFTS_TEMPLATE_ID = "premium-gifts-usa";
/** @deprecated legacy id retained so old admin installs still resolve */
export const RAKSHA_BANDHAN_TEMPLATE_ID = PREMIUM_GIFTS_TEMPLATE_ID;
/** @deprecated */
export const PREMIUM_RAKSHA_BANDHAN_TEMPLATE_ID = PREMIUM_GIFTS_TEMPLATE_ID;
export const FREE_SHIPPING_TEMPLATE_ID = FREE_SHIPPING_EMAIL_CONFIG.templateId;
export const SHOP_MORE_SAVE_MORE_TEMPLATE_ID = SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.templateId;
/** @deprecated removed Rakhi starters */
export const STARTING_PRICE_TEMPLATE_ID = "gifts-starting-offer";
/** @deprecated */
export const RAKHI_HAMPERS_USA_TEMPLATE_ID = "gift-hampers-usa";
/** @deprecated */
export const INDEPENDENCE_DAY_TEMPLATE_ID = "celebration-sale-usa";

export const STARTER_EMAIL_TEMPLATES: StarterEmailTemplateMeta[] = [
  {
    templateId: PREMIUM_GIFTS_TEMPLATE_ID,
    name: "Premium Gifts USA (Editable)",
    subject: "Send flowers, cakes & gifts across the USA — BlossomPot",
    layout: PREMIUM_MARKETING_EMAIL_LAYOUT,
    contentFields: DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT,
    preserveAdminEdits: true,
  },
  {
    templateId: FREE_SHIPPING_TEMPLATE_ID,
    name: FREE_SHIPPING_EMAIL_CONFIG.name,
    subject: FREE_SHIPPING_EMAIL_CONFIG.subject,
    buildHtml: () => buildFreeShippingEmailHtml(),
    htmlPath: "/email-templates/free-shipping-above-7.html",
  },
  {
    templateId: SHOP_MORE_SAVE_MORE_TEMPLATE_ID,
    name: SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.name,
    subject: SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.subject,
    buildHtml: () => buildShopMoreSaveMoreEmailHtml(),
    htmlPath: "/email-templates/shop-more-save-more.html",
  },
];

export function resolveStarterHtmlBody(starter: StarterEmailTemplateMeta, fileHtml?: string): string {
  if (starter.buildHtml) {
    return starter.buildHtml();
  }
  if (starter.contentFields) {
    return buildPremiumMarketingEmailHtml(starter.contentFields);
  }
  return fileHtml ?? "<p>Hello {{name}}</p>";
}
