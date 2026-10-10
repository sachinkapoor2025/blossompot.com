/**
 * Upsert Gift Baskets Overseas gifts into DynamoDB so add-to-cart / PDP work
 * the same way as Orange County catalog SKUs.
 */
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  GBO_CATEGORY_SLUG,
  GBO_PRODUCT_INVENTORY,
  VENDOR_GBO,
  categoryKeys,
  gboGiftToProduct,
  metaDescription,
  parseGboSlug,
  normalizeCatalogSku,
  productKeys,
  type Product,
} from "@blossompot/shared";
import { insertCatalogProduct, isTransactionConflict, skuClaimPut, skuReleaseDelete, transactCatalogItems } from "./catalog-sku-write";
import { docClient, PRODUCTS_TABLE, now } from "./db";
import { gboResolveGift } from "./gbo-client";

async function ensureGboCategory(ts: string) {
  const slug = GBO_CATEGORY_SLUG;
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: categoryKeys.pk(slug), SK: categoryKeys.sk() },
    })
  );
  if (existing.Item) return;

  await docClient.send(
    new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: {
        name: "Overseas Gift Baskets",
        slug,
        description:
          "International gift baskets delivered worldwide through our Gift Baskets Overseas partner. Delivery is included in the product price.",
        seoTitle: "Send Gift Baskets Overseas | International Delivery | BlossomPot",
        seoDescription: metaDescription(
          "Shop international gift baskets for delivery to 200+ countries. Worldwide fulfillment with no extra delivery fee."
        ),
        published: true,
        sortOrder: 80,
        PK: categoryKeys.pk(slug),
        SK: categoryKeys.sk(),
        GSI1PK: categoryKeys.gsi1pk(),
        GSI1SK: categoryKeys.gsi1sk(80, slug),
        createdAt: ts,
        updatedAt: ts,
      },
    })
  );
}

function dynamoItemFromProduct(product: Product, ts: string, slug: string): Record<string, unknown> {
  const item: Record<string, unknown> = {
    ...product,
    slug,
    inventory: GBO_PRODUCT_INVENTORY,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(product.categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: product.createdAt || ts,
    updatedAt: ts,
  };
  for (const [k, v] of Object.entries(item)) {
    if (v === undefined) delete item[k];
  }
  return item;
}

function gboFieldUpdate(product: Product, ts: string) {
  return {
    UpdateExpression:
      "SET #n = :n, description = :d, price = :p, images = :img, inventory = :inv, vendorSlug = :vs, vendorCost = :vc, couponExcluded = :cx, published = :pub, indexable = :idx, internationalDelivery = :intl, fulfilledByName = :fn, updatedAt = :u",
    ExpressionAttributeNames: { "#n": "name" },
    ExpressionAttributeValues: {
      ":n": product.name,
      ":d": product.description,
      ":p": product.price,
      ":img": product.images,
      ":inv": GBO_PRODUCT_INVENTORY,
      ":vs": VENDOR_GBO,
      ":vc": product.vendorCost ?? product.price,
      ":cx": true,
      ":pub": true,
      ":idx": false,
      ":intl": true,
      ":fn": product.fulfilledByName ?? "International delivery partner",
      ":u": ts,
    },
  };
}

/**
 * Refresh a stored GBO product from the gift that was read.
 * When the incoming SKU matches the SKU that was read, the write is conditional on that SKU.
 * A concurrent SKU change is left in place; price, images, and inventory still refresh.
 * An intentional SKU change uses the reservation transaction. A lost race does not restore the old SKU.
 */
export async function refreshExistingGboProduct(
  observed: Record<string, unknown>,
  product: Product,
  slug: string,
  ts: string
): Promise<Record<string, unknown>> {
  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const fields = gboFieldUpdate(product, ts);
  const previousSku = typeof observed.sku === "string" ? observed.sku : undefined;
  const skuChanged = normalizeCatalogSku(previousSku) !== normalizeCatalogSku(product.sku);
  const guard = typeof previousSku === "string"
    ? { ConditionExpression: "sku = :currentSku", extra: { ":currentSku": previousSku } }
    : { ConditionExpression: "attribute_not_exists(sku)", extra: {} as Record<string, unknown> };
  const skuUpdate = {
    TableName: PRODUCTS_TABLE,
    Key: key,
    UpdateExpression: `${fields.UpdateExpression}, sku = :sku`,
    ExpressionAttributeNames: fields.ExpressionAttributeNames,
    ExpressionAttributeValues: { ...fields.ExpressionAttributeValues, ":sku": product.sku, ...guard.extra },
    ConditionExpression: guard.ConditionExpression,
  };

  try {
    if (!skuChanged) {
      await transactCatalogItems([{ Update: skuUpdate }]);
    } else {
      const claim = product.sku ? skuClaimPut(PRODUCTS_TABLE, product.sku, slug) : null;
      const release = previousSku ? skuReleaseDelete(PRODUCTS_TABLE, previousSku, slug) : null;
      await transactCatalogItems([
        { Update: skuUpdate },
        ...(claim ? [claim] : []),
        ...(release ? [release] : []),
      ]);
    }
  } catch (err) {
    if (!isTransactionConflict(err)) throw err;
    await transactCatalogItems([
      {
        Update: {
          TableName: PRODUCTS_TABLE,
          Key: key,
          ...fields,
          ConditionExpression: "attribute_exists(PK)",
        },
      },
    ]);
    const fresh = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: key }));
    if (!fresh.Item) throw err;
    return fresh.Item as Record<string, unknown>;
  }

  return {
    ...observed,
    ...product,
    slug,
    inventory: GBO_PRODUCT_INVENTORY,
    updatedAt: ts,
  };
}

async function upsertAtSlug(product: Product, slug: string, ts: string): Promise<Record<string, unknown>> {
  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: key,
    })
  );

  if (existing.Item) {
    return refreshExistingGboProduct(existing.Item as Record<string, unknown>, product, slug, ts);
  }

  const item = dynamoItemFromProduct(product, ts, slug);
  try {
    await insertCatalogProduct(item);
  } catch (err) {
    if (!isTransactionConflict(err)) throw err;
    const raced = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: key }));
    if (raced.Item) return raced.Item as Record<string, unknown>;
    throw err;
  }
  return item;
}

export async function ensureGboProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  const ref = parseGboSlug(slug);
  if (!ref) return null;

  const gift = await gboResolveGift(ref.country, ref.productId);
  const ts = now();
  const product = gboGiftToProduct(ref.country, gift, ts);
  await ensureGboCategory(ts);

  const canonical = await upsertAtSlug(product, product.slug, ts);
  if (product.slug !== slug) {
    return upsertAtSlug(product, slug, ts);
  }
  return canonical;
}
