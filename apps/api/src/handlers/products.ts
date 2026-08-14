import { PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  createProductSchema,
  updateProductSchema,
  bulkProductRowSchema,
  productKeys,
  DEFAULT_PRODUCT_INVENTORY,
  withCompetitiveStorefrontPricing,
  stripVendorPrivateFields,
  productAllowsAddons,
  isRakhiSetSizeCategory,
  productMatchesRakhiSetCategory,
  resolveProductImagesForUpsert,
  type Product,
} from "@blossompot/shared";
import { docClient, PRODUCTS_TABLE, now, slugify } from "../lib/db";
import { ok, okCached, created, badRequest, notFound, forbidden } from "../lib/response";
import { getAuth } from "../lib/auth";
import { withResolvedProductImages, resolveProductImageUrl } from "../lib/images";
import { syncInventoryAlertState } from "../lib/inventory";
import { ensureProductInDb } from "../lib/ensure-product";

function forStorefront(product: Product): Product {
  const allowsAddons = productAllowsAddons(product);
  const stripped = stripVendorPrivateFields(
    withCompetitiveStorefrontPricing(withResolvedProductImages(product))
  );
  return { ...stripped, allowsAddons } as Product;
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

  items = items.filter((p) => p.published !== false && (p.inventory ?? 0) > 0);
  if (search) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags?.some((t) => t.toLowerCase().includes(search))
    );
  }

  // Short CDN TTL only — listing + PDP must not drift for minutes after price edits.
  if (search) return ok({ products: items.map(forStorefront) });
  return okCached({ products: items.map(forStorefront) }, 10);
}

export async function getProduct(event: APIGatewayProxyEventV2) {
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Slug required");

  const nowMs = Date.now();
  const cached = productGetCache.get(slug);
  if (cached && nowMs - cached.at < PRODUCT_GET_CACHE_TTL_MS) {
    return okCached({ product: forStorefront(cached.product) }, 30);
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );

  let item = result.Item as (Product & { published?: boolean }) | undefined;
  if (!item) {
    // Storefront may list bundled catalog SKUs before DynamoDB import — upsert on first view.
    const upserted = await ensureProductInDb(slug);
    if (upserted) {
      item = upserted as Product & { published?: boolean };
      invalidateProductListCache(item.categorySlug);
    }
  }

  if (!item) return notFound("Product not found");
  const product = item;
  if (product.published === false) return notFound("Product not found");
  productGetCache.set(slug, { at: nowMs, product });
  return okCached({ product: forStorefront(product) }, 10);
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
  const item: Product & { PK: string; SK: string; GSI1PK: string; GSI1SK: string } = {
    ...parsed.data,
    inventory,
    slug,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(parsed.data.categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
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

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: updated }));
  invalidateProductListCache();

  if (parsed.data.inventory !== undefined) {
    await syncInventoryAlertState(slug, previous, parsed.data.inventory);
  }

  return ok({ product: updated });
}

/** Admin: list all products including unpublished. */
export async function listAdminProducts(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const result = await docClient.send(
    new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
      ExpressionAttributeValues: { ":prefix": "PRODUCT#", ":sk": "META" },
    })
  );

  const items = ((result.Items ?? []) as Product[]).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return ok({ products: items.map(withResolvedProductImages) });
}

export async function deleteProduct(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return forbidden();

  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Slug required");

  await docClient.send(
    new DeleteCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
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
      images: [],
      PK: productKeys.pk(slug),
      SK: productKeys.sk(),
      GSI1PK: productKeys.gsi1pk(parsed.data.categorySlug),
      GSI1SK: productKeys.gsi1sk(slug),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
    createdProducts.push(item as Product);
  }

  invalidateProductListCache();
  return ok({ created: createdProducts.length, errors, products: createdProducts });
}
