import {
  flowerGuideCardsSchema,
  SHOPPING_COUNTRY_ISO,
  type FlowerGuideCardsData,
  type FlowerGuideCard,
  type Product,
} from "@blossompot/shared";
import { after } from "next/server";
import { api } from "./api";
import { mergeProductsForCountry } from "./catalog-fallback";
import { flowerDeliveryCountryIso, type CountryFlowerDeliverySlug } from "./content/country-flower-delivery";
import { CATALOG_REVALIDATE_SECONDS, loadProducts } from "./product-loader";
import { pickCountryProducts } from "./country-flower-selection";

const MEMORY_TTL_MS = CATALOG_REVALIDATE_SECONDS * 1000;

type MemoryEntry = { at: number; data: FlowerGuideCardsData };

const memoryCache = new Map<string, MemoryEntry>();
const inFlight = new Map<string, Promise<Product[]>>();

function isSafeCardImage(image: string): boolean {
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\") && !image.includes("..")) {
    return true;
  }
  try {
    return new URL(image).protocol === "https:";
  } catch {
    return false;
  }
}

/** Public card fields only. Wholesale cost and other private product fields are omitted. */
export function toFlowerGuideCard(product: Product): FlowerGuideCard | null {
  if (product.published === false) return null;
  if (!product.slug || !product.name || !product.categorySlug) return null;
  if (!Number.isFinite(product.price) || product.price <= 0) return null;
  if (!Number.isInteger(product.inventory) || product.inventory < 0) return null;
  if (product.currency !== "USD" && product.currency !== "INR") return null;

  const card: FlowerGuideCard = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: product.currency,
    categorySlug: product.categorySlug,
    images: (product.images ?? []).filter(isSafeCardImage).slice(0, 12),
    inventory: product.inventory,
    published: true,
  };
  if (product.compareAtPrice != null && product.compareAtPrice > 0) {
    card.compareAtPrice = product.compareAtPrice;
  }
  if (product.unitsSold != null && product.unitsSold >= 0) {
    card.unitsSold = product.unitsSold;
  }
  return card;
}

export function flowerGuideCardsToProducts(products: FlowerGuideCard[]): Product[] {
  return products.map((card) => ({
    slug: card.slug,
    name: card.name,
    description: "",
    price: card.price,
    compareAtPrice: card.compareAtPrice,
    currency: card.currency,
    categorySlug: card.categorySlug,
    images: card.images,
    inventory: card.inventory,
    unitsSold: card.unitsSold,
    published: true,
    tags: [],
    createdAt: "",
    updatedAt: "",
  }));
}

