import { notFound, permanentRedirect } from "next/navigation";
import {
  assertGeoLocationComplete,
  getGeoLocation,
  isGeoPublished,
} from "@/lib/content/geo/locations";
import { locationPublicPath } from "@/lib/content/seo-data";

interface Props {
  params: Promise<{ path: string[] }>;
}

/**
 * Compatibility layer: /locations/united-states/{state}/{city?} → /gifts-to-{slug}
 * Preserves indexed USA URLs. Direct 301, no redirect chains.
 */
export default async function UnitedStatesLegacyPath({ params }: Props) {
  const { path } = await params;
  if (!path?.length) notFound();

  const slug = path[path.length - 1]!;
  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo) || !isGeoPublished(geo)) notFound();

  if (path.length === 2 && geo.type === "city") {
    const state = getGeoLocation(path[0]!);
    if (!state || state.type !== "state") notFound();
    if (geo.state !== state.name && geo.stateAbbr.toLowerCase() !== path[0]) {
      // Still redirect if the city slug is real — avoid 404s on near-miss hierarchy.
    }
  }

  permanentRedirect(locationPublicPath(geo.slug));
}
