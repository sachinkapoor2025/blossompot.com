import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { Order } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.USE_LOCAL_UPLOADS = "true";
process.env.CONFIG_TABLE = "blossompot-config-commerce-cache-test";
process.env.PRODUCTS_TABLE = "blossompot-products-commerce-cache-test";
process.env.CARTS_TABLE = "blossompot-carts-commerce-cache-test";
process.env.ORDERS_TABLE = "blossompot-orders-commerce-cache-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let getProduct: Handler;
let listAdminProducts: Handler;
let commitProductImport: Handler;
let setProductImportImageProbe: (probe: (url: string) => Promise<{ ok: boolean; detail: string }>) => void;
let vendorUpsertProduct: Handler;
let adminApproveVendorProduct: Handler;
let attachImageToProduct: Handler;
let deleteImageFromProduct: Handler;
let decrementInventoryForOrder: (order: Order) => Promise<void>;
let invalidateProductListCache: () => void;
let putVendorSession: (session: {
  token: string;
  vendorId: string;
  vendorSlug: string;
  email: string;
  expiresAt: string;
}) => Promise<void>;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productKeys: {
  pk: (slug: string) => string;
  sk: () => string;
  gsi1pk: (category: string) => string;
  gsi1sk: (slug: string) => string;
};
let productsTable: string;
let configTable: string;

const admin = { headers: { authorization: "Bearer dev:admin@blossompot.test:admin" } };
const FIRST_IMAGE = "https://cdn.example.com/commerce-rose.jpg";
const SECOND_IMAGE = "https://cdn.example.com/commerce-rose-side.jpg";

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  configTable = db.CONFIG_TABLE;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  getProduct = products.getProduct;
  listAdminProducts = products.listAdminProducts;
  const productImport = await import("./product-import");
  commitProductImport = productImport.commitProductImport;
  setProductImportImageProbe = productImport.setProductImportImageProbe;
  setProductImportImageProbe(async (url) =>
    url.startsWith("https://cdn.example.com/") ? { ok: true, detail: "HTTP 200" } : { ok: false, detail: "HTTP 404" }
  );
  const vendors = await import("./marketplace-vendors");
  vendorUpsertProduct = vendors.vendorUpsertProduct;
  adminApproveVendorProduct = vendors.adminApproveVendorProduct;
  const uploads = await import("./uploads");
  attachImageToProduct = uploads.attachImageToProduct;
  deleteImageFromProduct = uploads.deleteImageFromProduct;
  const inventory = await import("../lib/inventory");
  decrementInventoryForOrder = inventory.decrementInventoryForOrder;
  invalidateProductListCache = products.invalidateProductListCache;
  const vendorAuth = await import("../lib/vendor-auth");
  putVendorSession = vendorAuth.putVendorSession;
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: { PK: "CATEGORY#flowers", SK: "META", slug: "flowers", name: "Flowers" },
    })
  );
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
        deliveryCountries: ["US"],
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
        countries: [{ countryCode: "US", enabled: true }],
        updatedAt: "2026-10-09T00:00:00.000Z",
      },
    })
  );
  await drainBundledPersist();
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function shop(partial: Record<string, unknown> = {}): APIGatewayProxyEventV2 {
  return {
    headers: { "x-session-id": "commerce-cache-shopper" },
    requestContext: { http: { method: "GET", path: "/products" } },
    queryStringParameters: { country: "US", postalCode: "92612" },
    ...partial,
  } as unknown as APIGatewayProxyEventV2;
}

function row(slug: string, extra: Record<string, unknown> = {}) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk("flowers"),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: slug,
    description: "cached description",
    price: 20,
    currency: "USD",
    categorySlug: "flowers",
    images: [FIRST_IMAGE],
    inventory: 6,
    published: true,
    couponExcluded: true,
    tags: [],
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
    ...extra,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

function listed(body: Record<string, unknown>, slug: string): Record<string, unknown> | undefined {
  const products = (body.products as Array<Record<string, unknown>> | undefined) ?? [];
  return products.find((product) => product.slug === slug);
}

