import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-publication-test";
process.env.PRODUCTS_TABLE = "blossompot-products-publication-test";
process.env.CARTS_TABLE = "blossompot-carts-publication-test";
process.env.ORDERS_TABLE = "blossompot-orders-publication-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let getProduct: Handler;
let addToCart: Handler;
let updateCartItem: Handler;
let getCartHandler: Handler;
let checkout: Handler;
let getFlowerGuideCardsCache: Handler;
let putFlowerGuideCardsCache: Handler;
let invalidateProductListCache: (categorySlug?: string) => void;
let docClient: { send: (command: unknown) => Promise<{ Items?: Record<string, unknown>[]; Item?: Record<string, unknown> }> };
let productKeys: { pk: (slug: string) => string; sk: () => string; gsi1pk: (category: string) => string; gsi1sk: (slug: string) => string };
let isStoredProductUnpublished: (product: { published?: boolean } | null | undefined) => boolean;

const SHOPPER = "publication-shopper";
const BUYER = "publication-buyer";

before(async () => {
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const publication = await import("./product-publication");
  isStoredProductUnpublished = publication.isStoredProductUnpublished;
  const products = await import("../handlers/products");
  listProducts = products.listProducts;
  getProduct = products.getProduct;
  invalidateProductListCache = products.invalidateProductListCache;
  const cart = await import("../handlers/cart");
  addToCart = cart.addToCart;
  updateCartItem = cart.updateCartItem;
  getCartHandler = cart.getCartHandler;
  const orders = await import("../handlers/orders");
  checkout = orders.checkout;
  const guides = await import("../handlers/flower-guide-cards");
  getFlowerGuideCardsCache = guides.getFlowerGuideCardsCache;
  putFlowerGuideCardsCache = guides.putFlowerGuideCardsCache;
  invalidateProductListCache();
});

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
    published: true,
    tags: [],
    ...extra,
  };
}

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function slugsOf(body: Record<string, unknown>): string[] {
  const products = (body.products as Array<{ slug?: string }> | undefined) ?? [];
  return products.map((product) => String(product.slug));
}

function shopper(session: string, partial: Record<string, unknown> = {}): APIGatewayProxyEventV2 {
  const headers = {
    "x-session-id": session,
    ...((partial.headers as Record<string, string> | undefined) ?? {}),
  };
  return {
    requestContext: { http: { method: "GET", path: "/products" } },
    ...partial,
    headers,
  } as unknown as APIGatewayProxyEventV2;
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: item }));
}

function checkoutEvent(session: string): APIGatewayProxyEventV2 {
  return shopper(session, {
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
  });
}

