import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dedupeStorefrontProducts, isRakhiRelatedProduct, type Product } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-listing-card-test";
process.env.PRODUCTS_TABLE = "blossompot-products-listing-card-test";
process.env.CARTS_TABLE = "blossompot-carts-listing-card-test";
process.env.ORDERS_TABLE = "blossompot-orders-listing-card-test";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let getProduct: Handler;
let updateCatalogVendorAdmin: Handler;
let invalidateProductListCache: (categorySlug?: string) => void;
let toListingCardProduct: <T extends { description?: string }>(product: T) => T;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productKeys: {
  pk: (slug: string) => string;
  sk: () => string;
  gsi1pk: (categorySlug: string) => string;
  gsi1sk: (slug: string) => string;
};

const SEARCH_TOKEN = "zzmarigoldtoken";

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  getProduct = products.getProduct;
  invalidateProductListCache = products.invalidateProductListCache;
  toListingCardProduct = products.toListingCardProduct;
  const vendors = await import("./catalog-vendors");
  updateCatalogVendorAdmin = vendors.updateCatalogVendorAdmin;
  invalidateProductListCache();

  const rows = [
    row("card-rose", "flowers", { description: "Fresh roses." }),
    row("card-search", "flowers", {
      description: `${"A long stored description. ".repeat(6)}${SEARCH_TOKEN} appears only here.`,
    }),
    row("card-rakhi-body", "flowers", {
      name: "Garden rose",
      seoTitle: "Garden rose",
      description: `${"A long stored description. ".repeat(6)}Includes a designer rakhi in the copy.`,
    }),
    row("card-rakhi-seo", "flowers", {
      name: "Sunset bloom",
      description: "Fresh sunset flowers.",
      seoTitle: "Rakhi special",
    }),
    row("card-cake", "cakes", { description: "A small cake." }),
    row("card-uk", "flowers", { description: "UK only roses.", deliveryCountries: ["GB"] }),
    row("card-hidden", "flowers", { description: "Unpublished roses.", published: false }),
    row("card-stock", "flowers", { description: "Out of stock roses.", inventory: 0 }),
    row("card-oc", "flowers", { description: "Irvine hamper.", vendorSlug: "orange-county" }),
    row("card-detail", "flowers", {
      description: `${"Full detail copy. ".repeat(8)}Keep this sentence.`,
      seoTitle: "Detail SEO title",
      seoDescription: "Detail SEO description",
      shippingNote: "Ships overnight",
      shippingOptions: [{ id: "overnight" }],
      shortDescription: "Overnight roses",
      imageAssets: [{ url: "https://cdn.example.com/card.jpg" }],
      variants: [{ name: "Deluxe", price: 12 }],
      updatedAt: "2026-01-15T00:00:00.000Z",
    }),
  ];
  for (const item of rows) {
    await docClient.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: item }));
  }
});

function row(slug: string, categorySlug: string, extra: Record<string, unknown>) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: slug,
    description: "Catalog row",
    price: 24,
    currency: "USD",
    categorySlug,
    images: ["https://cdn.example.com/card.jpg"],
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

function productsOf(body: Record<string, unknown>): Array<Record<string, unknown>> {
  return (body.products as Array<Record<string, unknown>> | undefined) ?? [];
}

function slugsOf(body: Record<string, unknown>): string[] {
  return productsOf(body).map((product) => String(product.slug));
}

function shopperEvent(partial: Record<string, unknown> = {}): APIGatewayProxyEventV2 {
  const headers = {
    "x-session-id": "listing-card-shopper",
    ...((partial.headers as Record<string, string> | undefined) ?? {}),
  };
  return {
    requestContext: { http: { method: "GET", path: "/products" } },
    ...partial,
    headers,
  } as unknown as APIGatewayProxyEventV2;
}

function cardHeaders(): Record<string, string> {
  return {
    "x-blossompot-listing-view": "card",
    "x-blossompot-listing-groups": "1",
  };
}

async function both(query: Record<string, string>) {
  const plain = resultOf(await listProducts(shopperEvent({ queryStringParameters: query })));
  const card = resultOf(
    await listProducts(shopperEvent({ queryStringParameters: query, headers: cardHeaders() }))
  );
  assert.equal(plain.statusCode, 200);
  assert.equal(card.statusCode, 200);
  return { plain, card };
}

function cardSlugsMatchStorefront(plain: Array<Record<string, unknown>>, card: string[]): void {
  const expected = plain
    .filter((product) => !isRakhiRelatedProduct(product as unknown as Product))
    .map((product) => String(product.slug));
  assert.deepEqual(card, expected);
}

