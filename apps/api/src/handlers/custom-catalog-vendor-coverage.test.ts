import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.CONFIG_TABLE = "blossompot-config-custom-vendor-coverage-test";
process.env.PRODUCTS_TABLE = "blossompot-products-custom-vendor-coverage-test";
process.env.CARTS_TABLE = "blossompot-carts-custom-vendor-coverage-test";
process.env.ORDERS_TABLE = "blossompot-orders-custom-vendor-coverage-test";
process.env.GBO_STOREFRONT_ENABLED = "false";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

const ADMIN = "Bearer dev:admin@blossompot.test:admin";
const APPLE = "apple-blossom-fulfillment";
const ZIP_VENDOR = "zip-bakery";
const CLOSED_VENDOR = "closed-bakery";
const TRASHED_VENDOR = "trashed-bakery";
const COOKIE = "gluten-free-cookie-collection";

let listProducts: Handler;
let getProduct: Handler;
let createCatalogVendorAdmin: Handler;
let updateCatalogVendorAdmin: Handler;
let trashCatalogVendorAdmin: Handler;
let updateCatalogCountriesAdmin: Handler;
let loadCoverageBundle: () => Promise<{ areas: Array<Record<string, unknown>>; activeVendorSlugs: string[] }>;
let putVendorArea: (
  vendorSlug: string,
  area: {
    countryCode: string;
    postalCode: string;
    scope: "POSTAL_CODE";
    ruleType: "ALLOW";
    isActive: boolean;
  }
) => Promise<unknown>;
let evaluateProductsForLocation: (
  products: Array<{ slug: string; vendorSlug?: string; published?: boolean; inventory?: number }>,
  location: { countryCode: string; postalCode: string }
) => Promise<Array<{ slug: string; deliverable: boolean; reason: string }>>;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productKeys: { pk: (slug: string) => string; sk: () => string };
let marketplaceVendorKeys: { pk: (id: string) => string; sk: () => string };
let invalidateProductListCache: () => void;

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  marketplaceVendorKeys = shared.marketplaceVendorKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  getProduct = products.getProduct;
  invalidateProductListCache = products.invalidateProductListCache;
  const vendors = await import("./catalog-vendors");
  createCatalogVendorAdmin = vendors.createCatalogVendorAdmin;
  updateCatalogVendorAdmin = vendors.updateCatalogVendorAdmin;
  trashCatalogVendorAdmin = vendors.trashCatalogVendorAdmin;
  const countries = await import("./catalog-countries");
  updateCatalogCountriesAdmin = countries.updateCatalogCountriesAdmin;
  const coverage = await import("../lib/serviceability-store");
  loadCoverageBundle = coverage.loadCoverageBundle as typeof loadCoverageBundle;
  putVendorArea = coverage.putVendorArea;
  const serviceability = await import("./serviceability");
  evaluateProductsForLocation = serviceability.evaluateProductsForLocation;

  await createVendor(APPLE, "Apple Blossom Fulfillment", true);
  await createVendor(ZIP_VENDOR, "Zip Bakery", true);
  await createVendor(CLOSED_VENDOR, "Closed Bakery", false);
  await createVendor(TRASHED_VENDOR, "Trashed Bakery", true);
  await putVendorArea(ZIP_VENDOR, {
    countryCode: "US",
    postalCode: "92612",
    scope: "POSTAL_CODE",
    ruleType: "ALLOW",
    isActive: true,
  });
  await docClient.send(
    new PutCommand({
      TableName: process.env.CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.pk("market-approved"),
        SK: marketplaceVendorKeys.sk(),
        status: "approved",
        vendorSlug: "market-bakery",
        deliveryZone: { zipCodes: ["10001"] },
      },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: process.env.CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.pk("market-pending"),
        SK: marketplaceVendorKeys.sk(),
        status: "pending",
        vendorSlug: "pending-bakery",
        deliveryZone: { zipCodes: ["10001"] },
      },
    })
  );

  for (const item of [
    product(COOKIE, "Gluten Free Cookie Collection", APPLE, { sku: "1083", deliveryCountries: ["US"] }),
    product("zip-cookie", "Zip Bakery Cookie", ZIP_VENDOR),
    product("closed-cookie", "Closed Bakery Cookie", CLOSED_VENDOR),
    product("trashed-cookie", "Trashed Bakery Cookie", TRASHED_VENDOR),
    product("unpublished-cookie-sample", "Unpublished Cookie Sample", APPLE, { published: false }),
    product("zero-stock-cookie-sample", "Zero Stock Cookie Sample", APPLE, { inventory: 0 }),
    product("us-only-cookie", "US Only Cookie", APPLE, { deliveryCountries: ["US"] }),
    product("open-country-cookie", "Open Country Cookie", APPLE),
    product("builtin-fnp-cookie", "Builtin FNP Cookie", "fnp"),
    product("builtin-blossompot-cookie", "Builtin BlossomPot Cookie"),
    product("builtin-oc-cookie", "Builtin Orange County Cookie", "orange-county"),
    product("builtin-gbo-cookie", "Builtin GBO Cookie", "gift-baskets-overseas", {
      internationalDelivery: true,
      sku: "gbo:US:1083",
    }),
  ]) {
    await docClient.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: item }));
  }
  invalidateProductListCache();
});

