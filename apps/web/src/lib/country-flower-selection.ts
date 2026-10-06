import {
  isProductStorefrontVisible,
  productVisibleForDeliveryCountry,
  SHOPPING_COUNTRY_ISO,
  type Product,
} from "@blossompot/shared";
import { shuffleForCity } from "./city-products";
import type { CountryFlowerDeliverySlug } from "./content/country-flower-delivery";

const FLOWER_CATEGORY_SLUGS = new Set(["flowers", "flower-bouquets"]);

/**
 * Guide rails shop the United States. The slug still chooses the card count
 * and shuffle seed. Guide titles keep their own country.
 */
export function pickCountryProducts(products: Product[], slug: CountryFlowerDeliverySlug): Product[] {
  const visible = products.filter(
    (p) => isProductStorefrontVisible(p) && productVisibleForDeliveryCountry(p, SHOPPING_COUNTRY_ISO)
  );
  const flowers = visible.filter((p) => FLOWER_CATEGORY_SLUGS.has(p.categorySlug));
  if (slug === "usa") {
    const pool = flowers.length > 0 ? flowers : visible;
    return shuffleForCity(pool, `flower-delivery-${slug}`).slice(0, 24);
  }
  const flowersFirst = [
    ...flowers,
    ...visible.filter((p) => !FLOWER_CATEGORY_SLUGS.has(p.categorySlug)),
  ];
  return shuffleForCity(flowersFirst, `flower-delivery-${slug}`).slice(0, 10);
}
