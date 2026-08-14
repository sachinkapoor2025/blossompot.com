import { api } from "@/lib/api";
import { site, navItems, faqs, giftSetsMenu } from "@/lib/site";
import { siteUrl } from "@/lib/env";
import { getCatalogProducts } from "@/lib/catalog-fallback";
import { stripHtml } from "@/lib/html-text";
import type { Product } from "@blossompot/shared";

/**
 * llms-full.txt — detailed product catalog for AI assistants (GEO).
 * Extends /llms.txt with per-product name, price, category, description.
 */
export async function GET() {
  let products: Product[] = [];
  try {
    const data = await api<{ products: Product[] }>("/products");
    products = data.products;
  } catch {
    products = [];
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  for (const p of getCatalogProducts()) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  products = [...bySlug.values()];

  const categories = [
    ...giftSetsMenu.items.map((n) => `- ${n.label}: ${siteUrl}${n.href}`),
    ...navItems
      .filter((n): n is typeof n & { category: string } => "category" in n)
      .map((n) => `- ${n.label}: ${siteUrl}${n.href}`),
  ].join("\n");

  const productLines = products
    .map((p) => {
      const desc = stripHtml(p.description).replace(/\s+/g, " ").slice(0, 220);
      const tags = p.tags?.length ? ` | Tags: ${p.tags.join(", ")}` : "";
      return `- **${p.name}** | ${p.currency} ${p.price} | ${p.categorySlug} | ${siteUrl}/products/${p.slug}\n  ${desc}${tags}`;
    })
    .join("\n\n");

  const faqList = faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");

  const body = `# ${site.name} — Full Product Catalog (llms-full.txt)
> Extended machine-readable catalog for AI shopping assistants.
> Summary file: ${siteUrl}/llms.txt

${site.description}

**Website:** ${siteUrl}
**Primary buyers:** Customers ordering flowers, cakes, and gifts for USA delivery.
**Catalog focus:** Flowers, bouquets, cakes, hampers, personalized gifts, and occasion collections.
**Delivery:** Nationwide USA coverage with faster windows to major metros when available.
**Payments:** Stripe (USD), Razorpay (INR / UPI).

---

## Categories

${categories}

---

## All products (${products.length})

${productLines || "Product catalog temporarily unavailable."}

---

## FAQs

${faqList}

---

## Contact

Email: ${site.supportEmail} | WhatsApp: ${site.whatsappDisplay}
Press: ${siteUrl}/press
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "all",
    },
  });
}
