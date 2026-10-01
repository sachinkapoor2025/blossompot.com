"use client";

import Link from "next/link";
import { cityMenuForCountry } from "@/lib/city-menu-for-location";
import { COUNTRY_GUIDE_HREF } from "@/lib/gbo-delivery-countries";
import { countryDisplayName } from "@/lib/location-seo-urls";
import { countriesMenu, cityNavHref } from "@/lib/site";
import { useStorefrontCountryIso } from "@/lib/use-storefront-country";

export function FooterDeliverTo() {
  const iso = useStorefrontCountryIso() ?? "US";
  const country = countryDisplayName(iso);
  const menu = cityMenuForCountry(iso);
  const guideHref = COUNTRY_GUIDE_HREF[iso];
  const guide = countriesMenu.items.find((item) => item.href === guideHref);
  const cityLinks = menu.links.slice(0, 12).map((city) => ({
    label: city.menuLabel ?? city.label,
    href: city.href ?? cityNavHref(city),
  }));

  return (
    <div className="col-span-2 lg:col-span-5 min-w-0">
      <p className="font-semibold text-primary mb-3 sm:mb-4">Deliver to {country}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-slate-600">
        {guide ? (
          <li className="col-span-2 sm:col-span-3">
            <Link href={guide.href} className="hover:text-primary hover:underline font-medium">
              {guide.label}
            </Link>
          </li>
        ) : null}
        {cityLinks.length > 0 ? (
          <li className="col-span-2 sm:col-span-3 pt-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">{country} cities</span>
          </li>
        ) : null}
        {cityLinks.map((c) => (
          <li key={`${c.href}-${c.label}`}>
            <Link href={c.href} className="hover:text-primary hover:underline">
              {c.label}
            </Link>
          </li>
        ))}
        <li className="col-span-2 sm:col-span-3">
          <Link href={menu.allHref} className="hover:text-primary hover:underline font-medium">
            {menu.allLabel} →
          </Link>
        </li>
      </ul>
    </div>
  );
}
