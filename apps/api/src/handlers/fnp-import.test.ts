import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "dev";
process.env.PRODUCTS_TABLE = "blossompot-products-dev";
process.env.DEV_AUTH_ENABLED = "true";
process.env.UPLOAD_BUCKET = "blossompot-dev-uploads";
process.env.FNP_IMPORT_IMAGE_STUB = "https://cdn.example.com/fnp-stub.webp";

function event(
  method: string,
  path: string,
  body?: unknown,
  token = "dev:admin@example.com:admin"
): APIGatewayProxyEventV2 {
  return {
    rawPath: path,
    body: body == null ? undefined : JSON.stringify(body),
    headers: { authorization: `Bearer ${token}` },
    isBase64Encoded: false,
    pathParameters: {},
    requestContext: {
      http: { method, path },
      stage: "$default",
    },
  } as unknown as APIGatewayProxyEventV2;
}

function read(result: APIGatewayProxyResultV2): { status: number; body: Record<string, unknown> } {
  if (typeof result === "string") return { status: 200, body: JSON.parse(result) as Record<string, unknown> };
  return {
    status: result.statusCode ?? 200,
    body: JSON.parse(result.body ?? "{}") as Record<string, unknown>,
  };
}

function cakeRow(overrides: Record<string, unknown> = {}) {
  return {
    "Product Name": "Petite Midnight Chocolate Cake",
    "Final Category": "Combos",
    "List Price ($)": 49.99,
    "MRP ($)": 59.99,
    "Product URL": "https://www.fnp.com/usa/gift/petite-midnight-chocolate-cake",
    "Image URL": "https://static-assets-prod.fnp.com/images/m/petite.jpg",
    ...overrides,
  };
}

