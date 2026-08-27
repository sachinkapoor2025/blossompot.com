import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { glossaryTerms } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Glossary: Bouquet Terms Explained | BlossomPot",
  description:
    "What is a bouquet, posy, boutonniere, florist’s choice, floriography or flower food? A plain-language florist glossary.",
  path: "/flower-guide/flower-glossary",
});

export default function GlossaryPage() {
  return (
    <FlowerGuideShell current="/flower-guide/flower-glossary">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Glossary", path: "/flower-guide/flower-glossary" },
        ])}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Glossary" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flower glossary</h1>
        <p className="mt-4 text-slate-700">
          Short definitions for the words florists and wedding planners use. These are practical terms,
          not a Victorian codebook.
        </p>
        <dl className="mt-8 space-y-8">
          {glossaryTerms.map((t) => (
            <div key={t.slug} id={t.slug}>
              <dt className="font-display text-2xl text-primary">What is {t.term.toLowerCase().startsWith("a ") || t.term.toLowerCase().startsWith("florist") ? t.term : `a ${t.term.toLowerCase()}`}?</dt>
              <dd className="mt-2 text-slate-700 leading-relaxed">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </FlowerGuideShell>
  );
}
