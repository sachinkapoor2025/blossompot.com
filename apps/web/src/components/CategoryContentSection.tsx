import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import type { CategoryRichContent } from "@/lib/content/category-rich-content";
import { categoryPageInlineLinks } from "@/lib/content/page-inline-links";
import { applyInlineLinks } from "@/lib/inline-links";
import { whatsappChatUrl } from "@/lib/site";

interface Props {
  content: CategoryRichContent;
  categoryName: string;
}

export function CategoryContentSection({ content, categoryName }: Props) {
  const inlineLinks = categoryPageInlineLinks[content.slug] ?? [];
  const usedHrefs = new Set<string>();

  return (
    <div className="mt-12 pt-10 border-t border-line">
      <div className="grid lg:grid-cols-3 gap-10 xl:gap-12 items-start">
        <article className="lg:col-span-2 space-y-8 text-ink leading-relaxed">
          <header>
            <h2 className="text-2xl font-bold text-ink mb-4">{content.headline}</h2>
            {content.intro.map((p, i) => (
              <p key={i} className="mb-4">
                {applyInlineLinks(p, inlineLinks, { usedHrefs, currentPath: categoryHref(content.slug), max: 4 })}
              </p>
            ))}
          </header>

          <section>
            <h3 className="text-xl font-semibold text-ink mb-3">{content.delivery.heading}</h3>
            {content.delivery.paragraphs.map((p, i) => (
              <p key={i} className="mb-3">
                {applyInlineLinks(p, inlineLinks, { usedHrefs, max: 4 })}
              </p>
            ))}
          </section>

          <section>
            <h3 className="text-xl font-semibold text-ink mb-3">{content.highlights.heading}</h3>
            {content.highlights.paragraphs && content.highlights.paragraphs.length > 0 ? (
              <div className="space-y-3 text-ink leading-relaxed">
                {content.highlights.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {content.highlights.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {content.tradition && (
            <section>
              <h3 className="text-xl font-semibold text-ink mb-3">{content.tradition.heading}</h3>
              {content.tradition.paragraphs.map((p, i) => (
                <p key={i} className="mb-3">
                  {applyInlineLinks(p, inlineLinks, { usedHrefs, max: 4 })}
                </p>
              ))}
            </section>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <section className="bg-ivory rounded-xl p-6 h-full">
              <h3 className="text-lg font-semibold text-ink mb-4">{content.whyUs.heading}</h3>
              <ul className="space-y-2 text-sm">
                {content.whyUs.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="text-accent font-bold shrink-0">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-surface border border-line rounded-xl p-6 h-full">
              <h3 className="text-lg font-semibold text-ink mb-4">{content.howTo.heading}</h3>
              <ol className="space-y-3 text-sm list-decimal list-inside marker:font-semibold marker:text-primary">
                {content.howTo.steps.map((step, i) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>

        <aside className="lg:sticky lg:top-24">
          <section className="bg-primary text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Need help choosing {categoryName}?</h3>
            <p className="text-sm text-white/90 mb-4">
              Our team helps you pick the perfect {categoryName.toLowerCase()} and confirm US delivery addresses.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/contact"
                className="bg-surface text-primary px-4 py-2 rounded-lg font-medium hover:bg-petal"
              >
                Contact us
              </Link>
              <a
                href={whatsappChatUrl(`Hi, I need help with ${categoryName}.`)}
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

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <section className="bg-surface border border-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Explore More Collections</h2>
          <ul className="space-y-3 text-sm">
            {content.relatedCategories.map((cat) => (
              <li key={cat.href}>
                <Link href={cat.href} className="font-medium text-nav hover:underline">
                  {cat.label}
                </Link>
                <p className="text-muted mt-0.5">{cat.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-ivory border border-line rounded-xl p-6">
          <h3 className="text-lg font-semibold text-ink mb-3">Need help choosing?</h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Message us on WhatsApp for sizing, delivery timing, or gift recommendations for{" "}
            {categoryName.toLowerCase()}.
          </p>
          <a
            href={whatsappChatUrl(`Hi! I need help choosing a ${categoryName} for worldwide delivery.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-semibold text-nav hover:underline"
          >
            Chat on WhatsApp →
          </a>
        </section>
      </div>

      <section className="mt-10 pt-8 border-t border-line">
        <h2 className="text-xl font-semibold text-ink mb-6">
          Frequently Asked Questions — {categoryName}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {content.faqs.map((faq) => (
            <div key={faq.q} className="bg-surface border border-line rounded-xl p-5">
              <h4 className="font-semibold text-ink text-sm mb-2">{faq.q}</h4>
              <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
