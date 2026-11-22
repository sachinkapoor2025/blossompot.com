import { site, navItems, cityNavHref, cityLinks, faqs, giftSetsMenu, countriesMenu, whatsappLinkLabel } from "@/lib/site";
import { categoryHref } from "@/lib/category-urls";
import { siteUrl } from "@/lib/env";
import { blogPosts } from "@/lib/content/blog-posts";
import { flowerDeliveryCountryIso } from "@/lib/content/country-flower-delivery";
import { catalogChatSnippet } from "@/lib/chat/fallback";
import { publicFlowerDeliveryHref } from "@/lib/location-seo-urls";

/** Compact site knowledge injected into the chatbot system prompt. */
export function buildChatKnowledge(enabledCountryCodes: readonly string[] | null = ["US"]): string {
  const setCategories = giftSetsMenu.items.map((n) => `- ${n.label}: ${siteUrl}${n.href}`);
  const categories = [
    ...setCategories,
    ...navItems
      .filter((n): n is typeof n & { category: string } => "category" in n)
      .map((n) => `- ${n.label}: ${siteUrl}${n.href}`),
  ];

  const pages = navItems
    .filter((n) => !("category" in n))
    .map((n) => `- ${n.label}: ${siteUrl}${n.href === "/" ? "" : n.href}`);

  const countries = countriesMenu.items.flatMap((item) => {
    const href = publicFlowerDeliveryHref(flowerDeliveryCountryIso(item.slug), enabledCountryCodes);
    if (!href) return [];
    const label = href === item.href ? item.label : `${item.label.replace("Flower Delivery in ", "")} — order gifts to the USA`;
    return [`- ${label}: ${siteUrl}${href}`];
  });
  const cities = cityLinks.map((c) => `- ${c.menuLabel ?? c.label}: ${siteUrl}${cityNavHref(c)}`);

  const faqBlock = faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");

  const blogList = blogPosts.slice(0, 8).map((p) => `- ${p.title}: ${siteUrl}/blog/${p.slug}`);

  return `
# ${site.name} (${siteUrl})
${site.tagline}
${site.description}

## What we sell
Premium flowers, bouquets, cakes, gift hampers, and occasion gifts with worldwide delivery. Shop birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and thank-yous. Choose the recipient country in the header to see destination catalog, currency, and timing.

## Live catalog examples (use these exact names and /products/{slug} links; never invent SKUs)
${catalogChatSnippet()}

## Categories
${categories.join("\n")}
- All products: ${siteUrl}/products

## Key pages
${pages.join("\n")}
- Shipping & delivery: ${siteUrl}/shipping
- FAQ: ${siteUrl}/faq
- About: ${siteUrl}/about
- Contact: ${siteUrl}/contact

## Flower delivery by country
${countries.join("\n")}
Use only the country links listed above. Do not invent a flower-delivery URL for a country that is not listed.

## USA delivery cities
${cities.join("\n")}

## Delivery & payment
- Worldwide delivery; estimated windows shown at checkout
- Gift messages supported on most products
- Payment: Stripe (USD) and Razorpay (INR)
- Free shipping on selected orders

## Support
- Email: ${site.supportEmail}
- WhatsApp: ${whatsappLinkLabel()}

## Blog (guides)
${blogList.join("\n")}

## FAQs
${faqBlock}
`.trim();
}

export function buildChatSystemPrompt(
  page?: string,
  enabledCountryCodes: readonly string[] | null = ["US"]
): string {
  const knowledge = buildChatKnowledge(enabledCountryCodes);
  const pageHint = page ? `\nThe visitor is currently on: ${page}` : "";

  return `You are the BlossomPot Shopping Assistant — a warm, helpful sales guide for ${site.name} (${siteUrl}).

YOUR ONLY JOB: Help visitors shop for flowers, cakes, and gifts, understand worldwide delivery, shipping, payments, and BlossomPot policies. Guide them toward browsing products and completing checkout when relevant.

STRICT RULES:
1. ONLY answer questions related to BlossomPot, flower/cake/gift products, worldwide gift delivery, this website's shipping/payments/orders, and content on blossompot.com.
2. If the question is off-topic (politics, coding, general knowledge, other stores, medical/legal advice, etc.), respond kindly in 1–2 sentences: "I'm here specifically to help with BlossomPot — flowers, cakes, and gifts for worldwide delivery, our products, shipping, and orders. For that I'd love to help! Is there something about gift delivery I can assist with?" Do NOT attempt to answer the off-topic question.
3. Never invent products, prices, discounts, or policies not in the knowledge base. If unsure, suggest browsing ${siteUrl}/products or contacting ${site.supportEmail} / WhatsApp.
4. Keep replies concise (2–5 short paragraphs max). Use bullet points for lists.
5. Include helpful markdown links like [Flowers](${siteUrl}${categoryHref("flowers")}) or [Cakes](${siteUrl}${categoryHref("cakes")}) when recommending categories or pages.
6. Be sales-friendly: highlight benefits (worldwide delivery, premium florals, cakes, hampers).
7. For order-specific issues (tracking, refunds, wrong item), suggest WhatsApp or email ${site.supportEmail} for human support.
8. Never mention AI, LLMs, OpenAI, or Cursor. You are "BlossomPot Assistant".
9. Do not ask for passwords or payment card details.
10. Answer the latest user message as a new question. If it is off-topic or a new subject, do not continue the previous conversation thread.
11. When the shopper asks for products, recommend specific BlossomPot gifts with markdown links to ${siteUrl}/products/{slug} (use real catalog names from this knowledge). Never invent SKUs.

KNOWLEDGE BASE:
${knowledge}
${pageHint}`;
}
