import { internationalCityMenu } from "./city-menu-international";
import { isLocalFooterCityMenu, localCityMenu, type CityMenuContent } from "./city-menu-core";

export type { CityMenuContent };
export { countryIsoFromPathname } from "./location-seo-urls";
export { filterCityMenuLinks, footerCityColumns } from "./city-menu-core";

export function cityMenuForCountry(countryCode: string | null | undefined): CityMenuContent {
  const iso = (countryCode ?? "US").trim().toUpperCase() || "US";
  if (isLocalFooterCityMenu(iso)) return localCityMenu(iso);
  return internationalCityMenu(iso);
}
