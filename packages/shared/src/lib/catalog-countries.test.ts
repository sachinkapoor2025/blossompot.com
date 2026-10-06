import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configKeys } from "../db/keys";
import { clampShoppingCountry, isShoppingCountry } from "./postal-countries";
import {
  catalogCountryKeys,
  defaultCatalogCountries,
  enabledCatalogCountries,
  isCatalogCountryEnabled,
  normalizeCatalogCountries,
  readStoredCatalogCountries,
} from "./catalog-countries";

describe("catalog country defaults", () => {
  it("uses USA only when the config item is missing", () => {
    const resolved = readStoredCatalogCountries(null);
    assert.equal(resolved.source, "default");
    assert.deepEqual(resolved.countries, defaultCatalogCountries());
    assert.equal(isCatalogCountryEnabled(resolved.countries, "US"), true);
    assert.equal(isCatalogCountryEnabled(resolved.countries, "GB"), false);
    assert.deepEqual(enabledCatalogCountries(resolved.countries), [{ countryCode: "US", enabled: true }]);
  });

  it("keeps a stored USA row enabled", () => {
    const resolved = readStoredCatalogCountries({
      countries: [{ countryCode: "US", enabled: true }],
      updatedAt: "2026-10-05T00:00:00.000Z",
    });
    assert.equal(resolved.source, "config");
    assert.equal(isCatalogCountryEnabled(resolved.countries, "US"), true);
    assert.equal(isCatalogCountryEnabled(resolved.countries, "GB"), false);
  });

  it("keeps both USA and the UK when both are enabled", () => {
    const normalized = normalizeCatalogCountries([
      { countryCode: "us", enabled: true },
      { countryCode: "GB", enabled: true },
    ]);
    assert.equal("countries" in normalized, true);
    if (!("countries" in normalized)) return;
    assert.deepEqual(normalized.countries, [
      { countryCode: "US", enabled: true },
      { countryCode: "GB", enabled: true },
    ]);
    assert.equal(isCatalogCountryEnabled(normalized.countries, "GB"), true);
  });

  it("stores the global list on one config key", () => {
    assert.equal(catalogCountryKeys.pk, "CONFIG#CATALOG_COUNTRIES");
    assert.equal(catalogCountryKeys.sk, "META");
    assert.equal(configKeys.catalogCountries.pk, catalogCountryKeys.pk);
  });
});

describe("catalog country validation", () => {
  it("rejects an unknown country code", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: true },
      { countryCode: "ZZ", enabled: false },
    ]);
    assert.deepEqual(result, { error: '"ZZ" is not a known delivery country.' });
  });

  it("rejects a country code that is not ISO-2", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "USA", enabled: true },
    ]);
    assert.deepEqual(result, { error: '"USA" is not a two-letter country code.' });
  });

  it("rejects a duplicate country code", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: true },
      { countryCode: "us", enabled: false },
    ]);
    assert.deepEqual(result, { error: '"US" is listed more than once.' });
  });

  it("rejects a list with no enabled country", () => {
    const result = normalizeCatalogCountries([
      { countryCode: "US", enabled: false },
      { countryCode: "GB", enabled: false },
    ]);
    assert.deepEqual(result, { error: "At least one country must be enabled." });
  });

  it("leaves the USA shopping clamp unchanged", () => {
    assert.equal(clampShoppingCountry("GB"), "US");
    assert.equal(clampShoppingCountry("CA"), "US");
    assert.equal(isShoppingCountry("US"), true);
    assert.equal(isShoppingCountry("GB"), false);
  });
});
