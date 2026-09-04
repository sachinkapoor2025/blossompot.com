import Link from "next/link";
import { applyInlineLinks } from "@/lib/inline-links";
import { homepageInlineLinks } from "@/lib/content/page-inline-links";
import { whatsappChatUrl } from "@/lib/site";
import { homeSeoContent } from "@/lib/content/home-seo";

export function HomeSeoSection() {
  const { intro, categories, delivery, howItWorks, cities, faqs } = homeSeoContent;
  const usedHrefs = new Set<string>();

  return (
    <section className="bg-slate-50 border-y border-slate-200" aria-labelledby="home-seo-heading">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-14">
          <article className="space-y-8 text-slate-700 leading-relaxed">
            <header>
              <h2 id="home-seo-heading" className="text-2xl font-bold text-primary mb-4">
                {intro.heading}
              </h2>
              {intro.paragraphs.map((para, i) => (
                <p key={i} className="mb-4">
                  {applyInlineLinks(para, homepageInlineLinks, { usedHrefs, currentPath: "/", max: 4 })}
                </p>
              ))}
            </header>

            <section>
              <h3 className="text-xl font-semibold text-primary mb-3">{delivery.heading}</h3>
              {delivery.paragraphs.map((para, i) => (
                <p key={i} className="mb-4">
                  {applyInlineLinks(para, homepageInlineLinks, { usedHrefs, currentPath: "/", max: 4 })}
                </p>
              ))}
              <div className="flex flex-wrap gap-2 mt-2">
                {cities.links.map((city) => (
                  <Link
                    key={city.href}
                    href={city.href}
                    className="text-xs sm:text-sm px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-nav hover:text-nav transition"
                  >
                    Gifts to {city.label}
                  </Link>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-primary mb-2">{categories.heading}</h3>
              <p className="text-slate-600 text-sm mb-4">{categories.intro}</p>
              <ul className="space-y-3 text-sm">
                {categories.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="font-semibold text-nav hover:underline">
                      {item.label}
                    </Link>
                    <p className="text-slate-500 mt-0.5">{item.text}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm">
                <Link href="/products" className="text-nav font-semibold hover:underline">
                  View all gifts →
                </Link>
              </p>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">{howItWorks.heading}</h3>
              <ol className="space-y-3 text-sm list-decimal list-inside marker:font-semibold marker:text-nav">
                {howItWorks.steps.map((step) => (
                  <li key={step.title} className="pl-1">
                    <span className="font-semibold text-primary">{step.title.replace(/^\d+\.\s*/, "")}</span>
                    {" — "}
                    {step.text}
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm space-x-2">
                <Link href="/shipping" className="text-nav font-semibold hover:underline">
                  Shipping details →
                </Link>
                <Link href="/flowers" className="text-nav font-semibold hover:underline">
                  Shop flowers →
                </Link>
                <Link href="/cakes" className="text-nav font-semibold hover:underline">
                  Shop cakes →
                </Link>
              </p>
            </section>

            <section className="bg-nav text-white rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Ready to send a gift across the USA?</h3>
              <p className="text-sm text-white/90 mb-4">
                Browse flowers, cakes, and hampers above — or reach out and we&apos;ll help you pick the right surprise.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/products"
                  className="bg-white text-nav px-4 py-2 rounded-lg font-medium hover:bg-slate-100"
                >
                  Shop all gifts
                </Link>
                <a
                  href={whatsappChatUrl("Hi BlossomPot, I want to send a gift in the USA.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/60 px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  WhatsApp
                </a>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-12 pt-10 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-semibold text-primary">{faqs.heading}</h3>
            <Link href="/faq" className="text-sm text-nav font-semibold hover:underline">
              View all FAQs →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.items.map((faq) => (
              <div key={faq.q} className="bg-white border border-slate-100 rounded-xl p-5">
                <h4 className="font-semibold text-primary text-sm mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
