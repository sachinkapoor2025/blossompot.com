import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.PRODUCTS_TABLE = "blossompot-products-import-test";
process.env.CONFIG_TABLE = "blossompot-config-import-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let previewProductImport: Handler;
let commitProductImport: Handler;
let setProductImportImageProbe: (probe: (url: string) => Promise<{ ok: boolean; detail: string }>) => void;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown>; Items?: Record<string, unknown>[] }> };
let productsTable: string;
let configTable: string;
let decideNewShopping: (product: { productSlug: string; vendorSlug?: string; deliveryCountries?: readonly string[] | null }, country: string) => Promise<{ available: boolean; reason?: string }>;
let withStoredShoppingIdentity: (item: { productSlug: string; vendorSlug?: string }) => Promise<{ deliveryCountries?: readonly string[] | null }>;

const admin = { headers: { authorization: "Bearer dev:admin@blossompot.test:admin" } };

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") throw new Error("Expected JSON");
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function event(body: unknown): APIGatewayProxyEventV2 {
  return { ...admin, body: JSON.stringify(body) } as unknown as APIGatewayProxyEventV2;
}

const validRow = {
  name: "Import Red Roses",
  description: "A dozen roses",
  sku: "import-red-roses",
  price: 24,
  currency: "USD",
  categorySlug: "flowers",
  imageUrls: "https://cdn.example.com/roses.jpg",
};

before(async () => {
  const mod = await import("./product-import");
  previewProductImport = mod.previewProductImport;
  commitProductImport = mod.commitProductImport;
  setProductImportImageProbe = mod.setProductImportImageProbe;
  setProductImportImageProbe(async (url) =>
    url.startsWith("https://cdn.example.com/")
      ? { ok: true, detail: "HTTP 200" }
      : { ok: false, detail: "HTTP 404" }
  );
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  configTable = db.CONFIG_TABLE;
  const store = await import("../lib/catalog-vendor-store");
  decideNewShopping = store.decideNewShopping;
  withStoredShoppingIdentity = store.withStoredShoppingIdentity;
  await docClient.send(
    new PutCommand({
      TableName: configTable,
      Item: {
        PK: "CATALOGVENDOR#fnp",
        SK: "META",
        vendorSlug: "fnp",
        vendorName: "FNP",
        enabled: true,
        integrationType: "excel",
        deliveryCountries: ["US", "GB"],
        defaultInventory: 12,
        updatedAt: "2026-10-09T00:00:00.000Z",
      },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: configTable,
      Item: {
        PK: "CONFIG#CATALOG_COUNTRIES",
        SK: "META",
        countries: [
          { countryCode: "US", enabled: true },
          { countryCode: "GB", enabled: true },
        ],
        updatedAt: "2026-10-09T00:00:00.000Z",
      },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: { PK: "CATEGORY#flowers", SK: "META", slug: "flowers", name: "Flowers" },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: {
        PK: "PRODUCT#kept-rose",
        SK: "META",
        slug: "kept-rose",
        sku: "kept-rose",
        name: "Kept Rose",
        inventory: 7,
        vendorSlug: "fnp",
        price: 10,
      },
    })
  );
});

async function productCount(): Promise<number> {
  const page = await docClient.send(new ScanCommand({ TableName: productsTable }));
  return (page.Items ?? []).filter((item) => String(item.PK).startsWith("PRODUCT#") && item.SK === "META").length;
}

