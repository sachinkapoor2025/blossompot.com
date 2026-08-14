import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { categoryHref } from "@/lib/category-urls";
import { site, categoryOrder, whatsappChatUrl } from "@/lib/site";
import { aboutPageJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About BlossomPot — Flowers, Cakes & Gifts | USA Delivery",
  description:
    "BlossomPot.com — premium online gifting for flowers, bouquets, cakes, and curated gifts with fast USA delivery. Secure checkout and thoughtful packaging for every celebration.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={aboutPageJsonLd()} />
      <h1 className="text-3xl font-bold text-primary mb-6">About {site.name}</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          <strong>{site.name}</strong> ({site.domain}) is a premium online gifting storefront for flowers,
          bouquets, cakes, and curated gifts — built for birthdays, anniversaries, Valentine&apos;s Day,
          Mother&apos;s Day, weddings, and everyday thank-yous across the United States.
        </p>
        <p>
          Whether you&apos;re surprising someone in California, New York, Texas, or any US state, we make
          celebration gifting feel effortless. Order online with clear delivery expectations, elegant
          presentation, and secure checkout.
        </p>
        <h2 className="text-xl font-bold text-primary pt-4">Why customers choose BlossomPot</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Flowers, cakes, bouquets, and hampers in one marketplace</li>
          <li>Nationwide USA delivery with faster windows to major metros when available</li>
          <li>Same-day options in select cities when you order before the local cut-off</li>
          <li>Free shipping on selected orders</li>
        </ul>
        <h2 className="text-xl font-bold text-primary pt-4">What we offer</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Fresh flower arrangements and signature bouquets</li>
          <li>Celebration cakes and sweet gifts</li>
          <li>Gift hampers, personalized gifts, and occasion collections</li>
          <li>Flower-and-chocolate and teddy-and-flower style combos</li>
          <li>Secure payments via Razorpay and Stripe</li>
        </ul>
        <h2 className="text-xl font-bold text-primary pt-4">Who we are</h2>
        <p>
          {site.name} is operated by <strong>Divit Global Ventures (DGV)</strong> with a US-focused
          fulfillment and support team. We curate premium gifts and pack every order carefully so
          recipients receive something that feels special — not just shipped.
        </p>
        <h2 className="text-xl font-bold text-primary pt-4">Our promise</h2>
        <p>
          Every gift is packed with care. Celebrations are emotional — not just transactions. We focus on
          reliable USA shipping, responsive WhatsApp support, and a satisfaction guarantee for every
          customer who orders.
        </p>
        <p>
          Questions? Reach us on{" "}
          <a
            href={whatsappChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nav hover:underline"
          >
            WhatsApp ({site.whatsappDisplay})
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
