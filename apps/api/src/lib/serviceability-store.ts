import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  VENDOR_BLOSSOMPOT,
  VENDOR_ORANGE_COUNTY,
  VENDOR_GBO,
  defaultBlossompotAreas,
  defaultOrangeCountyAreas,
  marketplaceVendorKeys,
  vendorCoverageKeys,
  type MarketplaceVendor,
  type VendorServiceArea,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient, now } from "./db";

type Cached = { at: number; areas: VendorServiceArea[]; slugs: string[] };
let cache: Cached | null = null;
const CACHE_MS = 30_000;

export function invalidateServiceabilityCache() {
  cache = null;
}

function fromItem(item: Record<string, unknown>): VendorServiceArea {
  return {
    areaId: String(item.areaId),
    vendorSlug: String(item.vendorSlug),
    countryCode: String(item.countryCode),
    stateCode: item.stateCode ? String(item.stateCode) : undefined,
    city: item.city ? String(item.city) : undefined,
    postalCode: item.postalCode ? String(item.postalCode) : undefined,
    postalPrefix: item.postalPrefix ? String(item.postalPrefix) : undefined,
    radius: typeof item.radius === "number" ? item.radius : undefined,
    radiusUnit: item.radiusUnit === "km" ? "km" : item.radiusUnit === "mi" ? "mi" : undefined,
    originLat: typeof item.originLat === "number" ? item.originLat : undefined,
    originLng: typeof item.originLng === "number" ? item.originLng : undefined,
    scope: item.scope as VendorServiceArea["scope"],
    ruleType: item.ruleType as VendorServiceArea["ruleType"],
    isActive: item.isActive !== false,
    priority: typeof item.priority === "number" ? item.priority : undefined,
  };
}

export async function listVendorAreas(vendorSlug: string): Promise<VendorServiceArea[]> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CONFIG_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": vendorCoverageKeys.pk(vendorSlug),
          ":sk": vendorCoverageKeys.areaPrefix(),
        },
        ExclusiveStartKey,
      })
    );
    items.push(...((result.Items ?? []) as Record<string, unknown>[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items.map(fromItem);
}

async function listMarketplaceVendors(): Promise<MarketplaceVendor[]> {
  const items: MarketplaceVendor[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: CONFIG_TABLE,
        FilterExpression: "begins_with(PK, :p) AND SK = :sk",
        ExpressionAttributeValues: {
          ":p": marketplaceVendorKeys.pkPrefix(),
          ":sk": marketplaceVendorKeys.sk(),
        },
        ExclusiveStartKey,
      })
    );
    items.push(...((result.Items ?? []) as MarketplaceVendor[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

function legacyZoneAreas(vendor: MarketplaceVendor): VendorServiceArea[] {
  const zips = vendor.deliveryZone?.zipCodes ?? [];
  return zips.map((zip, i) => ({
    areaId: `legacy-zip-${vendor.vendorSlug}-${i}`,
    vendorSlug: vendor.vendorSlug,
    countryCode: "US",
    postalCode: zip,
    scope: "POSTAL_CODE" as const,
    ruleType: "ALLOW" as const,
    isActive: true,
  }));
}

export async function loadCoverageBundle(): Promise<{
  areas: VendorServiceArea[];
  activeVendorSlugs: string[];
}> {
  const nowMs = Date.now();
  if (cache && nowMs - cache.at < CACHE_MS) {
    return { areas: cache.areas, activeVendorSlugs: cache.slugs };
  }

  const marketplace = await listMarketplaceVendors();
  const activeMarket = marketplace.filter((v) => v.status === "active" || v.status === "approved");
  const slugs = [
    VENDOR_BLOSSOMPOT,
    VENDOR_ORANGE_COUNTY,
    VENDOR_GBO,
    ...activeMarket.map((v) => v.vendorSlug),
  ];

  const perVendor = await Promise.all(slugs.map((slug) => listVendorAreas(slug)));
  const stored = perVendor.flat();
  const storedByVendor = new Set(stored.map((a) => a.vendorSlug));

  const areas = [...stored];
  if (!storedByVendor.has(VENDOR_BLOSSOMPOT)) areas.push(...defaultBlossompotAreas());
  if (!storedByVendor.has(VENDOR_ORANGE_COUNTY)) areas.push(...defaultOrangeCountyAreas());
  for (const vendor of activeMarket) {
    if (!storedByVendor.has(vendor.vendorSlug)) {
      areas.push(...legacyZoneAreas(vendor));
    }
  }

  cache = { at: nowMs, areas, slugs };
  return { areas, activeVendorSlugs: slugs };
}

export async function putVendorArea(
  vendorSlug: string,
  area: Omit<VendorServiceArea, "vendorSlug" | "areaId"> & { areaId?: string }
): Promise<VendorServiceArea> {
  const areaId = area.areaId ?? uuidv4();
  const record: VendorServiceArea = { ...area, vendorSlug, areaId };
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: vendorCoverageKeys.pk(vendorSlug),
        SK: vendorCoverageKeys.areaSk(areaId),
        ...record,
        updatedAt: now(),
      },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: vendorCoverageKeys.pk(vendorSlug),
        SK: vendorCoverageKeys.metaSk(),
        vendorSlug,
        updatedAt: now(),
      },
    })
  );
  invalidateServiceabilityCache();
  return record;
}

export async function deleteVendorArea(vendorSlug: string, areaId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: vendorCoverageKeys.pk(vendorSlug),
        SK: vendorCoverageKeys.areaSk(areaId),
      },
    })
  );
  invalidateServiceabilityCache();
}

export async function getVendorArea(vendorSlug: string, areaId: string): Promise<VendorServiceArea | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: vendorCoverageKeys.pk(vendorSlug),
        SK: vendorCoverageKeys.areaSk(areaId),
      },
    })
  );
  return result.Item ? fromItem(result.Item as Record<string, unknown>) : null;
}

export function coverageSummary(areas: VendorServiceArea[], activeVendorSlugs: string[]) {
  const active = areas.filter((a) => a.isActive);
  const countries = new Set(active.map((a) => a.countryCode));
  const states = new Set(active.map((a) => a.stateCode).filter(Boolean));
  const postalAllows = active.filter((a) => a.ruleType === "ALLOW" && a.scope === "POSTAL_CODE");
  const prefixAllows = active.filter((a) => a.ruleType === "ALLOW" && a.scope === "POSTAL_PREFIX");
  return {
    vendors: activeVendorSlugs.length,
    vendorsWithAreas: new Set(active.map((a) => a.vendorSlug)).size,
    countries: countries.size,
    states: states.size,
    postalCodeRules: postalAllows.length,
    prefixRules: prefixAllows.length,
    totalRules: active.length,
  };
}
