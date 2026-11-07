"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cityNavHref, cityNavMenuLabel } from "@/lib/site";
import { cityMenuForCountry, filterCityMenuLinks } from "@/lib/city-menu-for-location";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { deliverToDestination, navigateAfterLocationCommit } from "@/lib/country-switch";
import { useGboDeliveryCountries } from "@/lib/gbo-delivery-countries";

function CitiesCountryField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (countryCode: string) => void;
}) {
  const { countries } = useGboDeliveryCountries();
  return (
    <div className="px-3 pb-2">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor={id}>
        Country
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
      >
        {countries.some((c) => c.countryCode === value) ? null : (
          <option value={value}>{value}</option>
        )}
        {countries.map((c) => (
          <option key={c.countryCode} value={c.countryCode}>
            {c.countryName}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Desktop Cities dropdown. Mounted only while the menu is open. */
export function CitiesMenuPanel({
  menuIso,
  setMenuIso,
  query,
  setQuery,
  onClose,
  onNavigate,
}: {
  menuIso: string;
  setMenuIso: (iso: string) => void;
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const { openSelector, setLocation } = useDeliveryLocation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menu = cityMenuForCountry(menuIso);
  const visible = filterCityMenuLinks(menu.links, query);

  const chooseMenuCountry = (countryCode: string) => {
    const iso = countryCode.trim().toUpperCase();
    setMenuIso(iso);
    navigateAfterLocationCommit({
      href: deliverToDestination(pathname, iso, searchParams.toString()),
      commit: () => setLocation({ countryCode: iso, postalCode: "", postalDisplay: iso }),
      navigate: (url) => router.push(url),
    });
  };

  return (
    <div className="absolute top-full right-0 pt-1.5 z-[100]">
      <div className="min-w-[260px] max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
        <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {menu.heading}
        </p>
        <CitiesCountryField id="cities-country" value={menuIso} onChange={chooseMenuCountry} />
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={menu.searchPlaceholder}
            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
          />
        </div>
        <Link
          href={menu.allHref}
          className="block px-4 py-2.5 text-sm font-semibold text-nav hover:bg-blue-50 whitespace-nowrap"
          onClick={() => {
            onClose();
            onNavigate?.();
          }}
        >
          {menu.allLabel}
        </Link>
        {visible.length === 0 ? (
          <p className="px-4 py-2.5 text-sm text-slate-500">No city pages for this location yet.</p>
        ) : (
          visible.map((c) => (
            <Link
              key={c.slug}
              href={cityNavHref(c)}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-nav whitespace-nowrap"
              onClick={() => {
                onClose();
                onNavigate?.();
              }}
            >
              {cityNavMenuLabel(c)}
            </Link>
          ))
        )}
        <button
          type="button"
          className="mt-1 w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-nav hover:bg-blue-50"
          onClick={() => {
            onClose();
            openSelector();
          }}
        >
          United States — enter ZIP code
        </button>
      </div>
    </div>
  );
}

/** Mobile Cities list. Mounted only while that section is expanded. */
export function MobileCitiesPanel({
  cityMenuIso,
  setCityMenuIso,
  cityQuery,
  setCityQuery,
  onCloseMenu,
}: {
  cityMenuIso: string;
  setCityMenuIso: (iso: string) => void;
  cityQuery: string;
  setCityQuery: (value: string) => void;
  onCloseMenu: () => void;
}) {
  const { openSelector, setLocation } = useDeliveryLocation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menu = cityMenuForCountry(cityMenuIso);
  const visible = filterCityMenuLinks(menu.links, cityQuery);

  return (
    <div className="mt-1 ml-2 border-l-2 border-slate-100 pl-2 space-y-1">
      <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {menu.heading}
      </p>
      <CitiesCountryField
        id="cities-country-mobile"
        value={cityMenuIso}
        onChange={(iso) => {
          setCityMenuIso(iso);
          onCloseMenu();
          navigateAfterLocationCommit({
            href: deliverToDestination(pathname, iso, searchParams.toString()),
            commit: () => setLocation({ countryCode: iso, postalCode: "", postalDisplay: iso }),
            navigate: (url) => router.push(url),
          });
        }}
      />
      <input
        value={cityQuery}
        onChange={(e) => setCityQuery(e.target.value)}
        placeholder={menu.searchPlaceholder}
        className="mx-2 mb-1 w-[calc(100%-1rem)] rounded-md border border-slate-200 px-2 py-1.5 text-sm"
      />
      <Link
        href={menu.allHref}
        onClick={onCloseMenu}
        className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-nav hover:bg-blue-50"
      >
        {menu.allLabel}
      </Link>
      {visible.length === 0 ? (
        <p className="px-4 py-2.5 text-sm text-slate-500">No city pages for this location yet.</p>
      ) : (
        visible.map((c) => (
          <Link
            key={c.slug}
            href={cityNavHref(c)}
            onClick={onCloseMenu}
            className="block rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-nav"
          >
            {cityNavMenuLabel(c)}
          </Link>
        ))
      )}
      <button
        type="button"
        className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-nav hover:bg-blue-50"
        onClick={() => {
          onCloseMenu();
          openSelector();
        }}
      >
        United States — enter ZIP code
      </button>
    </div>
  );
}
