import { PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  createProductSchema,
  updateProductSchema,
  bulkProductRowSchema,
  productKeys,
  marketplaceVendorKeys,
  vendorCoverageKeys,
  DEFAULT_PRODUCT_INVENTORY,
  withCompetitiveStorefrontPricing,
  stripVendorPrivateFields,
  productAllowsAddons,
  isRakhiSetSizeCategory,
  productMatchesRakhiSetCategory,
  resolveProductImagesForUpsert,
  isProductStorefrontVisible,
  isSampleCatalogProduct,
  productInStorefrontCategory,
  productVisibleForDeliveryCountry,
  dedupeStorefrontProducts,
  coalesceProductImages,
  isGboHiddenFromStorefront,
  NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE,
  productAllowedForNewShopping,
  productForShoppingDecision,
  fulfillmentVendorSlug,
  catalogVendorShoppingStatus,
  listingGroupsForProducts,
  orderProductsByVendor,
  sortVendorsForDisplay,
  VENDOR_GBO,
  type Product,
} from "@blossompot/shared";
import { decideNewShopping, loadCatalogVendorRegistry } from "../lib/catalog-vendor-store";
import { docClient, PRODUCTS_TABLE, CONFIG_TABLE, now, slugify } from "../lib/db";
import { deleteCatalogProduct, insertCatalogProduct, isTransactionConflict, replaceCatalogProduct, SKU_TAKEN_MESSAGE } from "../lib/catalog-sku-write";
import { ok, created, badRequest, notFound, forbidden, json } from "../lib/response";
import { evaluateProductsForLocation, parseLocationQuery, resolveShoppingLocation } from "./serviceability";
import { getAuth, requireAdmin } from "../lib/auth";
import { withResolvedProductImages, resolveProductImageUrl } from "../lib/images";
import { syncInventoryAlertState } from "../lib/inventory";
import { ensureProductInDb } from "../lib/ensure-product";
import { getBundledUsarakhiProduct, listBundledCatalogProducts, persistMissingBundledCatalogProducts } from "../lib/blossompot-catalog";
import { getBundledOrangeCountyProduct } from "../lib/orange-county-catalog";

function decodeProductPathSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function mergeBundledCatalogProducts(items: Product[], category?: string): Product[] {
  const bundledBySlug = new Map(listBundledCatalogProducts().map((row) => [row.slug, row]));
  const bySlug = new Map(
    items.map((product) => {
      const bundled = bundledBySlug.get(product.slug);
      const images = coalesceProductImages(product.images, bundled?.images);
      const tfUsa = (product.tags ?? bundled?.tags ?? []).includes("tf-usa");
      const next: Product = {
        ...product,
        images,
        ...(tfUsa && bundled?.price != null ? { price: bundled.price } : {}),
        ...(tfUsa && bundled && "deliveryFee" in bundled ? { deliveryFee: bundled.deliveryFee } : {}),
        ...(tfUsa ? { couponExcluded: false } : {}),
      };
      return [product.slug, next] as const;
    })
  );
  const stamp = "2026-09-23T00:00:00.000Z";
  for (const bundled of listBundledCatalogProducts()) {
    if (bySlug.has(bundled.slug)) continue;
    if (category && !productInStorefrontCategory(bundled, category)) continue;
    bySlug.set(bundled.slug, {
      ...bundled,
      currency: bundled.currency ?? "USD",
      inventory: bundled.inventory ?? DEFAULT_PRODUCT_INVENTORY,
      tags: bundled.tags ?? [],
      images: bundled.images ?? [],
      published: bundled.published !== false,
      createdAt: stamp,
      updatedAt: stamp,
    } as Product);
  }
  return [...bySlug.values()];
}

const BUNDLED_CATALOG_PERSIST_BATCH = 25;

