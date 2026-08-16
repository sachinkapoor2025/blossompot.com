import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { locationPublicPath } from "@/lib/content/seo-data";
import {
  geoCitiesInState,
  geoStates,
  locationLabel,
  publishedGeoLocations,
} from "@/lib/content/geo/locations";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Gift Delivery Locations — All 50 States, DC & Puerto Rico",
  description:
    "BlossomPot delivers flowers, cakes, and gifts to all 50 states, DC and Puerto Rico. Browse state hubs and major city delivery pages.",
  path: "/delivery-locations",
});

export default function DeliveryLocationsPage() {
  const states = geoStates();
  const published = new Set(publishedGeoLocations().map((g) => g.slug));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          { label: "Delivery locations" },
        ]}
      />
      <h1 className="text-3xl font-bold text-primary mb-3">
        Gift delivery locations across the USA
      </h1>
      <p className="text-slate-600 max-w-3xl mb-8 leading-relaxed">
        Delivering to all 50 states, DC and Puerto Rico. Open a state hub for city pages, cut-offs,
        and local FAQs. Same-day options appear only where coverage and the local clock allow.
        Ordering from Canada, Australia, the UK, or Europe? Start at the{" "}
        <Link href="/locations" className="text-nav hover:underline">
          international locations hub
        </Link>
        .
      </p>

      <div className="space-y-8">
        {states.map((st) => {
          const cities = geoCitiesInState(st.name).filter((c) => published.has(c.slug));
          return (
            <section key={st.slug} id={st.slug}>
              <h2 className="text-xl font-bold text-primary mb-2">
                <Link href={locationPublicPath(st.slug)} className="hover:underline">
                  {locationLabel(st)}
                </Link>
              </h2>
              {cities.length > 0 ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {cities.map((c) => (
                    <li key={c.slug}>
                      <Link href={locationPublicPath(c.slug)} className="text-nav hover:underline">
                        {locationLabel(c)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  Statewide hub live — city pages publish in later waves.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
