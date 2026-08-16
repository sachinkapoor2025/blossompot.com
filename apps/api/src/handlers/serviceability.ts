import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  checkServiceabilitySchema,
  checkVendorServiceability,
  describeMatch,
  formatPostalDisplay,
  fulfillmentVendorSlug,
  getDeliveryCountry,
  getServiceableVendors,
  isProductDeliverableToLocation,
  isValidPostal,
  vendorServiceAreaImportRowSchema,
  vendorServiceAreaInputSchema,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { badRequest, forbidden, json, notFound, ok } from "../lib/response";
import {
  coverageSummary,
  deleteVendorArea,
  getVendorArea,
  listVendorAreas,
  loadCoverageBundle,
  putVendorArea,
} from "../lib/serviceability-store";

function locationFromEvent(event: APIGatewayProxyEventV2) {
  const q = event.queryStringParameters ?? {};
  const body = event.body ? JSON.parse(event.body) : {};
  return {
    countryCode: String(body.countryCode ?? q.country ?? q.countryCode ?? "").toUpperCase(),
    postalCode: String(body.postalCode ?? q.postalCode ?? q.zip ?? ""),
    stateCode: body.stateCode ?? q.state ?? q.stateCode,
    city: body.city ?? q.city,
  };
}

export async function checkServiceability(event: APIGatewayProxyEventV2) {
  const raw = event.requestContext.http.method === "GET" ? locationFromEvent(event) : JSON.parse(event.body ?? "{}");
  const parsed = checkServiceabilitySchema.safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.message);

  const country = getDeliveryCountry(parsed.data.countryCode);
  if (!country?.enabled) return badRequest("Unsupported country");
  if (!isValidPostal(parsed.data.countryCode, parsed.data.postalCode)) {
    return badRequest(`Enter a valid ${country.postalLabel.toLowerCase()}`);
  }

  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  const vendors = getServiceableVendors(areas, parsed.data, activeVendorSlugs);
  const serviceable = vendors.length > 0;

  console.log(
    JSON.stringify({
      type: "SERVICEABILITY_CHECK",
      country: parsed.data.countryCode,
      postal_code: parsed.data.postalCode.replace(/\s+/g, ""),
      result: serviceable,
      vendor_count: vendors.length,
      reason: serviceable ? "matched" : "no_matching_service_area",
    })
  );

  return ok({
    serviceable,
    location: {
      country: country.countryName,
      countryCode: parsed.data.countryCode,
      postalCode: formatPostalDisplay(parsed.data.countryCode, parsed.data.postalCode),
      postalLabel: country.postalLabel,
    },
    vendors: vendors.map((v) => ({
      vendorId: v.vendorSlug,
      name: v.vendorSlug,
      matchedRule: v.matchedRule,
    })),
    message: serviceable
      ? `We can deliver to ${formatPostalDisplay(parsed.data.countryCode, parsed.data.postalCode)}.`
      : parsed.data.countryCode === "US"
        ? `We don't have a delivery partner for ${formatPostalDisplay(parsed.data.countryCode, parsed.data.postalCode)} yet.`
        : "We currently fulfill gifts to United States addresses. Enter a US ZIP to see available products.",
  });
}

export async function adminListServiceAreas(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorSlug = event.pathParameters?.vendorSlug;
  if (!vendorSlug) return badRequest("vendorSlug required");
  const areas = await listVendorAreas(vendorSlug);
  return ok({ vendorSlug, areas });
}

export async function adminCreateServiceArea(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorSlug = event.pathParameters?.vendorSlug;
  if (!vendorSlug) return badRequest("vendorSlug required");
  const parsed = vendorServiceAreaInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) return badRequest(parsed.error.message);
  const area = await putVendorArea(vendorSlug, parsed.data);
  return json(201, { area });
}

export async function adminUpdateServiceArea(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorSlug = event.pathParameters?.vendorSlug;
  const areaId = event.pathParameters?.areaId;
  if (!vendorSlug || !areaId) return badRequest("vendorSlug and areaId required");
  const existing = await getVendorArea(vendorSlug, areaId);
  if (!existing) return notFound("Service area not found");
  const body = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
  const parsed = vendorServiceAreaInputSchema.safeParse({
    countryCode: existing.countryCode,
    scope: existing.scope,
    ruleType: existing.ruleType,
    stateCode: existing.stateCode,
    city: existing.city,
    postalCode: existing.postalCode,
    postalPrefix: existing.postalPrefix,
    radius: existing.radius,
    radiusUnit: existing.radiusUnit,
    originLat: existing.originLat,
    originLng: existing.originLng,
    isActive: existing.isActive,
    priority: existing.priority,
    ...body,
  });
  if (!parsed.success) return badRequest(parsed.error.message);
  const area = await putVendorArea(vendorSlug, { ...parsed.data, areaId });
  return ok({ area });
}