async function persistAndMergeBundledCatalog(items: Product[], category?: string): Promise<Product[]> {
  const merged = dedupeStorefrontProducts(mergeBundledCatalogProducts(items, category));
  try {
    const alreadyStored = new Set(items.map((product) => product.slug));
    const registry = await loadCatalogVendorRegistry();
    for (const bundled of listBundledCatalogProducts()) {
      if (alreadyStored.has(bundled.slug)) continue;
      const decision = productAllowedForNewShopping(productForShoppingDecision(bundled), "US", registry);
      if (decision.reason === "vendor_disabled" || decision.reason === "gbo_storefront_disabled") {
        alreadyStored.add(bundled.slug);
      }
    }
    const persisted = await persistMissingBundledCatalogProducts(
      alreadyStored,
      BUNDLED_CATALOG_PERSIST_BATCH
    );
    if (persisted.length > 0) {
      invalidateProductListCache(category);
    }
  } catch (err) {
    console.error("persistMissingBundledCatalogProducts failed", err);
  }
  return merged;
}

function vendorHiddenFromStorefront(decision: { available: boolean; reason?: string }): boolean {
  return !decision.available && (decision.reason === "vendor_disabled" || decision.reason === "gbo_storefront_disabled");
}

function forStorefront(product: Product): Product {
  const vendorSlug = fulfillmentVendorSlug(product);
  const allowsAddons = productAllowsAddons(product);
  const stripped = stripVendorPrivateFields(
    withCompetitiveStorefrontPricing(withResolvedProductImages(product))
  );
  const { sourceUrl: _sourceUrl, importBatchId: _importBatchId, ...publicProduct } = stripped;
  const international = vendorSlug === VENDOR_GBO || product.internationalDelivery === true;
  return {
    ...publicProduct,
    vendorSlug,
    allowsAddons,
    ...(international
      ? {
          internationalDelivery: true,
          fulfilledByName: product.fulfilledByName || "International delivery partner",
        }
      : {}),
  } as Product;
}

function isKidsComboProduct(product: Product): boolean {
  if (product.categorySlug !== "kids-rakhi") return false;

  const text = [product.name, product.description, ...(product.tags ?? [])]
    .join(" ")
    .toLowerCase();

  return [
    "combo",
    "chocolate",
    "chocolates",
    "hershey",
    "lindor",
    "lindt",
    "kitkat",
    "dairy milk",
    "snicker",
    "milky way",
  ].some((term) => text.includes(term));
}

/** Warm-instance caches — cut DynamoDB under concurrent browse; keep prices stable. */
const PRODUCT_LIST_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const PRODUCT_GET_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
let productListCache: { at: number; items: Product[] } | null = null;
const categoryProductCache = new Map<string, { at: number; items: Product[] }>();
const productGetCache = new Map<string, { at: number; product: Product }>();

