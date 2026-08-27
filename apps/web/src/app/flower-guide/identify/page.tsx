import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { flowerDirectory } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Identify Your Flower | BlossomPot",
  description:
    "Browse flowers by colour, season, fragrance and size. This is a visual directory — not a scientific AI identification tool.",
  path: "/flower-guide/identify",
});

export default function IdentifyPage() {
  const withImages = flowerDirectory.filter((f) => f.image);
  return (
    <FlowerGuideShell current="/flower-guide/identify">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Identify", path: "/flower-guide/identify" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Identify" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Identify your flower</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">
          Browse by colour, season, fragrance or how long stems usually last. This is not an automated
          identification system and it is not scientifically accurate AI. If you need a botanical ID,
          use a local extension service or a trained horticulturist.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link href="/flower-guide/flowers-a-z?colour=pink" className="rounded-full border border-[#eadfd8] bg-white px-3 py-1.5 hover:border-nav">Colour</Link>
          <Link href="/flower-guide/flowers-a-z?season=spring" className="rounded-full border border-[#eadfd8] bg-white px-3 py-1.5 hover:border-nav">Season</Link>
          <Link href="/flower-guide/flowers-a-z?fragrance=strong" className="rounded-full border border-[#eadfd8] bg-white px-3 py-1.5 hover:border-nav">Fragrance</Link>
          <Link href="/flower-guide/flowers-a-z?longevity=long" className="rounded-full border border-[#eadfd8] bg-white px-3 py-1.5 hover:border-nav">Longevity</Link>
          <Link href="/flower-guide/flowers-by-colour" className="rounded-full border border-[#eadfd8] bg-white px-3 py-1.5 hover:border-nav">Colour guides</Link>
        </div>
        <h2 className="font-display text-2xl text-primary mt-10">Image-based browsing</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {withImages.map((f) => (
            <FlowerCard key={f.slug} flower={f} />
          ))}
        </div>
      </div>
    </FlowerGuideShell>
  );
}
