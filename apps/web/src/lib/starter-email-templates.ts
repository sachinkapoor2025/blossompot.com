/** Starter marketing templates installed into Admin → Marketing Emails → Templates. */

import {
  DEFAULT_PREMIUM_MARKETING_EMAIL_CONTENT,
  PREMIUM_MARKETING_EMAIL_LAYOUT,
  buildPremiumMarketingEmailHtml,
  buildFreeShippingEmailHtml,
  buildStartingPriceEmailHtml,
  buildShopMoreSaveMoreEmailHtml,
  buildRakhiHampersUsaEmailHtml,
  buildIndependenceDayEmailHtml,
  FREE_SHIPPING_EMAIL_CONFIG,
  STARTING_PRICE_EMAIL_CONFIG,
  SHOP_MORE_SAVE_MORE_EMAIL_CONFIG,
  RAKHI_HAMPERS_USA_EMAIL_CONFIG,
  INDEPENDENCE_DAY_EMAIL_CONFIG,
  type MarketingEmailContent,
} from "@blossompot/shared";

export type StarterEmailTemplateMeta = {
  templateId: string;
  name: string;
  subject: string;
  /** Public URL path (served from apps/web/public) — optional when contentFields/buildHtml provided. */
  htmlPath?: string;
  /** Structured layout for Admin visual editor. */
  layout?: typeof PREMIUM_MARKETING_EMAIL_LAYOUT;
  contentFields?: MarketingEmailContent;
  /** Code-built HTML (campaign templates). Preferred over htmlPath when set. */
  buildHtml?: () => string;
  /**
   * When true (default for structured templates), never overwrite an existing
   * DynamoDB template so Admin field edits are preserved.
   */
  preserveAdminEdits?: boolean;
};

export const RAKSHA_BANDHAN_TEMPLATE_ID = "raksha-bandhan-usa";
export const PREMIUM_RAKSHA_BANDHAN_TEMPLATE_ID = "premium-raksha-bandhan";
export const FREE_SHIPPING_TEMPLATE_ID = FREE_SHIPPING_EMAIL_CONFIG.templateId;
export const STARTING_PRICE_TEMPLATE_ID = STARTING_PRICE_EMAIL_CONFIG.templateId;
export const SHOP_MORE_SAVE_MORE_TEMPLATE_ID = SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.templateId;
export const RAKHI_HAMPERS_USA_TEMPLATE_ID = RAKHI_HAMPERS_USA_EMAIL_CONFIG.templateId;
export const INDEPENDENCE_DAY_TEMPLATE_ID = INDEPENDENCE_DAY_EMAIL_CONFIG.templateId;

export const STARTER_EMAIL_TEMPLATES: StarterEmailTemplateMeta[] = [
  {
    templateId: RAKSHA_BANDHAN_TEMPLATE_ID,
    name: "Raksha Bandhan USA",
    subject: "Celebrate Raksha Bandhan Across Miles",
    htmlPath: "/email-templates/raksha-bandhan-usa.html",
  },
  {
    templateId: PREMIUM_RAKSHA_BANDHAN_TEMPLATE_ID,
    name: "Premium Raksha Bandhan (Editable)",
    subject: "Celebrate Raksha Bandhan Across Miles — BlossomPot",
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
    templateId: STARTING_PRICE_TEMPLATE_ID,
    name: STARTING_PRICE_EMAIL_CONFIG.name,
    subject: STARTING_PRICE_EMAIL_CONFIG.subject,
    buildHtml: () => buildStartingPriceEmailHtml(),
    htmlPath: "/email-templates/rakhi-starting-265.html",
  },
  {
    templateId: SHOP_MORE_SAVE_MORE_TEMPLATE_ID,
    name: SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.name,
    subject: SHOP_MORE_SAVE_MORE_EMAIL_CONFIG.subject,
    buildHtml: () => buildShopMoreSaveMoreEmailHtml(),
    htmlPath: "/email-templates/shop-more-save-more.html",
  },
  {
    templateId: RAKHI_HAMPERS_USA_TEMPLATE_ID,
    name: RAKHI_HAMPERS_USA_EMAIL_CONFIG.name,
    subject: RAKHI_HAMPERS_USA_EMAIL_CONFIG.subject,
    buildHtml: () => buildRakhiHampersUsaEmailHtml(),
    htmlPath: "/email-templates/rakhi-hampers-to-usa.html",
  },
  {
    templateId: INDEPENDENCE_DAY_TEMPLATE_ID,
    name: INDEPENDENCE_DAY_EMAIL_CONFIG.name,
    subject: INDEPENDENCE_DAY_EMAIL_CONFIG.subject,
    buildHtml: () => buildIndependenceDayEmailHtml(),
    htmlPath: "/email-templates/india-independence-day-offer.html",
  },
];

export function resolveStarterHtmlBody(starter: StarterEmailTemplateMeta, fileHtml?: string): string {
  if (starter.buildHtml) {
    return starter.buildHtml();
  }
  if (starter.contentFields && starter.layout === PREMIUM_MARKETING_EMAIL_LAYOUT) {
    return buildPremiumMarketingEmailHtml(starter.contentFields);
  }
  if (starter.contentFields) {
    return buildPremiumMarketingEmailHtml(starter.contentFields);
  }
  return fileHtml?.trim() || "";
}
