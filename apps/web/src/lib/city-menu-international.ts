import { internationalPath, publishedInternationalLocations } from "./content/geo/international/registry";
import { COUNTRY_HUB, countryName, type CityMenuContent } from "./city-menu-core";
import type { CityNavLink } from "./site";

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

/** City menu for countries whose links live in the international registry. */
export function internationalCityMenu(countryCode: string): CityMenuContent {
  const iso = countryCode.trim().toUpperCase();
  const hub = COUNTRY_HUB[iso];
  const name = countryName(iso);
  return {
    heading: `${name} city pages`,
    searchPlaceholder: `Search ${name} cities…`,
    allHref: hub?.href ?? "/locations",
    allLabel: hub?.label ?? "All locations",
    links: intlCitiesForCountry(iso),
  };
}
