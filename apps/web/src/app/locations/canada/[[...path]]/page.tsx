import type { Metadata } from "next";
import {
  InternationalMarketPage,
  internationalMetadata,
  internationalStaticParams,
} from "@/lib/content/geo/international/route-page";

interface Props {
  params: Promise<{ path?: string[] }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return internationalStaticParams("canada");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  return internationalMetadata("canada", path);
}

export default async function CanadaLocationPage({ params }: Props) {
  const { path } = await params;
  return <InternationalMarketPage market="canada" segments={path} />;
}
