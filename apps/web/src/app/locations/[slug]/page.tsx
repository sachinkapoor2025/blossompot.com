import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityContentSection } from "@/components/CityContentSection";
import { SeoLocationLanding } from "@/components/SeoLocationLanding";
import { SecondaryCityLanding, buildSecondaryCityFaqs } from "@/components/SecondaryCityLanding";
import { JsonLd } from "@/components/JsonLd";
import {
  allSeoLocationSlugs,
  californiaWarehouseLocations,
  getSeoLocation,
  locationPublicPath,
  seoLocations,
} from "@/lib/content/seo-data";
import { getCityContent } from "@/lib/content/city-pages";
import {
  getSecondaryCity,
  isExpressMetro,
  isSecondaryCity,
  secondaryCityIntro,
} from "@/lib/content/city-delivery-tiers";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceAreaJsonLd } from "@/lib/seo";
import { buildLocationContent } from "@/components/SeoLocationLanding";
import { site } from "@/lib/site";
import type { Product } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Same as homepage: always load the full live catalog (avoid stale 20-product ISR HTML). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return allSeoLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = locationPublicPath(slug);

  // Express metros: prefer individually maintained city-pages copy for title/description.
  const cityContent = getCityContent(slug);
  if (isExpressMetro(slug) && cityContent) {
    return pageMetadata({
      title: `Send Rakhi to ${cityContent.label} USA | Fast Delivery`,
      description:
        cityContent.metaExtra ??
        `Send Rakhi to ${cityContent.label}, USA with ${site.name}. Premium rakhis, express to major metros, roli chawal included.`,
      path,
      keywords: `send rakhi to ${cityContent.label}, rakhi delivery ${cityContent.label}, BlossomPot`,
      absoluteTitle: true,
    });
  }

  const secondary = getSecondaryCity(slug);
  if (secondary) {
    const place = `${secondary.name}, ${secondary.state}`;
    return pageMetadata({
      title: `Send Rakhi to ${place} | 5–7 Day USA Delivery | ${site.name}`,
      description: `Send rakhi to ${place} with ${site.name}. Domestic USA shipping in 5–7 business days, roli chawal on most orders, Stripe & Razorpay checkout.`,
      path,
      keywords: `send rakhi to ${secondary.name}, rakhi delivery ${secondary.name}, rakhi ${secondary.state}`,
      absoluteTitle: true,
    });
  }

  const location = getSeoLocation(slug);
  if (!location) return { title: "Rakhi Delivery" };

  const place =
    location.region === "state"
      ? location.name
      : location.state
        ? `${location.name}, ${location.state}`
        : location.name;
  const primary = location.keywords[0] ?? `send rakhi to ${location.name.toLowerCase()}`;
  const warehouseNote = location.isCaliforniaWarehouse
    ? " Ships from our California warehouse for faster West Coast delivery."
    : location.state
      ? ` Domestic USA shipping to ${place} — no customs delays.`
      : " Domestic USA shipping nationwide — no customs delays.";
  const regionNote =
    location.region === "state"
      ? `Browse designer Single Rakhi, combos, and hampers for addresses across ${location.name}.`
      : `Order online for doorstep delivery in ${place}${location.state ? ` and nearby ${location.state} metros` : ""}.`;

  return pageMetadata({
    title: `Send Rakhi to ${place} | ${primary.charAt(0).toUpperCase() + primary.slice(1)} | ${site.name}`,
    description: `${primary.charAt(0).toUpperCase() + primary.slice(1)} with ${site.name}.${warehouseNote} ${regionNote} Roli chawal included. Secure Stripe & Razorpay checkout.`,
    path,
    keywords: location.keywords.slice(0, 12).join(", "),
    absoluteTitle: true,
  });
}

