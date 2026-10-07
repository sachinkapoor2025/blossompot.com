import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  catalogCountriesForStorefront,
  catalogCountryKeys,
  catalogCountryName,
  normalizeCatalogCountries,
  updateCatalogCountriesSchema,
  type CatalogCountrySetting,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { invalidateCatalogCountryCache, loadCatalogCountries } from "../lib/catalog-country-store";
import { CONFIG_TABLE, docClient, now } from "../lib/db";
import { badRequest, forbidden, ok } from "../lib/response";

function withName(country: CatalogCountrySetting, includeEnabled: boolean) {
  return {
    countryCode: country.countryCode,
    ...(includeEnabled ? { enabled: country.enabled } : {}),
    name: catalogCountryName(country.countryCode),
  };
}

/** Admin list, including disabled countries. Missing config is USA-only. */
export async function listCatalogCountriesAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const stored = await loadCatalogCountries();
  return ok({
    source: stored.source,
    updatedAt: stored.updatedAt,
    ...(stored.updatedBy ? { updatedBy: stored.updatedBy } : {}),
    countries: stored.countries.map((country) => withName(country, true)),
  });
}

/** Storefront list of globally enabled countries. The country selector uses this list. */
export async function listCatalogCountriesPublic() {
  const stored = await loadCatalogCountries();
  return ok({
    countries: catalogCountriesForStorefront(stored.countries).map((country) =>
      withName(country, false)
    ),
  });
}

/** Replace the global target-country list. Does not change vendor rows or shopping. */
export async function updateCatalogCountriesAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Invalid JSON");
  }
  const parsed = updateCatalogCountriesSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid catalog country update");
  }
  const normalized = normalizeCatalogCountries(parsed.data.countries);
  if ("error" in normalized) return badRequest(normalized.error);

  const updatedAt = now();
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: catalogCountryKeys.pk,
        SK: catalogCountryKeys.sk,
        countries: normalized.countries,
        updatedAt,
        updatedBy: auth.email,
      },
    })
  );
  invalidateCatalogCountryCache();

  return ok({
    source: "config" as const,
    updatedAt,
    updatedBy: auth.email,
    countries: normalized.countries.map((country) => withName(country, true)),
  });
}
