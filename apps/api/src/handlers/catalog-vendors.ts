import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  CATALOG_STORAGE_LABEL,
  CATALOG_VENDOR_SLUGS,
  catalogMethodLabel,
  catalogVendorConfirmName,
  catalogVendorKeys,
  catalogVendorShoppingStatus,
  catalogVendorTrashExpiry,
  createCatalogVendorSchema,
  fulfillmentVendorSlug,
  isCatalogVendorSlug,
  normalizeDeliveryCountries,
  parseStoredCatalogVendor,
  readStoredCatalogVendor,
  trashCatalogVendorSchema,
  updateCatalogVendorSchema,
  type CatalogVendor,
  type CatalogVendorSlug,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { invalidateCatalogVendorCache } from "../lib/catalog-vendor-store";
import { CONFIG_TABLE, PRODUCTS_TABLE, docClient, now } from "../lib/db";
import { invalidateServiceabilityCache } from "../lib/serviceability-store";
import { badRequest, forbidden, json, notFound, ok } from "../lib/response";

function present(slug: string, vendor: CatalogVendor, source: "config" | "default", productCount: number) {
  const shopping = catalogVendorShoppingStatus(vendor);
  return {
    ...vendor,
    updatedAt: source === "config" ? vendor.updatedAt : null,
    source,
    productCount,
    storage: CATALOG_STORAGE_LABEL,
    method: catalogMethodLabel(vendor.integrationType),
    shoppingAvailable: shopping.shoppingAvailable,
    storefrontEnvEnabled: shopping.storefrontEnvEnabled,
    storefrontBlockReason: shopping.storefrontBlockReason,
  };
}

async function loadItem(slug: string): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: catalogVendorKeys.pk(slug), SK: catalogVendorKeys.sk() },
    })
  );
  return result.Item as Record<string, unknown> | undefined;
}

async function loadVendorMap(): Promise<Map<string, { vendor: CatalogVendor; source: "config" | "default" }>> {
  const vendors = new Map<string, { vendor: CatalogVendor; source: "config" | "default" }>();
  for (const slug of CATALOG_VENDOR_SLUGS) {
    const loaded = readStoredCatalogVendor(slug, await loadItem(slug));
    vendors.set(slug, loaded);
  }
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: CONFIG_TABLE,
        FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": catalogVendorKeys.pkPrefix(),
          ":sk": catalogVendorKeys.sk(),
        },
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of page.Items ?? []) {
      const slug = String(item.vendorSlug ?? "").trim().toLowerCase();
      if (!slug || vendors.has(slug)) continue;
      const parsed = parseStoredCatalogVendor(slug, item as Record<string, unknown>);
      if (parsed) vendors.set(slug, { vendor: parsed, source: "config" });
    }
    startKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return vendors;
}

async function countProductsByVendor(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
        ExpressionAttributeValues: { ":pk": "PRODUCT#", ":sk": "META" },
        ProjectionExpression: "slug, vendorSlug, sku, internationalDelivery",
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of page.Items ?? []) {
      const slug = fulfillmentVendorSlug({
        slug: typeof item.slug === "string" ? item.slug : undefined,
        vendorSlug: typeof item.vendorSlug === "string" ? item.vendorSlug : undefined,
        sku: typeof item.sku === "string" ? item.sku : undefined,
        internationalDelivery: item.internationalDelivery === true,
      });
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    startKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return counts;
}

function orderedVendors(vendors: Map<string, { vendor: CatalogVendor; source: "config" | "default" }>) {
  const builtin = CATALOG_VENDOR_SLUGS.filter((slug) => vendors.has(slug));
  const extra = [...vendors.keys()].filter((slug) => !(CATALOG_VENDOR_SLUGS as readonly string[]).includes(slug)).sort();
  return [...builtin, ...extra];
}

function writeVendor(vendor: CatalogVendor) {
  return docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: catalogVendorKeys.pk(vendor.vendorSlug),
        SK: catalogVendorKeys.sk(),
        ...vendor,
      },
    })
  );
}

/** Admin list. Built-in rows fall back to code defaults. Product counts come from the catalog. */
export async function listCatalogVendorsAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const [vendors, counts] = await Promise.all([loadVendorMap(), countProductsByVendor()]);
  return ok({
    vendors: orderedVendors(vendors).map((slug) => {
      const row = vendors.get(slug)!;
      return present(slug, row.vendor, row.source, counts.get(slug) ?? 0);
    }),
    productCountAvailable: true,
    storage: CATALOG_STORAGE_LABEL,
  });
}

export async function getCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  const vendors = await loadVendorMap();
  const row = vendors.get(slug);
  if (!row) return notFound("Unknown catalog vendor");
  const counts = await countProductsByVendor();
  return ok({ vendor: present(slug, row.vendor, row.source, counts.get(slug) ?? 0) });
}

