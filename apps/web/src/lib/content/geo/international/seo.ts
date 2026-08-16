import { site } from "@/lib/site";
import { breadcrumbJsonLd, canonical, faqJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/env";
import type { ResolvedLocation } from "./types";

export function internationalWebPageJsonLd(loc: ResolvedLocation) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical(loc.path)}#webpage`,
    url: canonical(loc.path),
    name: loc.title,
    description: loc.description,
    inLanguage: loc.locale,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
    breadcrumb: { "@id": `${canonical(loc.path)}#breadcrumb` },
  };
}

export function internationalServiceJsonLd(loc: ResolvedLocation) {
  const area =
    loc.serviceMode === "destination"
      ? {
          "@type": loc.kind === "city" ? "City" : loc.kind === "region" ? "State" : "Country",
          name: loc.name,
          containedInPlace: { "@type": "Country", name: "United States" },
        }
      : {
          "@type": "Country",
          name: "United States",
        };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name:
      loc.serviceMode === "destination"
        ? `Gift delivery to ${loc.label}`
        : `Order gifts from ${loc.label} for USA delivery`,
    description: loc.availability,
    url: canonical(loc.path),
    provider: { "@id": `${siteUrl}/#organization` },
    serviceType: "Flower, cake, and gift delivery to the United States",
    areaServed: area,
    audience: {
      "@type": "Audience",
      geographicArea: {
        "@type": loc.isoCountry && loc.serviceMode !== "destination" ? "Country" : "Country",
        name: loc.serviceMode === "destination" ? "United States" : loc.name,
      },
    },
    offers: {
      "@type": "Offer",
      priceCurrency: loc.serviceMode === "destination" ? "USD" : loc.currency,
      availability: "https://schema.org/InStock",
      url: canonical(loc.path),
    },
  };
}

export function internationalJsonLd(loc: ResolvedLocation) {
  return [
    breadcrumbJsonLd(loc.crumbs.map((c) => ({ name: c.label, path: c.path }))),
    faqJsonLd(loc.faqs),
    internationalWebPageJsonLd(loc),
    internationalServiceJsonLd(loc),
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: site.name,
      url: siteUrl,
    },
  ];
}