describe("FNP import handlers", () => {
  beforeEach(async () => {
    process.env.ENVIRONMENT = "dev";
    process.env.UPLOAD_BUCKET = "blossompot-dev-uploads";
    process.env.FNP_IMPORT_IMAGE_STUB = "https://cdn.example.com/fnp-stub.webp";
    const { clearMemoryStore } = await import("../lib/memory-store");
    clearMemoryStore();
  });

  it("previews without writing and refuses a commit when the environment is production", async () => {
    const { previewFnpImport, commitFnpImport } = await import("./fnp-import");
    const { getMemoryStoreSize } = await import("../lib/memory-store");
    const preview = read(
      await previewFnpImport(event("POST", "/admin/imports/fnp/preview", { rows: [cakeRow()] }))
    );
    assert.equal(preview.status, 200);
    assert.equal(preview.body.writes, false);
    assert.equal(getMemoryStoreSize(), 0);
    const rows = preview.body.rows as Array<{ status: string }>;
    assert.equal(rows[0]?.status, "blocked");

    process.env.ENVIRONMENT = "production";
    const denied = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [{ row: 1, input: cakeRow() }],
        })
      )
    );
    assert.equal(denied.status, 403);
    assert.equal(getMemoryStoreSize(), 0);
    process.env.ENVIRONMENT = "dev";
  });

  it("rejects more than 20 rows and unauthenticated callers", async () => {
    const { commitFnpImport } = await import("./fnp-import");
    const entries = Array.from({ length: 21 }, (_, index) => ({ row: index + 1, input: cakeRow() }));
    const tooMany = read(await commitFnpImport(event("POST", "/admin/imports/fnp/commit", { entries })));
    assert.equal(tooMany.status, 400);
    const guest = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", { entries: [{ row: 1, input: cakeRow() }] }, "nope")
      )
    );
    assert.equal(guest.status, 403);
  });

  it("imports an unpublished product, skips the same FNP URL, and leaves another product unchanged", async () => {
    const { PutCommand, GetCommand } = await import("@aws-sdk/lib-dynamodb");
    const { categoryKeys, productKeys } = await import("@blossompot/shared");
    const { docClient, PRODUCTS_TABLE } = await import("../lib/db");
    const { commitFnpImport, listFnpImports } = await import("./fnp-import");

    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: categoryKeys.pk("cakes"),
          SK: categoryKeys.sk(),
          slug: "cakes",
          name: "Cakes",
          published: true,
          description: "Existing cakes",
        },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: categoryKeys.pk("flowers"),
          SK: categoryKeys.sk(),
          slug: "flowers",
          name: "Flowers",
          published: true,
          description: "Existing flowers",
        },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: productKeys.pk("red-rose-bouquet"),
          SK: productKeys.sk(),
          slug: "red-rose-bouquet",
          name: "Red Rose Bouquet",
          description: "Shop flower",
          price: 42,
          currency: "USD",
          categorySlug: "flowers",
          images: ["https://cdn.example.com/rose.jpg"],
          inventory: 12,
          published: true,
          tags: [],
        },
      })
    );

    const first = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [{ row: 4, input: cakeRow() }],
        })
      )
    );
    assert.equal(first.status, 200);
    const firstRows = first.body.rows as Array<{ outcome: { status: string; productSlug?: string } }>;
    assert.equal(firstRows[0]?.outcome.status, "imported");
    assert.equal(firstRows[0]?.outcome.productSlug, "petite-midnight-chocolate-cake");

    const stored = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("petite-midnight-chocolate-cake"), SK: productKeys.sk() },
      })
    );
    const product = stored.Item as Record<string, unknown>;
    assert.equal(product.sku, "petite-midnight-chocolate-cake");
    assert.equal(product.published, false);
    assert.equal(product.indexable, false);
    assert.equal(product.inventory, 0);
    assert.equal(product.categorySlug, "cakes");
    assert.equal(product.compareAtPrice, 59.99);
    assert.deepEqual(product.images, ["https://cdn.example.com/fnp-stub.webp"]);
    assert.equal(product.sourceUrl, "https://www.fnp.com/usa/gift/petite-midnight-chocolate-cake");

    const cakes = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: categoryKeys.pk("cakes"), SK: categoryKeys.sk() },
      })
    );
    assert.equal(cakes.Item?.name, "Cakes");
    assert.equal(cakes.Item?.published, true);
    assert.equal(cakes.Item?.description, "Existing cakes");

    const second = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [{ row: 4, input: cakeRow({ "List Price ($)": 12 }) }],
        })
      )
    );
    const secondRows = second.body.rows as Array<{ outcome: { status: string } }>;
    assert.equal(secondRows[0]?.outcome.status, "duplicate");
    const reread = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("petite-midnight-chocolate-cake"), SK: productKeys.sk() },
      })
    );
    assert.equal(reread.Item?.price, 49.99);

    const conflict = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [
            {
              row: 9,
              input: cakeRow({
                "Product Name": "Red Rose Bouquet",
                "Final Category": "Flowers",
                "Product URL": "https://www.fnp.com/usa/gift/red-rose-bouquet",
                "List Price ($)": 80,
                "MRP ($)": 80,
              }),
            },
          ],
        })
      )
    );
    const conflictRows = conflict.body.rows as Array<{ outcome: { status: string } }>;
    assert.equal(conflictRows[0]?.outcome.status, "conflict");
    const rose = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("red-rose-bouquet"), SK: productKeys.sk() },
      })
    );
    assert.equal(rose.Item?.price, 42);
    assert.equal(rose.Item?.inventory, 12);
    assert.equal(rose.Item?.published, true);
    assert.equal(rose.Item?.description, "Shop flower");

    const history = read(await listFnpImports(event("GET", "/admin/imports/fnp")));
    assert.equal(history.status, 200);
    assert.ok(Array.isArray(history.body.batches));
    assert.ok((history.body.batches as unknown[]).length >= 1);
  });

  it("creates a missing approved category unpublished and retries an image failure", async () => {
    const { GetCommand } = await import("@aws-sdk/lib-dynamodb");
    const { categoryKeys, productKeys } = await import("@blossompot/shared");
    const { docClient, PRODUCTS_TABLE } = await import("../lib/db");
    const { commitFnpImport, retryFnpImport } = await import("./fnp-import");

    delete process.env.FNP_IMPORT_IMAGE_STUB;
    delete process.env.UPLOAD_BUCKET;
    const combo = cakeRow({
      "Product Name": "Relax N Recharge Rakhi",
      "Final Category": "Combos",
      "Product URL": "https://www.fnp.com/usa/gift/relax-n-recharge-rakhi",
      "MRP ($)": 40,
      "List Price ($)": 40,
    });
    const failed = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [{ row: 2, input: combo }],
        })
      )
    );
    assert.equal(failed.status, 200);
    const failedRows = failed.body.rows as Array<{ outcome: { status: string; message: string } }>;
    assert.equal(failedRows[0]?.outcome.status, "error");
    assert.match(failedRows[0]?.outcome.message ?? "", /S3 image hosting/);
    const missingProduct = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("relax-n-recharge-rakhi"), SK: productKeys.sk() },
      })
    );
    assert.equal(missingProduct.Item, undefined);
    const missingCategory = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: categoryKeys.pk("combos"), SK: categoryKeys.sk() },
      })
    );
    assert.equal(missingCategory.Item, undefined);

    process.env.FNP_IMPORT_IMAGE_STUB = "https://cdn.example.com/fnp-stub.webp";
    process.env.UPLOAD_BUCKET = "blossompot-dev-uploads";
    const retried = read(
      await retryFnpImport(
        event("POST", "/admin/imports/fnp/retry", { batchId: failed.body.batchId })
      )
    );
    assert.equal(retried.status, 200);
    const retriedRows = retried.body.rows as Array<{ outcome: { status: string } }>;
    assert.equal(retriedRows[0]?.outcome.status, "imported");
    const category = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: categoryKeys.pk("combos"), SK: categoryKeys.sk() },
      })
    );
    assert.equal(category.Item?.published, false);
    assert.equal(category.Item?.name, "Combos");
    const product = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("relax-n-recharge-rakhi"), SK: productKeys.sk() },
      })
    );
    assert.equal(product.Item?.published, false);
    assert.equal(product.Item?.categorySlug, "combos");
  });

  it("blocks invalid rows, maps an unmatched category, reuses one image, and skips a second upload", async () => {
    const { previewFnpImport, commitFnpImport } = await import("./fnp-import");
    const { PutCommand, GetCommand } = await import("@aws-sdk/lib-dynamodb");
    const { categoryKeys, importImageKeys, importSourceKeys, productKeys } = await import("@blossompot/shared");
    const { createHash } = await import("node:crypto");
    const { docClient, PRODUCTS_TABLE } = await import("../lib/db");

    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: categoryKeys.pk("flowers"),
          SK: categoryKeys.sk(),
          slug: "flowers",
          name: "Flowers",
          published: true,
        },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: categoryKeys.pk("cakes"),
          SK: categoryKeys.sk(),
          slug: "cakes",
          name: "Cakes",
          published: true,
        },
      })
    );

    const preview = read(
      await previewFnpImport(
        event("POST", "/admin/imports/fnp/preview", {
          rows: [
            cakeRow({ "Product Name": "" }),
            cakeRow({ "List Price ($)": 0, "Product URL": "https://www.fnp.com/usa/gift/zero-price" }),
            cakeRow({ "Image URL": "", "Product URL": "https://www.fnp.com/usa/gift/no-image" }),
            cakeRow({
              "Product Name": "Blue Vase",
              "Final Category": "Desk Plants",
              "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
            }),
          ],
        })
      )
    );
    assert.equal(preview.status, 200);
    const previewRows = preview.body.rows as Array<{ status: string }>;
    assert.equal(previewRows[0]?.status, "blocked");
    assert.equal(previewRows[1]?.status, "blocked");
    assert.equal(previewRows[2]?.status, "blocked");
    assert.equal(previewRows[3]?.status, "blocked");
    assert.deepEqual(preview.body.unmatchedCategories, ["Desk Plants"]);

    const image = "https://static-assets-prod.fnp.com/images/m/shared.jpg";
    const committed = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          categoryOverrides: [{ workbook: "Desk Plants", slug: "flowers", name: "Flowers", create: false }],
          entries: [
            { row: 1, input: cakeRow({ "S. No": 4, "Image URL": image }) },
            {
              row: 2,
              input: cakeRow({
                "Product Name": "Double Chocolate Cake With Personalization",
                "Product URL": "https://www.fnp.com/usa/gift/double-chocolate-cake",
                "Image URL": image,
                "S. No": 5,
              }),
            },
            {
              row: 3,
              input: cakeRow({
                "Product Name": "Blue Vase",
                "Final Category": "Desk Plants",
                "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
                "Image URL": image,
              }),
            },
          ],
        })
      )
    );
    assert.equal(committed.status, 200);
    const outcomes = committed.body.rows as Array<{ outcome: { status: string; productSlug?: string } }>;
    assert.equal(outcomes[0]?.outcome.status, "imported");
    assert.equal(outcomes[1]?.outcome.status, "imported");
    assert.equal(outcomes[2]?.outcome.status, "imported");
    assert.equal(outcomes[2]?.outcome.productSlug, "blue-vase");

    const vase = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("blue-vase"), SK: productKeys.sk() },
      })
    );
    assert.equal(vase.Item?.categorySlug, "flowers");
    assert.equal(vase.Item?.published, false);
    assert.equal(vase.Item?.price, 49.99);

    const digest = createHash("sha256").update(image).digest("hex");
    const pointer = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: importImageKeys.pk(digest), SK: importImageKeys.sk() },
      })
    );
    assert.equal(pointer.Item?.imageUrl, "https://cdn.example.com/fnp-stub.webp");
    assert.equal(pointer.Item?.sourceImageUrl, image);

    const source = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: {
          PK: importSourceKeys.pk("petite-midnight-chocolate-cake"),
          SK: importSourceKeys.sk(),
        },
      })
    );
    assert.equal(source.Item?.sourceSerial, "4");

    const again = read(
      await commitFnpImport(
        event("POST", "/admin/imports/fnp/commit", {
          entries: [{ row: 1, input: cakeRow({ "Image URL": image, "List Price ($)": 12 }) }],
        })
      )
    );
    const againRows = again.body.rows as Array<{ outcome: { status: string } }>;
    assert.equal(againRows[0]?.outcome.status, "duplicate");
    const reread = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("petite-midnight-chocolate-cake"), SK: productKeys.sk() },
      })
    );
    assert.equal(reread.Item?.price, 49.99);
  });
});
