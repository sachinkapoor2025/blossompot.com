import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  applyEnabledShoppingCountry,
  checkServiceabilitySchema,
  checkVendorServiceability,
  describeMatch,
  formatPostalDisplay,
  getDeliveryCountry,
  isProductDeliverableToLocation,
  isValidPostal,
  NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE,
  resolveDeliveryCountry,
  resolveEnabledShoppingCountry,
  SHOPPING_COUNTRY_ISO,
  vendorCoversShoppingCountryWithoutArea,
  vendorServiceAreaImportRowSchema,
  vendorServiceAreaInputSchema,
  type ServiceabilityMatch,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { loadCatalogCountries } from "../lib/catalog-country-store";
import { loadCatalogVendorRegistry } from "../lib/catalog-vendor-store";
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

/**
 * Public delivery check.
 * Without an enabled-country list this stays USA-only, matching a missing global config.
 * Callers that loaded `CONFIG#CATALOG_COUNTRIES` pass that list and keep an enabled country.
 */
export function publicShoppingServiceability(input: {
  countryCode: string;
  postalCode?: string | null;
  enabledCountryCodes?: readonly string[];
}): { countryCode: string; postalCode: string } | { error: string } {
  const requested = input.countryCode.trim().toUpperCase();
  const postal = (input.postalCode ?? "").trim();
  const enabled = (input.enabledCountryCodes ?? [SHOPPING_COUNTRY_ISO]).map((countryCode) => ({
    countryCode,
    enabled: true,
  }));
  const resolved = resolveEnabledShoppingCountry(requested, enabled);
  if (!resolved) return { error: NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE };
  const postalForCheck = resolved === requested ? postal : "";
  if (postalForCheck && !isValidPostal(resolved, postalForCheck)) {
    const label = resolveDeliveryCountry(resolved).postalLabel;
    return { error: `Enter a valid ${label.toLowerCase()}` };
  }
  return { countryCode: resolved, postalCode: postalForCheck };
}

/** Cart availability flag. A disabled country falls back through the enabled list and drops its postal code. */
export function cartAvailabilityLocation(
  country?: string | null,
  postal?: string | null,
  enabledCountryCodes?: readonly string[]
) {
  const requested = (country ?? "").trim();
  if (!requested) return null;
  const shopping = publicShoppingServiceability({
    countryCode: requested,
    postalCode: postal,
    enabledCountryCodes,
  });
  if ("error" in shopping) return null;
  return shopping;
}

