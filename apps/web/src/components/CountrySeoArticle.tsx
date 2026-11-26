import type { ReactNode } from "react";
import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ReadMore } from "@/components/ReadMore";
import { countrySeoHrefs, type CountrySeoContent, type SeoSection } from "@/lib/content/country-seo-registry";
import { seoArticleInlineLinks } from "@/lib/content/page-inline-links";
import { applyInlineLinks, normalizeInternalPath } from "@/lib/inline-links";
import type { SeoLink } from "@/lib/content/country-seo-registry";

function ArticleRemainder({
  readMore,
  extraIntro,
  callsToAction,
  linked,
  children,
}: {
  readMore: boolean;
  extraIntro: string[];
  callsToAction: SeoLink[];
  linked: (paragraph: string) => ReactNode;
  children: ReactNode;
}) {
  const content = (
    <>
      {extraIntro.map((paragraph) => (
        <p key={paragraph} className="mb-4">
          {linked(paragraph)}
        </p>
      ))}
      {callsToAction.length > 0 ? (
        <div className="flex flex-wrap gap-3 pt-2">
          {callsToAction.map((link) => (
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
      {children}
    </>
  );
  if (!readMore) return content;
  return <ReadMore>{content}</ReadMore>;
}

export function CountrySeoArticle({
  article,
  headingLevel = "h1",
  omitHeading = false,
  centerFaq = false,
  headingClassName = "font-display text-3xl font-bold text-primary mb-4",
  currentPath,
  readMore = false,
}: {
  article: CountrySeoContent;
  headingLevel?: "h1" | "h2";
  /** The surrounding page already rendered this article's heading. */
  omitHeading?: boolean;
  /** Center the FAQ block. Question text stays left-aligned. */
  centerFaq?: boolean;
  /** Page heading classes. Defaults to the existing article title. */
  headingClassName?: string;
  /** Skip links that point at this page. */
  currentPath?: string;
  /** Show the first three paragraphs, and put the rest behind Read more. */
  readMore?: boolean;
}) {
  const Heading = headingLevel;
  const inlineLinks = seoArticleInlineLinks[article.page] ?? [];
  const usedHrefs = new Set<string>();
  const usedPhrases = new Set<string>();
  const blockedHrefs = new Set(countrySeoHrefs(article).map((href) => normalizeInternalPath(href)));
  const linkOpts = { usedHrefs, usedPhrases, blockedHrefs, currentPath };
  const linked = (paragraph: string) => applyInlineLinks(paragraph, inlineLinks, linkOpts);
  const stepSeparator = article.stepSeparator ?? " — ";
  const previewParagraphCount = 3;
  const visibleIntro = readMore ? article.intro.slice(0, previewParagraphCount) : article.intro;
  const extraIntro = readMore ? article.intro.slice(previewParagraphCount) : [];
  const sectionBudget = readMore ? Math.max(0, previewParagraphCount - visibleIntro.length) : 0;
  const firstSection = article.sections[0];
  const leadParagraphs =
    sectionBudget > 0 && firstSection ? firstSection.paragraphs.slice(0, sectionBudget) : [];
  const leadSection =
    leadParagraphs.length > 0 && firstSection
      ? { ...firstSection, paragraphs: leadParagraphs, items: undefined, links: undefined, paragraphsAfter: undefined }
      : null;
  const remainingSections = leadSection
    ? [
        {
          ...firstSection,
          paragraphs: firstSection.paragraphs.slice(leadParagraphs.length),
        },
        ...article.sections.slice(1),
      ].filter(
        (section) =>
          section.paragraphs.length > 0 ||
          (section.items?.length ?? 0) > 0 ||
          (section.links?.length ?? 0) > 0 ||
          (section.paragraphsAfter?.length ?? 0) > 0
      )
    : article.sections;
  const renderSection = (section: SeoSection, omitHeading = false) => (
    <section key={section.heading}>
      {omitHeading ? null : (
        <h2 className="font-display text-xl font-semibold text-primary mb-3">{section.heading}</h2>
      )}
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mb-4">
          {linked(paragraph)}
        </p>
      ))}
      {section.items && section.items.length > 0 ? (
        <div className="space-y-4">
          {section.items.map((item) => (
            <div key={item.title}>
              <h3 className="font-display font-semibold text-primary">
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </h3>
              {item.text ? <p>{item.text}</p> : null}
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
      {section.paragraphsAfter?.map((paragraph) => (
        <p key={paragraph} className="mt-4">
          {linked(paragraph)}
        </p>
      ))}
    </section>
  );
  const faq =
    article.faqs.length > 0 ? (
      <section className="mt-12 pt-10 border-t border-slate-200">
        <h2 className={`font-display text-xl font-semibold text-primary mb-6${centerFaq ? " text-center" : ""}`}>
          {article.faqHeading ?? "Frequently asked questions"}
        </h2>
        <FaqAccordion items={article.faqs} />
      </section>
    ) : null;

  return (
    <section
      className="bg-slate-50 border-y border-slate-200"
      aria-labelledby={omitHeading ? undefined : "country-seo-heading"}
    >
      <div className="site-container py-12 sm:py-16">
        <article className="space-y-8 text-slate-700 leading-relaxed">
          <header>
            {omitHeading ? null : (
              <Heading id="country-seo-heading" className={headingClassName}>
                {article.heading}
              </Heading>
            )}
            {visibleIntro.map((paragraph) => (
              <p key={paragraph} className="mb-4">
                {linked(paragraph)}
              </p>
            ))}
            {!readMore && article.callsToAction.length > 0 ? (
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

          {leadSection ? renderSection(leadSection) : null}

          <ArticleRemainder
            readMore={readMore}
            extraIntro={extraIntro}
            callsToAction={readMore ? article.callsToAction : []}
            linked={linked}
          >
          {remainingSections.map((section, index) =>
            renderSection(section, Boolean(leadSection) && index === 0)
          )}

          {article.steps.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold text-primary mb-3">{article.stepsHeading}</h2>
              <ol className="space-y-3 list-decimal list-inside">
                {article.steps.map((step) => (
                  <li key={step.title || step.text}>
                    {step.title ? (
                      <>
                        <span className="font-semibold text-primary">{step.title}</span>
                        {stepSeparator}
                      </>
                    ) : null}
                    {step.text}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {article.faqBeforeClosing ? faq : null}

          {article.closing.heading ? (
            <section>
              <h2 className="font-display text-xl font-semibold text-primary mb-4">{article.closing.heading}</h2>
              {article.closing.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-4">
                  {linked(paragraph)}
                </p>
              ))}
            </section>
          ) : null}
          {readMore && !article.faqBeforeClosing ? faq : null}
          </ArticleRemainder>
        </article>

        {readMore || article.faqBeforeClosing ? null : faq}
      </div>
    </section>
  );
}
