import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CountrySeoArticle } from "@/components/CountrySeoArticle";
import { countrySeoContent } from "@/lib/content/country-seo-registry";
import { locationPublicPath } from "@/lib/content/seo-data";
import {
  geoCitiesInState,
  geoStates,
  locationLabel,
  publishedGeoLocations,
} from "@/lib/content/geo/locations";
import { pageMetadata } from "@/lib/seo";

const usaDeliverySeo = countrySeoContent("US", "delivery-locations");

export const metadata: Metadata = pageMetadata({
  title: usaDeliverySeo.title,
  description: usaDeliverySeo.description,
  path: "/delivery-locations",
});

export default function DeliveryLocationsPage() {
  const published = new Set(publishedGeoLocations().map((g) => g.slug));
  const states = geoStates().filter((state) => published.has(state.slug));

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 pt-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          { label: "Delivery locations" },
        ]}
      />
    </div>
    <CountrySeoArticle article={usaDeliverySeo} />
    <div className="max-w-7xl mx-auto px-4 py-10">
      <p className="text-slate-600 max-w-3xl mb-8 leading-relaxed">
        Ordering from Canada, Australia, the UK, or Europe? Start at the{" "}
        <Link href="/locations" className="text-nav hover:underline">
          international locations hub
        </Link>
        .
      </p>
      <h2 className="text-2xl font-bold text-primary mb-6">Browse published USA state and city pages</h2>

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
    </>
  );
}
