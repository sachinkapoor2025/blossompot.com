"use client";

import { Suspense, use, useId, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  COUNTRY_HUB,
  footerCityColumns,
  isLocalFooterCityMenu,
  localCityMenu,
  type CityMenuContent,
} from "@/lib/city-menu-core";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { footerUsaTopicHeading } from "@/lib/footer-usa-topic";
import { COUNTRY_GUIDE_HREF } from "@/lib/gbo-delivery-countries";
import { countryDisplayName, countryIsoFromPathname } from "@/lib/location-seo-urls";
import { countriesMenu, cityNavHref } from "@/lib/site";

const linkClass = "text-slate-700 hover:text-primary hover:underline";

export function FooterDeliverToFallback() {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <PinIcon />
        Deliver to
      </p>
    </div>
  );
}

const internationalMenuCache = new Map<string, Promise<CityMenuContent>>();

function internationalMenu(iso: string): Promise<CityMenuContent> {
  const key = iso.trim().toUpperCase();
  let pending = internationalMenuCache.get(key);
  if (!pending) {
    pending = import("@/lib/city-menu-international").then((mod) => mod.internationalCityMenu(key));
    internationalMenuCache.set(key, pending);
  }
  return pending;
}

/**
 * Delivery column. Country follows the header selection, the page URL, or the saved location.
 * US and UAE menus are local. The international registry loads only once `loadInternationalCities` is true.
 */
export function FooterDeliverTo({
  idPrefix = "footer-cities",
  showHeading = true,
  loadInternationalCities = false,
}: {
  idPrefix?: string;
  showHeading?: boolean;
  loadInternationalCities?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { location, ready, pendingCountry } = useDeliveryLocation();
  const pathIso = countryIsoFromPathname(pathname, searchParams.get("country"));
  const iso = (pendingCountry ?? pathIso ?? (ready ? location?.countryCode : null) ?? "US").trim().toUpperCase();
  if (isLocalFooterCityMenu(iso)) {
    return <FooterCityColumn idPrefix={idPrefix} showHeading={showHeading} iso={iso} menu={localCityMenu(iso)} />;
  }
  if (!loadInternationalCities) {
    return <FooterCityColumn idPrefix={idPrefix} showHeading={showHeading} iso={iso} menu={null} />;
  }
  return (
    <Suspense fallback={<FooterCityColumn idPrefix={idPrefix} showHeading={showHeading} iso={iso} menu={null} />}>
      <InternationalFooterCities idPrefix={idPrefix} showHeading={showHeading} iso={iso} />
    </Suspense>
  );
}

function InternationalFooterCities({
  idPrefix,
  showHeading,
  iso,
}: {
  idPrefix: string;
  showHeading: boolean;
  iso: string;
}) {
  const menu = use(internationalMenu(iso));
  return <FooterCityColumn idPrefix={idPrefix} showHeading={showHeading} iso={iso} menu={menu} />;
}

function FooterCityColumn({
  idPrefix,
  showHeading,
  iso,
  menu,
}: {
  idPrefix: string;
  showHeading: boolean;
  iso: string;
  menu: CityMenuContent | null;
}) {
  const pathname = usePathname();
  const country = countryDisplayName(iso);
  const guideHref = COUNTRY_GUIDE_HREF[iso];
  const guide = guideHref ? countriesMenu.items.find((item) => item.href === guideHref) : undefined;
  const topicLabel =
    guide?.href === "/flower-delivery-usa" ? (footerUsaTopicHeading(pathname) ?? guide.label) : guide?.label;
  const hub = COUNTRY_HUB[iso];
  const cityLinks = (menu?.links ?? []).map((city) => ({
    label: city.menuLabel ?? city.label,
    href: city.href ?? cityNavHref(city),
    slug: city.slug,
    menuLabel: city.menuLabel,
  }));
  const columns = menu ? footerCityColumns(cityLinks, iso) : null;
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const visible = columns ? (expanded ? columns.all : columns.preview) : [];
  const canToggle = columns ? columns.all.length > columns.preview.length : false;
  const allLabel = menu?.allLabel ?? hub?.label ?? "All locations";
  const allHref = menu?.allHref ?? hub?.href ?? "/locations";

  return (
    <div className="min-w-0" aria-busy={menu ? undefined : true}>
      {showHeading ? (
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <PinIcon />
          Deliver to {country}
        </h2>
      ) : null}
      {guide ? (
        <p className="mt-3 text-center text-sm leading-6">
          <Link href={guide.href} className={linkClass}>
            {topicLabel}
          </Link>
        </p>
      ) : null}
      {visible.length > 0 ? (
        <>
          <p className="mb-3 mt-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <span className="h-px flex-1 bg-[#E8CCD7]" aria-hidden />
            {country} cities
            <span className="h-px flex-1 bg-[#E8CCD7]" aria-hidden />
          </p>
          <ul id={`${idPrefix}-${listId}`} className="grid grid-cols-2 gap-x-4 gap-y-2 text-center text-sm leading-6 text-slate-700">
            {visible.map((city) => (
              <li key={`${city.href}-${city.slug}`} className="min-w-0 text-center">
                <Link href={city.href ?? cityNavHref(city)} className={linkClass}>
                  {city.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {canToggle ? (
        <p className="mt-3 text-center">
          <button
            type="button"
            className="inline-flex min-h-11 items-center font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-0"
            aria-expanded={expanded}
            aria-controls={`${idPrefix}-${listId}`}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Show fewer locations ↑" : `${allLabel} →`}
          </button>
        </p>
      ) : allHref ? (
        <p className="mt-3 text-center">
          <Link href={allHref} className="font-medium text-primary hover:underline">
            {allLabel} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
