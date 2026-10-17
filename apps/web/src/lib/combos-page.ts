import { api } from "./api";
import { loadStorefrontCatalog } from "./product-loader";

export const COMBOS_PATH = "/combos";
export const COMBOS_HEADING = "Combos";

export type ComboRecordView = {
  slug: string;
  name: string;
  description?: string;
  productSlugs: string[];
  published?: boolean;
  sortOrder?: number;
};

export type StorefrontComboComponent = {
  slug: string;
  name: string;
  price: number;
  /** Primary image for this component. Null when that product has no image. */
  image: string | null;
  inventory: number;
};

export type StorefrontCombo = {
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD" | "INR";
  components: [StorefrontComboComponent, StorefrontComboComponent];
  sortOrder: number;
};

export type CombosPageView =
  | { state: "combos"; combos: StorefrontCombo[] }
  | { state: "empty"; combos: [] }
  | { state: "error"; combos: [] };

type PricedComponent = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  currency?: "USD" | "INR";
  images?: string[];
  inventory?: number;
};

/** First real image belonging to this product. Never borrowed from another product. */
export function comboComponentImage(images: readonly string[] | undefined): string | null {
  const image = images?.map((url) => url.trim()).find((url) => url.length > 0);
  return image ?? null;
}

function componentView(product: PricedComponent): StorefrontComboComponent {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: comboComponentImage(product.images),
    inventory: product.inventory ?? 0,
  };
}

/** A combo is shown only when both components are in the country-eligible catalog. */
export function presentStorefrontCombo<T extends PricedComponent>(
  combo: ComboRecordView,
  products: ReadonlyMap<string, T>
): StorefrontCombo | null {
  if (combo.published === false || combo.productSlugs.length !== 2) return null;
  const [firstSlug, secondSlug] = combo.productSlugs;
  const first = firstSlug ? products.get(firstSlug) : undefined;
  const second = secondSlug ? products.get(secondSlug) : undefined;
  if (!first || !second) return null;
  const currency = componentCurrency(first);
  if (componentCurrency(second) !== currency) return null;
  const price = sumMoney([first.price, second.price]);
  const compareAt = sumMoney([first.compareAtPrice ?? first.price, second.compareAtPrice ?? second.price]);
  return {
    slug: combo.slug,
    name: combo.name,
    description: combo.description ?? "",
    price,
    ...(compareAt > price ? { compareAtPrice: compareAt } : {}),
    currency,
    components: [componentView(first), componentView(second)],
    sortOrder: combo.sortOrder ?? 0,
  };
}

/** Slugs that can still become a visible combo. Unpublished or incomplete records are ignored. */
export function comboComponentSlugs(combos: readonly ComboRecordView[]): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const combo of combos) {
    if (combo.published === false || combo.productSlugs.length !== 2) continue;
    for (const slug of combo.productSlugs) {
      const trimmed = slug.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      slugs.push(trimmed);
    }
  }
  return slugs;
}

export async function loadCombosPage(country?: string): Promise<CombosPageView> {
  try {
    const records = await api<{ combos?: ComboRecordView[] }>("/combos", { revalidate: false });
    const combos = records.combos ?? [];
    const slugs = comboComponentSlugs(combos);
    if (slugs.length === 0) return { state: "empty", combos: [] };
    const catalog = await loadStorefrontCatalog({ country, slugs });
    if (!catalog.ok) return { state: "error", combos: [] };
    const products = new Map(catalog.products.map((product) => [product.slug, product]));
    const visible = combos
      .map((combo) => presentStorefrontCombo(combo, products))
      .filter((combo): combo is StorefrontCombo => combo != null);
    if (visible.length === 0) return { state: "empty", combos: [] };
    return { state: "combos", combos: visible };
  } catch {
    return { state: "error", combos: [] };
  }
}

function componentCurrency(product: PricedComponent): "USD" | "INR" {
  return product.currency === "INR" ? "INR" : "USD";
}

function sumMoney(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
}

export function sortStorefrontCombos<T extends { name: string; price: number; sortOrder: number }>(
  combos: readonly T[],
  sort: "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc"
): T[] {
  const next = [...combos];
  if (sort === "price-asc") return next.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return next.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") return next.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name-desc") return next.sort((a, b) => b.name.localeCompare(a.name));
  return next.sort((a, b) => a.sortOrder - b.sortOrder);
}
