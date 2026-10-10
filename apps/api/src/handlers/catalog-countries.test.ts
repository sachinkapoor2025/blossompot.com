import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.CONFIG_TABLE = "blossompot-config-catalog-country-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listCatalogCountriesAdmin: Handler;
let updateCatalogCountriesAdmin: Handler;
let listCatalogCountriesPublic: Handler;
let listCatalogVendorsAdmin: Handler;
let docClient: { send: (command: unknown) => Promise<{ Items?: Record<string, unknown>[] }> };

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  const countries = await import("./catalog-countries");
  listCatalogCountriesAdmin = countries.listCatalogCountriesAdmin;
  updateCatalogCountriesAdmin = countries.updateCatalogCountriesAdmin;
  listCatalogCountriesPublic = countries.listCatalogCountriesPublic;
  const vendors = await import("./catalog-vendors");
  listCatalogVendorsAdmin = vendors.listCatalogVendorsAdmin;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function event(opts: { token?: string | null; body?: unknown; method?: string } = {}): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};
  if (opts.token !== null) {
    headers.authorization = opts.token ?? "Bearer dev:admin@blossompot.test:admin";
  }
  return {
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    requestContext: { http: { method: opts.method ?? "GET", path: "/admin/catalog-countries" } },
  } as unknown as APIGatewayProxyEventV2;
}

function codes(body: Record<string, unknown>): Array<{ countryCode: string; enabled?: boolean; name: string | null }> {
  return (body.countries as Array<{ countryCode: string; enabled?: boolean; name: string | null }>) ?? [];
}

