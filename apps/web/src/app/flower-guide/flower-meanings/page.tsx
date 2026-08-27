import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { colourGuides, publicDirectoryEntries } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Meanings: A Careful Guide | BlossomPot",
  description:
    "Flower meanings are cultural traditions, not universal facts. Learn how colour, occasion and country change the message.",
  path: "/flower-guide/flower-meanings",
});

export default function MeaningsPage() {
  const published = publicDirectoryEntries();
  return (
    <FlowerGuideShell current="/flower-guide/flower-meanings">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Flower Meanings", path: "/flower-guide/flower-meanings" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flower Meanings" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flower meanings</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">
          Floriography — the Victorian habit of assigning coded meanings to flowers — is a historical
          curiosity, not a global language. The same white chrysanthemum can be a cheerful autumn gift
          in one country and a cemetery flower in another. BlossomPot uses wording such as “traditionally
          associated with” and “often used to express” because symbolism varies by culture, religion and
          family.
        </p>
        <p className="mt-4 text-slate-700 leading-relaxed">
          If you want a reliable message, write it on the card. Use colour and flower type as atmosphere,
          not as a secret code the recipient is required to decode.
        </p>
        <h2 className="font-display text-2xl text-primary mt-10">Start with colour</h2>
        <ul className="mt-4 grid sm:grid-cols-2 gap-3">
          {colourGuides.map((c) => (
            <li key={c.slug}>
              <Link href={`/flower-guide/flowers-by-colour/${c.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-4 hover:border-nav">
                <p className="font-semibold text-primary">{c.name}</p>
                <p className="text-sm text-slate-600 mt-1">{c.association}</p>
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-10">Published flower guides</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {published.map((f) => (
            <FlowerCard key={f.slug} flower={f} />
          ))}
        </div>
      </div>
    </FlowerGuideShell>
  );
}
