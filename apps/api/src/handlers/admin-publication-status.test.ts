import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-admin-publication-test";
process.env.PRODUCTS_TABLE = "blossompot-products-admin-publication-test";
process.env.CARTS_TABLE = "blossompot-carts-admin-publication-test";
process.env.ORDERS_TABLE = "blossompot-orders-admin-publication-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listAdminProducts: Handler;
let listProducts: Handler;
let updateProduct: Handler;
let invalidateProductListCache: () => void;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productKeys: { pk: (slug: string) => string; sk: () => string; gsi1pk: (category: string) => string; gsi1sk: (slug: string) => string };
let productsTable: string;

const admin = { headers: { authorization: "Bearer dev:admin@blossompot.test:admin" } };

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const products = await import("./products");
  listAdminProducts = products.listAdminProducts;
  listProducts = products.listProducts;
  updateProduct = products.updateProduct;
  invalidateProductListCache = products.invalidateProductListCache;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function listed(body: Record<string, unknown>, slug: string): Record<string, unknown> | undefined {
  const products = (body.products as Array<Record<string, unknown>> | undefined) ?? [];
  return products.find((product) => product.slug === slug);
}

function row(slug: string, extra: Record<string, unknown> = {}) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk("flowers"),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: slug,
    description: "Catalog row",
    price: 24,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://cdn.example.com/rose.jpg"],
    inventory: 8,
    tags: [],
    updatedAt: "2026-10-14T00:00:00.000Z",
    createdAt: "2026-10-14T00:00:00.000Z",
    ...extra,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

function adminList(): Promise<APIGatewayProxyResultV2> {
  return listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2);
}

function update(slug: string, body: Record<string, unknown>) {
  return updateProduct({
    ...admin,
    body: JSON.stringify(body),
    pathParameters: { slug },
    rawPath: `/products/${slug}`,
  } as unknown as APIGatewayProxyEventV2);
}

function shopList() {
  return listProducts({
    headers: { "x-session-id": "admin-status-shopper" },
    queryStringParameters: { country: "US", postalCode: "92612" },
  } as unknown as APIGatewayProxyEventV2);
}

/** Bundled catalog inserts clear the list cache. Warm until a pass inserts nothing. */
async function warmListCache() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(" "));
      original.apply(console, args);
    };
    try {
      await adminList();
      await shopList();
    } finally {
      console.log = original;
    }
    if (!logs.some((line) => line.startsWith("upserted "))) return;
  }
  throw new Error("Bundled catalog persist did not finish");
}

describe("admin publication status follows the stored row", { concurrency: false }, () => {
  it("shows Published immediately after publish and Draft immediately after unpublish", async () => {
    await putProduct(row("admin-status-toggle", { name: "Toggle rose", published: false }));
    const draft = listed(resultOf(await adminList()).body, "admin-status-toggle");
    assert.equal(draft?.published, false);

    const published = resultOf(await update("admin-status-toggle", { published: true }));
    assert.equal(published.statusCode, 200);
    assert.equal((published.body.product as { published?: boolean }).published, true);
    assert.equal(listed(resultOf(await adminList()).body, "admin-status-toggle")?.published, true);

    const hidden = resultOf(await update("admin-status-toggle", { published: false }));
    assert.equal(hidden.statusCode, 200);
    assert.equal((hidden.body.product as { published?: boolean }).published, false);
    assert.equal(listed(resultOf(await adminList()).body, "admin-status-toggle")?.published, false);
  });

  it("does not let a stale list cache override published, and keeps other cached fields", async () => {
    await putProduct(row("admin-status-stale", { name: "Cached rose", description: "cached description", published: true }));
    await putProduct(row("admin-status-other", { name: "Other rose", description: "other description", published: true }));
    await warmListCache();

    await putProduct(row("admin-status-stale", { name: "Fresh rose", description: "fresh description", published: false }));
    await putProduct(row("admin-status-other", { name: "Other rose", description: "changed in the database", published: true }));

    const admin = resultOf(await adminList());
    const stale = listed(admin.body, "admin-status-stale");
    assert.equal(stale?.published, false);
    assert.equal(stale?.name, "Cached rose");
    assert.equal(stale?.description, "cached description");

    const shop = resultOf(await shopList());
    const slugs = ((shop.body.products as Array<{ slug?: string }>) ?? []).map((product) => product.slug);
    assert.equal(slugs.includes("admin-status-stale"), false);
    const other = ((shop.body.products as Array<Record<string, unknown>>) ?? []).find(
      (product) => product.slug === "admin-status-other"
    );
    assert.equal(other?.description, "other description");
  });

  it("keeps a missing published flag eligible and does not publish on a rejected save", async () => {
    invalidateProductListCache();
    await putProduct(row("admin-status-omitted", { name: "Omitted rose" }));
    const omitted = listed(resultOf(await adminList()).body, "admin-status-omitted");
    assert.ok(omitted);
    assert.notEqual(omitted.published, false);

    await putProduct(row("admin-status-reject", { name: "Reject rose", published: false }));
    invalidateProductListCache();
    assert.equal(listed(resultOf(await adminList()).body, "admin-status-reject")?.published, false);
    const rejected = resultOf(await update("admin-status-reject", { price: -1, published: true }));
    assert.equal(rejected.statusCode, 400);
    assert.equal(listed(resultOf(await adminList()).body, "admin-status-reject")?.published, false);
  });

  it("keeps a row with a non-array gallery and tag set in the admin list", async () => {
    invalidateProductListCache();
    await putProduct(
      row("admin-malformed-gallery", {
        name: "Malformed gallery",
        published: false,
        inventory: 0,
        images: "https://cdn.example.com/not-an-array.jpg",
        tags: new Set(["sample-product"]),
        vendorSlug: 12,
      })
    );
    const listedAdmin = resultOf(await adminList());
    assert.equal(listedAdmin.statusCode, 200);
    assert.ok(listed(listedAdmin.body, "admin-malformed-gallery"));
  });
});
