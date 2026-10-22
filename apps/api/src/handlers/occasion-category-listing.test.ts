import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { catalogCountryKeys, catalogVendorKeys, vendorCoverageKeys } from "@blossompot/shared";

/**
 * Fixtures copied from the 2026-10-16 DEV read of the 16 occasion products.
 * This file does not query or write blossompot-products-dev.
 * Service areas below are test rules, not a read of DEV ZIP coverage.
 */
process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.PRODUCTS_TABLE = "blossompot-products-occasion-listing-fixture";
process.env.CONFIG_TABLE = "blossompot-config-occasion-listing-fixture";
process.env.CARTS_TABLE = "blossompot-carts-occasion-listing-fixture";
process.env.ORDERS_TABLE = "blossompot-orders-occasion-listing-fixture";

const ANNIVERSARY = [
  "love-in-full-bloom",
  "love-bloom-chocolate",
  "anniversary-delectable-carrot-cake",
  "anniversary-cookies-and-cream-brownie-cake",
  "anniversary-triple-chocolate-enrobed-brownie-cake",
] as const;

const VALENTINES = [
  "delicious-valentines-day-cupcakes",
  "gourmet-brownie-valentine-assortment",
  "valentine-special-jumbo-cupcakes-set",
  "valentine-special-chocolate-gift-basket",
  "decadent-romance-collection-for-valentine",
  "the-perfect-valentines-day-gift-bag",
  "valentines-gift-for-special-lady",
  "valentines-day-cookie-and-brownie-gift-crate",
  "valentine-celebration-with-wine",
  "sips-n-sweetheart-treats-for-valentine",
  "cuddly-valentine-gift-hamper",
] as const;

const FNP_ANNIVERSARY = ANNIVERSARY.filter((slug) => slug !== "love-in-full-bloom" && slug !== "love-bloom-chocolate");

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let invalidateProductListCache: () => void;
let invalidateCatalogVendorCache: () => void;
let invalidateServiceabilityCache: () => void;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productsTable: string;
let configTable: string;
let productKeys: {
  pk: (slug: string) => string;
  sk: () => string;
  gsi1pk: (category: string) => string;
  gsi1sk: (slug: string) => string;
};

before(async () => {
  if (process.env.USE_MEMORY_DB !== "true") {
    throw new Error("Refusing to run the occasion listing test without the in-memory database.");
  }
  if (process.env.PRODUCTS_TABLE === "blossompot-products-dev") {
    throw new Error("Refusing to use the DEV products table.");
  }
  const db = await import("../lib/db");
  if (db.PRODUCTS_TABLE === "blossompot-products-dev") {
    throw new Error("The database client is bound to the DEV products table.");
  }
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  configTable = db.CONFIG_TABLE;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  invalidateProductListCache = products.invalidateProductListCache;
  invalidateCatalogVendorCache = (await import("../lib/catalog-vendor-store")).invalidateCatalogVendorCache;
  invalidateServiceabilityCache = (await import("../lib/serviceability-store")).invalidateServiceabilityCache;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function slugsOf(body: Record<string, unknown>): string[] {
  return ((body.products as Array<{ slug?: string }> | undefined) ?? []).map((product) => product.slug ?? "");
}

function product(input: {
  slug: string;
  name: string;
  categorySlug: string;
  additionalCategorySlugs: string[];
  inventory: number;
  published?: boolean;
  vendorSlug?: string;
  tags: string[];
  sku: string;
}) {
  return {
    PK: productKeys.pk(input.slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(input.categorySlug),
    GSI1SK: productKeys.gsi1sk(input.slug),
    slug: input.slug,
    name: input.name,
    description: "Fixture copied from the prior DEV category read",
    price: 24,
    currency: "USD",
    categorySlug: input.categorySlug,
    additionalCategorySlugs: input.additionalCategorySlugs,
    images: ["https://cdn.example.com/gift.jpg"],
    inventory: input.inventory,
    sku: input.sku,
    tags: input.tags,
    published: input.published !== false,
    ...(input.vendorSlug ? { vendorSlug: input.vendorSlug } : {}),
    updatedAt: "2026-10-16T00:00:00.000Z",
    createdAt: "2026-10-16T00:00:00.000Z",
  };
}

function vendor(vendorSlug: string, vendorName: string, integrationType: string, enabled: boolean) {
  return {
    PK: catalogVendorKeys.pk(vendorSlug),
    SK: catalogVendorKeys.sk(),
    vendorSlug,
    vendorName,
    enabled,
    integrationType,
    deliveryCountries: ["US"],
    updatedAt: "2026-10-16T00:00:00.000Z",
  };
}

function area(vendorSlug: string, areaId: string, extra: Record<string, unknown>) {
  return {
    PK: vendorCoverageKeys.pk(vendorSlug),
    SK: vendorCoverageKeys.areaSk(areaId),
    areaId,
    vendorSlug,
    countryCode: "US",
    isActive: true,
    ...extra,
  };
}

async function put(table: string, item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: table, Item: item }));
}

