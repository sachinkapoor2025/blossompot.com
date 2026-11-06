import { getDeliveryCountry } from "@blossompot/shared";
import { cityLinks, type CityNavLink } from "./site";

export type CityMenuContent = {
  heading: string;
  searchPlaceholder: string;
  allHref: string;
  allLabel: string;
  links: readonly CityNavLink[];
};

export const COUNTRY_HUB: Record<string, { href: string; label: string }> = {
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

export function countryName(iso: string): string {
  return getDeliveryCountry(iso)?.countryName ?? iso;
}

/** US and UAE menus do not need the international city registry. */
export function isLocalFooterCityMenu(countryCode: string | null | undefined): boolean {
  const iso = (countryCode ?? "US").trim().toUpperCase() || "US";
  return iso === "US" || iso === "AE";
}

export function localCityMenu(countryCode: string | null | undefined): CityMenuContent {
  const iso = (countryCode ?? "US").trim().toUpperCase() || "US";
  if (iso === "AE") {
    const name = countryName(iso);
    return {
      heading: `${name} city pages`,
      searchPlaceholder: `Search ${name} cities…`,
      allHref: COUNTRY_HUB.AE.href,
      allLabel: COUNTRY_HUB.AE.label,
      links: UAE_CITIES,
    };
  }
  return {
    heading: "USA city pages",
    searchPlaceholder: "Search US cities…",
    allHref: COUNTRY_HUB.US.href,
    allLabel: COUNTRY_HUB.US.label,
    links: cityLinks,
  };
}

const US_FOOTER_PRIORITY = ["california", "florida", "new-york", "texas", "chicago", "dallas"] as const;

function citySortLabel(link: CityNavLink): string {
  return link.menuLabel ?? link.label;
}

/** Collapsed footer shows a short priority list. Expanded shows every current link once, A–Z. */
export function footerCityColumns(links: readonly CityNavLink[], countryIso: string): {
  preview: CityNavLink[];
  all: CityNavLink[];
} {
  const all = [...links].sort((a, b) => citySortLabel(a).localeCompare(citySortLabel(b)));
  const iso = countryIso.trim().toUpperCase();
  if (iso === "US") {
    const preview = US_FOOTER_PRIORITY.flatMap((slug) => {
      const match = links.find((link) => link.slug === slug);
      return match ? [match] : [];
    });
    return { preview, all };
  }
  return { preview: links.slice(0, 6), all };
}

export function filterCityMenuLinks(links: readonly CityNavLink[], query: string): CityNavLink[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...links];
  return links.filter((c) => `${c.label} ${c.menuLabel ?? ""} ${c.slug}`.toLowerCase().includes(q));
}