export async function adminDeleteServiceArea(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorSlug = event.pathParameters?.vendorSlug;
  const areaId = event.pathParameters?.areaId;
  if (!vendorSlug || !areaId) return badRequest("vendorSlug and areaId required");
  await deleteVendorArea(vendorSlug, areaId);
  return ok({ deleted: true });
}

export async function adminTestServiceability(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const body = JSON.parse(event.body ?? "{}");
  const vendorSlug = String(body.vendorSlug ?? event.pathParameters?.vendorSlug ?? "");
  const parsed = checkServiceabilitySchema.safeParse(body);
  if (!vendorSlug) return badRequest("vendorSlug required");
  if (!parsed.success) return badRequest(parsed.error.message);
  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  const match = checkVendorServiceability(
    vendorSlug,
    areas,
    parsed.data,
    activeVendorSlugs.includes(vendorSlug)
  );
  return ok({
    serviceable: match.serviceable,
    reason: match.reason,
    matchedRule: match.matchedRule,
    description: describeMatch(match),
  });
}

export async function adminImportServiceAreas(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorSlug = event.pathParameters?.vendorSlug;
  if (!vendorSlug) return badRequest("vendorSlug required");
  const body = JSON.parse(event.body ?? "{}");
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) return badRequest("rows required");
  if (rows.length > 2000) return badRequest("Maximum 2000 rows per import");

  const existing = await listVendorAreas(vendorSlug);
  const seen = new Set(
    existing.map((a) => `${a.scope}|${a.ruleType}|${a.countryCode}|${a.postalCode ?? ""}|${a.postalPrefix ?? ""}|${a.stateCode ?? ""}|${a.city ?? ""}`)
  );

  let imported = 0;
  const errors: { row: number; error: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const parsed = vendorServiceAreaInputSchema.safeParse(normalizeImportRow(rows[i]));
    if (!parsed.success) {
      errors.push({ row: i + 1, error: parsed.error.issues[0]?.message ?? "invalid row" });
      continue;
    }
    const key = `${parsed.data.scope}|${parsed.data.ruleType}|${parsed.data.countryCode}|${parsed.data.postalCode ?? ""}|${parsed.data.postalPrefix ?? ""}|${parsed.data.stateCode ?? ""}|${parsed.data.city ?? ""}`;
    if (seen.has(key)) {
      errors.push({ row: i + 1, error: "duplicate" });
      continue;
    }
    await putVendorArea(vendorSlug, parsed.data);
    seen.add(key);
    imported += 1;
  }
  return ok({ imported, failed: errors.length, errors });
}

function normalizeImportRow(row: Record<string, unknown>) {
  const csv = vendorServiceAreaImportRowSchema.safeParse(row);
  if (csv.success) {
    const r = csv.data;
    const scope =
      r.scope ??
      (r.postal_code ? "POSTAL_CODE" : r.postal_prefix ? "POSTAL_PREFIX" : r.city ? "CITY" : r.state_code ? "STATE" : "COUNTRY");
    return {
      countryCode: r.country_code,
      stateCode: r.state_code || undefined,
      city: r.city || undefined,
      postalCode: r.postal_code || undefined,
      postalPrefix: r.postal_prefix || undefined,
      scope,
      ruleType: r.rule,
      isActive: true,
    };
  }
  return row;
}

export async function adminCoverageSummary(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  return ok({ summary: coverageSummary(areas, activeVendorSlugs) });
}

export async function evaluateProductsForLocation(
  products: Array<{ slug: string; vendorSlug?: string; published?: boolean; inventory?: number }>,
  location: { countryCode: string; postalCode: string; stateCode?: string; city?: string }
) {
  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  const active = new Set(activeVendorSlugs);
  return products.map((p) => {
    const match = isProductDeliverableToLocation(p, areas, location, active);
    return {
      slug: p.slug,
      vendorSlug: fulfillmentVendorSlug(p),
      deliverable: match.serviceable,
      reason: match.reason,
      matchedRule: match.matchedRule,
    };
  });
}

export function parseLocationQuery(event: APIGatewayProxyEventV2) {
  const q = event.queryStringParameters ?? {};
  const countryCode = (q.country ?? q.countryCode ?? "").trim().toUpperCase();
  const postalCode = (q.postalCode ?? q.zip ?? "").trim();
  if (!countryCode || !postalCode) return null;
  if (!getDeliveryCountry(countryCode) || !isValidPostal(countryCode, postalCode)) return null;
  return { countryCode, postalCode, stateCode: q.state ?? q.stateCode, city: q.city };
}