describe("safe product import", { concurrency: false }, () => {
  it("previews without writing and blocks a batch when one row is invalid", async () => {
    const beforeCount = await productCount();
    const preview = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [validRow, { ...validRow, name: "Second", sku: "", imageUrls: "notaurl" }],
        })
      )
    );
    assert.equal(preview.statusCode, 200);
    assert.equal(preview.body.writes, false);
    assert.equal(preview.body.ok, false);
    assert.equal(await productCount(), beforeCount);
    const commit = resultOf(
      await commitProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [validRow, { ...validRow, name: "Second", sku: "" }],
        })
      )
    );
    assert.equal(commit.statusCode, 400);
    assert.equal(commit.body.writes, false);
    assert.equal(await productCount(), beforeCount);
  });

  it("rejects an unknown image, a duplicate sku, an existing slug, and a country outside vendor coverage", async () => {
    const image = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [{ ...validRow, sku: "fresh-sku", name: "Fresh Name", imageUrls: "https://evil.example/rose.jpg" }],
        })
      )
    );
    assert.equal(image.body.ok, false);
    const duplicate = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [
            { ...validRow, name: "One Rose", sku: "same-sku" },
            { ...validRow, name: "Two Rose", sku: "SAME-SKU" },
          ],
        })
      )
    );
    assert.equal(duplicate.body.ok, false);
    const existing = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [{ ...validRow, name: "Kept Rose", sku: "brand-new-sku" }],
        })
      )
    );
    assert.equal(existing.body.ok, false);
    const country = resultOf(
      await previewProductImport(
        event({ vendorSlug: "fnp", deliveryCountries: ["FR"], rows: [{ ...validRow, name: "France Rose", sku: "france-rose" }] })
      )
    );
    assert.equal(country.body.ok, false);
    const kept = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#kept-rose", SK: "META" } })
    );
    assert.equal(kept.Item?.inventory, 7);
    assert.equal(kept.Item?.name, "Kept Rose");
  });

  it("commits unpublished products with the selected countries and reserves the SKU", async () => {
    const commit = resultOf(
      await commitProductImport(
        event({ vendorSlug: "fnp", deliveryCountries: ["US"], rows: [validRow] })
      )
    );
    assert.equal(commit.statusCode, 201);
    assert.equal(commit.body.writes, true);
    const stored = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#import-red-roses", SK: "META" } })
    );
    assert.equal(stored.Item?.published, false);
    assert.deepEqual(stored.Item?.deliveryCountries, ["US"]);
    assert.equal(stored.Item?.inventory, 12);
    assert.equal(stored.Item?.vendorCost, undefined);
    const sku = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "SKU#import-red-roses", SK: "META" } })
    );
    assert.equal(sku.Item?.productSlug, "import-red-roses");
    const line = { productSlug: "import-red-roses", vendorSlug: "fnp" };
    const identity = await withStoredShoppingIdentity(line);
    assert.deepEqual(identity.deliveryCountries, ["US"]);
    const decision = await decideNewShopping({ ...line, deliveryCountries: identity.deliveryCountries }, "GB");
    assert.equal(decision.available, false);
    assert.equal(decision.reason, "country_not_allowed");
    assert.equal((await decideNewShopping({ ...line, deliveryCountries: identity.deliveryCountries }, "US")).available, true);
  });

  it("does not overwrite an existing product when a second batch races the same slug", async () => {
    const again = resultOf(
      await commitProductImport(
        event({ vendorSlug: "fnp", deliveryCountries: ["GB"], rows: [{ ...validRow, sku: "other-sku" }] })
      )
    );
    assert.equal(again.statusCode, 400);
    const stored = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#import-red-roses", SK: "META" } })
    );
    assert.deepEqual(stored.Item?.deliveryCountries, ["US"]);
    assert.equal(stored.Item?.sku, "import-red-roses");
  });

  it("rejects a missing vendor, an unknown category, and a missing name", async () => {
    const beforeCount = await productCount();
    const vendor = resultOf(
      await previewProductImport(event({ vendorSlug: "missing-vendor", deliveryCountries: ["US"], rows: [validRow] }))
    );
    assert.equal(vendor.body.ok, false);
    const category = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [{ ...validRow, name: "No Category", sku: "no-category", categorySlug: "not-a-category" }],
        })
      )
    );
    assert.equal(category.body.ok, false);
    const name = resultOf(
      await previewProductImport(
        event({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [{ ...validRow, name: "", sku: "no-name" }],
        })
      )
    );
    assert.equal(name.body.ok, false);
    assert.equal(await productCount(), beforeCount);
  });

  it("rejects a batch over 50 products before writing", async () => {
    const beforeCount = await productCount();
    const rows = Array.from({ length: 51 }, (_, index) => ({
      ...validRow,
      name: `Bulk Rose ${index}`,
      sku: `bulk-rose-${index}`,
    }));
    const commit = resultOf(
      await commitProductImport(event({ vendorSlug: "fnp", deliveryCountries: ["US"], rows }))
    );
    assert.equal(commit.statusCode, 400);
    assert.equal(commit.body.writes, false);
    assert.equal(await productCount(), beforeCount);
  });

  it("lets one of two concurrent commits win and leaves a single product", async () => {
    const body = {
      vendorSlug: "fnp",
      deliveryCountries: ["US"],
      rows: [{ ...validRow, name: "Race Rose", sku: "race-rose" }],
    };
    const [first, second] = await Promise.all([
      commitProductImport(event(body)),
      commitProductImport(event(body)),
    ]);
    const results = [resultOf(first), resultOf(second)];
    const saved = results.filter((result) => result.statusCode === 201);
    const blocked = results.filter((result) => result.statusCode !== 201);
    assert.equal(saved.length, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.body.writes, false);
    const matches = (await docClient.send(new ScanCommand({ TableName: productsTable }))).Items?.filter(
      (item) => item.slug === "race-rose" && item.SK === "META"
    );
    assert.equal(matches?.length, 1);
  });
});
