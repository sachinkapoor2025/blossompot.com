import type { Metadata } from "next";
import { InternationalMarketPage, internationalMetadata } from "@/lib/content/geo/international/route-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateMetadata(): Promise<Metadata> {
  return internationalMetadata("united-states", []);
}

export default function UnitedStatesHubPage() {
  return <InternationalMarketPage market="united-states" />;
}
