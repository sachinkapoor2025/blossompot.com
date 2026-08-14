import type { Metadata } from "next";
import {
  productMetaDescription,
  resolveProductImageUrls,
  type ProductRatingAggregate,
} from "@blossompot/shared";
import { site } from "./site";
import { getCdnUrl, siteUrl } from "./env";
import { locationPublicPath } from "./content/seo-data";

export { metaDescription, productMetaDescription } from "@blossompot/shared";

/** Default OG image size (site logo / social share). */
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/** Build absolute canonical URL for a path (no query string). */
export function canonical(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${p === "/" ? "" : p}`.replace(/([^:]\/)\/+/g, "$1") || siteUrl;
}

function ogImages(url: string, alt: string) {
  return [{ url, alt, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }];
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
  /** Use exact title (no layout template suffix). Required for category SEO titles. */
  absoluteTitle?: boolean;
}): Metadata {
  const url = canonical(opts.path);
  const image = opts.ogImage ?? site.logoPngSrc ?? site.logoSrc;
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: site.name,
      locale: "en_US",
      type: "website",
      images: ogImages(image, site.name),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** Product pages — og:type=product for WhatsApp/Facebook link previews. */
export function productPageMetadata(opts: {
  title: string;
  seoDescription?: string;
  description: string;
  path: string;
  price: number;
  currency: string;
  ogImage?: string;
}): Metadata {
  const description = productMetaDescription(opts.seoDescription, opts.description);
  const url = canonical(opts.path);
  const image = opts.ogImage ?? site.logoPngSrc ?? site.logoSrc;
  const price = Number.isFinite(opts.price) ? opts.price.toFixed(2) : "0.00";
  const currency = opts.currency === "INR" ? "INR" : "USD";

  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: site.name,
      locale: "en_US",
      type: "website",
      images: ogImages(image, opts.title),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [image],
    },
    other: {
      "product:price:amount": price,
      "product:price:currency": currency,
    },
    robots: { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: site.name,
    legalName: site.legalName,
    foundingDate: site.foundingDate,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: canonical(site.logoPngSrc),
      width: 512,
      height: 512,
    },
    description: site.description,
    email: site.supportEmail,
    telephone: site.phone,
    sameAs: [
      "https://www.facebook.com/blossompot/",
      "https://www.instagram.com/blossompot/",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: site.supportEmail,
        telephone: site.phone,
        url: `https://wa.me/${site.whatsapp}`,
        availableLanguage: ["en"],
        areaServed: "US",
      },
    ],
    areaServed: [{ "@type": "Country", name: "United States" }],
    audience: {
      "@type": "Audience",
      audienceType:
        "Customers ordering flowers, cakes, bouquets, and gifts for delivery across the United States",
    },
    knowsAbout: [
      "Flower delivery USA",
      "Birthday cake delivery",
      "Anniversary flowers and gifts",
      "Valentine's Day flower delivery",
      "Mother's Day gifts and bouquets",
      "Send flowers and gifts across the USA",
      "Order flowers, cakes, and gifts online",
      "Gift hampers USA",
      "Same-day flower delivery",
      "Personalized gifts USA",
    ],
  };
}

export function onlineStoreJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${siteUrl}/#store`,
    name: site.name,
    url: siteUrl,
    description: site.description,
    image: canonical(site.logoSrc),
    email: site.supportEmail,
    telephone: site.phone,
    areaServed: [
      { "@type": "Country", name: "United States" },
      { "@type": "Country", name: "India" },
    ],
    priceRange: "$$",
    currenciesAccepted: "USD, INR",
    paymentAccepted: "Credit Card, Debit Card, UPI, Razorpay, Stripe",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
      },
    },
    parentOrganization: { "@id": `${siteUrl}/#organization` },
  };
}

