import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { productSkuKeys } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.PRODUCTS_TABLE = "blossompot-products-sku-write-test";
process.env.CONFIG_TABLE = "blossompot-config-sku-write-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let createProduct: Handler;
let updateProduct: Handler;
let deleteProduct: Handler;
let bulkUploadProducts: Handler;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;

const admin = { headers: { authorization: "Bearer dev:admin@blossompot.test:admin" } };

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") throw new Error("Expected JSON");
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function event(path: string, body: unknown, slug?: string): APIGatewayProxyEventV2 {
  return {
    ...admin,
    body: JSON.stringify(body),
    pathParameters: slug ? { slug } : undefined,
    rawPath: path,
  } as unknown as APIGatewayProxyEventV2;
}

const productBody = {
  name: "Sku Rose",
  description: "A rose",
  price: 20,
  categorySlug: "flowers",
  currency: "USD",
  sku: "Rose-1",
  inventory: 7,
};

before(async () => {
  const products = await import("./products");
  createProduct = products.createProduct;
  updateProduct = products.updateProduct;
  deleteProduct = products.deleteProduct;
  bulkUploadProducts = products.bulkUploadProducts;
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
});

async function skuOwner(sku: string): Promise<string | undefined> {
  const row = await docClient.send(
    new GetCommand({ TableName: productsTable, Key: { PK: productSkuKeys.pk(sku), SK: productSkuKeys.sk() } })
  );
  return row.Item?.productSlug as string | undefined;
}

describe("catalog sku reservation", () => {
  it("reserves a sku on create and rejects a second product using it", async () => {
    const created = resultOf(await createProduct(event("/products", productBody)));
    assert.equal(created.statusCode, 201);
    assert.equal(await skuOwner("rose-1"), "sku-rose");
    const conflict = resultOf(
      await createProduct(event("/products", { ...productBody, name: "Other Rose", sku: " rose-1 " }))
    );
    assert.equal(conflict.statusCode, 409);
    const other = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#other-rose", SK: "META" } })
    );
    assert.equal(other.Item, undefined);
  });

  it("moves the reservation on update without changing inventory", async () => {
    const updated = resultOf(
      await updateProduct(event("/products/sku-rose", { sku: "Rose-2", name: "Sku Rose" }, "sku-rose"))
    );
    assert.equal(updated.statusCode, 200);
    const stored = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#sku-rose", SK: "META" } })
    );
    assert.equal(stored.Item?.sku, "Rose-2");
    assert.equal(stored.Item?.inventory, 7);
    assert.equal(await skuOwner("rose-1"), undefined);
    assert.equal(await skuOwner("rose-2"), "sku-rose");
  });

  it("rejects an update that would take another product's sku", async () => {
    const second = resultOf(await createProduct(event("/products", { ...productBody, name: "Kept Lily", sku: "Lily-1", inventory: 4 })));
    assert.equal(second.statusCode, 201);
    const conflict = resultOf(await updateProduct(event("/products/kept-lily", { sku: "Rose-2" }, "kept-lily")));
    assert.equal(conflict.statusCode, 409);
    const stored = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#kept-lily", SK: "META" } })
    );
    assert.equal(stored.Item?.sku, "Lily-1");
    assert.equal(stored.Item?.inventory, 4);
    assert.equal(await skuOwner("rose-2"), "sku-rose");
  });

  it("releases the sku on delete and lets one of two concurrent creates win", async () => {
    const removed = resultOf(await deleteProduct(event("/products/sku-rose", {}, "sku-rose")));
    assert.equal(removed.statusCode, 200);
    assert.equal(await skuOwner("rose-2"), undefined);
    const [first, second] = await Promise.all([
      createProduct(event("/products", { ...productBody, name: "Race One", sku: "Race-1" })),
      createProduct(event("/products", { ...productBody, name: "Race Two", sku: "RACE-1" })),
    ]);
    const results = [resultOf(first), resultOf(second)];
    assert.equal(results.filter((result) => result.statusCode === 201).length, 1);
    assert.equal(results.filter((result) => result.statusCode === 409).length, 1);
    assert.equal(await skuOwner("race-1") != null, true);
  });

  it("does not overwrite an existing bulk row or reserve a duplicate sku", async () => {
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: { PK: "PRODUCT#kept-bulk", SK: "META", slug: "kept-bulk", name: "Kept", inventory: 3, sku: "kept-bulk" },
      })
    );
    const bulk = resultOf(
      await bulkUploadProducts(
        event("/products/bulk", {
          rows: [
            { name: "Kept Bulk", description: "x", price: 5, categorySlug: "flowers", sku: "new-kept" },
            { name: "Fresh Bulk", description: "x", price: 5, categorySlug: "flowers", sku: "Lily-1" },
            { name: "Open Bulk", description: "x", price: 5, categorySlug: "flowers", sku: "Open-1" },
          ],
        })
      )
    );
    assert.equal(bulk.statusCode, 200);
    assert.equal(bulk.body.created, 1);
    const kept = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#kept-bulk", SK: "META" } })
    );
    assert.equal(kept.Item?.inventory, 3);
    assert.equal(await skuOwner("new-kept"), undefined);
    assert.equal(await skuOwner("open-1"), "open-bulk");
  });
});