describe("catalog countries API", { concurrency: false }, () => {
  it("requires admin authorization and defaults a missing config to the United States", async () => {
    const missing = resultOf(await listCatalogCountriesAdmin(event({ token: null })));
    assert.equal(missing.statusCode, 403);
    const stranger = resultOf(
      await updateCatalogCountriesAdmin(
        event({ token: "Bearer dev:shopper@blossompot.test:customer", method: "PUT", body: { countries: [] } })
      )
    );
    assert.equal(stranger.statusCode, 403);

    const admin = resultOf(await listCatalogCountriesAdmin(event()));
    assert.equal(admin.statusCode, 200);
    assert.equal(admin.body.source, "default");
    assert.deepEqual(codes(admin.body), [{ countryCode: "US", enabled: true, name: "United States" }]);

    const pub = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    assert.equal(pub.statusCode, 200);
    assert.deepEqual(codes(pub.body).map((country) => country.countryCode), ["US"]);
  });

  it("returns disabled countries to admin and only enabled countries publicly", async () => {
    const saved = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "GB", enabled: false },
            ],
          },
        })
      )
    );
    assert.equal(saved.statusCode, 200);
    assert.deepEqual(codes(saved.body), [
      { countryCode: "US", enabled: true, name: "United States" },
      { countryCode: "GB", enabled: false, name: "United Kingdom" },
    ]);

    const admin = resultOf(await listCatalogCountriesAdmin(event()));
    assert.equal(admin.body.source, "config");
    assert.equal(codes(admin.body).some((country) => country.countryCode === "GB" && country.enabled === false), true);

    const pub = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    const publicCodes = codes(pub.body).map((country) => country.countryCode);
    assert.deepEqual(publicCodes, ["US"]);
    assert.equal(publicCodes.includes("GB"), false);
  });

  it("rejects unknown, malformed, duplicate, and empty-enabled lists", async () => {
    const unknown = resultOf(
      await updateCatalogCountriesAdmin(
        event({ method: "PUT", body: { countries: [{ countryCode: "ZZ", enabled: true }] } })
      )
    );
    assert.equal(unknown.statusCode, 400);
    assert.match(String(unknown.body.error), /not a known delivery country/);

    const malformed = resultOf(
      await updateCatalogCountriesAdmin(
        event({ method: "PUT", body: { countries: [{ countryCode: "USA", enabled: true }] } })
      )
    );
    assert.equal(malformed.statusCode, 400);
    assert.match(String(malformed.body.error), /not a two-letter country code/);

    const duplicate = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "us", enabled: true },
            ],
          },
        })
      )
    );
    assert.equal(duplicate.statusCode, 400);
    assert.match(String(duplicate.body.error), /listed more than once/);

    const none = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: false },
              { countryCode: "GB", enabled: false },
            ],
          },
        })
      )
    );
    assert.equal(none.statusCode, 400);
    assert.match(String(none.body.error), /At least one country must be enabled/);
  });

  it("stores an explicit default and rejects a disabled one", async () => {
    const { invalidateCatalogCountryCache } = await import("../lib/catalog-country-store");
    const saved = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "GB", enabled: true },
            ],
            defaultCountry: "GB",
          },
        })
      )
    );
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.body.defaultCountry, "GB");
    assert.deepEqual(
      codes(saved.body).map((country) => country.countryCode),
      ["US", "GB"]
    );

    const disabled = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: false },
              { countryCode: "GB", enabled: true },
            ],
            defaultCountry: "US",
          },
        })
      )
    );
    assert.equal(disabled.statusCode, 400);
    assert.match(String(disabled.body.error), /not an enabled country/);

    const ukOnly = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: false },
              { countryCode: "GB", enabled: true },
            ],
          },
        })
      )
    );
    assert.equal(ukOnly.statusCode, 200);
    assert.equal(ukOnly.body.defaultCountry, "GB");
    const pub = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    assert.equal(pub.body.defaultCountry, "GB");
    assert.deepEqual(codes(pub.body).map((country) => country.countryCode), ["GB"]);
    assert.equal("enabled" in (codes(pub.body)[0] ?? {}), false);

    invalidateCatalogCountryCache();
    await docClient.send(
      new PutCommand({
        TableName: process.env.CONFIG_TABLE,
        Item: {
          PK: "CONFIG#CATALOG_COUNTRIES",
          SK: "META",
          countries: [
            { countryCode: "US", enabled: true },
            { countryCode: "GB", enabled: true },
          ],
          updatedAt: "2026-10-05T00:00:00.000Z",
        },
      })
    );
    const legacy = resultOf(await listCatalogCountriesAdmin(event()));
    assert.equal(legacy.body.defaultCountry, "US");
    assert.equal(legacy.body.source, "config");

    const restored = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "GB", enabled: false },
            ],
          },
        })
      )
    );
    assert.equal(restored.statusCode, 200);
    assert.equal(restored.body.defaultCountry, "US");
  });

  it("keeps the public response cached until PUT replaces the config", async () => {
    const { invalidateCatalogCountryCache } = await import("../lib/catalog-country-store");
    invalidateCatalogCountryCache();

    const cached = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    const cachedCodes = codes(cached.body).map((country) => country.countryCode);
    assert.deepEqual(cachedCodes, ["US"]);
    assert.equal(cachedCodes.includes("CA"), false);

    await docClient.send(
      new PutCommand({
        TableName: process.env.CONFIG_TABLE,
        Item: {
          PK: "CONFIG#CATALOG_COUNTRIES",
          SK: "META",
          countries: [
            { countryCode: "US", enabled: true },
            { countryCode: "CA", enabled: true },
          ],
          updatedAt: "2026-10-05T00:00:00.000Z",
          updatedBy: "direct-write",
        },
      })
    );
    const stillCached = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    assert.deepEqual(
      codes(stillCached.body).map((country) => country.countryCode),
      cachedCodes
    );

    const replaced = resultOf(
      await updateCatalogCountriesAdmin(
        event({
          method: "PUT",
          body: {
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "GB", enabled: true },
            ],
          },
        })
      )
    );
    assert.equal(replaced.statusCode, 200);
    const fresh = resultOf(await listCatalogCountriesPublic(event({ token: null })));
    const freshCodes = codes(fresh.body).map((country) => country.countryCode);
    assert.deepEqual(freshCodes, ["US", "GB"]);
    assert.equal(freshCodes.includes("CA"), false);
  });

  it("does not write catalog vendor rows or change vendor defaults", async () => {
    const before = resultOf(await listCatalogVendorsAdmin(event()));
    const vendors = before.body.vendors as Array<{ vendorSlug: string; enabled: boolean; deliveryCountries: string[] }>;
    assert.deepEqual(
      vendors.map((vendor) => vendor.vendorSlug),
      ["blossompot", "orange-county", "gift-baskets-overseas", "fnp"]
    );
    assert.equal(vendors.every((vendor) => vendor.enabled && vendor.deliveryCountries[0] === "US"), true);

    const scan = await docClient.send(
      new ScanCommand({
        TableName: process.env.CONFIG_TABLE,
        FilterExpression: "begins_with(PK, :prefix)",
        ExpressionAttributeValues: { ":prefix": "CATALOGVENDOR#" },
      })
    );
    assert.equal((scan.Items ?? []).length, 0);
  });

  it("connects global countries to product, cart, and checkout validation", () => {
    const products = readFileSync(path.join(__dirname, "products.ts"), "utf8");
    const cart = readFileSync(path.join(__dirname, "cart.ts"), "utf8");
    const orders = readFileSync(path.join(__dirname, "orders.ts"), "utf8");
    assert.equal(products.includes("resolveShoppingLocation"), true);
    assert.equal(cart.includes("loadCatalogCountries"), true);
    assert.equal(orders.includes("loadCatalogCountries"), true);
    const postal = readFileSync(
      path.join(__dirname, "../../../../packages/shared/src/lib/postal-countries.ts"),
      "utf8"
    );
    assert.match(postal, /export function clampShoppingCountry/);
    assert.match(postal, /return SHOPPING_COUNTRY_ISO;/);
  });
});
