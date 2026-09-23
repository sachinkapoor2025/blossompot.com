import { getDeliveryCountry } from "@blossompot/shared";
import { internationalPath, publishedInternationalLocations } from "./content/geo/international";
import { countryIsoFromPathname } from "./location-seo-urls";
import { cityLinks, type CityNavLink } from "./site";

export { countryIsoFromPathname };

export type CityMenuContent = {
  heading: string;
  searchPlaceholder: string;
  allHref: string;
  allLabel: string;
  links: readonly CityNavLink[];
};

const COUNTRY_HUB: Record<string, { href: string; label: string }> = {
  US: { href: "/locations", label: "All US locations" },
  GB: { href: "/locations/europe/united-kingdom", label: "All UK locations" },
  CA: { href: "/locations/canada", label: "All Canada locations" },
  AU: { href: "/locations/australia", label: "All Australia locations" },
  AE: { href: "/flower-delivery-uae", label: "UAE flower delivery" },
  IE: { href: "/locations/europe/ireland", label: "Ireland locations" },
  DE: { href: "/locations/europe/germany", label: "Germany locations" },
  FR: { href: "/locations/europe/france", label: "France locations" },
  NL: { href: "/locations/europe/netherlands", label: "Netherlands locations" },
  BE: { href: "/locations/europe/belgium", label: "Belgium locations" },
};

const UAE_CITIES: CityNavLink[] = [
  { label: "Dubai", slug: "dubai", href: "/flower-delivery-uae", menuLabel: "Dubai" },
  { label: "Abu Dhabi", slug: "abu-dhabi", href: "/flower-delivery-uae", menuLabel: "Abu Dhabi" },
  { label: "Sharjah", slug: "sharjah", href: "/flower-delivery-uae", menuLabel: "Sharjah" },
];

function countryName(iso: string): string {
  return getDeliveryCountry(iso)?.countryName ?? iso;
}

function intlCitiesForCountry(iso: string): CityNavLink[] {
  const all = publishedInternationalLocations().filter((loc) => loc.isoCountry === iso);
  const cities = all.filter((loc) => loc.kind === "city");
  const source = cities.length > 0 ? cities : all.filter((loc) => loc.kind === "city" || loc.kind === "region");
  return source.map((loc) => ({
    label: loc.name,
    slug: loc.slug,
    href: internationalPath(loc),
    menuLabel: loc.name,
  }));
}

export function cityMenuForCountry(countryCode: string | null | undefined): CityMenuContent {
  const iso = (countryCode ?? "US").trim().toUpperCase() || "US";

  if (iso === "US") {
    return {
      heading: "USA city pages",
      searchPlaceholder: "Search US cities…",
      allHref: COUNTRY_HUB.US.href,
      allLabel: COUNTRY_HUB.US.label,
      links: cityLinks,
    };
  }

  const links = iso === "AE" ? UAE_CITIES : intlCitiesForCountry(iso);
  const hub = COUNTRY_HUB[iso];
  const name = countryName(iso);

  return {
    heading: `${name} city pages`,
    searchPlaceholder: `Search ${name} cities…`,
    allHref: hub?.href ?? "/locations",
    allLabel: hub?.label ?? "All locations",
    links,
  };
}

export function filterCityMenuLinks(links: readonly CityNavLink[], query: string): CityNavLink[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...links];
  return links.filter((c) => `${c.label} ${c.menuLabel ?? ""} ${c.slug}`.toLowerCase().includes(q));
}
