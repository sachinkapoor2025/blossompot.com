import {
  homepageCatalogDataSchema,
  type Category,
  type HomepageCatalogData,
  type Product,
} from "@blossompot/shared";
import { api } from "./api";
import { buildHomeCategoryTiles } from "./home-category-carousel";
import { CATALOG_REVALIDATE_SECONDS, loadProducts } from "./product-loader";

const MEMORY_TTL_MS = CATALOG_REVALIDATE_SECONDS * 1000;

type MemoryEntry = { at: number; data: HomepageCatalogData };

const memoryCache = new Map<string, MemoryEntry>();
const inFlight = new Map<string, Promise<HomepageCatalogData>>();

function readMemory(country: string): HomepageCatalogData | null {
  const hit = memoryCache.get(country);
  if (!hit) return null;
  if (Date.now() - hit.at >= MEMORY_TTL_MS) {
    memoryCache.delete(country);
    return null;
  }
  return hit.data;
}

function writeMemory(country: string, data: HomepageCatalogData) {
  memoryCache.set(country, { at: Date.now(), data });
}

/**
 * Same inputs the homepage used inline: merged visible catalog length, category length,
 * and `buildHomeCategoryTiles()` (category image, then one product image, then the static tile).
 */
export function deriveHomepageCatalogData(
  country: string,
  products: Product[],
  categories: Category[]
): HomepageCatalogData {
  return {
    country,
    giftCount: products.length,
    categoryCount: categories.length,
    tiles: buildHomeCategoryTiles(products, categories),
  };
}

async function readShared(country: string): Promise<HomepageCatalogData | null> {
  try {
    const data = await api<unknown>(`/homepage-catalog?country=${country}`, { revalidate: false });
    const parsed = homepageCatalogDataSchema.safeParse(data);
    if (!parsed.success || parsed.data.country !== country) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeShared(data: HomepageCatalogData): Promise<void> {
  const parsed = homepageCatalogDataSchema.safeParse(data);
  if (!parsed.success) return;
  try {
    await api(`/homepage-catalog?country=${parsed.data.country}`, {
      method: "PUT",
      body: JSON.stringify(parsed.data),
      revalidate: false,
    });
  } catch {
    /* The page still renders. The next instance recomputes if the shared record was not stored. */
  }
}

async function compute(country: string): Promise<HomepageCatalogData> {
  const [products, categoriesData] = await Promise.all([
    loadProducts({ country }),
    api<{ categories: Category[] }>("/categories", { revalidate: CATALOG_REVALIDATE_SECONDS }),
  ]);
  return deriveHomepageCatalogData(country, products, categoriesData.categories);
}

async function resolveHomepageCatalog(country: string): Promise<HomepageCatalogData> {
  const memory = readMemory(country);
  if (memory) {
    console.info(`homepage-catalog country=${country} source=memory`);
    return memory;
  }

  const shared = await readShared(country);
  if (shared) {
    writeMemory(country, shared);
    console.info(`homepage-catalog country=${country} source=shared`);
    return shared;
  }

  const computed = await compute(country);
  writeMemory(country, computed);
  // Do not hold the homepage HTML for the cache write. A miss already paid for the catalog fetch.
  void writeShared(computed);
  console.info(`homepage-catalog country=${country} source=miss`);
  return computed;
}

/**
 * Homepage-only catalog facts for one delivery country.
 * A hit reads the shared 45-second record. A miss uses `loadProducts()` and the existing tile helper,
 * then stores that result for other server instances.
 */
export function getHomepageCatalogData(country: string): Promise<HomepageCatalogData> {
  const iso = country.trim().toUpperCase();
  const pending = inFlight.get(iso);
  if (pending) return pending;

  const job = resolveHomepageCatalog(iso).finally(() => {
    inFlight.delete(iso);
  });
  inFlight.set(iso, job);
  return job;
}
