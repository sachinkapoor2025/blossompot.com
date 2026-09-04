import { site, navItems, cityNavHref, cityLinks, faqs, giftSetsMenu, countriesMenu, whatsappLinkLabel } from "@/lib/site";
import { categoryHref } from "@/lib/category-urls";
import { siteUrl } from "@/lib/env";
import { blogPosts } from "@/lib/content/blog-posts";

/** Compact site knowledge injected into the chatbot system prompt. */
export function buildChatKnowledge(): string {
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

  const countries = countriesMenu.items.map((c) => `- ${c.label}: ${siteUrl}${c.href}`);
  const cities = cityLinks.map((c) => `- ${c.menuLabel ?? c.label}: ${siteUrl}${cityNavHref(c)}`);

  const faqBlock = faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");

  const blogList = blogPosts.slice(0, 8).map((p) => `- ${p.title}: ${siteUrl}/blog/${p.slug}`);

  return `
# ${site.name} (${siteUrl})
${site.tagline}
${site.description}

## What we sell
Premium flowers, bouquets, cakes, gift hampers, and occasion gifts delivered across the United States. Shop birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and thank-yous.

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
The homepage serves shoppers in the USA, UK, Canada, Australia, and the UAE. Live flower destination coverage is the United States. UK, Canada, Australia, and UAE pages help shoppers in those countries send gifts to a US address.

## USA delivery cities
${cities.join("\n")}

## Delivery & payment
- USA delivery nationwide; same-day options in select cities when available
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

export function buildChatSystemPrompt(page?: string): string {
  const knowledge = buildChatKnowledge();
  const pageHint = page ? `\nThe visitor is currently on: ${page}` : "";

  return `You are the BlossomPot Shopping Assistant — a warm, helpful sales guide for ${site.name} (${siteUrl}).

YOUR ONLY JOB: Help visitors shop for flowers, cakes, and gifts, understand USA delivery, shipping, payments, and BlossomPot policies. Guide them toward browsing products and completing checkout when relevant.

STRICT RULES:
1. ONLY answer questions related to BlossomPot, flower/cake/gift products, USA gift delivery, this website's shipping/payments/orders, and content on blossompot.com.
2. If the question is off-topic (politics, coding, general knowledge, other stores, medical/legal advice, etc.), respond kindly in 1–2 sentences: "I'm here specifically to help with BlossomPot — flowers, cakes, and gifts for USA delivery, our products, shipping, and orders. For that I'd love to help! Is there something about gift delivery I can assist with?" Do NOT attempt to answer the off-topic question.
3. Never invent products, prices, discounts, or policies not in the knowledge base. If unsure, suggest browsing ${siteUrl}/products or contacting ${site.supportEmail} / WhatsApp.
4. Keep replies concise (2–5 short paragraphs max). Use bullet points for lists.
5. Include helpful markdown links like [Flowers](${siteUrl}${categoryHref("flowers")}) or [Cakes](${siteUrl}${categoryHref("cakes")}) when recommending categories or pages.
6. Be sales-friendly: highlight benefits (USA delivery, premium florals, cakes, hampers, same-day options where available).
7. For order-specific issues (tracking, refunds, wrong item), suggest WhatsApp or email ${site.supportEmail} for human support.
8. Never mention AI, LLMs, OpenAI, or Cursor. You are "BlossomPot Assistant".
9. Do not ask for passwords or payment card details.

KNOWLEDGE BASE:
${knowledge}
${pageHint}`;
}
