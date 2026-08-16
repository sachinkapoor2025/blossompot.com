import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { directoryBySlug, featuredFlowerLocations, getPublishedGuide, publicFlowerGuides } from "@/lib/content/flower-guide";
import { loadProducts } from "@/lib/product-loader";
import { productsForFlower } from "@/lib/content/flower-guide/products";
import { HomeProductCard } from "@/components/HomeProductCard";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { isFlowerGuideIndexable } from "@blossompot/shared";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publicFlowerGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPublishedGuide(slug);
  if (!guide || !isFlowerGuideIndexable(guide.status)) {
    return { title: "Flower guide", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: guide.seoTitle,
    description: guide.seoDescription,
    path: `/flower-guide/${guide.slug}`,
    ogImage: guide.images[0]?.src,
    absoluteTitle: true,
  });
}

export default async function FlowerGuidePage({ params }: Props) {
  const { slug } = await params;
  const reserved = new Set([
    "flowers-a-z",
    "flower-meanings",
    "flowers-by-colour",
    "flowers-by-occasion",
    "seasonal-flowers",
    "spring-flowers",
    "summer-flowers",
    "autumn-flowers",
    "winter-flowers",
    "flower-care",
    "flower-comparisons",
    "flower-glossary",
    "identify",
  ]);
  if (reserved.has(slug)) notFound();

  const guide = getPublishedGuide(slug);
  if (!guide || !isFlowerGuideIndexable(guide.status)) notFound();

  const related = guide.relatedFlowers
    .map((s) => directoryBySlug(s))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  let products: Awaited<ReturnType<typeof loadProducts>> = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  const relatedProducts = productsForFlower(products, guide, 4);
  const locations = featuredFlowerLocations(6);
  const hero = guide.images[0];
  const path = `/flower-guide/${guide.slug}`;

  return (
    <FlowerGuideShell>
      <JsonLd
        data={[
          articleJsonLd({
            slug: guide.slug,
            title: guide.seoTitle,
            description: guide.seoDescription,
            publishedAt: guide.publishedAt ?? guide.updatedAt,
            updatedAt: guide.updatedAt,
            image: hero?.src,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Flowers A–Z", path: "/flower-guide/flowers-a-z" },
            { name: guide.name, path },
          ]),
          faqJsonLd(guide.faqs),
          {
            "@context": "https://schema.org",
            "@type": "ImageObject",
            url: hero?.src,
            caption: hero?.alt,
            creditText: hero?.attribution,
            license: hero?.license,
          },
        ]}
      />

      <article>
        <div className="relative min-h-[360px] overflow-hidden">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/35 to-slate-900/10" />
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/75">Flower encyclopedia</p>
            <h1 className="font-display text-4xl sm:text-5xl mt-2 max-w-3xl">{guide.h1}</h1>
            <p className="mt-4 max-w-2xl text-white/90 text-lg">{guide.whatIs}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/products?search=${encodeURIComponent(guide.shopQuery)}`} className="rounded-full bg-white text-primary font-semibold px-5 py-2.5 text-sm">
                Shop {guide.name.toLowerCase()}s
              </Link>
              {guide.relatedCareSlug ? (
                <Link href={`/flower-guide/flower-care/${guide.relatedCareSlug}`} className="rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold">
                  Care guide
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Flower Guide", href: "/flower-guide" },
              { label: "Flowers A–Z", href: "/flower-guide/flowers-a-z" },
              { label: guide.name },
            ]}
          />

          <section className="rounded-2xl border border-[#eadfd8] bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl text-primary">{guide.name} at a glance</h2>
            <p className="mt-3 text-slate-800 leading-relaxed">{guide.glance}</p>
            <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Flower</dt><dd className="font-medium text-slate-800">{guide.name}</dd></div>
              <div><dt className="text-slate-500">Botanical name</dt><dd className="font-medium text-slate-800">{guide.botanicalName}</dd></div>
              <div><dt className="text-slate-500">Family</dt><dd className="font-medium text-slate-800">{guide.family}</dd></div>
              <div><dt className="text-slate-500">Colours</dt><dd className="font-medium text-slate-800">{guide.colours.map((c) => c.label).join(", ")}</dd></div>
              <div><dt className="text-slate-500">Typical season</dt><dd className="font-medium text-slate-800">{guide.seasonSummary}</dd></div>
              <div><dt className="text-slate-500">Fragrance</dt><dd className="font-medium text-slate-800">{guide.fragrance}</dd></div>
              <div><dt className="text-slate-500">Popular for</dt><dd className="font-medium text-slate-800">{guide.occasions.slice(0, 5).join(", ")}</dd></div>
              <div><dt className="text-slate-500">Vase life</dt><dd className="font-medium text-slate-800">{guide.vaseLife}</dd></div>
            </dl>
          </section>

          <section className="mt-12 prose-none">
            <h2 className="font-display text-3xl text-primary">What is a {guide.name.toLowerCase()}?</h2>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              {guide.about.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">Origin: {guide.origin} · Habitat: {guide.habitat}</p>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">What does a {guide.name.toLowerCase()} mean?</h2>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              {guide.meaning.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">{guide.name} colours</h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              {guide.colours.map((c) => (
                <Link
                  key={c.colour}
                  href={`/flower-guide/flowers-by-colour/${c.colour}`}
                  className="rounded-2xl border border-[#eadfd8] bg-white p-4 hover:border-nav"
                >
                  <p className="font-semibold text-primary">{c.label}</p>
                  <p className="text-sm text-slate-600 mt-1">{c.association}</p>
                  <p className="text-xs text-slate-400 mt-2">Often chosen for {c.occasions.join(", ")}</p>
                </Link>
              ))}
            </div>
          </section>

          {guide.varieties.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-3xl text-primary">{guide.name} varieties</h2>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {guide.varieties.map((v) => (
                  <div key={v.name} className="rounded-2xl border border-[#eadfd8] bg-white p-4">
                    <h3 className="font-semibold text-primary">{v.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{v.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">When is {guide.name.toLowerCase()} in season?</h2>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              {guide.seasonDetail.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <ul className="mt-5 grid sm:grid-cols-2 gap-3">
              {guide.marketNotes.map((n) => (
                <li key={n.market} className="rounded-xl bg-white border border-[#eadfd8] p-4 text-sm">
                  <p className="font-semibold capitalize text-primary">{n.market === "uk" ? "UK" : n.market === "uae" ? "UAE" : n.market === "us" ? "USA" : n.market}</p>
                  <p className="text-slate-600 mt-1">{n.summary}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Link href="/flower-guide/seasonal-flowers" className="text-nav font-semibold hover:underline">
                Seasonal flower calendar →
              </Link>
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">How to care for {guide.name.toLowerCase()}s</h2>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-700">
              {guide.care.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600"><span className="font-medium">Pet safety:</span> {guide.petSafety}</p>
            <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Pollen:</span> {guide.pollenNotes}</p>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">{guide.name}s for different occasions</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              {guide.occasionNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {guide.relatedOccasions.map((o) => (
                <Link key={o} href={`/flower-guide/flowers-by-occasion/${o}`} className="rounded-full bg-white border border-[#eadfd8] px-3 py-1 text-sm hover:border-nav">
                  {o.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </section>

          {relatedProducts.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-3xl text-primary">Popular {guide.name.toLowerCase()} bouquets</h2>
              <p className="mt-2 text-slate-600">Live BlossomPot products that mention this flower. Availability depends on your delivery location.</p>
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p) => (
                  <HomeProductCard key={p.slug} product={p} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-12 rounded-2xl bg-petal p-6">
              <h2 className="font-display text-2xl text-primary">Shop {guide.name.toLowerCase()} arrangements</h2>
              <p className="mt-2 text-slate-700">Browse the live catalog for bouquets and gifts that include {guide.name.toLowerCase()}s.</p>
              <Link href={`/products?search=${encodeURIComponent(guide.shopQuery)}`} className="btn-nav mt-4 inline-flex">
                View {guide.name.toLowerCase()} products
              </Link>
            </section>
          )}

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">{guide.name} delivery</h2>
            <p className="mt-3 text-slate-700 leading-relaxed">
              BlossomPot lists delivery destinations we actually publish. US city pages are gift-delivery
              destinations. Canada, Australia and Europe city pages explain how to send gifts from those
              cities to a US address — they are not local florist storefronts we do not operate.
            </p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
              {locations.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-nav hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {related.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-3xl text-primary">Related flowers</h2>
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((f) => (
                  <FlowerCard key={f.slug} flower={f} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <h2 className="font-display text-3xl text-primary">Frequently asked questions</h2>
            <div className="mt-5 space-y-4">
              {guide.faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-semibold text-primary">{f.q}</h3>
                  <p className="text-slate-700 mt-1 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 text-sm text-slate-500">
            <h2 className="font-display text-2xl text-primary">Sources &amp; further reading</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              {guide.sources.map((s) => (
                <li key={s.label}>
                  {s.url ? (
                    <a href={s.url} className="text-nav hover:underline" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                  {s.note ? ` — ${s.note}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-6">
              Reviewed by {guide.reviewedBy}. Updated {guide.updatedAt}. Status: {guide.status}.{" "}
              <Link href="/editorial-policy" className="text-nav hover:underline">
                Editorial policy
              </Link>
            </p>
          </section>
        </div>
      </article>
    </FlowerGuideShell>
  );
}