export async function createCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = createCatalogVendorSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid catalog vendor");
  const normalized = normalizeDeliveryCountries(parsed.data.deliveryCountries);
  if ("error" in normalized) return badRequest(normalized.error);
  if (parsed.data.enabled && normalized.countries.length === 0) {
    return badRequest("An enabled vendor needs at least one delivery country.");
  }
  const slug = parsed.data.vendorSlug;
  if (isCatalogVendorSlug(slug) || (await loadItem(slug))) {
    return json(409, { error: "A catalog vendor with this slug already exists." });
  }
  const vendor: CatalogVendor = {
    vendorSlug: slug,
    vendorName: parsed.data.vendorName,
    enabled: parsed.data.enabled,
    integrationType: parsed.data.integrationType,
    deliveryCountries: normalized.countries,
    ...(parsed.data.sourceName ? { sourceName: parsed.data.sourceName } : {}),
    ...(parsed.data.defaultInventory != null ? { defaultInventory: parsed.data.defaultInventory } : {}),
    updatedAt: now(),
    updatedBy: auth.email,
  };
  await writeVendor(vendor);
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return json(201, { vendor: present(slug, vendor, "config", counts.get(slug) ?? 0) });
}

/**
 * Admin update of vendor settings. The slug is not changed, and existing products are not rewritten.
 */
export async function updateCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();

  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  const existingItem = await loadItem(slug);
  const existing = isCatalogVendorSlug(slug)
    ? readStoredCatalogVendor(slug, existingItem).vendor
    : parseStoredCatalogVendor(slug, existingItem);
  if (!existing) return notFound("Unknown catalog vendor");

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
  if (existing.trashedAt && parsed.data.enabled) {
    return badRequest("Restore the vendor before enabling it.");
  }

  const normalized = normalizeDeliveryCountries(parsed.data.deliveryCountries);
  if ("error" in normalized) return badRequest(normalized.error);
  if (parsed.data.enabled && normalized.countries.length === 0) {
    return badRequest("An enabled vendor needs at least one delivery country.");
  }

  const sourceName = parsed.data.sourceName?.trim() || existing.sourceName;
  const defaultInventory =
    parsed.data.defaultInventory === null ? undefined : parsed.data.defaultInventory ?? existing.defaultInventory;
  const next: CatalogVendor = {
    vendorSlug: slug,
    vendorName: parsed.data.vendorName ?? existing.vendorName,
    integrationType: parsed.data.integrationType ?? existing.integrationType,
    enabled: parsed.data.enabled,
    deliveryCountries: normalized.countries,
    ...(sourceName ? { sourceName } : {}),
    ...(defaultInventory != null ? { defaultInventory } : {}),
    ...(existing.trashedAt ? { trashedAt: existing.trashedAt, trashExpiresAt: existing.trashExpiresAt } : {}),
    updatedAt: now(),
    updatedBy: auth.email,
  };

  await writeVendor(next);
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return ok({ vendor: present(slug, next, "config", counts.get(slug) ?? 0) });
}

export async function trashCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  const existingItem = await loadItem(slug);
  const existing = isCatalogVendorSlug(slug)
    ? readStoredCatalogVendor(slug, existingItem).vendor
    : parseStoredCatalogVendor(slug, existingItem);
  if (!existing) return notFound("Unknown catalog vendor");
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = trashCatalogVendorSchema.safeParse(body);
  if (!parsed.success) return badRequest("Type the vendor name to confirm.");
  if (!catalogVendorConfirmName(existing.vendorName, parsed.data.confirmName)) {
    return badRequest("The confirmation does not match the vendor name.");
  }
  const trashedAt = now();
  const next: CatalogVendor = {
    ...existing,
    vendorSlug: slug,
    enabled: false,
    trashedAt,
    trashExpiresAt: catalogVendorTrashExpiry(new Date(trashedAt)),
    updatedAt: trashedAt,
    updatedBy: auth.email,
  };
  await writeVendor(next);
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return ok({ vendor: present(slug, next, "config", counts.get(slug) ?? 0) });
}

export async function restoreCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  const existingItem = await loadItem(slug);
  const existing = isCatalogVendorSlug(slug)
    ? readStoredCatalogVendor(slug, existingItem).vendor
    : parseStoredCatalogVendor(slug, existingItem);
  if (!existing?.trashedAt) return notFound("This vendor is not in trash.");
  const { trashedAt: _trashed, trashExpiresAt: _expiry, ...rest } = existing;
  const restored: CatalogVendor = {
    ...rest,
    vendorSlug: slug,
    enabled: false,
    updatedAt: now(),
    updatedBy: auth.email,
  };
  await writeVendor(restored);
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return ok({ vendor: present(slug, restored, "config", counts.get(slug) ?? 0) });
}

/**
 * Removes a trashed custom vendor record. Built-in vendors stay, and products are not deleted.
 * There is no scheduled 30-day purge.
 */
export async function deleteCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  if (isCatalogVendorSlug(slug as CatalogVendorSlug)) {
    return badRequest("Built-in catalog vendors can be moved to Trash and restored. They are not permanently deleted.");
  }
  const existing = parseStoredCatalogVendor(slug, await loadItem(slug));
  if (!existing?.trashedAt) return badRequest("Move the vendor to Trash before permanent deletion.");
  const counts = await countProductsByVendor();
  if ((counts.get(slug) ?? 0) > 0) {
    return badRequest("This vendor still has products. Permanent product purge is not available.");
  }
  await docClient.send(
    new DeleteCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: catalogVendorKeys.pk(slug), SK: catalogVendorKeys.sk() },
    })
  );
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  return ok({ deleted: true, vendorSlug: slug, productsDeleted: 0 });
}
