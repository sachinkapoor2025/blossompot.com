import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

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
    catalogProduct("phase4-gbo", "gift-baskets-overseas"),
  ]) {
    await docClient.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: product }));
  }
});

function catalogProduct(slug: string, vendorSlug?: string) {
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
    const open = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
    assert.equal(open.statusCode, 200);
    assert.equal(slugsOf(open.body).includes("phase4-oc"), true);
    assert.equal(slugsOf(open.body).includes("phase4-owned"), true);

    await setVendor("orange-county", false);
    const closed = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US" } })));
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
    assert.equal(slugsOf(fnpOff.body).includes("phase4-fnp"), false);
    await setVendor("fnp", true);
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

  it("does not apply the new-shopping gate to existing vendor fulfillment code", () => {
    const vendorFeed = readFileSync(path.join(__dirname, "vendor-orders.ts"), "utf8");
    const gboOrders = readFileSync(path.join(__dirname, "../lib/gbo-orders.ts"), "utf8");
    assert.equal(vendorFeed.includes("productAllowedForNewShopping"), false);
    assert.equal(vendorFeed.includes("decideNewShopping"), false);
    assert.equal(gboOrders.includes("productAllowedForNewShopping"), false);
    assert.equal(gboOrders.includes("decideNewShopping"), false);
  });
});