function refresh() {
  invalidateProductListCache();
  invalidateCatalogVendorCache();
  invalidateServiceabilityCache();
}

function categoryList(category: string, query: Record<string, string> = {}) {
  refresh();
  return listProducts({
    headers: { "x-session-id": "occasion-listing-fixture" },
    queryStringParameters: { category, ...query },
  } as unknown as APIGatewayProxyEventV2);
}

function assertEachOnce(actual: string[], expected: readonly string[]) {
  for (const slug of expected) {
    assert.equal(actual.filter((value) => value === slug).length, 1, slug);
  }
}

describe("occasion category listing fixtures", { concurrency: false }, () => {
  before(async () => {
    const rows = [
      product({
        slug: "love-in-full-bloom",
        name: "Love in Full Bloom",
        categorySlug: "flower-bouquets",
        additionalCategorySlugs: ["flowers", "anniversary-gifts"],
        inventory: 50,
        tags: ["tf-usa", "fixed-price", "flowers"],
        sku: "TFFF2613",
      }),
      product({
        slug: "love-bloom-chocolate",
        name: "Love Bloom & Chocolate",
        categorySlug: "flower-bouquets",
        additionalCategorySlugs: ["flowers", "anniversary-gifts"],
        inventory: 50,
        tags: ["tf-usa", "fixed-price", "flowers"],
        sku: "TFFF2617",
      }),
      product({
        slug: "anniversary-delectable-carrot-cake",
        name: "Anniversary Delectable Carrot Cake",
        categorySlug: "cakes",
        additionalCategorySlugs: ["anniversary-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "anniversary-delectable-carrot-cake",
      }),
      product({
        slug: "anniversary-cookies-and-cream-brownie-cake",
        name: "Anniversary Cookies And Cream Brownie Cake",
        categorySlug: "cakes",
        additionalCategorySlugs: ["anniversary-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "anniversary-cookies-and-cream-brownie-cake",
      }),
      product({
        slug: "anniversary-triple-chocolate-enrobed-brownie-cake",
        name: "Anniversary Triple Chocolate Enrobed Brownie Cake",
        categorySlug: "cakes",
        additionalCategorySlugs: ["anniversary-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "anniversary-triple-chocolate-enrobed-brownie-cake",
      }),
      product({
        slug: "delicious-valentines-day-cupcakes",
        name: "Delicious Valentines Day Cupcakes",
        categorySlug: "cakes",
        additionalCategorySlugs: ["valentines-day-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "delicious-valentines-day-cupcakes",
      }),
      product({
        slug: "gourmet-brownie-valentine-assortment",
        name: "Gourmet Brownie Valentine Assortment",
        categorySlug: "cakes",
        additionalCategorySlugs: ["valentines-day-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "gourmet-brownie-valentine-assortment",
      }),
      product({
        slug: "valentine-special-jumbo-cupcakes-set",
        name: "Valentine Special Jumbo Cupcakes Set",
        categorySlug: "cakes",
        additionalCategorySlugs: ["valentines-day-gifts"],
        inventory: 200,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "valentine-special-jumbo-cupcakes-set",
      }),
      ...[
        "valentine-special-chocolate-gift-basket",
        "decadent-romance-collection-for-valentine",
        "the-perfect-valentines-day-gift-bag",
        "valentines-gift-for-special-lady",
        "valentines-day-cookie-and-brownie-gift-crate",
        "valentine-celebration-with-wine",
        "sips-n-sweetheart-treats-for-valentine",
        "cuddly-valentine-gift-hamper",
      ].map((slug) =>
        product({
          slug,
          name: slug,
          categorySlug: "gift-hampers",
          additionalCategorySlugs: ["valentines-day-gifts"],
          inventory: 200,
          vendorSlug: "fnp",
          tags: ["fnp-usa-import"],
          sku: slug,
        })
      ),
      product({
        slug: "unrelated-tulip",
        name: "Unrelated Tulip",
        categorySlug: "flowers",
        additionalCategorySlugs: [],
        inventory: 20,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "unrelated-tulip",
      }),
      product({
        slug: "unpublished-anniversary-cake",
        name: "Unpublished Anniversary Cake",
        categorySlug: "cakes",
        additionalCategorySlugs: ["anniversary-gifts"],
        inventory: 200,
        published: false,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "unpublished-anniversary-cake",
      }),
      product({
        slug: "sold-out-valentine-hamper",
        name: "Sold Out Valentine Hamper",
        categorySlug: "gift-hampers",
        additionalCategorySlugs: ["valentines-day-gifts"],
        inventory: 0,
        vendorSlug: "fnp",
        tags: ["fnp-usa-import"],
        sku: "sold-out-valentine-hamper",
      }),
    ];
    for (const row of rows) await put(productsTable, row);
    await put(configTable, vendor("fnp", "FNP", "excel", true));
    await put(configTable, vendor("blossompot", "BlossomPot", "owned", true));
    await put(configTable, {
      PK: catalogCountryKeys.pk,
      SK: catalogCountryKeys.sk,
      countries: [
        { countryCode: "US", enabled: true },
        { countryCode: "GB", enabled: true },
      ],
      defaultCountry: "US",
      updatedAt: "2026-10-16T00:00:00.000Z",
    });
    await put(
      configTable,
      area("fnp", "fixture-fnp-us-country", { scope: "COUNTRY", ruleType: "ALLOW" })
    );
    await put(
      configTable,
      area("blossompot", "fixture-bp-us-country", { scope: "COUNTRY", ruleType: "ALLOW" })
    );
    await put(
      configTable,
      area("fnp", "fixture-fnp-prefix-926", {
        scope: "POSTAL_PREFIX",
        ruleType: "ALLOW",
        postalPrefix: "926",
      })
    );
  });

  it("lists each verified occasion slug once for a US request and leaves unrelated rows out", async () => {
    const anniversary = resultOf(await categoryList("anniversary-gifts", { country: "US" }));
    const valentines = resultOf(await categoryList("valentines-day-gifts", { country: "US" }));
    assert.equal(anniversary.statusCode, 200);
    assert.equal(valentines.statusCode, 200);
    assert.equal(anniversary.body.countryUnavailable, undefined);
    const anniversarySlugs = slugsOf(anniversary.body);
    const valentineSlugs = slugsOf(valentines.body);
    assertEachOnce(anniversarySlugs, ANNIVERSARY);
    assertEachOnce(valentineSlugs, VALENTINES);
    for (const slug of VALENTINES) assert.equal(anniversarySlugs.includes(slug), false);
    for (const slug of ANNIVERSARY) assert.equal(valentineSlugs.includes(slug), false);
    for (const slug of ["unrelated-tulip", "unpublished-anniversary-cake", "sold-out-valentine-hamper"]) {
      assert.equal(anniversarySlugs.includes(slug), false);
      assert.equal(valentineSlugs.includes(slug), false);
    }
  });

  it("excludes the same products when the request country is GB", async () => {
    const anniversary = slugsOf(resultOf(await categoryList("anniversary-gifts", { country: "GB" })).body);
    const valentines = slugsOf(resultOf(await categoryList("valentines-day-gifts", { country: "GB" })).body);
    for (const slug of [...ANNIVERSARY, ...VALENTINES]) {
      assert.equal(anniversary.includes(slug), false, slug);
      assert.equal(valentines.includes(slug), false, slug);
    }
  });

  it("excludes FNP products after that vendor is disabled and keeps the BlossomPot bouquets", async () => {
    await put(configTable, vendor("fnp", "FNP", "excel", false));
    const anniversary = slugsOf(resultOf(await categoryList("anniversary-gifts", { country: "US" })).body);
    const valentines = slugsOf(resultOf(await categoryList("valentines-day-gifts", { country: "US" })).body);
    assert.equal(anniversary.includes("love-in-full-bloom"), true);
    assert.equal(anniversary.includes("love-bloom-chocolate"), true);
    for (const slug of [...FNP_ANNIVERSARY, ...VALENTINES]) {
      assert.equal(anniversary.includes(slug), false, slug);
      assert.equal(valentines.includes(slug), false, slug);
    }
    await put(configTable, vendor("fnp", "FNP", "excel", true));
  });

  it("applies an explicit in-memory ZIP prefix without treating it as DEV coverage", async () => {
    await docClient.send(
      new DeleteCommand({
        TableName: configTable,
        Key: { PK: vendorCoverageKeys.pk("fnp"), SK: vendorCoverageKeys.areaSk("fixture-fnp-us-country") },
      })
    );
    const outside = slugsOf(
      resultOf(await categoryList("anniversary-gifts", { country: "US", postalCode: "10001" })).body
    );
    const inside = slugsOf(
      resultOf(await categoryList("valentines-day-gifts", { country: "US", postalCode: "92612" })).body
    );
    const insideAnniversary = slugsOf(
      resultOf(await categoryList("anniversary-gifts", { country: "US", postalCode: "92612" })).body
    );
    assert.equal(outside.includes("love-in-full-bloom"), true);
    assert.equal(outside.includes("love-bloom-chocolate"), true);
    for (const slug of FNP_ANNIVERSARY) assert.equal(outside.includes(slug), false, slug);
    assertEachOnce(inside, VALENTINES);
    assertEachOnce(insideAnniversary, ANNIVERSARY);
  });
});
