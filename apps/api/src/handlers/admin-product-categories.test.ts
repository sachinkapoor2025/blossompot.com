import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-admin-categories-test";
process.env.PRODUCTS_TABLE = "blossompot-products-admin-categories-test";
process.env.CARTS_TABLE = "blossompot-carts-admin-categories-test";
process.env.ORDERS_TABLE = "blossompot-orders-admin-categories-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let updateProduct: Handler;
let createProduct: Handler;
let docClient: { send: (command: unknown) => Promise<unknown> };
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
  updateProduct = products.updateProduct;
  createProduct = products.createProduct;
  await putCategory("phase3-flowers", "Flowers");
  await putCategory("phase3-cakes", "Cakes");
  await putCategory("phase3-anniversary", "Anniversary Gifts");
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

async function putCategory(slug: string, name: string) {
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: {
        PK: categoryKeys.pk(slug),
        SK: categoryKeys.sk(),
        slug,
        name,
        description: name,
        published: true,
      },
    })
  );
}

function productRow(slug: string, extra: Record<string, unknown> = {}) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    slug,
    name: "Kept name",
    description: "Kept description",
    price: 22,
    currency: "USD",
    categorySlug: "phase3-flowers",
    additionalCategorySlugs: ["phase3-anniversary"],
    images: ["https://cdn.example.com/rose.jpg"],
    inventory: 6,
    sku: `${slug}-sku`,
    vendorSlug: "fnp",
    tags: ["fnp-usa-import"],
    published: true,
    updatedAt: "2026-10-14T00:00:00.000Z",
    createdAt: "2026-10-14T00:00:00.000Z",
    ...extra,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

async function stored(slug: string): Promise<Record<string, unknown>> {
  const result = (await docClient.send(
    new GetCommand({
      TableName: productsTable,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  )) as { Item?: Record<string, unknown> };
  if (!result.Item) throw new Error(`Missing ${slug}`);
  return result.Item;
}

function update(slug: string, body: Record<string, unknown>) {
  return updateProduct({
    ...admin,
    body: JSON.stringify(body),
    pathParameters: { slug },
  } as unknown as APIGatewayProxyEventV2);
}

function create(body: Record<string, unknown>, token = admin.headers.authorization) {
  return createProduct({
    headers: { authorization: token },
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2);
}

describe("admin product categories", () => {
  it("rejects a create without a primary category and an unknown primary category", async () => {
    const missing = resultOf(
      await create({ name: "No Category", description: "Rose", price: 18 })
    );
    assert.equal(missing.statusCode, 400);

    const unknown = resultOf(
      await create({
        name: "Unknown Category",
        description: "Rose",
        price: 18,
        categorySlug: "not-a-category",
      })
    );
    assert.equal(unknown.statusCode, 400);
    assert.match(String(unknown.body.error), /not-a-category/);
  });

  it("creates a product with a primary category and additional categories", async () => {
    const saved = resultOf(
      await create({
        name: "Phase Three Rose",
        description: "Rose",
        price: 18,
        inventory: 4,
        sku: "phase3-rose-sku",
        published: false,
        categorySlug: "phase3-flowers",
        additionalCategorySlugs: ["phase3-flowers", "phase3-cakes", "phase3-cakes"],
      })
    );
    assert.equal(saved.statusCode, 201);
    const product = (saved.body.product ?? {}) as Record<string, unknown>;
    assert.equal(product.categorySlug, "phase3-flowers");
    assert.deepEqual(product.additionalCategorySlugs, ["phase3-cakes"]);
    assert.equal(product.price, 18);
    assert.equal(product.inventory, 4);
    assert.equal(product.published, false);
  });

  it("loads and replaces additional categories without changing unrelated fields", async () => {
    await putProduct(productRow("phase3-edit"));
    const before = await stored("phase3-edit");
    assert.deepEqual(before.additionalCategorySlugs, ["phase3-anniversary"]);

    const saved = resultOf(
      await update("phase3-edit", {
        categorySlug: "phase3-cakes",
        additionalCategorySlugs: ["phase3-cakes", "phase3-flowers"],
      })
    );
    assert.equal(saved.statusCode, 200);
    const item = await stored("phase3-edit");
    assert.equal(item.categorySlug, "phase3-cakes");
    assert.deepEqual(item.additionalCategorySlugs, ["phase3-flowers"]);
    assert.equal(item.name, "Kept name");
    assert.equal(item.price, 22);
    assert.equal(item.inventory, 6);
    assert.equal(item.sku, "phase3-edit-sku");
    assert.equal(item.vendorSlug, "fnp");
    assert.deepEqual(item.tags, ["fnp-usa-import"]);
    assert.equal(item.published, true);
    assert.deepEqual(item.images, ["https://cdn.example.com/rose.jpg"]);
  });

  it("rejects an invalid additional category and leaves the product unchanged", async () => {
    await putProduct(productRow("phase3-invalid"));
    const denied = resultOf(
      await update("phase3-invalid", {
        categorySlug: "phase3-flowers",
        additionalCategorySlugs: ["missing-category"],
      })
    );
    assert.equal(denied.statusCode, 400);
    const item = await stored("phase3-invalid");
    assert.equal(item.categorySlug, "phase3-flowers");
    assert.deepEqual(item.additionalCategorySlugs, ["phase3-anniversary"]);
    assert.equal(item.vendorSlug, "fnp");
    assert.equal(item.published, true);
  });

  it("keeps stored categories when an edit does not send them", async () => {
    await putProduct(productRow("phase3-stock"));
    const saved = resultOf(await update("phase3-stock", { inventory: 2 }));
    assert.equal(saved.statusCode, 200);
    const item = await stored("phase3-stock");
    assert.equal(item.inventory, 2);
    assert.equal(item.categorySlug, "phase3-flowers");
    assert.deepEqual(item.additionalCategorySlugs, ["phase3-anniversary"]);
  });

  it("does not let a shopper create a product", async () => {
    const denied = resultOf(
      await create(
        {
          name: "Shopper Rose",
          description: "Rose",
          price: 18,
          categorySlug: "phase3-flowers",
        },
        "Bearer dev:shopper@blossompot.test:customer"
      )
    );
    assert.equal(denied.statusCode, 403);
  });
});
