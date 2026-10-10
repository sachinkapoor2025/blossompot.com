import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";
import type { CountrySeoContent } from "@/lib/content/country-seo-registry";

export function CountrySeoArticle({
  article,
  headingLevel = "h1",
  omitHeading = false,
}: {
  article: CountrySeoContent;
  headingLevel?: "h1" | "h2";
  /** The surrounding page already rendered this article's heading. */
  omitHeading?: boolean;
}) {
  const Heading = headingLevel;

  return (
    <section
      className="bg-slate-50 border-y border-slate-200"
      aria-labelledby={omitHeading ? undefined : "country-seo-heading"}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <article className="max-w-3xl space-y-8 text-slate-700 leading-relaxed">
          <header>
            {omitHeading ? null : (
              <Heading id="country-seo-heading" className="text-3xl font-bold text-primary mb-4">
                {article.heading}
              </Heading>
            )}
            {article.intro.map((paragraph) => (
              <p key={paragraph} className="mb-4">
                {paragraph}
              </p>
            ))}
            {article.callsToAction.length > 0 ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {article.callsToAction.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-primary mb-3">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-4">
                  {paragraph}
                </p>
              ))}
              {section.items && section.items.length > 0 ? (
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.title}>
                      <h3 className="font-semibold text-primary">
                        {item.href ? (
                          <Link href={item.href} className="hover:underline">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </h3>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {section.links && section.links.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs sm:text-sm px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-nav hover:text-nav"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {article.steps.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">{article.stepsHeading}</h2>
              <ol className="space-y-3 list-decimal list-inside">
                {article.steps.map((step) => (
                  <li key={step.title}>
                    <span className="font-semibold text-primary">{step.title}</span>
                    {" — "}
                    {step.text}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {article.closing.heading ? (
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">{article.closing.heading}</h2>
              {article.closing.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </section>
          ) : null}
        </article>

        {article.faqs.length > 0 ? (
          <section className="mt-12 pt-10 border-t border-slate-200 max-w-3xl">
            <h2 className="text-xl font-semibold text-primary mb-6">Frequently asked questions</h2>
            <FaqAccordion items={article.faqs} />
          </section>
        ) : null}
      </div>
    </section>
  );
}
