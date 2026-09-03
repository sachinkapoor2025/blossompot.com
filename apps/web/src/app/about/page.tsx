import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { categoryHref } from "@/lib/category-urls";
import { marketingPageInlineLinks } from "@/lib/content/page-inline-links";
import { applyInlineLinks } from "@/lib/inline-links";
import { site, categoryOrder, whatsappChatUrl } from "@/lib/site";
import { aboutPageJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About BlossomPot — Flowers, Cakes & Gifts | USA Delivery",
  description:
    "At BlossomPot, we believe a thoughtful gift can transform an ordinary moment into something special. Send flowers, bouquets, cakes, gift hampers and personalized gifts across the United States.",
  path: "/about",
});

export default function AboutPage() {
  const inlineLinks = marketingPageInlineLinks.about;
  const usedHrefs = new Set<string>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={aboutPageJsonLd()} />
      <h1 className="text-3xl font-bold text-primary mb-6">About {site.name}</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          {applyInlineLinks(
            `At ${site.name}, we believe that a thoughtful gift has the power to transform an ordinary moment into something special. We make it easy to send something meaningful to the people you care about, from fresh flowers and stylish bouquets to celebration cakes, gift hampers and personalized gifts.`,
            inlineLinks,
            { usedHrefs, currentPath: "/about", max: 4 }
          )}
        </p>
        <p>
          {applyInlineLinks(
            `${site.name} is a leading online gifting destination serving customers throughout the United States. Whether it's a birthday, anniversary, Valentine's Day, Mother's Day, a wedding, a new beginning or just to say thank you, we have a selection of gifts for all occasions and relationships.`,
            inlineLinks,
            { usedHrefs, currentPath: "/about", max: 4 }
          )}
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">Making Gifting Simple</h2>
        <p>
          Shopping for the perfect gift should be fun, not a task. Hence, {site.name} combines flowers,
          cakes, curated gift hampers, personalized gifts and popular gift combinations under one roof in
          an online store.
        </p>
        <p>
          Whatever you&apos;re sending – a classic bouquet to someone special, flowers with chocolates or a
          thoughtful teddy-and-flower combo – we have collections to suit a variety of celebrations,
          preferences and budgets.
        </p>
        <p>
          Our aim is to make the whole gifting experience easy – browsing, ordering, delivery and
          presentation.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">What You Can Find at {site.name}</h2>
        <p>In our collection you&apos;ll find a selection of gifts for everyday moments and special occasions, including:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Fresh flower arrangements and signature bouquets</li>
          <li>Celebration cakes and sweet gifts</li>
          <li>Gift hampers and curated gift sets</li>
          <li>Personalized gifts for special occasions</li>
          <li>Flower-and-chocolate combinations</li>
          <li>Teddy-and-flower gift combinations</li>
          <li>
            Occasion-based collections for birthdays, anniversaries, weddings, Valentine&apos;s Day,
            Mother&apos;s Day, and more
          </li>
        </ul>
        <p>
          Our selection is always changing to reflect seasonal celebrations, customer needs and popular
          gifting occasions.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">Serving Customers Across the USA</h2>
        <p>
          {site.name} is committed to providing customers throughout the USA with the convenience of
          gifting. We partner with fulfilment partners and delivery networks to help ensure that orders
          arrive safely and within the expected delivery window.
        </p>
        <p>
          Availability and delivery times may vary according to product, destination, time of order and
          local availability. Same day delivery may be available in select cities for orders placed before
          the applicable local cut-off time.
        </p>
        <p>
          Clear delivery expectations are part of a good online shopping experience, and we want to
          provide you with relevant delivery information before you complete your order.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">Thoughtful Presentation Matters</h2>
        <p>A gift is more than just the item in the box. And the way it comes can be just as important.</p>
        <p>
          That&apos;s why we care about how the orders are placed and served. We want every gift to feel
          thoughtful when it arrives in the recipient&apos;s hands — whether it is being sent for a major
          celebration or simply to brighten someone&apos;s day.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">A Focus on a Better Gifting Experience</h2>
        <p>
          {site.name} is operated by <strong>Divit Global Ventures (DGV)</strong> with a US-focused
          fulfillment and customer support operation.
        </p>
        <p>
          We combine online convenience with a personal approach to gifting. From selecting products to
          handling orders and customer queries, we work to make the experience straightforward and
          dependable.
        </p>
        <p>
          For customer assistance, our support team is available through WhatsApp to help with questions
          related to orders, products, delivery, and other gifting concerns.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">Secure and Convenient Payments</h2>
        <p>
          We understand that online customers want a secure and seamless checkout experience. {site.name}{" "}
          supports payment processing through well-known payment providers such as Razorpay and Stripe,
          making it easy for customers to pay online.
        </p>

        <h2 className="text-xl font-bold text-primary pt-4">Our Promise</h2>
        <p>At {site.name}, we want to make sending a thoughtful gift easy.</p>
        <p>
          We understand that every order is a special moment — a birthday wish, a celebration, a thank you,
          a congratulations, or just a reminder that someone is thinking about you.
        </p>
        <p>
          That&apos;s why we put such emphasis on careful preparation, reliable delivery options, customer
          support and a straightforward shopping experience.
        </p>
        <p>
          {site.name} helps you turn that thought into something they can receive and remember, whether
          it&apos;s sending flowers to someone across the country or choosing a gift for a special
          occasion.
        </p>
        <p className="font-semibold text-primary">{site.name} — Thoughtful gifts for meaningful moments.</p>

        <p>
          Questions? Reach us on{" "}
          <a
            href={whatsappChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nav hover:underline"
          >
            WhatsApp
          </a>
          , email{" "}
          <a href={`mailto:${site.supportEmail}`} className="text-nav hover:underline">
            {site.supportEmail}
          </a>
          , or visit our <Link href="/contact" className="text-nav hover:underline">contact page</Link>.
          Media inquiries: <Link href="/press" className="text-nav hover:underline">Press kit</Link>.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        {categoryOrder.map((slug) => (
          <Link
            key={slug}
            href={categoryHref(slug)}
            className="px-4 py-2 rounded-full border border-slate-200 text-sm hover:border-nav capitalize"
          >
            {slug.replace(/-/g, " ")}
          </Link>
        ))}
      </div>
    </div>
  );
}
