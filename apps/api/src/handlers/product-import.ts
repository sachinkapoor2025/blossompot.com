import { GetCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import {
  categoryKeys,
  planProductImport,
  PRODUCT_IMPORT_IMAGE_PROBE_NOTE,
  PRODUCT_IMPORT_MAX_PRODUCTS,
  PRODUCT_IMPORT_MAX_TRANSACTION_BYTES,
  SKU_OWNER_CONDITION,
  productImportDynamoItems,
  productKeys,
  productSkuKeys,
  storefrontShoppingCountryCodes,
  type PlannedImportProduct,
  type ProductImportContext,
  type ProductImportImageResult,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { probeSafeImageUrl } from "../lib/safe-image-probe";
import { invalidateCatalogCountryCache, loadCatalogCountries } from "../lib/catalog-country-store";
import { invalidateCatalogVendorCache, loadCatalogVendorRegistry } from "../lib/catalog-vendor-store";
import { docClient, now, PRODUCTS_TABLE } from "../lib/db";
import { badRequest, forbidden, json, ok } from "../lib/response";

/**
 * Image accessibility for this import.
 * The URL is resolved and rejected unless every address is public, then requested
 * with redirects checked one hop at a time. HEAD 405/501 retries with a size-capped GET.
 * Only HTTP 200–299 counts, and a provided content type must be an image type.
 */
export async function probeProductImportImage(url: string): Promise<ProductImportImageResult> {
  return probeSafeImageUrl(url);
}

let imageProbe = probeProductImportImage;

/** Tests replace the network probe. Production uses probeProductImportImage. */
export function setProductImportImageProbe(probe: typeof probeProductImportImage) {
  imageProbe = probe;
}

type ImportBody = {
  vendorSlug?: string;
  deliveryCountries?: string[];
  rows?: Record<string, unknown>[];
};

function readBody(event: APIGatewayProxyEventV2): ImportBody | { error: string } {
  try {
    const body = JSON.parse(event.body ?? "{}") as ImportBody;
    if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Request body must be a JSON object." };
    return body;
  } catch {
    return { error: "Request body must be JSON." };
  }
}

async function loadCategorySlugs(rows: readonly Record<string, unknown>[]): Promise<Set<string>> {
  const slugs = new Set<string>();
  for (const row of rows) {
    const primary = String(row.categorySlug ?? "").trim();
    if (primary) slugs.add(primary);
    const additional = row.additionalCategorySlugs;
    const extras = Array.isArray(additional)
      ? additional.map((item) => String(item).trim())
      : String(additional ?? "").split("|").map((item) => item.trim());
    for (const extra of extras) if (extra) slugs.add(extra);
  }
  const present = new Set<string>();
  await Promise.all(
    [...slugs].map(async (slug) => {
      const result = await docClient.send(
        new GetCommand({
          TableName: PRODUCTS_TABLE,
          Key: { PK: categoryKeys.pk(slug), SK: categoryKeys.sk() },
        })
      );
      if (result.Item) present.add(slug);
    })
  );
  return present;
}

/**
 * Point-in-time read of product slugs and SKUs.
 * This is not the race-safe guarantee. The transaction condition on PRODUCT# and SKU# is.
 * Legacy products have no SKU# row, so this read is what sees their sku attribute.
 * Writers that also maintain SKU# cannot pass the transaction condition.
 * A writer that only changes the product sku attribute can still race with this read.
 */
async function loadExistingIdentity(): Promise<{ slugs: Set<string>; skus: Set<string> }> {
  const slugs = new Set<string>();
  const skus = new Set<string>();
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        ProjectionExpression: "PK, SK, slug, sku",
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of page.Items ?? []) {
      if (String(item.SK ?? "") !== "META") continue;
      const pk = String(item.PK ?? "");
      if (pk.startsWith("PRODUCT#")) {
        const slug = String(item.slug ?? pk.slice("PRODUCT#".length)).trim();
        if (slug) slugs.add(slug);
        const sku = String(item.sku ?? "").trim().toLowerCase();
        if (sku) skus.add(sku);
      } else if (pk.startsWith("SKU#")) {
        const sku = String(item.sku ?? pk.slice("SKU#".length)).trim().toLowerCase();
        if (sku) skus.add(sku);
      }
    }
    startKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return { slugs, skus };
}

function collectImageUrls(rows: readonly Record<string, unknown>[]): string[] {
  const urls: string[] = [];
  for (const row of rows) {
    const raw = row.images ?? row.imageUrls ?? row.imageUrl;
    const values = Array.isArray(raw) ? raw : String(raw ?? "").split("|");
    for (const value of values) {
      const url = String(value ?? "").trim();
      if (url && !urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

async function buildContext(body: ImportBody): Promise<ProductImportContext> {
  invalidateCatalogVendorCache();
  invalidateCatalogCountryCache();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const [vendors, countries, categories, identity] = await Promise.all([
    loadCatalogVendorRegistry(),
    loadCatalogCountries(),
    loadCategorySlugs(rows),
    loadExistingIdentity(),
  ]);
  const vendorSlug = String(body.vendorSlug ?? "").trim().toLowerCase();
  const vendor = vendors.get(vendorSlug) ?? null;
  const imageResults = new Map<string, ProductImportImageResult>();
  if (rows.length > 0 && rows.length <= PRODUCT_IMPORT_MAX_PRODUCTS) {
    await Promise.all(
      collectImageUrls(rows).map(async (url) => {
        imageResults.set(url, await imageProbe(url));
      })
    );
  }
  return {
    vendor: vendor
      ? {
          vendorSlug: vendor.vendorSlug,
          enabled: vendor.enabled,
          trashedAt: vendor.trashedAt,
          deliveryCountries: vendor.deliveryCountries,
          defaultInventory: vendor.defaultInventory,
        }
      : null,
    globallyEnabledCountries: storefrontShoppingCountryCodes(countries.countries),
    categorySlugs: categories,
    existingSlugs: identity.slugs,
    existingSkus: identity.skus,
    imageResults,
  };
}

function planFromBody(body: ImportBody, context: ProductImportContext) {
  return planProductImport(
    {
      vendorSlug: String(body.vendorSlug ?? ""),
      deliveryCountries: Array.isArray(body.deliveryCountries) ? body.deliveryCountries : [],
      rows: Array.isArray(body.rows) ? body.rows : [],
    },
    context
  );
}

export async function previewProductImport(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const body = readBody(event);
  if ("error" in body) return badRequest(body.error);
  const context = await buildContext(body);
  const plan = planFromBody(body, context);
  return ok({
    writes: false,
    ok: plan.ok,
    batchErrors: plan.batchErrors,
    rows: plan.rows.map((row) => ({
      row: row.row,
      errors: row.errors,
      ...(row.product
        ? {
            name: row.product.name,
            slug: row.product.slug,
            sku: row.product.sku,
            published: row.product.published,
            deliveryCountries: row.product.deliveryCountries,
          }
        : {}),
    })),
    actionCount: plan.actionCount,
    maxProducts: PRODUCT_IMPORT_MAX_PRODUCTS,
    imageValidation: PRODUCT_IMPORT_IMAGE_PROBE_NOTE,
  });
}

export async function commitProductImport(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const body = readBody(event);
  if ("error" in body) return badRequest(body.error);
  const context = await buildContext(body);
  const plan = planFromBody(body, context);
  if (!plan.ok) {
    return json(400, {
      writes: false,
      ok: false,
      batchErrors: plan.batchErrors,
      rows: plan.rows.map((row) => ({ row: row.row, errors: row.errors })),
    });
  }
  if (plan.actionCount > 100 || plan.transactionBytes > PRODUCT_IMPORT_MAX_TRANSACTION_BYTES) {
    return json(400, {
      writes: false,
      ok: false,
      batchErrors: ["The batch exceeds the DynamoDB transaction limit and was not written."],
      rows: [],
    });
  }
  const products = plan.rows.map((row) => row.product).filter((product): product is PlannedImportProduct => Boolean(product));
  const batchId = randomUUID();
  const timestamp = now();
  const items = products.flatMap((product) => productImportDynamoItems(product, batchId, timestamp));
  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: items.map((item) => {
          const pk = String(item.PK ?? "");
          if (pk.startsWith("SKU#")) {
            return {
              Put: {
                TableName: PRODUCTS_TABLE,
                Item: item,
                ConditionExpression: SKU_OWNER_CONDITION,
                ExpressionAttributeValues: { ":skuOwner": item.productSlug },
              },
            };
          }
          return {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: item,
              ConditionExpression: "attribute_not_exists(PK)",
            },
          };
        }),
      })
    );
  } catch (err) {
    const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
    if (name === "TransactionCanceledException" || name === "ConditionalCheckFailedException") {
      return json(409, {
        writes: false,
        ok: false,
        batchErrors: ["A product slug or SKU was reserved by another write. Nothing in this batch was saved."],
        rows: [],
      });
    }
    throw err;
  }
  return json(201, {
    writes: true,
    ok: true,
    batchId,
    created: products.length,
    products: products.map((product) => ({
      slug: product.slug,
      sku: product.sku,
      published: product.published,
      deliveryCountries: product.deliveryCountries,
      vendorSlug: product.vendorSlug,
    })),
  });
}

export const productImportKeysForTests = { productKeys, productSkuKeys };
