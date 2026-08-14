import { site, navItems, faqs, giftSetsMenu } from "@/lib/site";
import { categoryHref } from "@/lib/category-urls";
import { siteUrl } from "@/lib/env";

const OFF_TOPIC_REPLY = `I'm here specifically to help with BlossomPot — flowers, cakes, and gifts for USA delivery, our products, shipping, and orders. Is there something about gift delivery I can help with?

Browse our catalog: [All Products](${siteUrl}/products) · WhatsApp: ${site.whatsappDisplay}`;

const SITE_KEYWORDS =
  /\b(gift|flower|bouquet|cake|hamper|birthday|anniversary|valentine|mother|wedding|usa|us\b|shipping|deliver|order|payment|stripe|razorpay|product|categor|chocolate|same.?day|california|texas|new york|florida|india|checkout|cart|price|track|support|blossompot)\b/i;

function categoriesReply(): string {
  const links = [
    ...giftSetsMenu.items.map((n) => `- [${n.label}](${siteUrl}${n.href})`),
    ...navItems
      .filter((n): n is typeof n & { category: string } => "category" in n)
      .map((n) => `- [${n.label}](${siteUrl}${n.href})`),
  ].join("\n");

  return `We sell premium flowers, cakes, and gifts for USA delivery:\n\n${links}\n- [All Products](${siteUrl}/products)\n\nPopular picks include [Flowers](${siteUrl}${categoryHref("flowers")}), [Cakes](${siteUrl}${categoryHref("cakes")}), and [Gift Hampers](${siteUrl}${categoryHref("gift-hampers")}).`;
}

function deliveryReply(): string {
  return `We deliver gifts across the United States. Nationwide delivery is available to all 50 states, with faster windows to major metros when available. Same-day options appear in select cities when you order before the local cut-off.\n\nMore details: [Shipping & Delivery](${siteUrl}/shipping)`;
}

function occasionReply(): string {
  return `BlossomPot is built for celebrations year-round — birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and thank-yous.\n\nStart browsing: [Birthday gifts](${siteUrl}${categoryHref("birthday-gifts")}) · [Anniversary gifts](${siteUrl}${categoryHref("anniversary-gifts")}) · [Flowers](${siteUrl}${categoryHref("flowers")})`;
}

function orderFromAbroadReply(): string {
  return `Yes! You can order from India, the UK, Canada, Australia, and worldwide.\n\nEnter your recipient's USA delivery address at checkout. We fulfill for US delivery — clear tracking and responsive support.\n\nReady to shop? [Browse all gifts](${siteUrl}/products)`;
}

function paymentReply(): string {
  return `We accept secure online checkout via:\n- Stripe (USD)\n- Razorpay (INR)\n\nPrices are shown in USD or INR at checkout. We never store card details.\n\nQuestions about a specific order? WhatsApp us at ${site.whatsappDisplay} or email ${site.supportEmail}.`;
}

function greetingReply(): string {
  return `Welcome to BlossomPot! I can help you find flowers, cakes, and gifts, explain USA delivery, or answer questions about shipping and payment.\n\nPopular picks:\n- [Flowers](${siteUrl}${categoryHref("flowers")})\n- [Cakes](${siteUrl}${categoryHref("cakes")})\n- [Gift Hampers](${siteUrl}${categoryHref("gift-hampers")})\n\nWhat would you like to know?`;
}

function findFaqMatch(query: string): string | null {
  const q = query.toLowerCase();
  for (const faq of faqs) {
    const faqWords = faq.q.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const matches = faqWords.filter((w) => q.includes(w)).length;
    if (matches >= 2) return faq.a;
  }
  return null;
}

/** Rule-based replies when OPENAI_API_KEY is not configured. */
export function fallbackChatReply(userMessage: string): string {
  const q = userMessage.trim().toLowerCase();

  if (!q) return greetingReply();

  if (!SITE_KEYWORDS.test(q)) {
    return OFF_TOPIC_REPLY;
  }

  if (/type|sell|categor|collection|what.*gift|which gift|offer|product|flower|cake|bouquet|hamper/.test(q)) {
    return categoriesReply();
  }

  if (/deliver|shipping|how long|when.*arriv|business day|state|same.?day|california|texas|new york/.test(q)) {
    return deliveryReply();
  }

  if (/birthday|anniversary|valentine|mother|wedding|occasion|festival|celebration/.test(q)) {
    return occasionReply();
  }

  if (/india|uk|canada|australia|abroad|from india|international|worldwide|outside/.test(q)) {
    return orderFromAbroadReply();
  }

  if (/payment|pay|stripe|razorpay|usd|inr|card|checkout/.test(q)) {
    return paymentReply();
  }

  if (/hello|hi\b|hey|help|start/.test(q) && q.length < 30) {
    return greetingReply();
  }

  if (/contact|support|email|whatsapp|phone|call|track|order status|refund|cancel/.test(q)) {
    return `For order-specific help (tracking, changes, refunds), our team responds fastest on WhatsApp ${site.whatsappDisplay} or email ${site.supportEmail}.\n\nGeneral info: [FAQ](${siteUrl}/faq) · [Contact Us](${siteUrl}/contact)`;
  }

  if (/cake|chocolate|dessert/.test(q)) {
    return `Our [Cakes](${siteUrl}${categoryHref("cakes")}) collection covers chocolate, red velvet, designer birthday cakes, and more — with USA delivery and gift-message options.\n\n[Shop cakes](${siteUrl}${categoryHref("cakes")})`;
  }

  if (/flower|bouquet|rose|bloom/.test(q)) {
    return `Browse [Flowers](${siteUrl}${categoryHref("flowers")}) and [Flower Bouquets](${siteUrl}${categoryHref("flower-bouquets")}) for birthdays, anniversaries, and everyday surprises — delivered across the USA.\n\n[Shop flowers](${siteUrl}${categoryHref("flowers")})`;
  }

  const faqAnswer = findFaqMatch(q);
  if (faqAnswer) return faqAnswer;

  return `Thanks for your question! BlossomPot delivers flowers, cakes, and thoughtful gifts across the United States.\n\n- [Shop all gifts](${siteUrl}/products)\n- [Shipping info](${siteUrl}/shipping)\n- [FAQ](${siteUrl}/faq)\n\nFor order help: WhatsApp ${site.whatsappDisplay} or ${site.supportEmail}`;
}
