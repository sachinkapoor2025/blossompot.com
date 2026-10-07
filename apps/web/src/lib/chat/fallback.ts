import { site, navItems, faqs, giftSetsMenu, whatsappLinkLabel } from "@/lib/site";
import { categoryHref } from "@/lib/category-urls";
import { siteUrl } from "@/lib/env";
import { getCatalogProducts } from "@/lib/catalog-fallback";

const OFF_TOPIC_REPLY = `I'm here specifically to help with BlossomPot — flowers, cakes, and gifts for worldwide delivery, our products, shipping, and orders. Is there something about gift delivery I can help with?

Browse our catalog: [All Products](${siteUrl}/products) · ${whatsappLinkLabel()}`;

const SITE_KEYWORDS =
  /\b(gift|flower|bouquet|cake|hamper|birthday|anniversary|valentine|mother|wedding|usa|us\b|shipping|deliver|order|payment|stripe|razorpay|product|categor|chocolate|same.?day|california|texas|new york|florida|india|checkout|cart|price|track|support|blossompot)\b/i;

export function isOnTopicGiftQuestion(query: string): boolean {
  return SITE_KEYWORDS.test(query.trim());
}

function categoriesReply(): string {
  const links = [
    ...giftSetsMenu.items.map((n) => `- [${n.label}](${siteUrl}${n.href})`),
    ...navItems
      .filter((n): n is typeof n & { category: string } => "category" in n)
      .map((n) => `- [${n.label}](${siteUrl}${n.href})`),
  ].join("\n");

  return `We sell premium flowers, cakes, and gifts for worldwide delivery:\n\n${links}\n- [All Products](${siteUrl}/products)\n\nPopular picks include [Flowers](${siteUrl}${categoryHref("flowers")}), [Cakes](${siteUrl}${categoryHref("cakes")}), and [Gift Hampers](${siteUrl}${categoryHref("gift-hampers")}).`;
}

function deliveryReply(): string {
  return `We deliver gifts **worldwide**. Choose the recipient country in the header or at checkout — timing, catalog, and currency follow that destination. Same-day options appear in select cities when you order before the local cut-off.\n\nMore details: [Shipping & Delivery](${siteUrl}/shipping)`;
}

function occasionReply(): string {
  return `BlossomPot is built for celebrations year-round — birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and thank-yous.\n\nStart browsing: [Birthday gifts](${siteUrl}${categoryHref("birthday-gifts")}) · [Anniversary gifts](${siteUrl}${categoryHref("anniversary-gifts")}) · [Flowers](${siteUrl}${categoryHref("flowers")})`;
}

function orderFromAbroadReply(): string {
  return `Yes! You can order from India, the UK, Canada, Australia, and worldwide.\n\nEnter the recipient address at checkout and choose their country. Tracking and support are included.\n\nReady to shop? [Browse all gifts](${siteUrl}/products)`;
}

function paymentReply(): string {
  return `We accept secure online checkout via:\n- Stripe (USD)\n- Razorpay (INR)\n\nPrices are shown in USD or INR at checkout. We never store card details.\n\nQuestions about a specific order? Message us on WhatsApp or email ${site.supportEmail}.`;
}

export function catalogChatSnippet(limit = 40): string {
  const products = getCatalogProducts();
  const picked: typeof products = [];
  const perCategory = new Map<string, number>();
  for (const product of products) {
    const slug = product.categorySlug || "gifts";
    const n = perCategory.get(slug) ?? 0;
    if (n >= 5) continue;
    perCategory.set(slug, n + 1);
    picked.push(product);
    if (picked.length >= limit) break;
  }
  return picked
    .map(
      (product) =>
        `- [${product.name}](${siteUrl}/products/${product.slug}) — ${product.currency} ${product.price.toFixed(2)} (${product.categorySlug})`
    )
    .join("\n");
}

export function productRecommendations(query: string): string | null {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && !/^(with|from|that|this|have|want|need|looking|some|your)$/.test(word));
  if (terms.length === 0) return null;
  const scored = getCatalogProducts()
    .map((product) => {
      const hay = `${product.name} ${product.categorySlug} ${(product.tags ?? []).join(" ")}`.toLowerCase();
      const hits = terms.filter((term) => hay.includes(term)).length;
      return { product, hits };
    })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.product.price - b.product.price)
    .slice(0, 5);
  if (scored.length === 0) return null;
  const lines = scored.map(
    ({ product }) => `- [${product.name}](${siteUrl}/products/${product.slug}) — ${product.currency} ${product.price.toFixed(2)}`
  );
  return `Here are BlossomPot gifts that match your question:\n\n${lines.join("\n")}\n\nOpen a product to see photos, price, and delivery options.`;
}

function greetingReply(): string {
  return `Welcome to BlossomPot! I can help you find flowers, cakes, and gifts, explain worldwide delivery, or answer questions about shipping and payment.\n\nPopular picks:\n- [Flowers](${siteUrl}${categoryHref("flowers")})\n- [Cakes](${siteUrl}${categoryHref("cakes")})\n- [Gift Hampers](${siteUrl}${categoryHref("gift-hampers")})\n\nWhat would you like to know?`;
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

  if (!isOnTopicGiftQuestion(q)) {
    return OFF_TOPIC_REPLY;
  }

  const recommended = productRecommendations(userMessage);
  if (recommended && /flower|bouquet|rose|bloom|plant|cake|chocolate|hamper|gift|product/.test(q)) {
    return recommended;
  }

  if (/type|sell|categor|collection|what.*gift|which gift|offer/.test(q)) {
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
    return `For order-specific help (tracking, changes, refunds), our team responds fastest on WhatsApp or email ${site.supportEmail}.\n\nGeneral info: [FAQ](${siteUrl}/faq) · [Contact Us](${siteUrl}/contact)`;
  }

  if (/cake|chocolate|dessert/.test(q)) {
    return (
      productRecommendations(userMessage) ??
      `Our [Cakes](${siteUrl}${categoryHref("cakes")}) collection covers chocolate, red velvet, designer birthday cakes, and more — with worldwide delivery and gift-message options.\n\n[Shop cakes](${siteUrl}${categoryHref("cakes")})`
    );
  }

  if (/flower|bouquet|rose|bloom|plant|hamper/.test(q)) {
    return (
      productRecommendations(userMessage) ??
      `Browse [Flowers](${siteUrl}${categoryHref("flowers")}) and [Flower Bouquets](${siteUrl}${categoryHref("flower-bouquets")}) for birthdays, anniversaries, and everyday surprises — delivered worldwide.\n\n[Shop flowers](${siteUrl}${categoryHref("flowers")})`
    );
  }

  if (recommended) return recommended;

  const faqAnswer = findFaqMatch(q);
  if (faqAnswer) return faqAnswer;

  return `Thanks for your question! BlossomPot delivers flowers, cakes, and thoughtful gifts worldwide.\n\n- [Shop all gifts](${siteUrl}/products)\n- [Shipping info](${siteUrl}/shipping)\n- [FAQ](${siteUrl}/faq)\n\nFor order help: ${whatsappLinkLabel()} or ${site.supportEmail}`;
}