async function queryProductsByCategory(categorySlug: string): Promise<Product[]> {
  const nowMs = Date.now();
  const hit = categoryProductCache.get(categorySlug);
  if (hit && nowMs - hit.at < PRODUCT_LIST_CACHE_TTL_MS) return hit.items;

  const items: Product[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": productKeys.gsi1pk(categorySlug) },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...(result.Items as Product[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  categoryProductCache.set(categorySlug, { at: nowMs, items });
  return items;
}

async function scanAllProducts(): Promise<Product[]> {
  const nowMs = Date.now();
  if (productListCache && nowMs - productListCache.at < PRODUCT_LIST_CACHE_TTL_MS) {
    return productListCache.items;
  }

  const items: Product[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "PRODUCT#", ":sk": "META" },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...(result.Items as Product[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  productListCache = { at: nowMs, items };
  return items;
}

/** Call after product create/update/delete so storefront list stays fresh. */
export function invalidateProductListCache(categorySlug?: string) {
  productListCache = null;
  productGetCache.clear();
  if (categorySlug) categoryProductCache.delete(categorySlug);
  else categoryProductCache.clear();
}

export async function listProducts(event: APIGatewayProxyEventV2) {
  const category = event.queryStringParameters?.category;
  const search = event.queryStringParameters?.search?.toLowerCase();

  let items: Product[] = [];

  if (category) {
    if (isRakhiSetSizeCategory(category)) {
      const all = await scanAllProducts();
      items = all.filter((product) => productMatchesRakhiSetCategory(product, category));
    } else if (category === "rakhi-combo") {
      const [combo, kids, hampers] = await Promise.all([
        queryProductsByCategory("rakhi-combo"),
        queryProductsByCategory("kids-rakhi"),
        queryProductsByCategory("rakhi-hampers"),
      ]);
      const bySlug = new Map(combo.map((p) => [p.slug, p]));
      for (const product of kids.filter(isKidsComboProduct)) bySlug.set(product.slug, product);
      for (const product of hampers) {
        if (product.additionalCategorySlugs?.includes("rakhi-combo")) bySlug.set(product.slug, product);
      }
      items = [...bySlug.values()];
    } else if (category === "rakhi-hampers") {
      items = await queryProductsByCategory(category);
    } else {
      const [primary, hampers] = await Promise.all([
        queryProductsByCategory(category),
        queryProductsByCategory("rakhi-hampers"),
      ]);
      const bySlug = new Map(primary.map((p) => [p.slug, p]));
      for (const product of hampers) {
        if (product.additionalCategorySlugs?.includes(category)) bySlug.set(product.slug, product);
      }
      items = [...bySlug.values()];
    }
  } else {
    items = await scanAllProducts();
  }

  items = await persistAndMergeBundledCatalog(items, category);

  items = items.filter(
    (p) =>
      p.published !== false &&
      (p.inventory ?? 0) > 0 &&
      isProductStorefrontVisible(p) &&
      !isGboHiddenFromStorefront(p)
  );
  if (search) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags?.some((t) => t.toLowerCase().includes(search))
    );
  }

  const location = await resolveShoppingLocation(parseLocationQuery(event));
  if (!location) {
    return ok({ products: [], countryUnavailable: true, message: NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE });
  }
  items = items.filter((p) => productVisibleForDeliveryCountry(p, location.countryCode));
  const shoppingCountry = location.countryCode;
  const vendorRegistry = await loadCatalogVendorRegistry();
  items = items.filter(
    (product) => productAllowedForNewShopping(productForShoppingDecision(product), shoppingCountry, vendorRegistry).available
  );
  const vendorRecords = sortVendorsForDisplay([...vendorRegistry.values()]);
  items = orderProductsByVendor(items, vendorRecords);
  const evals = await evaluateProductsForLocation(items, location);
  const deliverable = new Set(evals.filter((e) => e.deliverable).map((e) => e.slug));
  items = items.filter((p) => deliverable.has(p.slug));
  const products = items.map(forStorefront);
  const listing =
    event.headers?.["x-blossompot-listing-groups"] === "1" ||
    event.headers?.["X-Blossompot-Listing-Groups"] === "1"
      ? {
          listingGroups: listingGroupsForProducts(items, vendorRecords),
          listingVendors: vendorRecords.map((vendor) => ({
            vendorSlug: vendor.vendorSlug,
            vendorName: vendor.vendorName,
            ...(vendor.displayOrder != null ? { displayOrder: vendor.displayOrder } : {}),
            shoppingAvailable: catalogVendorShoppingStatus(vendor).shoppingAvailable,
          })),
        }
      : {};
  return ok({ products, location, filtered: true, ...listing });
}

export async function getProduct(event: APIGatewayProxyEventV2) {
  const slug = decodeProductPathSlug(event.pathParameters?.slug ?? "");
  if (!slug) return badRequest("Slug required");
  if (isGboHiddenFromStorefront({ slug })) return notFound("Product not found");

  const nowMs = Date.now();
  const cached = productGetCache.get(slug);
  if (cached && nowMs - cached.at < PRODUCT_GET_CACHE_TTL_MS) {
    if (isGboHiddenFromStorefront(cached.product)) return notFound("Product not found");
    const location = await resolveShoppingLocation(parseLocationQuery(event));
    if (!location) return notFound(NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE);
    const visible = productVisibleForDeliveryCountry(cached.product, location.countryCode);
    const shopping = await decideNewShopping(cached.product, location.countryCode);
    if (vendorHiddenFromStorefront(shopping)) return notFound("Product not found");
    if (!visible || !shopping.available) {
      return ok({
        product: forStorefront(cached.product),
        availability: {
          deliverable: false,
          reason: shopping.reason ?? "country_not_allowed",
          location,
        },
      });
    }
    const [evalRow] = await evaluateProductsForLocation([cached.product], location);
    return ok({
      product: forStorefront(cached.product),
      availability: {
        deliverable: Boolean(evalRow?.deliverable),
        reason: evalRow?.reason,
        location,
      },
    });
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );

  let item = result.Item as (Product & { published?: boolean }) | undefined;
  if (!item) {
    const preview = getBundledUsarakhiProduct(slug) ?? getBundledOrangeCountyProduct(slug);
    if (preview) {
      const previewLocation = await resolveShoppingLocation(parseLocationQuery(event));
      if (!previewLocation) return notFound(NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE);
      const previewShopping = await decideNewShopping(preview, previewLocation.countryCode);
      if (vendorHiddenFromStorefront(previewShopping)) return notFound("Product not found");
    }
    // Storefront may list bundled catalog SKUs before DynamoDB import — upsert on first view.
    const upserted = await ensureProductInDb(slug);
    if (upserted) {
      item = upserted as Product & { published?: boolean };
      invalidateProductListCache(item.categorySlug);
    }
  }

  if (!item) return notFound("Product not found");
  const product = item;
  if (isGboHiddenFromStorefront(product)) return notFound("Product not found");
  if (product.published === false) return notFound("Product not found");
  if (!isProductStorefrontVisible(product)) return notFound("Product not found");
  productGetCache.set(slug, { at: nowMs, product });
  const location = await resolveShoppingLocation(parseLocationQuery(event));
  if (!location) return notFound(NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE);
  const visible = productVisibleForDeliveryCountry(product, location.countryCode);
  const shopping = await decideNewShopping(product, location.countryCode);
  if (vendorHiddenFromStorefront(shopping)) return notFound("Product not found");
  if (!visible || !shopping.available) {
    return ok({
      product: forStorefront(product),
      availability: {
        deliverable: false,
        reason: shopping.reason ?? "country_not_allowed",
        location,
      },
    });
  }
  const [evalRow] = await evaluateProductsForLocation([product], location);
  return ok({
    product: forStorefront(product),
    availability: {
      deliverable: Boolean(evalRow?.deliverable),
      reason: evalRow?.reason,
      location,
    },
  });
}

export async function createProduct(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const body = JSON.parse(event.body ?? "{}");
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const slug = slugify(parsed.data.name);
  const timestamp = now();
  const inventory = parsed.data.inventory ?? DEFAULT_PRODUCT_INVENTORY;
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  const item: Product & { PK: string; SK: string; GSI1PK: string; GSI1SK: string } = {
    ...parsed.data,
    vendorSlug: fulfillmentVendorSlug(parsed.data),
    inventory,
    slug,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(parsed.data.categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: typeof existing.Item?.createdAt === "string" ? existing.Item.createdAt : timestamp,
    updatedAt: timestamp,
  };

  try {
    if (existing.Item) {
      await replaceCatalogProduct({
        item,
        previousSku: existing.Item.sku,
        nextSku: typeof item.sku === "string" ? item.sku : undefined,
      });
    } else {
      await insertCatalogProduct(item);
    }
  } catch (err) {
    if (isTransactionConflict(err)) return json(409, { error: SKU_TAKEN_MESSAGE });
    throw err;
  }
  invalidateProductListCache();
  return created({ product: item });
}

export async function updateProduct(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Slug required");

  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  if (!existing.Item) {
    const upserted = await ensureProductInDb(slug);
    if (upserted) {
      existing.Item = upserted;
      invalidateProductListCache((upserted as Product).categorySlug);
    }
  }
  if (!existing.Item) return notFound("Product not found");

  const previous = existing.Item as Product;
  const body = JSON.parse(event.body ?? "{}");
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const allowShrinkImages = body?.replaceImages === true;
  const imageUpdate =
    parsed.data.images !== undefined
      ? resolveProductImagesForUpsert(parsed.data.images, previous.images, {
          allowShrink: allowShrinkImages,
        })
      : null;

  const updated = {
    ...previous,
    ...parsed.data,
    ...(imageUpdate ? { images: imageUpdate.images } : {}),
    updatedAt: now(),
  } as Product & { PK: string; SK: string; GSI1PK: string; GSI1SK: string };

  if (parsed.data.categorySlug) {
    updated.GSI1PK = productKeys.gsi1pk(parsed.data.categorySlug);
    updated.GSI1SK = productKeys.gsi1sk(slug);
  }

  try {
    await replaceCatalogProduct({
      item: updated,
      previousSku: previous.sku,
      nextSku: typeof updated.sku === "string" ? updated.sku : undefined,
    });
  } catch (err) {
    if (isTransactionConflict(err)) return json(409, { error: SKU_TAKEN_MESSAGE });
    throw err;
  }
  invalidateProductListCache();

  if (parsed.data.inventory !== undefined) {
    await syncInventoryAlertState(slug, previous, parsed.data.inventory);
  }

  return ok({ product: updated });
}

/** Admin: list all products including unpublished. Query `?sample=all|true|false`. */
export async function listAdminProducts(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const sampleFilter = (event.queryStringParameters?.sample ?? "all").toLowerCase();

  let items = await scanAllProducts();
  const dynamoSlugs = new Set(items.map((p) => p.slug));
  items = mergeBundledCatalogProducts(items);
  try {
    const persisted = await persistMissingBundledCatalogProducts(
      dynamoSlugs,
      BUNDLED_CATALOG_PERSIST_BATCH
    );
    if (persisted.length > 0) {
      invalidateProductListCache();
    }
  } catch (err) {
    console.error("persistMissingBundledCatalogProducts failed", err);
  }
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const sampleCount = items.filter((p) => isSampleCatalogProduct(p)).length;
  const realCount = items.length - sampleCount;

  if (sampleFilter === "true" || sampleFilter === "sample") {
    items = items.filter((p) => isSampleCatalogProduct(p));
  } else if (sampleFilter === "false" || sampleFilter === "real") {
    items = items.filter((p) => !isSampleCatalogProduct(p));
  }

  return ok({
    products: items.map(withResolvedProductImages),
    meta: {
      totalScanned: items.length,
      returned: items.length,
      sampleCount,
      realCount,
      sampleFilter,
    },
  });
}

async function scanAllProductTableItems(): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :prefix)",
        ExpressionAttributeValues: { ":prefix": "PRODUCT#" },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

function isSampleMarketplaceVendor(item: Record<string, unknown>): boolean {
  if (item.isSampleVendor === true) return true;
  const slug = String(item.vendorSlug ?? "").toLowerCase();
  if (slug.startsWith("sample-")) return true;
  const vendorId = String(item.vendorId ?? "").toLowerCase();
  if (vendorId.startsWith("sample-")) return true;
  const email = String(item.email ?? "").toLowerCase();
  if (email.endsWith("@sample.blossompot.local")) return true;
  const name = String(item.businessName ?? "");
  if (name.includes("SAMPLE VENDOR")) return true;
  return false;
}

async function deleteSampleMarketplaceVendors(): Promise<{
  deletedVendors: number;
  deletedVendorLookups: number;
  deletedCoverage: number;
}> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: CONFIG_TABLE,
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  const vendorMetas = items.filter(
    (i) => String(i.PK ?? "").startsWith("MVENDOR#") && String(i.SK ?? "") === "META" && isSampleMarketplaceVendor(i)
  );
  const vendorIds = new Set(vendorMetas.map((v) => String(v.vendorId ?? "")));
  const vendorSlugs = new Set(
    vendorMetas.map((v) => String(v.vendorSlug ?? "")).filter(Boolean)
  );

  let deletedVendors = 0;
  let deletedVendorLookups = 0;
  let deletedCoverage = 0;

  for (const item of items) {
    const pk = String(item.PK ?? "");
    const sk = String(item.SK ?? "");
    const vendorId = String(item.vendorId ?? "");
    const slugFromPk = pk.startsWith("MVENDORSLUG#") ? pk.slice("MVENDORSLUG#".length) : "";
    const emailFromPk = pk.startsWith("MVENDOREMAIL#") ? pk.slice("MVENDOREMAIL#".length) : "";
    const coverageSlug = pk.startsWith("VCOV#") ? pk.slice("VCOV#".length) : "";

    const dropVendorMeta = pk.startsWith("MVENDOR#") && vendorIds.has(pk.slice("MVENDOR#".length));
    const dropSlug =
      Boolean(slugFromPk) && (vendorSlugs.has(slugFromPk) || slugFromPk.startsWith("sample-"));
    const dropEmail =
      Boolean(emailFromPk) &&
      (emailFromPk.endsWith("@sample.blossompot.local") || vendorIds.has(vendorId));
    const dropCoverage = Boolean(coverageSlug) && vendorSlugs.has(coverageSlug);

    if (!dropVendorMeta && !dropSlug && !dropEmail && !dropCoverage) continue;

    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: pk, SK: sk },
      })
    );
    if (dropVendorMeta && sk === "META") deletedVendors++;
    else if (dropCoverage) deletedCoverage++;
    else deletedVendorLookups++;
  }

  // Coverage / slug rows may exist even if vendor META was already removed.
  for (const slug of vendorSlugs) {
    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: marketplaceVendorKeys.slugPk(slug), SK: marketplaceVendorKeys.slugSk() },
      })
    );
    const email = `${slug}@sample.blossompot.local`;
    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: marketplaceVendorKeys.emailPk(email), SK: marketplaceVendorKeys.emailSk() },
      })
    );
    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: vendorCoverageKeys.pk(slug), SK: vendorCoverageKeys.metaSk() },
      })
    );
  }

  return { deletedVendors, deletedVendorLookups, deletedCoverage };
}

