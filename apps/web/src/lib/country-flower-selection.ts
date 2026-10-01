import {
  isProductStorefrontVisible,
  productVisibleForDeliveryCountry,
  type Product,
} from "@blossompot/shared";
import { shuffleForCity } from "@/lib/city-products";
import { flowerDeliveryCountryIso, type CountryFlowerDeliverySlug } from "@/lib/content/country-flower-delivery";

const FLOWER_CATEGORY_SLUGS = new Set(["flowers", "flower-bouquets"]);

/** Same selection the guide used before the product section streamed on its own. */
export function pickCountryProducts(products: Product[], slug: CountryFlowerDeliverySlug): Product[] {
  const countryIso = flowerDeliveryCountryIso(slug);
  const visible = products.filter(
    (p) => isProductStorefrontVisible(p) && productVisibleForDeliveryCountry(p, countryIso)
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
