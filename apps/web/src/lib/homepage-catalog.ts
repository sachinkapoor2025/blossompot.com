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

async function writeShared(data: HomepageCatalogData): Promise<boolean> {
  const parsed = homepageCatalogDataSchema.safeParse(data);
  if (!parsed.success) {
    console.info(
      `homepage-catalog country=${data.country} source=miss stored=false reason=schema`
    );
    return false;
  }
  try {
    await api(`/homepage-catalog?country=${parsed.data.country}`, {
      method: "PUT",
      body: JSON.stringify(parsed.data),
      revalidate: false,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "write failed";
    console.info(
      `homepage-catalog country=${parsed.data.country} source=miss stored=false reason=${message}`
    );
    return false;
  }
}

async function compute(country: string): Promise<HomepageCatalogData> {
  const [products, categoriesData] = await Promise.all([
    loadProducts({ country }),
    api<{ categories: Category[] }>("/categories", { revalidate: CATALOG_REVALIDATE_SECONDS }),
  ]);
  return deriveHomepageCatalogData(country, products, categoriesData.categories);
}

export type HomepageCatalogSource = "memory" | "shared" | "miss";

type HomepageCatalogDeps = {
  readShared: (country: string) => Promise<HomepageCatalogData | null>;
  writeShared: (data: HomepageCatalogData) => Promise<boolean>;
  compute: (country: string) => Promise<HomepageCatalogData>;
};

/**
 * Shared record first, so another server instance can reuse what was stored.
 * Memory is only the fallback when the shared read misses but this instance already built the country.
 */
export async function resolveHomepageCatalogData(
  country: string,
  deps: HomepageCatalogDeps,
  memory: Map<string, MemoryEntry> = memoryCache
): Promise<{ data: HomepageCatalogData; source: HomepageCatalogSource }> {
  const iso = country.trim().toUpperCase();
  const shared = await deps.readShared(iso);
  if (shared) {
    memory.set(iso, { at: Date.now(), data: shared });
    return { data: shared, source: "shared" };
  }

  const local = memory.get(iso);
  if (local && Date.now() - local.at < MEMORY_TTL_MS) {
    return { data: local.data, source: "memory" };
  }
  memory.delete(iso);

  const computed = await deps.compute(iso);
  const stored = await deps.writeShared(computed);
  memory.set(iso, { at: Date.now(), data: computed });
  if (stored) {
    console.info(`homepage-catalog country=${iso} source=miss stored=true`);
  }
  return { data: computed, source: "miss" };
}

async function resolveHomepageCatalog(country: string): Promise<HomepageCatalogData> {
  const resolved = await resolveHomepageCatalogData(country, { readShared, writeShared, compute });
  if (resolved.source !== "miss") {
    console.info(`homepage-catalog country=${country} source=${resolved.source}`);
  }
  return resolved.data;
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
