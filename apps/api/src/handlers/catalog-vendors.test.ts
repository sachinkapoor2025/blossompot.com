import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.CONFIG_TABLE = "blossompot-config-catalog-vendor-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listCatalogVendorsAdmin: Handler;
let updateCatalogVendorAdmin: Handler;
let createCatalogVendorAdmin: Handler;
let trashCatalogVendorAdmin: Handler;
let restoreCatalogVendorAdmin: Handler;
let deleteCatalogVendorAdmin: Handler;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;

before(async () => {
  const mod = await import("./catalog-vendors");
  listCatalogVendorsAdmin = mod.listCatalogVendorsAdmin;
  updateCatalogVendorAdmin = mod.updateCatalogVendorAdmin;
  createCatalogVendorAdmin = mod.createCatalogVendorAdmin;
  trashCatalogVendorAdmin = mod.trashCatalogVendorAdmin;
  restoreCatalogVendorAdmin = mod.restoreCatalogVendorAdmin;
  deleteCatalogVendorAdmin = mod.deleteCatalogVendorAdmin;
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
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
    assert.equal(listed.body.productCountAvailable, true);
    assert.equal(vendors.every((vendor) => typeof vendor.productCount === "number"), true);
    assert.equal(vendors.every((vendor) => vendor.storage === "DynamoDB"), true);
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

  it("creates a unique vendor, counts its product, and leaves that product in place when the vendor is trashed", async () => {
    const created = resultOf(
      await createCatalogVendorAdmin(
        event({
          body: {
            vendorName: "Phase Two Flowers",
            vendorSlug: "phase2-flowers",
            integrationType: "owned",
            deliveryCountries: ["US"],
            enabled: true,
            sourceName: "Studio",
            defaultInventory: 12,
          },
        })
      )
    );
    assert.equal(created.statusCode, 201);
    const duplicate = resultOf(
      await createCatalogVendorAdmin(
        event({
          body: {
            vendorName: "Again",
            vendorSlug: "phase2-flowers",
            integrationType: "owned",
            deliveryCountries: ["US"],
            enabled: true,
          },
        })
      )
    );
    assert.equal(duplicate.statusCode, 409);
    const builtin = resultOf(
      await createCatalogVendorAdmin(
        event({
          body: {
            vendorName: "FNP copy",
            vendorSlug: "fnp",
            integrationType: "excel",
            deliveryCountries: ["US"],
            enabled: true,
          },
        })
      )
    );
    assert.equal(builtin.statusCode, 409);

    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: {
          PK: "PRODUCT#phase2-rose",
          SK: "META",
          slug: "phase2-rose",
          vendorSlug: "phase2-flowers",
          name: "Phase Two Rose",
          inventory: 4,
        },
      })
    );
    const listed = resultOf(await listCatalogVendorsAdmin(event({})));
    const vendors = listed.body.vendors as Array<Record<string, unknown>>;
    const row = vendors.find((vendor) => vendor.vendorSlug === "phase2-flowers");
    assert.equal(row?.productCount, 1);
    assert.equal(row?.method, "Manual");
    assert.equal(row?.storage, "DynamoDB");

    const wrongName = resultOf(
      await trashCatalogVendorAdmin(event({ vendorSlug: "phase2-flowers", body: { confirmName: "Nope" } }))
    );
    assert.equal(wrongName.statusCode, 400);
    const trashed = resultOf(
      await trashCatalogVendorAdmin(
        event({ vendorSlug: "phase2-flowers", body: { confirmName: "Phase Two Flowers" } })
      )
    );
    assert.equal(trashed.statusCode, 200);
    const trashedVendor = trashed.body.vendor as Record<string, unknown>;
    assert.equal(trashedVendor.enabled, false);
    assert.equal(typeof trashedVendor.trashedAt, "string");
    const product = await docClient.send(
      new GetCommand({
        TableName: productsTable,
        Key: { PK: "PRODUCT#phase2-rose", SK: "META" },
      })
    );
    assert.equal(product.Item?.inventory, 4);
    assert.equal(product.Item?.vendorSlug, "phase2-flowers");

    const restored = resultOf(await restoreCatalogVendorAdmin(event({ vendorSlug: "phase2-flowers" })));
    assert.equal(restored.statusCode, 200);
    const restoredVendor = restored.body.vendor as Record<string, unknown>;
    assert.equal(restoredVendor.enabled, false);
    assert.equal(restoredVendor.trashedAt, undefined);

    const builtinDelete = resultOf(await deleteCatalogVendorAdmin(event({ vendorSlug: "fnp" })));
    assert.equal(builtinDelete.statusCode, 400);
    const stillThere = resultOf(
      await trashCatalogVendorAdmin(
        event({ vendorSlug: "phase2-flowers", body: { confirmName: "Phase Two Flowers" } })
      )
    );
    assert.equal(stillThere.statusCode, 200);
    const blockedDelete = resultOf(await deleteCatalogVendorAdmin(event({ vendorSlug: "phase2-flowers" })));
    assert.equal(blockedDelete.statusCode, 400);
    assert.equal(product.Item?.slug, "phase2-rose");
  });
});