export async function checkServiceability(event: APIGatewayProxyEventV2) {
  const raw = event.requestContext.http.method === "GET" ? locationFromEvent(event) : JSON.parse(event.body ?? "{}");
  const parsed = checkServiceabilitySchema.safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.message);

  const storedCountries = await loadCatalogCountries();
  const enabledCountryCodes = storedCountries.countries
    .filter((country) => country.enabled)
    .map((country) => country.countryCode);
  const shopping = publicShoppingServiceability({
    countryCode: parsed.data.countryCode,
    postalCode: parsed.data.postalCode,
    enabledCountryCodes,
  });
  if ("error" in shopping) return badRequest(shopping.error);

  const country = resolveDeliveryCountry(shopping.countryCode);
  if (!getDeliveryCountry(shopping.countryCode)) return badRequest("Unsupported country");
  const postal = shopping.postalCode;
  const sameCountry = parsed.data.countryCode.trim().toUpperCase() === shopping.countryCode;

  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  const location = {
    ...parsed.data,
    countryCode: shopping.countryCode,
    postalCode: postal,
    stateCode: sameCountry ? parsed.data.stateCode : undefined,
    city: sameCountry ? parsed.data.city : undefined,
  };
  const checked = activeVendorSlugs.map((slug) => checkVendorServiceability(slug, areas, location, true));
  let vendors = checked.filter((match) => match.serviceable);
  if (shopping.countryCode !== "US") {
    const registry = await loadCatalogVendorRegistry();
    const covered: ServiceabilityMatch[] = [];
    for (const match of checked) {
      if (match.serviceable) continue;
      const vendor = registry.get(match.vendorSlug);
      if (!vendorCoversShoppingCountryWithoutArea(vendor, shopping.countryCode, match.reason)) continue;
      covered.push({
        serviceable: true,
        reason: "matched",
        vendorSlug: match.vendorSlug,
        matchedRule: {
          areaId: "vendor-delivery-country",
          scope: "COUNTRY",
          ruleType: "ALLOW",
          countryCode: shopping.countryCode,
        },
      });
    }
    vendors = [...vendors, ...covered];
  }
  const serviceable = vendors.length > 0;
  const where = postal
    ? formatPostalDisplay(shopping.countryCode, postal)
    : country.countryName;

  console.log(
    JSON.stringify({
      type: "SERVICEABILITY_CHECK",
      country: shopping.countryCode,
      postal_code: postal.replace(/\s+/g, ""),
      result: serviceable,
      vendor_count: vendors.length,
      reason: serviceable ? "matched" : "no_matching_service_area",
    })
  );

  return ok({
    serviceable,
    location: {
      country: country.countryName,
      countryCode: shopping.countryCode,
      postalCode: postal ? formatPostalDisplay(shopping.countryCode, postal) : "",
      postalLabel: country.postalLabel,
    },
    vendors: vendors.map((v) => ({
      vendorId: v.vendorSlug,
      name: v.vendorSlug,
      matchedRule: v.matchedRule,
    })),
    message: serviceable
      ? `We can deliver to ${where}.`
      : `We don't have a delivery partner for ${where} yet.`,
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
  products: Array<{ slug: string; vendorSlug?: string; published?: boolean; inventory?: number; sku?: string; internationalDelivery?: boolean; productSlug?: string }>,
  location: { countryCode: string; postalCode: string; stateCode?: string; city?: string }
) {
  const { areas, activeVendorSlugs } = await loadCoverageBundle();
  const registry = await loadCatalogVendorRegistry();
  const active = new Set(activeVendorSlugs);
  return products.map((p) => {
    const match = isProductDeliverableToLocation(p, areas, location, active);
    let deliverable = match.serviceable;
    let reason = match.reason;
    let matchedRule = match.matchedRule;
    const vendor = registry.get(match.vendorSlug);
    if (vendorCoversShoppingCountryWithoutArea(vendor, location.countryCode, match.reason)) {
      deliverable = true;
      reason = "matched";
      matchedRule = {
        areaId: "vendor-delivery-country",
        scope: "COUNTRY",
        ruleType: "ALLOW",
        countryCode: location.countryCode.trim().toUpperCase(),
      };
    }
    return {
      slug: p.slug,
      vendorSlug: match.vendorSlug,
      deliverable,
      reason,
      matchedRule,
    };
  });
}

/** Requested catalog location. Does not apply the global enabled-country list. */
export function parseLocationQuery(event: APIGatewayProxyEventV2) {
  const q = event.queryStringParameters ?? {};
  const requestedCountry = (q.country ?? q.countryCode ?? "").trim().toUpperCase();
  const requestedPostal = (q.postalCode ?? q.zip ?? "").trim();
  if (!requestedCountry || !/^[A-Z]{2}$/.test(requestedCountry)) return null;
  const known = Boolean(getDeliveryCountry(requestedCountry));
  const postalCode =
    requestedPostal && known && isValidPostal(requestedCountry, requestedPostal) ? requestedPostal : "";
  return {
    countryCode: requestedCountry,
    postalCode,
    stateCode: q.state ?? q.stateCode,
    city: q.city,
  };
}

/** Requested location after the global enabled-country list. Null when nothing is enabled. */
export async function resolveShoppingLocation(
  requested: { countryCode: string; postalCode: string; stateCode?: string; city?: string } | null
) {
  const stored = await loadCatalogCountries();
  return applyEnabledShoppingCountry(requested, stored.countries);
}
