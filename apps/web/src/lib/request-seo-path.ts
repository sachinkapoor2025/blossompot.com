import { headers } from "next/headers";
import { LOCATION_SEO_HEADER } from "@/lib/location-seo-urls";

export async function requestSeoPath(fallback: string): Promise<string> {
  try {
    const value = (await headers()).get(LOCATION_SEO_HEADER)?.trim();
    if (value?.startsWith("/")) return value;
  } catch {
    /* headers() unavailable outside a request */
  }
  return fallback;
}
