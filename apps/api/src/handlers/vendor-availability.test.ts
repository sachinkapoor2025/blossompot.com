import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.CONFIG_TABLE = "blossompot-config-vendor-avail-test";
process.env.PRODUCTS_TABLE = "blossompot-products-vendor-avail-test";
process.env.CARTS_TABLE = "blossompot-carts-vendor-avail-test";
process.env.ORDERS_TABLE = "blossompot-orders-vendor-avail-test";
process.env.GBO_STOREFRONT_ENABLED = "true";
process.env.ORANGE_COUNTY_VENDOR_API_KEY = "oc-test-key";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let getProduct: Handler;
let createProduct: Handler;
let bulkUploadProducts: Handler;
let addToCart: Handler;
let getCartHandler: Handler;
let checkout: Handler;
let updateCatalogVendorAdmin: Handler;
let listOrangeCountyOrders: Handler;
let docClient: { send: (command: unknown) => Promise<{ Items?: Record<string, unknown>[] }> };
let orderKeys: { pk: (id: string) => string; sk: () => string; gsi2pk: () => string; gsi2sk: (at: string) => string };
let cartKeys: { pk: (id: string) => string; sk: () => string };
let productKeys: { pk: (slug: string) => string; sk: () => string };

const SESSION = "phase4-shopper";

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  const keys = await import("@blossompot/shared");
  orderKeys = keys.orderKeys;
  cartKeys = keys.cartKeys;
  productKeys = keys.productKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  getProduct = products.getProduct;
  createProduct = products.createProduct;
  bulkUploadProducts = products.bulkUploadProducts;
  const cart = await import("./cart");
  addToCart = cart.addToCart;
  getCartHandler = cart.getCartHandler;
  const orders = await import("./orders");
  checkout = orders.checkout;
  const vendors = await import("./catalog-vendors");
  updateCatalogVendorAdmin = vendors.updateCatalogVendorAdmin;
  const vendorOrders = await import("./vendor-orders");
  listOrangeCountyOrders = vendorOrders.listOrangeCountyOrders;

  for (const product of [
    catalogProduct("phase4-owned"),
    catalogProduct("phase4-oc", "orange-county"),
    catalogProduct("phase4-fnp", "fnp"),
    catalogProduct("phase4-fnp-tag", undefined, ["fnp-usa-import"]),
    catalogProduct("phase4-other-tag", undefined, ["birthday"]),
    catalogProduct("phase4-gbo", "gift-baskets-overseas"),
  ]) {
    await docClient.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: product }));
  }
});

function catalogProduct(slug: string, vendorSlug?: string, tags?: string[]) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: "CATEGORY#flowers",
    GSI1SK: slug,
    slug,
    name: slug,
    description: "Phase 4 catalog product",
    price: 24,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://cdn.example.com/phase4.jpg"],
    inventory: 8,
    published: true,
    ...(tags ? { tags } : {}),
    ...(vendorSlug ? { vendorSlug } : {}),
    ...(vendorSlug === "gift-baskets-overseas" ? { internationalDelivery: true, sku: "gbo:US:101" } : {}),
  };
}

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function slugsOf(body: Record<string, unknown>): string[] {
  return ((body.products as Array<{ slug: string }> | undefined) ?? []).map((product) => product.slug);
}

function shopperEvent(partial: Record<string, unknown> = {}): APIGatewayProxyEventV2 {
  return {
    headers: { "x-session-id": SESSION },
    requestContext: { http: { method: "GET", path: "/products" } },
    ...partial,
  } as unknown as APIGatewayProxyEventV2;
}

async function setVendor(vendorSlug: string, enabled: boolean) {
  const updated = resultOf(
    await updateCatalogVendorAdmin({
      headers: { authorization: "Bearer dev:admin@blossompot.test:admin" },
      body: JSON.stringify({ enabled, deliveryCountries: ["US"] }),
      pathParameters: { vendorSlug },
      requestContext: { http: { method: "PUT" } },
    } as unknown as APIGatewayProxyEventV2)
  );
  assert.equal(updated.statusCode, 200);
}