export default async function SeoLocationPage({ params }: Props) {
  const { slug } = await params;

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  // Full catalog — same merge as homepage so every location lists every deliverable SKU.
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const cityProducts = shuffleForCity(products, slug);

  // --- Express metros: individually maintained CityContentSection ---
  const cityContent = getCityContent(slug);
  if (isExpressMetro(slug) && cityContent) {
    const crumbs = [
      { label: "Home", href: "/" },
      { label: `Send Rakhi to ${cityContent.label}` },
    ];
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <JsonLd
          data={[
            breadcrumbJsonLd(
              crumbs.map((c) => ({ name: c.label, path: c.href ?? locationPublicPath(slug) }))
            ),
            faqJsonLd(cityContent.faqs),
            serviceAreaJsonLd({ label: cityContent.label, slug, state: cityContent.state }),
          ]}
        />
        <Breadcrumbs items={crumbs} />
        <h1 className="text-3xl font-bold text-primary mb-2">
          Send Rakhi to {cityContent.label}, USA
        </h1>
        <p className="text-slate-600 mb-8 max-w-3xl">
          {cityContent.metaExtra ??
            `Premium Rakhi delivery to ${cityContent.label}. Domestic USA shipping — order from India, UK, Canada worldwide.`}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {cityProducts.map((p) => (
            <HomeProductCard key={p.slug} product={p} />
          ))}
        </div>
        <CityContentSection content={cityContent} />
      </div>
    );
  }

  // --- Secondary doorways: shared thin template ---
  const secondary = getSecondaryCity(slug);
  if (secondary) {
    const place = `${secondary.name}, ${secondary.state}`;
    const crumbs = [
      { label: "Home", href: "/" },
      { label: `Send Rakhi to ${secondary.name}` },
    ];
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <JsonLd
          data={[
            breadcrumbJsonLd(
              crumbs.map((c) => ({ name: c.label, path: c.href ?? locationPublicPath(slug) }))
            ),
            faqJsonLd([...buildSecondaryCityFaqs(secondary)]),
            serviceAreaJsonLd({ label: secondary.name, slug, state: secondary.state }),
          ]}
        />
        <Breadcrumbs items={crumbs} />
        <h1 className="text-3xl font-bold text-primary mb-2">
          Send Rakhi to {place} — Online USA Delivery
        </h1>
        <p className="text-slate-600 mb-8 max-w-3xl">
          {secondaryCityIntro(secondary.slug, secondary.name, secondary.state)}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {cityProducts.map((p) => (
            <HomeProductCard key={p.slug} product={p} />
          ))}
        </div>
        <SecondaryCityLanding city={secondary} />
      </div>
    );
  }

  // --- All other SEO locations (states + remaining cities) ---
  const location = getSeoLocation(slug);
  if (!location) notFound();

  const place =
    location.region === "state"
      ? location.name
      : location.state
        ? `${location.name}, ${location.state}`
        : location.name;

  const content = buildLocationContent(location);
  const related = location.isCaliforniaWarehouse
    ? californiaWarehouseLocations()
        .filter((l) => l.slug !== slug && !isSecondaryCity(l.slug))
        .slice(0, 8)
    : location.state
      ? seoLocations
          .filter((l) => l.state === location.state && l.slug !== slug && !isSecondaryCity(l.slug))
          .slice(0, 8)
      : [];

  const crumbs = [
    { label: "Home", href: "/" },
    { label: `Send Rakhi to ${place}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? locationPublicPath(slug) }))),
          faqJsonLd(content.faqs),
          serviceAreaJsonLd({ label: place, slug, state: location.state ?? undefined }),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-2">
        Send Rakhi to {place} — Online USA Delivery
      </h1>
      <p className="text-slate-600 mb-8 max-w-3xl">
        {location.keywords[0]
          ? `${location.keywords[0].charAt(0).toUpperCase() + location.keywords[0].slice(1)} with ${site.name}.`
          : `Premium rakhi delivery to ${place}.`}{" "}
        Domestic USA shipping, secure checkout, roli chawal on most rakhis.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cityProducts.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-slate-500 mt-4">
          <Link href="/products" className="text-nav hover:underline">
            Browse all Rakhis
          </Link>
        </p>
      )}

      <SeoLocationLanding location={location} related={related} />
    </div>
  );
}