/** California fulfillment warehouse — differentiator for "ships from USA". */
export function californiaWarehouseJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${siteUrl}/#california-warehouse`,
    name: `${site.name} California Fulfillment`,
    description:
      "BlossomPot California warehouse supporting careful USA gift fulfillment for flowers, cakes, and curated gifts.",
    url: siteUrl,
    image: canonical(site.logoSrc),
    parentOrganization: { "@id": `${siteUrl}/#organization` },
    address: {
      "@type": "PostalAddress",
      addressRegion: "CA",
      addressCountry: "US",
    },
    areaServed: { "@type": "Country", name: "United States" },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: site.name,
    url: siteUrl,
    description: site.description,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqJsonLd(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

/**
 * Product JSON-LD — price/offers come from the same storefront `product` object
 * used for the PDP UI and `product:price:amount` meta (via loadProduct → API).
 * AggregateRating is included only when DynamoDB has real published reviews
 * (`product.ratingAggregate`); site testimonials are NOT copied onto every SKU.
 */
export function productJsonLd(product: {
  slug: string;
  name: string;
  description: string;
  seoDescription?: string;
  images?: string[];
  sku?: string;
  price: number;
  currency: string;
  inventory: number;
  categorySlug?: string;
  ratingAggregate?: ProductRatingAggregate;
}) {
  const aggregate =
    product.ratingAggregate && product.ratingAggregate.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAggregate.ratingValue.toFixed(1),
            reviewCount: String(product.ratingAggregate.reviewCount),
            bestRating: String(product.ratingAggregate.bestRating ?? 5),
            worstRating: String(product.ratingAggregate.worstRating ?? 1),
          },
        }
      : {};

  const images = resolveProductImageUrls(product.images, getCdnUrl()).filter(Boolean);
  const offerPrice = Number(product.price).toFixed(2);
  const productUrl = canonical(`/products/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: productMetaDescription(product.seoDescription, product.description),
    image: images,
    sku: product.sku ?? product.slug,
    mpn: product.slug,
    productID: product.sku ?? product.slug,
    url: productUrl,
    brand: { "@type": "Brand", name: site.name },
    category: product.categorySlug?.replace(/-/g, " "),
    ...aggregate,
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: offerPrice,
      priceCurrency: product.currency === "INR" ? "INR" : "USD",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@id": `${siteUrl}/#organization` },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: product.currency === "INR" ? "INR" : "USD",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 5,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
      },
    },
  };
}

export function articleJsonLd(article: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: canonical(`/blog/${article.slug}`),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    ...(article.image ? { image: article.image } : {}),
    author: { "@type": "Organization", name: site.name },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function itemListJsonLd(name: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: canonical(item.path),
    })),
  };
}

export function howToSendGiftJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to send flowers, cakes & gifts online in the USA",
    description:
      "Order flowers, cakes, bouquets, and curated gifts for delivery across the United States with BlossomPot.",
    totalTime: "P7D",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Browse gift collections",
        text: "Visit BlossomPot.com and choose flowers, bouquets, cakes, gift hampers, or occasion collections.",
        url: canonical("/products"),
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Add to cart",
        text: "Select your gift. Most products support a personal message and delivery preferences at checkout.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Enter US delivery address",
        text: "At checkout, enter the recipient's full US address — city, state, and ZIP code.",
        url: canonical("/shipping"),
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Pay securely",
        text: "Complete payment with Razorpay (INR) or Stripe (USD).",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Receive delivery in USA",
        text: "BlossomPot delivers across America with nationwide coverage and faster windows to major metros when available.",
      },
    ],
  };
}

/** @deprecated Use howToSendGiftJsonLd */


export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${site.name}`,
    url: canonical("/contact"),
    description: `Contact ${site.name} for flower, cake, and gift delivery support across the USA.`,
    mainEntity: { "@id": `${siteUrl}/#organization` },
  };
}

export function serviceAreaJsonLd(city: { label: string; slug: string; state?: string }) {
  const path = locationPublicPath(city.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Gift Delivery to ${city.label}, USA`,
    description: `Send flowers, cakes, and gifts to ${city.label} with ${site.name}. Premium gifting with clear USA delivery windows.`,
    url: canonical(path),
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: {
      "@type": city.state ? "City" : "State",
      name: city.state ? `${city.label}, ${city.state}` : city.label,
      containedInPlace: { "@type": "Country", name: "United States" },
    },
    serviceType: "Flower, cake, and gift delivery",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: canonical(path),
    },
  };
}

export function aboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${site.name}`,
    url: canonical("/about"),
    description: site.description,
    mainEntity: { "@id": `${siteUrl}/#organization` },
  };
}
