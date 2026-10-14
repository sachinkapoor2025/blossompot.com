import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  DEFAULT_PACKAGE,
  estimatePackageFromItems,
  packageDetailsSchema,
  productHasShippingDims,
  type ProductShippingDims,
} from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-admin-edit-dims-test";
process.env.PRODUCTS_TABLE = "blossompot-products-admin-edit-dims-test";
process.env.CARTS_TABLE = "blossompot-carts-admin-edit-dims-test";
process.env.ORDERS_TABLE = "blossompot-orders-admin-edit-dims-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let updateProduct: Handler;
let createProduct: Handler;
let listProductsMissingDims: Handler;
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
  updateProduct = products.updateProduct;
  createProduct = products.createProduct;
  const shipping = await import("./shipping");
  listProductsMissingDims = shipping.listProductsMissingDims;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
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
    rawPath: `/products/${slug}`,
  } as unknown as APIGatewayProxyEventV2);
}

function create(body: Record<string, unknown>) {
  return createProduct({
    ...admin,
    body: JSON.stringify(body),
    rawPath: "/products",
  } as unknown as APIGatewayProxyEventV2);
}

function shippingDims(item: Record<string, unknown>): ProductShippingDims {
  const num = (value: unknown) => (typeof value === "number" ? value : undefined);
  return {
    weightOz: num(item.weightOz),
    lengthIn: num(item.lengthIn),
    widthIn: num(item.widthIn),
    heightIn: num(item.heightIn),
  };
}

function assertNoFabricatedDims(item: Record<string, unknown>) {
  assert.equal(item.weightOz, undefined);
  assert.equal(item.lengthIn, undefined);
  assert.equal(item.widthIn, undefined);
  assert.equal(item.heightIn, undefined);
  assert.equal(productHasShippingDims(shippingDims(item)), false);
}

describe("existing product edits do not require shipping dimensions", { concurrency: false }, () => {
  it("saves a description-only update when dimensions are missing", async () => {
    await putProduct(row("edit-dims-description"));
    const saved = resultOf(await update("edit-dims-description", { description: "Fresh copy" }));
    assert.equal(saved.statusCode, 200);
    const item = await stored("edit-dims-description");
    assert.equal(item.description, "Fresh copy");
    assert.equal(item.name, "edit-dims-description");
    assertNoFabricatedDims(item);
  });

  it("saves an inventory update when dimensions are missing", async () => {
    await putProduct(row("edit-dims-stock", { inventory: 8 }));
    const saved = resultOf(await update("edit-dims-stock", { inventory: 3 }));
    assert.equal(saved.statusCode, 200);
    const item = await stored("edit-dims-stock");
    assert.equal(item.inventory, 3);
    assert.equal(item.description, "Catalog row");
    assertNoFabricatedDims(item);
  });

  it("changes publication without requiring dimensions", async () => {
    await putProduct(row("edit-dims-publish", { published: true }));
    const hidden = resultOf(await update("edit-dims-publish", { published: false }));
    assert.equal(hidden.statusCode, 200);
    const item = await stored("edit-dims-publish");
    assert.equal(item.published, false);
    assertNoFabricatedDims(item);

    const shown = resultOf(await update("edit-dims-publish", { published: true }));
    assert.equal(shown.statusCode, 200);
    assert.equal((await stored("edit-dims-publish")).published, true);
  });

  it("keeps stored dimensions when an edit does not send them", async () => {
    await putProduct(
      row("edit-dims-keep", { weightOz: 16, lengthIn: 10, widthIn: 8, heightIn: 4 })
    );
    const saved = resultOf(await update("edit-dims-keep", { description: "Same box" }));
    assert.equal(saved.statusCode, 200);
    const item = await stored("edit-dims-keep");
    assert.equal(item.description, "Same box");
    assert.equal(item.weightOz, 16);
    assert.equal(item.lengthIn, 10);
    assert.equal(item.widthIn, 8);
    assert.equal(item.heightIn, 4);
  });

  it("rejects supplied dimensions that are not positive numbers", async () => {
    await putProduct(row("edit-dims-invalid", { description: "Keep me", published: true }));
    for (const weightOz of [0, -1, "heavy"]) {
      const rejected = resultOf(await update("edit-dims-invalid", { weightOz, description: "Changed" }));
      assert.equal(rejected.statusCode, 400);
    }
    const item = await stored("edit-dims-invalid");
    assert.equal(item.description, "Keep me");
    assert.equal(item.published, true);
    assertNoFabricatedDims(item);
  });

  it("still requires name, price, and category when creating a product", async () => {
    const missingName = resultOf(await create({ price: 12, categorySlug: "flowers" }));
    const missingPrice = resultOf(await create({ name: "Edit Dims Nameless Price", categorySlug: "flowers" }));
    const missingCategory = resultOf(await create({ name: "Edit Dims Nameless Category", price: 12 }));
    assert.equal(missingName.statusCode, 400);
    assert.equal(missingPrice.statusCode, 400);
    assert.equal(missingCategory.statusCode, 400);

    const created = resultOf(
      await create({
        name: "Edit Dims Created Rose",
        description: "New",
        price: 18,
        categorySlug: "flowers",
      })
    );
    assert.equal(created.statusCode, 201);
    const item = await stored("edit-dims-created-rose");
    assert.equal(item.name, "Edit Dims Created Rose");
    assert.equal(item.price, 18);
    assert.equal(item.categorySlug, "flowers");
    assertNoFabricatedDims(item);
  });

  it("still flags products that lack shipping dimensions", async () => {
    await putProduct(
      row("edit-dims-warned", { name: "Needs a box" })
    );
    await putProduct(
      row("edit-dims-ready", {
        name: "Ready box",
        weightOz: 8,
        lengthIn: 8,
        widthIn: 6,
        heightIn: 2,
      })
    );

    const report = resultOf(
      await listProductsMissingDims({ ...admin, rawPath: "/admin/shipping/products-missing-dims" } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(report.statusCode, 200);
    const products = report.body.products as Array<{ slug: string }>;
    assert.equal(products.some((product) => product.slug === "edit-dims-warned"), true);
    assert.equal(products.some((product) => product.slug === "edit-dims-ready"), false);
    assert.equal(productHasShippingDims(shippingDims(await stored("edit-dims-warned"))), false);
    assert.equal(productHasShippingDims(shippingDims(await stored("edit-dims-ready"))), true);

    const quoted = estimatePackageFromItems([{ quantity: 1 }]);
    assert.deepEqual(quoted, DEFAULT_PACKAGE);
    assert.equal(packageDetailsSchema.safeParse({}).success, false);
  });
});
