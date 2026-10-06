import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.CONFIG_TABLE = "blossompot-config-catalog-vendor-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listCatalogVendorsAdmin: Handler;
let updateCatalogVendorAdmin: Handler;

before(async () => {
  const mod = await import("./catalog-vendors");
  listCatalogVendorsAdmin = mod.listCatalogVendorsAdmin;
  updateCatalogVendorAdmin = mod.updateCatalogVendorAdmin;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function event(opts: {
  token?: string | null;
  body?: unknown;
  vendorSlug?: string;
}): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};
  if (opts.token !== null) {
    headers.authorization = opts.token ?? "Bearer dev:admin@blossompot.test:admin";
  }
  return {
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    pathParameters: opts.vendorSlug ? { vendorSlug: opts.vendorSlug } : undefined,
    requestContext: { http: { method: "PUT" } },
  } as APIGatewayProxyEventV2;
}

describe("admin catalog vendor API", { concurrency: false }, () => {
  it("requires admin authorization", async () => {
    const missing = resultOf(await listCatalogVendorsAdmin(event({ token: null })));
    assert.equal(missing.statusCode, 403);
    const stranger = resultOf(
      await updateCatalogVendorAdmin(event({ token: "Bearer dev:shopper@blossompot.test:customer", vendorSlug: "fnp", body: { enabled: false, deliveryCountries: ["US"] } }))
    );
    assert.equal(stranger.statusCode, 403);
  });

  it("lists four default vendors without a config row", async () => {
    const listed = resultOf(await listCatalogVendorsAdmin(event({})));
    assert.equal(listed.statusCode, 200);
    const vendors = listed.body.vendors as Array<Record<string, unknown>>;
    assert.deepEqual(
      vendors.map((vendor) => vendor.vendorSlug),
      ["blossompot", "orange-county", "gift-baskets-overseas", "fnp"]
    );
    assert.equal(vendors.every((vendor) => vendor.source === "default" && vendor.enabled === true), true);
    assert.equal(vendors.every((vendor) => Array.isArray(vendor.deliveryCountries) && vendor.deliveryCountries[0] === "US"), true);
    assert.equal(listed.body.productCountAvailable, false);
    assert.equal(vendors.every((vendor) => vendor.productCount === null), true);
  });

  it("rejects an unknown vendor slug", async () => {
    const unknown = resultOf(
      await updateCatalogVendorAdmin(
        event({ vendorSlug: "sample-florist", body: { enabled: false, deliveryCountries: ["US"] } })
      )
    );
    assert.equal(unknown.statusCode, 404);
  });

  it("disables and enables a vendor while keeping the United States", async () => {
    const disabled = resultOf(
      await updateCatalogVendorAdmin(
        event({ vendorSlug: "orange-county", body: { enabled: false, deliveryCountries: ["US"] } })
      )
    );
    assert.equal(disabled.statusCode, 200);
    const disabledVendor = disabled.body.vendor as Record<string, unknown>;
    assert.equal(disabledVendor.enabled, false);
    assert.deepEqual(disabledVendor.deliveryCountries, ["US"]);
    assert.equal(disabledVendor.integrationType, "local-catalog");
    assert.equal(disabledVendor.vendorName, "Orange County");

    const enabled = resultOf(
      await updateCatalogVendorAdmin(
        event({ vendorSlug: "orange-county", body: { enabled: true, deliveryCountries: ["us", "US"] } })
      )
    );
    assert.equal(enabled.statusCode, 200);
    const enabledVendor = enabled.body.vendor as Record<string, unknown>;
    assert.equal(enabledVendor.enabled, true);
    assert.deepEqual(enabledVendor.deliveryCountries, ["US"]);
  });

  it("rejects a delivery country that is not ISO-2 and an enabled vendor with no country", async () => {
    const badCode = resultOf(
      await updateCatalogVendorAdmin(
        event({ vendorSlug: "fnp", body: { enabled: true, deliveryCountries: ["USA"] } })
      )
    );
    assert.equal(badCode.statusCode, 400);
    const empty = resultOf(
      await updateCatalogVendorAdmin(event({ vendorSlug: "fnp", body: { enabled: true, deliveryCountries: [] } }))
    );
    assert.equal(empty.statusCode, 400);
  });

  it("keeps GBO catalog-enabled when the storefront environment flag is off", async () => {
    process.env.GBO_STOREFRONT_ENABLED = "false";
    const saved = resultOf(
      await updateCatalogVendorAdmin(
        event({
          vendorSlug: "gift-baskets-overseas",
          body: { enabled: true, deliveryCountries: ["US"] },
        })
      )
    );
    assert.equal(saved.statusCode, 200);
    const vendor = saved.body.vendor as Record<string, unknown>;
    assert.equal(vendor.enabled, true);
    assert.equal(vendor.shoppingAvailable, false);
    assert.equal(vendor.storefrontEnvEnabled, false);
    assert.equal(vendor.storefrontBlockReason, "Blocked by environment");
  });
});