describe("product publication", { concurrency: false }, () => {
  it("treats a missing published flag as eligible", () => {
    assert.equal(isStoredProductUnpublished({}), false);
    assert.equal(isStoredProductUnpublished({ published: true }), false);
    assert.equal(isStoredProductUnpublished(undefined), false);
    assert.equal(isStoredProductUnpublished({ published: false }), true);
  });

  it("keeps published products buyable and blocks unpublished ones in listings, cart, and checkout", async () => {
    const { published: _published, ...omitted } = row("pub-omitted");
    await putProduct(row("pub-rose", { name: "Published rose" }));
    await putProduct(omitted);
    await putProduct(row("pub-hidden", { name: "Hidden rose", published: false }));
    await putProduct(row("pub-stock", { inventory: 0 }));
    await putProduct(row("pub-uk", { deliveryCountries: ["GB"] }));
    await putProduct(row("pub-oc", { vendorSlug: "orange-county", name: "Irvine hamper" }));
    await putProduct(row("pub-cart", { name: "Cart rose" }));
    await putProduct(row("pub-keep", { name: "Kept rose" }));
    invalidateProductListCache();

    const open = resultOf(await listProducts(shopper(SHOPPER, { queryStringParameters: { country: "US", postalCode: "92612" } })));
    assert.equal(open.statusCode, 200);
    for (const slug of ["pub-rose", "pub-omitted", "pub-oc", "pub-cart", "pub-keep"]) {
      assert.equal(slugsOf(open.body).includes(slug), true, slug);
    }
    for (const slug of ["pub-hidden", "pub-stock", "pub-uk"]) {
      assert.equal(slugsOf(open.body).includes(slug), false, slug);
    }

    const flowers = resultOf(
      await listProducts(shopper(SHOPPER, { queryStringParameters: { country: "US", category: "flowers", postalCode: "92612" } }))
    );
    assert.equal(slugsOf(flowers.body).includes("pub-rose"), true);
    assert.equal(slugsOf(flowers.body).includes("pub-hidden"), false);

    const otherZip = resultOf(
      await listProducts(shopper(SHOPPER, { queryStringParameters: { country: "US", postalCode: "10001" } }))
    );
    assert.equal(slugsOf(otherZip.body).includes("pub-oc"), false);
    assert.equal(slugsOf(otherZip.body).includes("pub-rose"), true);

    const detail = resultOf(
      await getProduct(shopper(SHOPPER, { pathParameters: { slug: "pub-cart" }, queryStringParameters: { country: "US" } }))
    );
    assert.equal(detail.statusCode, 200);

    const added = resultOf(
      await addToCart(
        shopper(SHOPPER, {
          body: JSON.stringify({ productSlug: "pub-cart", quantity: 2, deliveryCountry: "US", deliveryPostal: "92612" }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(added.statusCode, 200);
    const kept = resultOf(
      await addToCart(
        shopper(SHOPPER, {
          body: JSON.stringify({ productSlug: "pub-keep", quantity: 1, deliveryCountry: "US", deliveryPostal: "92612" }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(kept.statusCode, 200);

    await putProduct(row("pub-cart", { name: "Cart rose", published: false }));

    const staleList = resultOf(
      await listProducts(shopper(SHOPPER, { queryStringParameters: { country: "US", postalCode: "92612" } }))
    );
    assert.equal(slugsOf(staleList.body).includes("pub-cart"), false);
    assert.equal(slugsOf(staleList.body).includes("pub-rose"), true);
    assert.equal(slugsOf(staleList.body).includes("pub-omitted"), true);
    const staleCategory = resultOf(
      await listProducts(shopper(SHOPPER, { queryStringParameters: { country: "US", category: "flowers", postalCode: "92612" } }))
    );
    assert.equal(slugsOf(staleCategory.body).includes("pub-cart"), false);
    assert.equal(slugsOf(staleCategory.body).includes("pub-keep"), true);

    const hiddenDetail = resultOf(
      await getProduct(shopper(SHOPPER, { pathParameters: { slug: "pub-cart" }, queryStringParameters: { country: "US" } }))
    );
    assert.equal(hiddenDetail.statusCode, 404);

    const rejectedAdd = resultOf(
      await addToCart(
        shopper(SHOPPER, {
          body: JSON.stringify({ productSlug: "pub-cart", quantity: 1, deliveryCountry: "US" }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rejectedAdd.statusCode, 400);
    assert.equal(rejectedAdd.body.error, "Cart rose is no longer available.");
    const stored = await docClient.send(
      new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { PK: productKeys.pk("pub-cart"), SK: productKeys.sk() },
      })
    );
    assert.equal(stored.Item?.published, false);

    const cart = resultOf(await getCartHandler(shopper(SHOPPER)));
    const lines = (cart.body.cart as { items: Array<Record<string, unknown>> }).items;
    const blockedLine = lines.find((item) => item.productSlug === "pub-cart");
    const keptLine = lines.find((item) => item.productSlug === "pub-keep");
    assert.equal(blockedLine?.quantity, 2);
    assert.equal(blockedLine?.unavailableReason, "Cart rose is no longer available.");
    assert.equal(keptLine?.quantity, 1);
    assert.equal(keptLine?.unavailableReason, undefined);

    const rejectedUpdate = resultOf(
      await updateCartItem(
        shopper(SHOPPER, {
          pathParameters: { lineId: String(blockedLine?.lineId) },
          body: JSON.stringify({ quantity: 3 }),
          requestContext: { http: { method: "PATCH", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rejectedUpdate.statusCode, 400);
    assert.equal(rejectedUpdate.body.error, "Cart rose is no longer available.");

    const rejectedOrder = resultOf(await checkout(checkoutEvent(SHOPPER)));
    assert.equal(rejectedOrder.statusCode, 400);
    assert.equal(rejectedOrder.body.error, "Cart rose is no longer available.");
    const orders = await docClient.send(
      new ScanCommand({
        TableName: process.env.ORDERS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "ORDER#", ":sk": "META" },
      })
    );
    assert.equal((orders.Items ?? []).length, 0);
    const afterReject = resultOf(await getCartHandler(shopper(SHOPPER)));
    const afterLines = (afterReject.body.cart as { items: Array<Record<string, unknown>> }).items;
    assert.equal(afterLines.find((item) => item.productSlug === "pub-cart")?.quantity, 2);
    assert.equal(afterLines.find((item) => item.productSlug === "pub-keep")?.quantity, 1);

    const rose = resultOf(
      await addToCart(
        shopper(BUYER, {
          body: JSON.stringify({ productSlug: "pub-rose", quantity: 1, deliveryCountry: "US", deliveryPostal: "92612" }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rose.statusCode, 200);
    const alsoKept = resultOf(
      await addToCart(
        shopper(BUYER, {
          body: JSON.stringify({ productSlug: "pub-keep", quantity: 1, deliveryCountry: "US", deliveryPostal: "92612" }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(alsoKept.statusCode, 200);
    const placed = resultOf(await checkout(checkoutEvent(BUYER)));
    assert.equal(placed.statusCode, 201);
    const orderItems = ((placed.body.order as { items?: Array<{ productSlug: string }> }).items ?? []).map(
      (item) => item.productSlug
    );
    assert.deepEqual(orderItems.sort(), ["pub-keep", "pub-rose"]);
  });

  it("drops an unpublished product from a fresh flower-guide card cache", async () => {
    const stored = resultOf(
      await putFlowerGuideCardsCache(
        shopper(SHOPPER, {
          rawPath: "/flower-guide-cards",
          queryStringParameters: { country: "US" },
          body: JSON.stringify({
            country: "US",
            slug: "usa",
            products: [
              {
                slug: "pub-rose",
                name: "Published rose",
                price: 24,
                currency: "USD",
                categorySlug: "flowers",
                images: ["https://cdn.example.com/rose.jpg"],
                inventory: 8,
                published: true,
              },
              {
                slug: "pub-hidden",
                name: "Hidden rose",
                price: 24,
                currency: "USD",
                categorySlug: "flowers",
                images: ["https://cdn.example.com/rose.jpg"],
                inventory: 8,
                published: true,
              },
            ],
          }),
          requestContext: { http: { method: "PUT", path: "/flower-guide-cards" } },
        })
      )
    );
    assert.equal(stored.statusCode, 200);
    const hit = resultOf(
      await getFlowerGuideCardsCache(
        shopper(SHOPPER, {
          rawPath: "/flower-guide-cards",
          queryStringParameters: { country: "US" },
          requestContext: { http: { method: "GET", path: "/flower-guide-cards" } },
        })
      )
    );
    assert.equal(hit.statusCode, 200);
    const slugs = ((hit.body.products as Array<{ slug: string }>) ?? []).map((product) => product.slug);
    assert.deepEqual(slugs, ["pub-rose"]);
  });
});
