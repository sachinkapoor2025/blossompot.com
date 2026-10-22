import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-bulk-categories-test";
process.env.PRODUCTS_TABLE = "blossompot-products-bulk-categories-test";
process.env.CARTS_TABLE = "blossompot-carts-bulk-categories-test";
process.env.ORDERS_TABLE = "blossompot-orders-bulk-categories-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let bulkUploadProducts: Handler;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productKeys: { pk: (slug: string) => string; sk: () => string };
let categoryKeys: { pk: (slug: string) => string; sk: () => string };
let productsTable: string;

const admin = { headers: { authorization: "Bearer dev:admin@blossompot.test:admin" } };

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  categoryKeys = shared.categoryKeys;
  const products = await import("./products");
  bulkUploadProducts = products.bulkUploadProducts;
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: {
        PK: categoryKeys.pk("flowers"),
        SK: categoryKeys.sk(),
        slug: "flowers",
        name: "Flowers",
        published: true,
      },
    })
  );
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

async function stored(slug: string): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: productsTable,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  return result.Item;
}

describe("bulk upload primary categories", () => {
  it("rejects missing, blank, and unknown primary categories before writing those rows", async () => {
    const saved = resultOf(
      await bulkUploadProducts({
        ...admin,
        body: JSON.stringify({
          rows: [
            { name: "Bulk Missing Category", description: "Rose", price: 18 },
            { name: "Bulk Blank Category", description: "Rose", price: 18, categorySlug: "   ", sku: "bulk-blank-sku" },
            {
              name: "Bulk Unknown Category",
              description: "Rose",
              price: 18,
              categorySlug: "missing-bulk-category",
              sku: "bulk-unknown-sku",
            },
            {
              name: "Bulk Valid Category",
              description: "Rose",
              price: 21,
              categorySlug: " flowers ",
              sku: "bulk-valid-sku",
              inventory: 5,
              published: false,
            },
          ],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );

    assert.equal(saved.statusCode, 200);
    assert.equal(saved.body.created, 1);
    const errors = saved.body.errors as Array<{ row: number; error: string }>;
    assert.equal(errors.length, 3);
    assert.match(errors[0]?.error ?? "", /categorySlug/);
    assert.match(errors[1]?.error ?? "", /primary category/i);
    assert.match(errors[2]?.error ?? "", /missing-bulk-category/);

    assert.equal(await stored("bulk-missing-category"), undefined);
    assert.equal(await stored("bulk-blank-category"), undefined);
    assert.equal(await stored("bulk-unknown-category"), undefined);

    const created = await stored("bulk-valid-category");
    assert.ok(created);
    assert.equal(created.categorySlug, "flowers");
    assert.equal(created.GSI1PK, categoryKeys.pk("flowers"));
    assert.equal(created.price, 21);
    assert.equal(created.inventory, 5);
    assert.equal(created.published, false);
    assert.equal(created.sku, "bulk-valid-sku");
  });
});
