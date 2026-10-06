import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  CATALOG_VENDOR_SLUGS,
  catalogVendorShoppingStatus,
  isCatalogVendorSlug,
  normalizeDeliveryCountries,
  readStoredCatalogVendor,
  updateCatalogVendorSchema,
  catalogVendorKeys,
  type CatalogVendor,
  type CatalogVendorSlug,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { invalidateCatalogVendorCache } from "../lib/catalog-vendor-store";
import { CONFIG_TABLE, docClient, now } from "../lib/db";
import { invalidateServiceabilityCache } from "../lib/serviceability-store";
import { badRequest, forbidden, notFound, ok } from "../lib/response";

const PRODUCT_COUNT_NOTE =
  "Product counts are not included. Products have no vendor index, and counting them would scan the products table.";

function present(slug: CatalogVendorSlug, item: Record<string, unknown> | undefined) {
  const { vendor, source } = readStoredCatalogVendor(slug, item);
  const shopping = catalogVendorShoppingStatus(vendor);
  return {
    ...vendor,
    updatedAt: source === "config" ? vendor.updatedAt : null,
    source,
    productCount: null as number | null,
    shoppingAvailable: shopping.shoppingAvailable,
    storefrontEnvEnabled: shopping.storefrontEnvEnabled,
    storefrontBlockReason: shopping.storefrontBlockReason,
  };
}

async function loadItem(slug: CatalogVendorSlug): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: catalogVendorKeys.pk(slug), SK: catalogVendorKeys.sk() },
    })
  );
  return result.Item as Record<string, unknown> | undefined;
}

/** Admin list. Missing config rows use code defaults. Does not scan products. */
export async function listCatalogVendorsAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const items = await Promise.all(CATALOG_VENDOR_SLUGS.map((slug) => loadItem(slug)));
  return ok({
    vendors: CATALOG_VENDOR_SLUGS.map((slug, index) => present(slug, items[index])),
    productCountAvailable: false,
    productCountNote: PRODUCT_COUNT_NOTE,
  });
}

/**
 * Admin update of `enabled` and `deliveryCountries` only.
 * Name, slug, and integration type stay on the stored record or the code default.
 * Does not change service areas or storefront product queries.
 */
export async function updateCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();

  const slug = event.pathParameters?.vendorSlug ?? "";
  if (!isCatalogVendorSlug(slug)) return notFound("Unknown catalog vendor");

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = updateCatalogVendorSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid catalog vendor update");
  }

  const normalized = normalizeDeliveryCountries(parsed.data.deliveryCountries);
  if ("error" in normalized) return badRequest(normalized.error);
  if (parsed.data.enabled && normalized.countries.length === 0) {
    return badRequest("An enabled vendor needs at least one delivery country.");
  }

  const existing = readStoredCatalogVendor(slug, await loadItem(slug)).vendor;
  const next: CatalogVendor = {
    vendorSlug: slug,
    vendorName: existing.vendorName,
    integrationType: existing.integrationType,
    enabled: parsed.data.enabled,
    deliveryCountries: normalized.countries,
    updatedAt: now(),
    updatedBy: auth.email,
  };

  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: catalogVendorKeys.pk(slug),
        SK: catalogVendorKeys.sk(),
        ...next,
      },
    })
  );
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();

  return ok({ vendor: present(slug, next) });
}