describe("catalog vendor availability for new shopping", { concurrency: false }, () => {
  it("lists an enabled vendor product and hides it when that vendor is disabled", async () => {
    await setVendor("orange-county", true);
    const nationwide = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(nationwide.statusCode, 200);
    assert.equal(slugsOf(nationwide.body).includes("phase4-oc"), false);
    assert.equal(slugsOf(nationwide.body).includes("phase4-owned"), true);
    const open = resultOf(
      await listProducts(shopperEvent({ queryStringParameters: { country: "US", postalCode: "92612" } }))
    );
    assert.equal(open.statusCode, 200);
    assert.equal(slugsOf(open.body).includes("phase4-oc"), true);
    assert.equal(slugsOf(open.body).includes("phase4-owned"), true);

    await setVendor("orange-county", false);
    const closed = resultOf(
      await listProducts(shopperEvent({ queryStringParameters: { country: "US", postalCode: "92612" } }))
    );
    assert.equal(slugsOf(closed.body).includes("phase4-oc"), false);
    assert.equal(slugsOf(closed.body).includes("phase4-owned"), true);
    await setVendor("orange-county", true);
  });

  it("re-checks a cached product after the vendor is disabled and again after it is re-enabled", async () => {
    await setVendor("fnp", true);
    const first = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-fnp" } })));
    assert.equal(first.statusCode, 200);

    await setVendor("fnp", false);
    const hidden = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-fnp" } })));
    assert.equal(hidden.statusCode, 404);

    await setVendor("fnp", true);
    const restored = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-fnp" } })));
    assert.equal(restored.statusCode, 200);
  });

  it("rejects a new add and a new order for a disabled vendor without dropping the existing cart line or writing an order", async () => {
    await setVendor("orange-county", true);
    const added = resultOf(
      await addToCart(
        shopperEvent({
          body: JSON.stringify({ productSlug: "phase4-oc", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(added.statusCode, 200);

    await setVendor("orange-county", false);
    const rejectedAdd = resultOf(
      await addToCart(
        shopperEvent({
          body: JSON.stringify({ productSlug: "phase4-oc", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rejectedAdd.statusCode, 400);
    assert.equal(typeof rejectedAdd.body.error, "string");

    const cart = resultOf(await getCartHandler(shopperEvent()));
    const items = (cart.body.cart as { items: Array<{ productSlug: string }> }).items;
    assert.equal(items.some((item) => item.productSlug === "phase4-oc"), true);

    const rejectedOrder = resultOf(
      await checkout(
        shopperEvent({
          body: JSON.stringify({
            paymentMethod: "stripe",
            shippingAddress: {
              name: "A Recipient",
              line1: "1 Main",
              city: "Irvine",
              state: "CA",
              postalCode: "92612",
              country: "US",
              phone: "+1 408 555 0100",
              email: "shopper@blossompot.test",
              senderName: "A Sender",
              senderMessage: "Thinking of you today",
            },
          }),
          requestContext: { http: { method: "POST", path: "/checkout" } },
        })
      )
    );
    assert.equal(rejectedOrder.statusCode, 400);
    const orders = await docClient.send(
      new ScanCommand({
        TableName: process.env.ORDERS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "ORDER#", ":sk": "META" },
      })
    );
    assert.equal((orders.Items ?? []).length, 0);
    await setVendor("orange-county", true);
  });

  it("keeps an existing Orange County order visible to the vendor feed after the vendor is disabled", async () => {
    const createdAt = new Date().toISOString();
    const orderId = "phase4-existing-oc";
    await docClient.send(
      new PutCommand({
        TableName: process.env.ORDERS_TABLE,
        Item: {
          PK: orderKeys.pk(orderId),
          SK: orderKeys.sk(),
          GSI2PK: orderKeys.gsi2pk(),
          GSI2SK: orderKeys.gsi2sk(createdAt),
          orderId,
          orderNumber: "OC10001",
          status: "paid",
          createdAt,
          updatedAt: createdAt,
          vendorSlugs: ["orange-county"],
          items: [
            {
              productSlug: "phase4-oc",
              name: "phase4-oc",
              price: 24,
              currency: "USD",
              quantity: 1,
              vendorSlug: "orange-county",
            },
          ],
          shippingAddress: {
            name: "A Recipient",
            line1: "1 Main",
            city: "Irvine",
            state: "CA",
            postalCode: "92612",
            country: "US",
            phone: "+1 408 555 0100",
            email: "shopper@blossompot.test",
          },
        },
      })
    );
    await setVendor("orange-county", false);
    const feed = resultOf(
      await listOrangeCountyOrders({
        headers: { "x-vendor-api-key": "oc-test-key" },
        queryStringParameters: { days: "15" },
        requestContext: { http: { method: "GET" } },
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(feed.statusCode, 200);
    const orders = feed.body.orders as Array<{ internalOrderId?: string; orderNumber?: string }>;
    assert.equal(
      orders.some((order) => order.internalOrderId === orderId || order.orderNumber === "OC10001"),
      true
    );
    await setVendor("orange-county", true);
  });

  it("applies both GBO controls", async () => {
    await setVendor("gift-baskets-overseas", true);
    process.env.GBO_STOREFRONT_ENABLED = "true";
    const open = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(open.body).includes("phase4-gbo"), true);

    await setVendor("gift-baskets-overseas", false);
    const catalogOff = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(catalogOff.body).includes("phase4-gbo"), false);

    await setVendor("gift-baskets-overseas", true);
    process.env.GBO_STOREFRONT_ENABLED = "false";
    const envOff = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(envOff.body).includes("phase4-gbo"), false);
    const hidden = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-gbo" } })));
    assert.equal(hidden.statusCode, 404);
    process.env.GBO_STOREFRONT_ENABLED = "true";
  });

  it("keeps a product with no vendor slug available and still recognizes FNP", async () => {
    await setVendor("blossompot", true);
    await setVendor("fnp", true);
    const listed = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(listed.body).includes("phase4-owned"), true);
    assert.equal(slugsOf(listed.body).includes("phase4-fnp"), true);

    await setVendor("fnp", false);
    const fnpOff = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(fnpOff.body).includes("phase4-owned"), true);
    assert.equal(slugsOf(fnpOff.body).includes("phase4-other-tag"), true);
    assert.equal(slugsOf(fnpOff.body).includes("phase4-fnp"), false);
    assert.equal(slugsOf(fnpOff.body).includes("phase4-fnp-tag"), false);
    const hiddenTag = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-fnp-tag" } })));
    assert.equal(hiddenTag.statusCode, 404);
    const beforeBundled = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": "perfectly-pastel-premium" },
      })
    );
    const bundledHidden = resultOf(
      await getProduct(shopperEvent({ pathParameters: { slug: "perfectly-pastel-premium" } }))
    );
    assert.equal(bundledHidden.statusCode, 404);
    assert.equal(slugsOf(fnpOff.body).includes("perfectly-pastel-premium"), false);
    const afterBundled = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": "perfectly-pastel-premium" },
      })
    );
    assert.equal((afterBundled.Items ?? []).length, (beforeBundled.Items ?? []).length);
    const added = resultOf(
      await addToCart(
        shopperEvent({
          body: JSON.stringify({ productSlug: "phase4-fnp-tag", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(added.statusCode, 400);
    const beforeOrders = await docClient.send(
      new ScanCommand({
        TableName: process.env.ORDERS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "ORDER#", ":sk": "META" },
      })
    );
    await setVendor("fnp", true);
    const taggedAdd = resultOf(
      await addToCart(
        shopperEvent({
          body: JSON.stringify({ productSlug: "phase4-fnp-tag", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(taggedAdd.statusCode, 200);
    await setVendor("fnp", false);
    const kept = resultOf(await getCartHandler(shopperEvent({ queryStringParameters: { country: "US" } })));
    const keptItems = (kept.body.cart as { items: Array<{ productSlug: string; vendorSlug?: string }> }).items;
    const taggedLine = keptItems.find((item) => item.productSlug === "phase4-fnp-tag");
    assert.ok(taggedLine);
    assert.equal(taggedLine.vendorSlug, undefined);
    const rejectedOrder = resultOf(
      await checkout(
        shopperEvent({
          body: JSON.stringify({
            paymentMethod: "stripe",
            shippingAddress: {
              name: "A Recipient",
              line1: "1 Main",
              city: "Irvine",
              state: "CA",
              postalCode: "92612",
              country: "US",
              phone: "+1 408 555 0100",
              email: "shopper@blossompot.test",
              senderName: "A Sender",
              senderMessage: "Thinking of you today",
            },
          }),
          requestContext: { http: { method: "POST", path: "/checkout" } },
        })
      )
    );
    assert.equal(rejectedOrder.statusCode, 400);
    const afterOrders = await docClient.send(
      new ScanCommand({
        TableName: process.env.ORDERS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "ORDER#", ":sk": "META" },
      })
    );
    assert.equal((afterOrders.Items ?? []).length, (beforeOrders.Items ?? []).length);
    const stillThere = resultOf(await getCartHandler(shopperEvent()));
    assert.equal(
      ((stillThere.body.cart as { items: Array<{ productSlug: string }> }).items ?? []).some(
        (item) => item.productSlug === "phase4-fnp-tag"
      ),
      true
    );
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("perfectly-pastel-premium"), SK: productKeys.sk() },
      })
    );
    const bundledAdd = resultOf(
      await addToCart(
        shopperEvent({
          body: JSON.stringify({ productSlug: "perfectly-pastel-premium", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(bundledAdd.statusCode, 400);
    const bundledRow = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": "perfectly-pastel-premium" },
      })
    );
    assert.equal((bundledRow.Items ?? []).length, 0);
    await setVendor("fnp", true);
    const restored = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(restored.body).includes("phase4-fnp-tag"), true);
  });

  it("keeps USA shopping and Orange County ZIP limits", async () => {
    await setVendor("orange-county", true);
    await setVendor("blossompot", true);
    const { updateCatalogCountriesAdmin } = await import("./catalog-countries");
    const enabled = resultOf(
      await updateCatalogCountriesAdmin({
        headers: { authorization: "Bearer dev:admin@blossompot.test:admin" },
        body: JSON.stringify({
          countries: [
            { countryCode: "US", enabled: true },
            { countryCode: "GB", enabled: true },
          ],
        }),
        requestContext: { http: { method: "PUT" } },
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(enabled.statusCode, 200);
    const abroad = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "GB" } })));
    assert.equal(slugsOf(abroad.body).includes("phase4-owned"), false);

    const irvine = resultOf(
      await listProducts(
        shopperEvent({ queryStringParameters: { country: "US", postalCode: "92612" } })
      )
    );
    assert.equal(slugsOf(irvine.body).includes("phase4-oc"), true);
    const manhattan = resultOf(
      await listProducts(
        shopperEvent({ queryStringParameters: { country: "US", postalCode: "10001" } })
      )
    );
    assert.equal(slugsOf(manhattan.body).includes("phase4-oc"), false);
    assert.equal(slugsOf(manhattan.body).includes("phase4-owned"), true);
  });

  it("hides only BlossomPot when that vendor is disabled and keeps the resolved public slug", async () => {
    await setVendor("blossompot", true);
    await setVendor("fnp", true);
    await setVendor("orange-county", true);
    await setVendor("gift-baskets-overseas", true);

    await setVendor("blossompot", false);
    const hidden = resultOf(
      await listProducts(shopperEvent({ queryStringParameters: { country: "US", postalCode: "92612" } }))
    );
    assert.equal(slugsOf(hidden.body).includes("phase4-owned"), false);
    assert.equal(slugsOf(hidden.body).includes("phase4-other-tag"), false);
    assert.equal(slugsOf(hidden.body).includes("phase4-fnp"), true);
    assert.equal(slugsOf(hidden.body).includes("phase4-fnp-tag"), true);
    assert.equal(slugsOf(hidden.body).includes("phase4-oc"), true);
    assert.equal(slugsOf(hidden.body).includes("phase4-gbo"), true);
    const publicRows = hidden.body.products as Array<{ slug: string; vendorSlug?: string; vendorCost?: number }>;
    assert.equal(publicRows.find((row) => row.slug === "phase4-fnp")?.vendorSlug, "fnp");
    assert.equal(publicRows.find((row) => row.slug === "phase4-fnp-tag")?.vendorSlug, "fnp");
    assert.equal(publicRows.find((row) => row.slug === "phase4-oc")?.vendorSlug, "orange-county");
    assert.equal(publicRows.find((row) => row.slug === "phase4-gbo")?.vendorSlug, "gift-baskets-overseas");
    assert.equal(publicRows.some((row) => row.vendorCost != null), false);

    const ownedPage = resultOf(await getProduct(shopperEvent({ pathParameters: { slug: "phase4-owned" } })));
    assert.equal(ownedPage.statusCode, 404);
    const fnpPage = resultOf(
      await getProduct(
        shopperEvent({ pathParameters: { slug: "phase4-fnp-tag" }, queryStringParameters: { country: "US", postalCode: "10001" } })
      )
    );
    assert.equal(fnpPage.statusCode, 200);
    assert.equal((fnpPage.body.product as { vendorSlug?: string }).vendorSlug, "fnp");
    assert.equal((fnpPage.body.availability as { deliverable?: boolean }).deliverable, true);

    const outsideOrangeCounty = resultOf(
      await listProducts(shopperEvent({ queryStringParameters: { country: "US", postalCode: "10001" } }))
    );
    assert.equal(slugsOf(outsideOrangeCounty.body).includes("phase4-oc"), false);
    assert.equal(slugsOf(outsideOrangeCounty.body).includes("phase4-fnp"), true);

    const added = resultOf(
      await addToCart(
        shopperEvent({
          headers: { "x-session-id": "phase4-identity-shopper" },
          body: JSON.stringify({ productSlug: "phase4-fnp-tag", quantity: 1 }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(added.statusCode, 200);
    const cart = resultOf(
      await getCartHandler(
        shopperEvent({
          headers: { "x-session-id": "phase4-identity-shopper" },
          queryStringParameters: { country: "US", postalCode: "10001" },
        })
      )
    );
    const line = (cart.body.cart as { items: Array<{ productSlug: string; vendorSlug?: string; unavailableForLocation?: boolean }> }).items.find(
      (item) => item.productSlug === "phase4-fnp-tag"
    );
    assert.ok(line);
    assert.equal(line.vendorSlug, undefined);
    assert.equal(line.unavailableForLocation, undefined);

    const order = resultOf(
      await checkout(
        shopperEvent({
          headers: { "x-session-id": "phase4-identity-shopper" },
          body: JSON.stringify({
            paymentMethod: "stripe",
            shippingAddress: {
              name: "A Recipient",
              line1: "1 Main",
              city: "New York",
              state: "NY",
              postalCode: "10001",
              country: "US",
              phone: "+1 408 555 0100",
              email: "shopper@blossompot.test",
              senderName: "A Sender",
              senderMessage: "Thinking of you today",
            },
          }),
          requestContext: { http: { method: "POST", path: "/checkout" } },
        })
      )
    );
    if (order.statusCode === 400) {
      const message = String(order.body.error ?? "");
      assert.equal(message.includes("temporarily unavailable"), false);
      assert.equal(message.includes("not available for delivery"), false);
    } else {
      assert.equal(order.statusCode < 500, true);
    }

    await setVendor("blossompot", true);
    const restored = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(slugsOf(restored.body).includes("phase4-owned"), true);
    assert.equal(slugsOf(restored.body).includes("phase4-other-tag"), true);
  });

  it("saves vendor identity on manual create and CSV import", async () => {
    const admin = {
      headers: { authorization: "Bearer dev:admin@blossompot.test:admin" },
      requestContext: { http: { method: "POST", path: "/products" } },
    };
    const created = resultOf(
      await createProduct({
        ...admin,
        body: JSON.stringify({
          name: "Identity Legacy Rose",
          description: "Owned",
          price: 12,
          categorySlug: "flowers",
          currency: "USD",
          tags: ["birthday"],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(created.statusCode, 201);
    assert.equal((created.body.product as { vendorSlug?: string }).vendorSlug, "blossompot");

    const tagged = resultOf(
      await createProduct({
        ...admin,
        body: JSON.stringify({
          name: "Identity Tagged Fnp",
          description: "FNP",
          price: 12,
          categorySlug: "flowers",
          currency: "USD",
          tags: ["fnp-usa-import"],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(tagged.statusCode, 201);
    assert.equal((tagged.body.product as { vendorSlug?: string }).vendorSlug, "fnp");

    const explicit = resultOf(
      await createProduct({
        ...admin,
        body: JSON.stringify({
          name: "Identity Explicit County",
          description: "County",
          price: 12,
          categorySlug: "flowers",
          currency: "USD",
          vendorSlug: "orange-county",
          tags: ["fnp-usa-import"],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(explicit.statusCode, 201);
    assert.equal((explicit.body.product as { vendorSlug?: string }).vendorSlug, "orange-county");

    const bulk = resultOf(
      await bulkUploadProducts({
        ...admin,
        requestContext: { http: { method: "POST", path: "/products/bulk" } },
        body: JSON.stringify({
          rows: [
            {
              name: "Identity Csv Rose",
              description: "Owned",
              price: "15",
              categorySlug: "flowers",
              currency: "USD",
              tags: "flowers,birthday",
            },
            {
              name: "Identity Csv Fnp",
              description: "FNP",
              price: "15",
              categorySlug: "flowers",
              currency: "USD",
              vendorSlug: "fnp",
              tags: "birthday",
            },
          ],
        }),
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(bulk.statusCode, 200);
    const products = bulk.body.products as Array<{ name: string; vendorSlug?: string }>;
    assert.equal(products.find((row) => row.name === "Identity Csv Rose")?.vendorSlug, "blossompot");
    assert.equal(products.find((row) => row.name === "Identity Csv Fnp")?.vendorSlug, "fnp");
  });

  it("does not apply the new-shopping gate to existing vendor fulfillment code", () => {
    const vendorFeed = readFileSync(path.join(__dirname, "vendor-orders.ts"), "utf8");
    const gboOrders = readFileSync(path.join(__dirname, "../lib/gbo-orders.ts"), "utf8");
    assert.equal(vendorFeed.includes("productAllowedForNewShopping"), false);
    assert.equal(vendorFeed.includes("decideNewShopping"), false);
    assert.equal(gboOrders.includes("productAllowedForNewShopping"), false);
    assert.equal(gboOrders.includes("decideNewShopping"), false);
  });
});