async function shopList(category?: string) {
  return resultOf(
    await listProducts(
      shop({
        queryStringParameters: {
          country: "US",
          postalCode: "92612",
          ...(category ? { category } : {}),
        },
      })
    )
  );
}

async function drainBundledPersist() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(" "));
      original.apply(console, args);
    };
    try {
      await shopList();
      await shopList("flowers");
    } finally {
      console.log = original;
    }
    if (!logs.some((line) => line.startsWith("upserted "))) return;
  }
  throw new Error("Bundled catalog persist did not finish");
}

async function detail(slug: string) {
  return resultOf(
    await getProduct(
      shop({
        pathParameters: { slug },
        queryStringParameters: { country: "US", postalCode: "92612" },
      })
    )
  );
}

describe("cached catalog commerce fields", { concurrency: false }, () => {
  it("refreshes price, publication, and stock on list and detail without replacing the cached body", async () => {
    await putProduct(row("commerce-rose"));
    invalidateProductListCache();
    await shopList();
    await shopList("flowers");
    const warmed = await detail("commerce-rose");
    assert.equal(warmed.statusCode, 200);
    assert.equal((warmed.body.product as { price?: number }).price, 20);
    assert.equal((warmed.body.product as { description?: string }).description, "cached description");

    await putProduct(row("commerce-rose", { price: 55, description: "database description" }));
    const priced = listed((await shopList()).body, "commerce-rose");
    const pricedCategory = listed((await shopList("flowers")).body, "commerce-rose");
    const pricedDetail = await detail("commerce-rose");
    assert.equal(priced?.price, 55);
    assert.equal(priced?.description, "cached description");
    assert.equal(pricedCategory?.price, 55);
    assert.equal(pricedCategory?.description, "cached description");
    assert.equal((pricedDetail.body.product as { price?: number }).price, 55);
    assert.equal((pricedDetail.body.product as { description?: string }).description, "cached description");

    await putProduct(row("commerce-rose", { price: 55, inventory: 0, description: "database description" }));
    assert.equal(listed((await shopList()).body, "commerce-rose"), undefined);
    assert.equal(listed((await shopList("flowers")).body, "commerce-rose"), undefined);
    const soldOut = await detail("commerce-rose");
    assert.equal(soldOut.statusCode, 200);
    assert.equal((soldOut.body.product as { inventory?: number }).inventory, 0);
    assert.equal((soldOut.body.product as { description?: string }).description, "cached description");

    await putProduct(row("commerce-rose", { price: 55, inventory: 4, description: "database description" }));
    assert.equal(listed((await shopList()).body, "commerce-rose")?.inventory, 4);
    assert.equal(listed((await shopList("flowers")).body, "commerce-rose")?.inventory, 4);
    const restocked = await detail("commerce-rose");
    assert.equal((restocked.body.product as { inventory?: number }).inventory, 4);

    await putProduct(row("commerce-rose", { price: 55, inventory: 4, published: false, description: "database description" }));
    assert.equal(listed((await shopList()).body, "commerce-rose"), undefined);
    assert.equal((await detail("commerce-rose")).statusCode, 404);

    await putProduct(row("commerce-rose", { price: 55, inventory: 4, published: true, description: "database description" }));
    const republished = listed((await shopList()).body, "commerce-rose");
    assert.equal(republished?.price, 55);
    assert.equal(republished?.description, "cached description");
    assert.equal(listed((await shopList("flowers")).body, "commerce-rose")?.slug, "commerce-rose");
    assert.equal((await detail("commerce-rose")).statusCode, 200);
  });
});