/** Admin: permanently delete all sample-vendor products (+ sample reviews on those slugs). */
export async function deleteAllSampleProducts(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const body = JSON.parse(event.body ?? "{}") as { confirm?: string };
  if (body.confirm !== "REMOVE_ALL_SAMPLE_PRODUCTS") {
    return badRequest('Pass confirm: "REMOVE_ALL_SAMPLE_PRODUCTS" to proceed');
  }

  const items = await scanAllProductTableItems();
  const sampleMetas = items.filter(
    (i) => i.SK === "META" && isSampleCatalogProduct(i as Product)
  ) as Product[];
  const sampleSlugs = new Set(sampleMetas.map((p) => p.slug));

  let deletedProducts = 0;
  let deletedReviews = 0;
  for (const item of items) {
    const pk = String(item.PK ?? "");
    const sk = String(item.SK ?? "");
    const slug = pk.replace(/^PRODUCT#/, "");
    const isSampleMeta = sk === "META" && sampleSlugs.has(slug);
    const isSampleReview =
      sk.startsWith("REVIEW#") &&
      sampleSlugs.has(slug) &&
      (item.isSampleReview === true || String(item.reviewId ?? "").startsWith("sample-"));
    if (!isSampleMeta && !isSampleReview) continue;
    if (isSampleMeta) {
      try {
        await deleteCatalogProduct(slug, item.sku);
      } catch (err) {
        if (!isTransactionConflict(err)) throw err;
        continue;
      }
      deletedProducts++;
    } else {
      await docClient.send(
        new DeleteCommand({
          TableName: PRODUCTS_TABLE,
          Key: { PK: pk, SK: sk },
        })
      );
      deletedReviews++;
    }
  }

  const vendors = await deleteSampleMarketplaceVendors();

  invalidateProductListCache();
  return ok({
    deletedProducts,
    deletedReviews,
    ...vendors,
    confirm: body.confirm,
  });
}

/** Admin: mark a sample product as real (clears sample flag; keeps images/data). */
export async function convertSampleProductToReal(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Slug required");
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  if (!existing.Item) return notFound("Product not found");
  const product = existing.Item as Product;
  if (!isSampleCatalogProduct(product)) {
    return badRequest("Product is not a sample product");
  }
  const tags = (product.tags ?? []).filter((t) => t !== "sample-product");
  const body = JSON.parse(event.body ?? "{}") as {
    vendorSlug?: string;
    fulfilledByName?: string;
  };
  try {
    await replaceCatalogProduct({
      item: {
        ...product,
        isSampleProduct: false,
        tags,
        vendorSlug: body.vendorSlug ?? product.vendorSlug,
        fulfilledByName: body.fulfilledByName ?? product.fulfilledByName,
        updatedAt: now(),
      },
      previousSku: product.sku,
      nextSku: typeof product.sku === "string" ? product.sku : undefined,
    });
  } catch (err) {
    if (isTransactionConflict(err)) return json(409, { error: SKU_TAKEN_MESSAGE });
    throw err;
  }
  invalidateProductListCache();
  return ok({ slug, isSampleProduct: false });
}

export async function deleteProduct(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Slug required");

  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  if (!existing.Item) return notFound("Product not found");
  try {
    await deleteCatalogProduct(slug, existing.Item.sku);
  } catch (err) {
    if (isTransactionConflict(err)) return json(409, { error: SKU_TAKEN_MESSAGE });
    throw err;
  }
  invalidateProductListCache();
  return ok({ deleted: true });
}

export async function bulkUploadProducts(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const body = JSON.parse(event.body ?? "{}");
  const rows: unknown[] = body.rows ?? body;
  if (!Array.isArray(rows)) return badRequest("Expected array of products");

  const createdProducts: Product[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = bulkProductRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({ row: i + 1, error: parsed.error.message });
      continue;
    }

    const slug = slugify(parsed.data.name);
    const timestamp = now();
    const tags = parsed.data.tags
      ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const vendorSlug = fulfillmentVendorSlug({ ...parsed.data, tags });

    const existing = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
      })
    );
    // Never wipe galleries on bulk re-upload of an existing product.
    if (existing.Item) {
      errors.push({
        row: i + 1,
        error: `Product already exists (slug=${slug}); bulk upload will not overwrite images/inventory. Edit the product instead.`,
      });
      continue;
    }

    const item = {
      ...parsed.data,
      slug,
      tags,
      vendorSlug,
      images: [],
      PK: productKeys.pk(slug),
      SK: productKeys.sk(),
      GSI1PK: productKeys.gsi1pk(parsed.data.categorySlug),
      GSI1SK: productKeys.gsi1sk(slug),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await insertCatalogProduct(item);
    } catch (err) {
      if (isTransactionConflict(err)) {
        errors.push({ row: i + 1, error: `SKU or slug is already reserved (slug=${slug}). Nothing for this row was saved.` });
        continue;
      }
      throw err;
    }
    createdProducts.push(item as Product);
  }

  invalidateProductListCache();
  return ok({ created: createdProducts.length, errors, products: createdProducts });
}