describe("listing card response", { concurrency: false }, () => {
  it("reads requested combo component slugs without returning the rest of the catalog", async () => {
    const view = await both({
      country: "US",
      slugs: "card-rose,card-uk,card-hidden,card-stock,card-cake,missing-combo-part",
    });
    assert.deepEqual(slugsOf(view.plain.body).sort(), ["card-cake", "card-rose"]);
    assert.equal(slugsOf(view.plain.body).includes("card-search"), false);
    assert.equal(slugsOf(view.card.body).includes("card-search"), false);
    cardSlugsMatchStorefront(productsOf(view.plain.body), slugsOf(view.card.body));

    const empty = resultOf(await listProducts(shopperEvent({ queryStringParameters: { country: "US", slugs: "" } })));
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(slugsOf(empty.body), []);

    const tooMany = resultOf(
      await listProducts(
        shopperEvent({
          queryStringParameters: { country: "US", slugs: Array.from({ length: 101 }, (_, index) => `slug-${index}`).join(",") },
        })
      )
    );
    assert.equal(tooMany.statusCode, 400);
  });

  it("keeps the description stub from changing duplicate rank", () => {
    const rich = {
      slug: "rich-rose",
      name: "Rose",
      sku: "SAME-SKU",
      categorySlug: "flowers",
      images: ["https://cdn.example.com/same.jpg"],
      description: "y".repeat(200),
      tags: ["tf-usa"],
      couponExcluded: true,
    };
    const thin = { ...rich, slug: "thin-rose", description: "short", tags: [] as string[], couponExcluded: false };
    const before = dedupeStorefrontProducts([thin, rich]).map((product) => product.slug);
    const after = dedupeStorefrontProducts([
      toListingCardProduct(thin),
      toListingCardProduct(rich),
    ]).map((product) => product.slug);
    assert.deepEqual(after, before);
    assert.equal(toListingCardProduct(rich).description?.length, 81);
    assert.equal(toListingCardProduct(thin).description, "short");
  });

  it("uses the same ordered slugs for category, search, and uncategorized lists after Rakhi exclusion", async () => {
    const uncategorized = await both({ country: "US" });
    const flowers = await both({ country: "US", category: "flowers" });
    const search = await both({ country: "US", search: SEARCH_TOKEN });
    cardSlugsMatchStorefront(productsOf(uncategorized.plain.body), slugsOf(uncategorized.card.body));
    cardSlugsMatchStorefront(productsOf(flowers.plain.body), slugsOf(flowers.card.body));
    cardSlugsMatchStorefront(productsOf(search.plain.body), slugsOf(search.card.body));

    const seeds = ["card-rose", "card-search", "card-rakhi-body", "card-rakhi-seo", "card-detail"];
    for (const view of [uncategorized, flowers, search]) {
      const plainSlugs = slugsOf(view.plain.body);
      const cardSlugs = slugsOf(view.card.body);
      assert.deepEqual(
        cardSlugs.filter((slug) => seeds.includes(slug)),
        plainSlugs.filter((slug) => seeds.includes(slug) && slug !== "card-rakhi-body" && slug !== "card-rakhi-seo")
      );
    }
    assert.equal(slugsOf(search.plain.body).includes("card-search"), true);
    assert.equal(slugsOf(search.card.body).includes("card-search"), true);
    assert.equal(slugsOf(flowers.plain.body).includes("card-cake"), false);
    assert.equal(slugsOf(flowers.card.body).includes("card-cake"), false);
  });

  it("drops Rakhi products whose only signal is the description or seoTitle", async () => {
    const { plain, card } = await both({ country: "US", category: "flowers" });
    assert.equal(slugsOf(plain.body).includes("card-rakhi-body"), true);
    assert.equal(slugsOf(plain.body).includes("card-rakhi-seo"), true);
    assert.equal(slugsOf(card.body).includes("card-rakhi-body"), false);
    assert.equal(slugsOf(card.body).includes("card-rakhi-seo"), false);
    assert.equal(slugsOf(card.body).includes("card-rose"), true);
  });

  it("still matches search text that exists only in the stored description", async () => {
    const { plain, card } = await both({ country: "US", search: SEARCH_TOKEN });
    const plainRow = productsOf(plain.body).find((product) => product.slug === "card-search");
    const cardRow = productsOf(card.body).find((product) => product.slug === "card-search");
    assert.equal(String(plainRow?.description).includes(SEARCH_TOKEN), true);
    assert.equal(String(cardRow?.description).includes(SEARCH_TOKEN), false);
    assert.equal(String(cardRow?.description).length, 81);
  });

  it("keeps the default list complete and the card list free of unused fields", async () => {
    const { plain, card } = await both({ country: "US", category: "flowers" });
    const plainRow = productsOf(plain.body).find((product) => product.slug === "card-detail");
    const cardRow = productsOf(card.body).find((product) => product.slug === "card-detail");
    assert.equal(plainRow?.seoDescription, "Detail SEO description");
    assert.equal(plainRow?.PK, productKeys.pk("card-detail"));
    assert.equal(Array.isArray(plainRow?.variants), true);
    assert.equal(plainRow?.shippingOptions != null, true);
    assert.equal(plainRow?.shortDescription, "Overnight roses");
    assert.equal(cardRow?.seoTitle, undefined);
    assert.equal(cardRow?.seoDescription, undefined);
    assert.equal(cardRow?.shippingNote, undefined);
    assert.equal(cardRow?.shippingOptions, undefined);
    assert.equal(cardRow?.shortDescription, undefined);
    assert.equal(cardRow?.imageAssets, undefined);
    assert.equal(cardRow?.variants, undefined);
    assert.equal(cardRow?.PK, undefined);
    assert.equal(cardRow?.SK, undefined);
    assert.equal(cardRow?.GSI1PK, undefined);
    assert.equal(cardRow?.GSI1SK, undefined);
    assert.equal(cardRow?.price, plainRow?.price);
    assert.equal(plainRow?.updatedAt, "2026-01-15T00:00:00.000Z");
    assert.equal(cardRow?.updatedAt, "2026-01-15T00:00:00.000Z");
    assert.equal(String(plainRow?.description).includes("Keep this sentence."), true);
    assert.equal(cardRow?.vendorSlug != null || cardRow?.slug === "card-detail", true);
    const groups = card.body.listingGroups as Array<{ count: number }> | undefined;
    assert.equal(
      groups?.reduce((sum, group) => sum + group.count, 0),
      slugsOf(card.body).length
    );
  });

  it("excludes unpublished, out-of-stock, other-country, disabled-vendor, and undeliverable ZIP rows from both views", async () => {
    const open = await both({ country: "US", postalCode: "92612" });
    assert.equal(slugsOf(open.plain.body).includes("card-oc"), true);
    assert.equal(slugsOf(open.card.body).includes("card-oc"), true);
    const blockedZip = await both({ country: "US", postalCode: "10001" });
    assert.equal(slugsOf(blockedZip.plain.body).includes("card-oc"), false);
    assert.equal(slugsOf(blockedZip.card.body).includes("card-oc"), false);
    assert.equal(slugsOf(blockedZip.plain.body).includes("card-rose"), true);
    assert.equal(slugsOf(blockedZip.card.body).includes("card-rose"), true);

    for (const view of [open, blockedZip]) {
      for (const slug of ["card-hidden", "card-stock", "card-uk"]) {
        assert.equal(slugsOf(view.plain.body).includes(slug), false);
        assert.equal(slugsOf(view.card.body).includes(slug), false);
      }
    }

    const disabled = resultOf(
      await updateCatalogVendorAdmin({
        headers: { authorization: "Bearer dev:admin@blossompot.test:admin" },
        body: JSON.stringify({ enabled: false, deliveryCountries: ["US"] }),
        pathParameters: { vendorSlug: "orange-county" },
        requestContext: { http: { method: "PUT" } },
      } as unknown as APIGatewayProxyEventV2)
    );
    assert.equal(disabled.statusCode, 200);
    const closed = await both({ country: "US", postalCode: "92612" });
    assert.equal(slugsOf(closed.plain.body).includes("card-oc"), false);
    assert.equal(slugsOf(closed.card.body).includes("card-oc"), false);
    await updateCatalogVendorAdmin({
      headers: { authorization: "Bearer dev:admin@blossompot.test:admin" },
      body: JSON.stringify({ enabled: true, deliveryCountries: ["US"] }),
      pathParameters: { vendorSlug: "orange-county" },
      requestContext: { http: { method: "PUT" } },
    } as unknown as APIGatewayProxyEventV2);
  });

  it("returns the full description, SEO fields, and variants from the product detail route", async () => {
    const detail = resultOf(
      await getProduct(
        shopperEvent({
          pathParameters: { slug: "card-detail" },
          queryStringParameters: { country: "US" },
          headers: cardHeaders(),
        })
      )
    );
    assert.equal(detail.statusCode, 200);
    const product = detail.body.product as Record<string, unknown>;
    assert.equal(String(product.description).includes("Keep this sentence."), true);
    assert.equal(product.seoTitle, "Detail SEO title");
    assert.equal(product.seoDescription, "Detail SEO description");
    assert.equal(Array.isArray(product.variants), true);
    assert.equal((product.variants as Array<{ name: string }>)[0]?.name, "Deluxe");
  });

  it("leaves sitemap and llms-full.txt on the default list contract", () => {
    const root = path.resolve(__dirname, "../../../..");
    const sitemap = readFileSync(path.join(root, "apps/web/src/app/sitemap.ts"), "utf8");
    const llms = readFileSync(path.join(root, "apps/web/src/app/llms-full.txt/route.ts"), "utf8");
    for (const source of [sitemap, llms]) {
      assert.equal(source.includes('"/products"'), true);
      assert.equal(source.includes("x-blossompot-listing-view"), false);
    }
    assert.equal(sitemap.includes("updatedAt"), true);
    assert.equal(llms.includes("p.description"), true);
  });
});
