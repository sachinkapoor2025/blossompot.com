import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InternationalLocationPage } from "@/components/geo/InternationalLocationPage";
import { pageMetadata } from "@/lib/seo";
import {
  generateParamsForMarket,
  isInternationalIndexable,
  resolveInternationalPath,
  resolveLocation,
  type MarketSlug,
} from "./index";

export function internationalStaticParams(market: MarketSlug) {
  return generateParamsForMarket(market);
}

export async function internationalMetadata(
  market: MarketSlug,
  segments: string[] | undefined
): Promise<Metadata> {
  const loc = resolveInternationalPath(market, segments ?? []);
  if (!loc || !isInternationalIndexable(loc)) {
    return { title: "Locations", robots: { index: false, follow: false } };
  }
  const resolved = resolveLocation(loc);
  return {
    ...pageMetadata({
      title: loc.title,
      description: loc.description,
      path: resolved.path,
      absoluteTitle: true,
    }),
    openGraph: {
      ...pageMetadata({
        title: loc.title,
        description: loc.description,
        path: resolved.path,
        absoluteTitle: true,
      }).openGraph,
      locale: loc.locale.replace("-", "_"),
    },
  };
}

export function InternationalMarketPage({
  market,
  segments,
}: {
  market: MarketSlug;
  segments?: string[];
}) {
  const loc = resolveInternationalPath(market, segments ?? []);
  if (!loc || !isInternationalIndexable(loc)) notFound();
  return <InternationalLocationPage loc={resolveLocation(loc)} />;
}
