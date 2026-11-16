import type { Product } from "@blossompot/shared";
import { isProductStorefrontVisible, productVisibleForDeliveryCountry } from "@blossompot/shared";
import { isRakhiRelatedProduct } from "./rakhi-filter";
import { getBundledCatalogProducts } from "./catalog-fallback";
import { loadProducts } from "./product-loader";
import { countrySeoSlug } from "./location-seo-urls";
import { specialDayArticle, type SpecialDayArticle } from "./special-day-copy";
import { selectSpecialDayProducts } from "./special-day-match";
import {
  SPECIAL_DAYS,
  specialDayPublicSlug,
  type SpecialDayId,
} from "./special-day-slugs";

export type SpecialDayContent = SpecialDayArticle & {
  id: SpecialDayId;
  publicSlug: string;
  name: string;
  date: string;
  heroSrc: string;
  heroAlt: string;
};

const PAGES: Record<SpecialDayId, Pick<SpecialDayContent, "name" | "date" | "heroSrc" | "heroAlt">> = {
  "rose-day": {
    name: "Rose Day",
    date: "7 February",
    heroSrc: "/banners/special-days/rose-day.jpg",
    heroAlt: "Red, blush, and white roses in a glass vase",
  },
  "propose-day": {
    name: "Propose Day",
    date: "8 February",
    heroSrc: "/banners/special-days/propose-day.jpg",
    heroAlt: "Red roses beside a ring box and a cream gift box",
  },
  "chocolate-day": {
    name: "Chocolate Day",
    date: "9 February",
    heroSrc: "/banners/special-days/chocolate-day.jpg",
    heroAlt: "Heart-shaped chocolates, a chocolate cake, and pink roses",
  },
  "teddy-day": {
    name: "Teddy Day",
    date: "10 February",
    heroSrc: "/banners/special-days/teddy-day.jpg",
    heroAlt: "A plush teddy bear with pink roses and a gift box",
  },
  "promise-day": {
    name: "Promise Day",
    date: "11 February",
    heroSrc: "/banners/special-days/promise-day.jpg",
    heroAlt: "A ribboned gift box with a handwritten card and a single rose",
  },
  "hug-day": {
    name: "Hug Day",
    date: "12 February",
    heroSrc: "/banners/special-days/hug-day.jpg",
    heroAlt: "A mixed bouquet of sunflowers, peach roses, and daisies",
  },
  "kiss-day": {
    name: "Kiss Day",
    date: "13 February",
    heroSrc: "/banners/special-days/kiss-day.jpg",
    heroAlt: "A close bouquet of deep red roses with a red ribbon",
  },
  "valentines-day": {
    name: "Valentine's Day",
    date: "14 February",
    heroSrc: "/banners/special-days/valentines-day.jpg",
    heroAlt: "Red and pink roses with a gift box and heart chocolates",
  },
};

export function getSpecialDay(id: string, countryIso = "US"): SpecialDayContent | null {
  const publicSlug = specialDayPublicSlug(id);
  const page = PAGES[id as SpecialDayId];
  const article = specialDayArticle(id, countryIso);
  if (!publicSlug || !page || !article) return null;
  return { id: id as SpecialDayId, publicSlug, ...page, ...article };
}

export function allSpecialDays(): SpecialDayContent[] {
  return SPECIAL_DAYS.map((day) => getSpecialDay(day.id)).filter((day): day is SpecialDayContent => Boolean(day));
}

export function specialDayLocationHref(id: string, countryIso: string): string {
  const publicSlug = specialDayPublicSlug(id);
  if (!publicSlug) return "/valentines-day-gifts";
  return `/${publicSlug}-to-${countrySeoSlug(countryIso)}`;
}

/** Live catalog for the shopper’s country, with the shipped catalog only if the API returns nothing. */
export async function loadSpecialDayProducts(dayId: string, country: string): Promise<Product[]> {
  let live: Product[] = [];
  try {
    live = await loadProducts({ country });
  } catch {
    live = [];
  }
  const usable = (product: Product) =>
    isProductStorefrontVisible(product) &&
    productVisibleForDeliveryCountry(product, country) &&
    !isRakhiRelatedProduct(product);
  const fromLive = selectSpecialDayProducts(dayId, live.filter(usable));
  if (fromLive.length > 0) return fromLive;
  return selectSpecialDayProducts(dayId, getBundledCatalogProducts().filter(usable));
}