function product(
  slug: string,
  name: string,
  vendorSlug?: string,
  extra: Record<string, unknown> = {}
) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: "CATEGORY#cakes",
    GSI1SK: `PRODUCT#${slug}`,
    slug,
    name,
    description: `${name} assortment`,
    price: 55,
    currency: "USD",
    categorySlug: "cakes",
    images: ["https://cdn.example.com/cookie.jpg"],
    inventory: 200,
    published: true,
    ...(vendorSlug ? { vendorSlug } : {}),
    ...extra,
  };
}

function adminEvent(partial: Record<string, unknown>): APIGatewayProxyEventV2 {
  return {
    headers: { authorization: ADMIN },
    requestContext: { http: { method: "POST" } },
    ...partial,
  } as unknown as APIGatewayProxyEventV2;
}

function shopperEvent(query: Record<string, string>, path = "/products"): APIGatewayProxyEventV2 {
  return {
    headers: {},
    queryStringParameters: query,
    requestContext: { http: { method: "GET", path } },
    ...(path.startsWith("/products/") ? { pathParameters: { slug: path.split("/").pop() } } : {}),
  } as unknown as APIGatewayProxyEventV2;
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

async function createVendor(slug: string, name: string, enabled: boolean) {
  const created = resultOf(
    await createCatalogVendorAdmin(
      adminEvent({
        body: JSON.stringify({
          vendorName: name,
          vendorSlug: slug,
          integrationType: "local-catalog",
          deliveryCountries: ["US"],
          enabled,
        }),
      })
    )
  );
  assert.equal(created.statusCode, 201, JSON.stringify(created.body));
}

async function listed(query: Record<string, string>): Promise<string[]> {
  const listedProducts = resultOf(await listProducts(shopperEvent(query)));
  assert.equal(listedProducts.statusCode, 200, JSON.stringify(listedProducts.body));
  return slugsOf(listedProducts.body);
}

describe("custom catalog vendor coverage", { concurrency: false }, () => {
  it("loads a shopping-enabled custom vendor and its stored areas without inventing coverage", async () => {
    const bundle = await loadCoverageBundle();
    assert.equal(bundle.activeVendorSlugs.includes(APPLE), true);
    assert.equal(bundle.activeVendorSlugs.includes(ZIP_VENDOR), true);
    assert.equal(bundle.activeVendorSlugs.includes(CLOSED_VENDOR), false);
    assert.equal(bundle.activeVendorSlugs.includes("gift-baskets-overseas"), false);
    assert.equal(bundle.activeVendorSlugs.includes("fnp"), true);
    assert.equal(bundle.activeVendorSlugs.includes("blossompot"), true);
    assert.equal(bundle.activeVendorSlugs.includes("orange-county"), true);
    assert.equal(bundle.activeVendorSlugs.includes("market-bakery"), true);
    assert.equal(bundle.activeVendorSlugs.includes("pending-bakery"), false);
    assert.equal(new Set(bundle.activeVendorSlugs).size, bundle.activeVendorSlugs.length);

    assert.equal(bundle.areas.some((area) => area.vendorSlug === APPLE), false);
    const zipAreas = bundle.areas.filter((area) => area.vendorSlug === ZIP_VENDOR);
    assert.equal(zipAreas.length, 1);
    assert.equal(zipAreas[0]?.scope, "POSTAL_CODE");
    assert.equal(zipAreas[0]?.postalCode, "92612");
    assert.equal(bundle.areas.some((area) => area.vendorSlug === "fnp" && area.scope === "COUNTRY"), true);
    assert.equal(bundle.areas.some((area) => area.vendorSlug === "blossompot" && area.scope === "COUNTRY"), true);
    assert.equal(
      bundle.areas.some((area) => area.vendorSlug === "orange-county" && area.scope === "POSTAL_PREFIX"),
      true
    );
    assert.equal(
      bundle.areas.some((area) => area.vendorSlug === "market-bakery" && area.postalCode === "10001"),
      true
    );
  });

  it("lists the Apple Blossom cookie for the US when the vendor has no location-scoped areas", async () => {
    const search = await listed({ country: "US", search: "Gluten Free Cookie Collection" });
    assert.deepEqual(search, [COOKIE]);
    const detail = resultOf(await getProduct(shopperEvent({ country: "US" }, `/products/${COOKIE}`)));
    assert.equal(detail.statusCode, 200);
    const productBody = detail.body.product as { weightOz?: number; lengthIn?: number; sku?: string };
    assert.equal(productBody.sku, "1083");
    assert.equal(productBody.weightOz, undefined);
    assert.equal(productBody.lengthIn, undefined);
    const availability = detail.body.availability as { deliverable?: boolean; reason?: string };
    assert.equal(availability.deliverable, true);
    assert.equal(availability.reason, "matched");

    const evaluated = await evaluateProductsForLocation(
      [{ slug: COOKIE, vendorSlug: APPLE, published: true, inventory: 200 }],
      { countryCode: "US", postalCode: "10001" }
    );
    assert.equal(evaluated[0]?.deliverable, true);
    assert.equal(evaluated[0]?.reason, "matched");
  });

  it("keeps a custom vendor inside its stored ZIP coverage", async () => {
    const inside = await listed({ country: "US", postalCode: "92612", search: "Zip Bakery Cookie" });
    assert.deepEqual(inside, ["zip-cookie"]);
    const outside = await listed({ country: "US", postalCode: "10001", search: "Zip Bakery Cookie" });
    assert.deepEqual(outside, []);
    const evaluated = await evaluateProductsForLocation(
      [{ slug: "zip-cookie", vendorSlug: ZIP_VENDOR, published: true, inventory: 200 }],
      { countryCode: "US", postalCode: "10001" }
    );
    assert.equal(evaluated[0]?.deliverable, false);
    assert.equal(evaluated[0]?.reason, "no_matching_service_area");
  });

  it("leaves a disabled custom vendor and a trashed custom vendor inactive", async () => {
    assert.equal((await listed({ country: "US", search: "Closed Bakery Cookie" })).includes("closed-cookie"), false);
    const beforeTrash = await listed({ country: "US", search: "Trashed Bakery Cookie" });
    assert.deepEqual(beforeTrash, ["trashed-cookie"]);
    const trashed = resultOf(
      await trashCatalogVendorAdmin(
        adminEvent({
          body: JSON.stringify({ confirmName: "Trashed Bakery" }),
          pathParameters: { vendorSlug: TRASHED_VENDOR },
          requestContext: { http: { method: "POST" } },
        })
      )
    );
    assert.equal(trashed.statusCode, 200, JSON.stringify(trashed.body));
    assert.equal((await listed({ country: "US", search: "Trashed Bakery Cookie" })).includes("trashed-cookie"), false);
    const bundle = await loadCoverageBundle();
    assert.equal(bundle.activeVendorSlugs.includes(CLOSED_VENDOR), false);
    assert.equal(bundle.activeVendorSlugs.includes(TRASHED_VENDOR), false);
    const hidden = resultOf(await getProduct(shopperEvent({ country: "US" }, "/products/closed-cookie")));
    assert.equal(hidden.statusCode, 404);
  });

  it("keeps FNP and BlossomPot available in the US and Orange County inside its prefixes", async () => {
    const nationwide = await listed({ country: "US", search: "Builtin" });
    assert.equal(nationwide.includes("builtin-fnp-cookie"), true);
    assert.equal(nationwide.includes("builtin-blossompot-cookie"), true);
    assert.equal(nationwide.includes("builtin-oc-cookie"), false);
    assert.equal(nationwide.includes("builtin-gbo-cookie"), false);
    const orangeCounty = await listed({ country: "US", postalCode: "92612", search: "Builtin Orange County Cookie" });
    assert.deepEqual(orangeCounty, ["builtin-oc-cookie"]);
    const elsewhere = await listed({ country: "US", postalCode: "10001", search: "Builtin Orange County Cookie" });
    assert.deepEqual(elsewhere, []);
  });

  it("still applies search, publication, and inventory filters", async () => {
    const exact = await listed({ country: "US", search: "Gluten Free Cookie Collection" });
    assert.deepEqual(exact, [COOKIE]);
    assert.equal((await listed({ country: "US", search: "1083" })).includes(COOKIE), false);
    assert.equal(
      (await listed({ country: "US", search: "Unpublished Cookie Sample" })).includes("unpublished-cookie-sample"),
      false
    );
    assert.equal(
      (await listed({ country: "US", search: "Zero Stock Cookie Sample" })).includes("zero-stock-cookie-sample"),
      false
    );
  });

  it("hides a product whose delivery countries exclude the requested country", async () => {
    const countries = resultOf(
      await updateCatalogCountriesAdmin(
        adminEvent({
          body: JSON.stringify({
            countries: [
              { countryCode: "US", enabled: true },
              { countryCode: "GB", enabled: true },
            ],
            defaultCountry: "US",
          }),
          requestContext: { http: { method: "PUT" } },
        })
      )
    );
    assert.equal(countries.statusCode, 200, JSON.stringify(countries.body));
    const vendor = resultOf(
      await updateCatalogVendorAdmin(
        adminEvent({
          body: JSON.stringify({ enabled: true, deliveryCountries: ["US", "GB"] }),
          pathParameters: { vendorSlug: APPLE },
          requestContext: { http: { method: "PUT" } },
        })
      )
    );
    assert.equal(vendor.statusCode, 200, JSON.stringify(vendor.body));

    const britain = await listed({ country: "GB", search: "Cookie" });
    assert.equal(britain.includes("us-only-cookie"), false);
    assert.equal(britain.includes("open-country-cookie"), true);
    assert.equal(britain.includes(COOKIE), false);
    const unitedStates = await listed({ country: "US", search: "US Only Cookie" });
    assert.deepEqual(unitedStates, ["us-only-cookie"]);
  });
});