describe("product cache invalidation on writers that previously skipped it", { concurrency: false }, () => {
  it("clears the product cache after a paid-order stock decrement", async () => {
    await putProduct(row("stock-rose", { description: "cached stock copy", lowStockAlertSentAt: "2026-10-01T00:00:00.000Z" }));
    assert.equal((await detail("stock-rose")).statusCode, 200);
    await putProduct(
      row("stock-rose", {
        description: "database stock copy",
        lowStockAlertSentAt: "2026-10-01T00:00:00.000Z",
      })
    );
    await decrementInventoryForOrder({
      items: [{ productSlug: "stock-rose", quantity: 1, name: "Stock rose", price: 20 }],
    } as Order);
    const fresh = await detail("stock-rose");
    assert.equal((fresh.body.product as { description?: string }).description, "database stock copy");
  });

  it("clears the product cache after a catalog import commit", async () => {
    await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2);
    await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2);
    const commit = resultOf(
      await commitProductImport({
        ...admin,
        body: JSON.stringify({
          vendorSlug: "fnp",
          deliveryCountries: ["US"],
          rows: [
            {
              name: "Commerce Cache Import Rose",
              description: "Imported rose",
              sku: "commerce-cache-import",
              price: 24,
              currency: "USD",
              categorySlug: "flowers",
              imageUrls: FIRST_IMAGE,
            },
          ],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(commit.statusCode, 201);
    const slug = String((commit.body.products as Array<{ slug?: string }>)[0]?.slug ?? "");
    assert.ok(slug);
    const adminList = resultOf(
      await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2)
    );
    assert.ok(listed(adminList.body, slug));
  });

  it("clears the product cache after vendor upsert and approval", async () => {
    await putVendorSession({
      token: "vendor-cache-token",
      vendorId: "vendor-cache",
      vendorSlug: "local-shop",
      email: "vendor@example.com",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const vendorHeaders = { authorization: "Bearer vendor-cache-token" };
    const upsertBody = {
      name: "Cache Rose",
      description: "vendor cached copy",
      vendorCost: 8,
      categorySlug: "flowers",
      images: [FIRST_IMAGE],
      inventory: 5,
      submitForApproval: false,
    };
    const created = resultOf(
      await vendorUpsertProduct({
        headers: vendorHeaders,
        body: JSON.stringify(upsertBody),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(created.statusCode, 201);
    await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2);
    const updated = resultOf(
      await vendorUpsertProduct({
        headers: vendorHeaders,
        body: JSON.stringify({ ...upsertBody, description: "vendor fresh copy" }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(updated.statusCode, 201);
    const afterUpsert = resultOf(
      await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(listed(afterUpsert.body, "local-shop-cache-rose")?.description, "vendor fresh copy");

    await putProduct(
      row("stall-rose", {
        vendorSlug: "stall-shop",
        published: false,
        price: 10,
        seoTitle: "cached title",
        description: "cached description",
      })
    );
    invalidateProductListCache();
    await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2);
    const approved = resultOf(
      await adminApproveVendorProduct({
        ...admin,
        pathParameters: { slug: "stall-rose" },
        body: JSON.stringify({ approvalStatus: "approved", sellPrice: 44, seoTitle: "Approved rose title" }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(approved.statusCode, 200);
    const live = listed(
      resultOf(
        await listAdminProducts({ ...admin, queryStringParameters: { sample: "all" } } as unknown as APIGatewayProxyEventV2)
      ).body,
      "stall-rose"
    );
    assert.equal(live?.price, 44);
    assert.equal(live?.seoTitle, "Approved rose title");
    assert.equal(live?.description, "cached description");
  });

  it("clears the product cache after a gallery image is added or removed", async () => {
    await putProduct(row("gallery-rose", { images: [FIRST_IMAGE], description: "cached description" }));
    const warmed = await detail("gallery-rose");
    assert.deepEqual((warmed.body.product as { images?: string[] }).images, [FIRST_IMAGE]);
    const added = resultOf(
      await attachImageToProduct({
        ...admin,
        pathParameters: { slug: "gallery-rose" },
        body: JSON.stringify({ imageUrl: SECOND_IMAGE }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(added.statusCode, 200);
    const withSide = await detail("gallery-rose");
    assert.deepEqual((withSide.body.product as { images?: string[] }).images, [FIRST_IMAGE, SECOND_IMAGE]);
    const removed = resultOf(
      await deleteImageFromProduct({
        ...admin,
        pathParameters: { slug: "gallery-rose" },
        body: JSON.stringify({ imageUrl: SECOND_IMAGE }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(removed.statusCode, 200);
    const withoutSide = await detail("gallery-rose");
    assert.deepEqual((withoutSide.body.product as { images?: string[] }).images, [FIRST_IMAGE]);
  });
});