async function readShared(country: string, slug: CountryFlowerDeliverySlug): Promise<FlowerGuideCardsData | null> {
  try {
    const data = await api<unknown>(`/flower-guide-cards?country=${country}`, { revalidate: false });
    const parsed = flowerGuideCardsSchema.safeParse(data);
    if (!parsed.success || parsed.data.country !== country || parsed.data.slug !== slug) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeShared(data: FlowerGuideCardsData): Promise<boolean> {
  const parsed = flowerGuideCardsSchema.safeParse(data);
  if (!parsed.success) return false;
  try {
    await api(`/flower-guide-cards?country=${parsed.data.country}`, {
      method: "PUT",
      body: JSON.stringify(parsed.data),
      revalidate: false,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "write failed";
    console.info(
      `flower-guide-cards country=${parsed.data.country} source=miss stored=false reason=${message}`
    );
    return false;
  }
}

async function selectCards(slug: CountryFlowerDeliverySlug): Promise<FlowerGuideSelection> {
  const country = flowerDeliveryCountryIso(slug);
  let products: Product[] = [];
  try {
    products = await loadProducts({ country });
  } catch {
    products = [];
  }
  const picked = pickCountryProducts(mergeProductsForCountry(products, SHOPPING_COUNTRY_ISO), slug);
  const cards = picked.map(toFlowerGuideCard);
  if (picked.length === 0 || cards.some((card) => card == null)) {
    return { data: null, products: picked };
  }
  const parsed = flowerGuideCardsSchema.safeParse({
    country,
    slug,
    products: cards,
  });
  return { data: parsed.success ? parsed.data : null, products: picked };
}

export type FlowerGuideCardsSource = "memory" | "shared" | "miss";

type FlowerGuideSelection = {
  data: FlowerGuideCardsData | null;
  products: Product[];
};

type FlowerGuideCardsDeps = {
  readShared: (country: string, slug: CountryFlowerDeliverySlug) => Promise<FlowerGuideCardsData | null>;
  writeShared: (data: FlowerGuideCardsData) => Promise<boolean>;
  selectCards: (slug: CountryFlowerDeliverySlug) => Promise<FlowerGuideSelection>;
  scheduleWrite: (task: () => Promise<void>) => void;
};

function freshMemoryEntry(
  memory: Map<string, MemoryEntry>,
  country: string,
  slug: CountryFlowerDeliverySlug
): MemoryEntry | null {
  const local = memory.get(country);
  if (!local) return null;
  const fresh = Date.now() - local.at < MEMORY_TTL_MS;
  if (fresh && local.data.slug === slug && local.data.country === country) return local;
  memory.delete(country);
  return null;
}

/** Runs after the response is finished. A write failure is logged and does not change the page. */
function scheduleSharedWrite(task: () => Promise<void>): void {
  after(() => task());
}

/**
 * Memory first. A shared read happens only after this server's 45-second entry misses.
 * The shared write is scheduled by the caller and is not awaited before the cards are returned.
 * An empty or incomplete selection is not stored.
 */
export async function resolveFlowerGuideCards(
  slug: CountryFlowerDeliverySlug,
  deps: FlowerGuideCardsDeps,
  memory: Map<string, MemoryEntry> = memoryCache
): Promise<{ data: FlowerGuideCardsData | null; products: Product[]; source: FlowerGuideCardsSource }> {
  const country = flowerDeliveryCountryIso(slug);
  const local = freshMemoryEntry(memory, country, slug);
  if (local) {
    return { data: local.data, products: flowerGuideCardsToProducts(local.data.products), source: "memory" };
  }

  let shared: FlowerGuideCardsData | null = null;
  try {
    shared = await deps.readShared(country, slug);
  } catch {
    shared = null;
  }
  if (shared && shared.country === country && shared.slug === slug) {
    memory.set(country, { at: Date.now(), data: shared });
    return { data: shared, products: flowerGuideCardsToProducts(shared.products), source: "shared" };
  }

  const selected = await deps.selectCards(slug);
  if (!selected.data) {
    console.info(`flower-guide-cards country=${country} source=miss stored=false reason=empty`);
    return { data: null, products: selected.products, source: "miss" };
  }

  const data = selected.data;
  memory.set(country, { at: Date.now(), data });
  deps.scheduleWrite(async () => {
    await deps.writeShared(data);
  });
  return {
    data,
    products: flowerGuideCardsToProducts(data.products),
    source: "miss",
  };
}

async function resolveForRender(slug: CountryFlowerDeliverySlug): Promise<Product[]> {
  const resolved = await resolveFlowerGuideCards(slug, {
    readShared,
    writeShared,
    selectCards,
    scheduleWrite: scheduleSharedWrite,
  });
  if (resolved.source !== "miss") {
    console.info(`flower-guide-cards country=${flowerDeliveryCountryIso(slug)} source=${resolved.source}`);
  }
  return resolved.products;
}

/** Selected guide cards for one country. A fresh cache hit does not call the catalog loader. */
export function getFlowerGuideProducts(slug: CountryFlowerDeliverySlug): Promise<Product[]> {
  const country = flowerDeliveryCountryIso(slug);
  const pending = inFlight.get(country);
  if (pending) return pending;

  const job = resolveForRender(slug).finally(() => {
    inFlight.delete(country);
  });
  inFlight.set(country, job);
  return job;
}
