import { DeleteCommand, GetCommand, PutCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
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
  reorderCatalogVendorsSchema,
  trashCatalogVendorSchema,
  updateCatalogVendorSchema,
  applyStoredDisplayOrder,
  insertVendorAtPosition,
  nextDisplayOrder,
  planVendorDisplaySequence,
  sortVendorsForDisplay,
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

function storedVendor(slug: string, item: Record<string, unknown> | undefined): CatalogVendor | null {
  const loaded = isCatalogVendorSlug(slug)
    ? readStoredCatalogVendor(slug as CatalogVendorSlug, item).vendor
    : parseStoredCatalogVendor(slug, item);
  if (!loaded) return null;
  return applyStoredDisplayOrder(loaded, item?.displayOrder);
}

function withStoredOrder(
  loaded: { vendor: CatalogVendor; source: "config" | "default" },
  item: Record<string, unknown> | undefined
): { vendor: CatalogVendor; source: "config" | "default" } {
  return { ...loaded, vendor: applyStoredDisplayOrder(loaded.vendor, item?.displayOrder) };
}

async function loadVendorMap(): Promise<Map<string, { vendor: CatalogVendor; source: "config" | "default" }>> {
  const vendors = new Map<string, { vendor: CatalogVendor; source: "config" | "default" }>();
  for (const slug of CATALOG_VENDOR_SLUGS) {
    const item = await loadItem(slug);
    vendors.set(slug, withStoredOrder(readStoredCatalogVendor(slug, item), item));
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
      if (parsed) {
        vendors.set(slug, {
          vendor: applyStoredDisplayOrder(parsed, item.displayOrder),
          source: "config",
        });
      }
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
  return sortVendorsForDisplay([...vendors.values()].map((row) => row.vendor)).map((vendor) => vendor.vendorSlug);
}

function vendorItem(vendor: CatalogVendor) {
  return {
    PK: catalogVendorKeys.pk(vendor.vendorSlug),
    SK: catalogVendorKeys.sk(),
    ...vendor,
  };
}

async function writeVendors(vendors: CatalogVendor[]) {
  if (vendors.length === 0) return;
  if (vendors.length === 1) {
    await writeVendor(vendors[0]!);
    return;
  }
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: vendors.map((vendor) => ({
        Put: {
          TableName: CONFIG_TABLE,
          Item: vendorItem(vendor),
        },
      })),
    })
  );
}

function writeVendor(vendor: CatalogVendor) {
  return docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: vendorItem(vendor),
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
  const existingVendors = sortVendorsForDisplay([...(await loadVendorMap()).values()].map((row) => row.vendor));
  const timestamp = now();
  const vendor: CatalogVendor = {
    vendorSlug: slug,
    vendorName: parsed.data.vendorName,
    enabled: parsed.data.enabled,
    integrationType: parsed.data.integrationType,
    deliveryCountries: normalized.countries,
    ...(parsed.data.sourceName ? { sourceName: parsed.data.sourceName } : {}),
    ...(parsed.data.defaultInventory != null ? { defaultInventory: parsed.data.defaultInventory } : {}),
    updatedAt: timestamp,
    updatedBy: auth.email,
  };
  if (parsed.data.displayPosition == null) {
    vendor.displayOrder = nextDisplayOrder(existingVendors);
    await writeVendor(vendor);
  } else {
    const inserted = insertVendorAtPosition(
      existingVendors.map((row) => row.vendorSlug),
      slug,
      parsed.data.displayPosition
    );
    if (!inserted) return badRequest("Choose a display position from 1 through the next open slot.");
    const planned = planVendorDisplaySequence(inserted, inserted);
    if (!planned.ok) return badRequest(planned.error);
    const current = new Map(existingVendors.map((row) => [row.vendorSlug, row]));
    const writes = planned.assignments.map((assignment) => {
      if (assignment.vendorSlug === slug) return { ...vendor, displayOrder: assignment.displayOrder };
      const previous = current.get(assignment.vendorSlug)!;
      return {
        ...previous,
        displayOrder: assignment.displayOrder,
        updatedAt: timestamp,
        updatedBy: auth.email,
      };
    });
    vendor.displayOrder = writes.find((row) => row.vendorSlug === slug)?.displayOrder;
    await writeVendors(writes);
  }
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return json(201, { vendor: present(slug, vendor, "config", counts.get(slug) ?? 0) });
}

/** Replace the whole vendor sequence in one write so positions stay unique. */
export async function reorderCatalogVendorsAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = reorderCatalogVendorsSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid vendor sequence");
  const vendors = await loadVendorMap();
  const planned = planVendorDisplaySequence([...vendors.keys()], parsed.data.vendorSlugs);
  if (!planned.ok) return badRequest(planned.error);
  const timestamp = now();
  const writes = planned.assignments.map((assignment) => {
    const current = vendors.get(assignment.vendorSlug)!.vendor;
    return {
      ...current,
      displayOrder: assignment.displayOrder,
      updatedAt: timestamp,
      updatedBy: auth.email,
    };
  });
  await writeVendors(writes);
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
  const counts = await countProductsByVendor();
  return ok({
    vendors: sortVendorsForDisplay(writes).map((vendor) => present(vendor.vendorSlug, vendor, "config", counts.get(vendor.vendorSlug) ?? 0)),
  });
}

/**
 * Admin update of vendor settings. The slug is not changed, and existing products are not rewritten.
 */
export async function updateCatalogVendorAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();

  const slug = (event.pathParameters?.vendorSlug ?? "").trim().toLowerCase();
  const existingItem = await loadItem(slug);
  const existing = storedVendor(slug, existingItem);
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
    ...(existing.displayOrder != null ? { displayOrder: existing.displayOrder } : {}),
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
  const existing = storedVendor(slug, existingItem);
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
  const existing = storedVendor(slug, existingItem);
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
