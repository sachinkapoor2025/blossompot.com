import { GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  catalogCountryKeys,
  readStoredCatalogCountries,
  type CatalogCountrySetting,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient } from "./db";

const CACHE_MS = 30_000;

type CachedCountries = {
  at: number;
  countries: CatalogCountrySetting[];
  defaultCountry: string;
  source: "config" | "default";
  updatedAt: string | null;
  updatedBy?: string;
};

let cache: CachedCountries | null = null;

export function invalidateCatalogCountryCache() {
  cache = null;
}

/** Global target countries. A missing row stays USA-only. */
export async function loadCatalogCountries(): Promise<Omit<CachedCountries, "at">> {
  const nowMs = Date.now();
  if (cache && nowMs - cache.at < CACHE_MS) {
    const { at: _at, ...rest } = cache;
    return rest;
  }
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: { PK: catalogCountryKeys.pk, SK: catalogCountryKeys.sk },
    })
  );
  const stored = readStoredCatalogCountries(result.Item as Record<string, unknown> | undefined);
  cache = { at: nowMs, ...stored };
  return stored;
}
