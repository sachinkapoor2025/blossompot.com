/**
 * Upsert Gift Baskets Overseas gifts into DynamoDB so add-to-cart / PDP work
 * the same way as Orange County catalog SKUs.
 */
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  GBO_CATEGORY_SLUG,
  GBO_PRODUCT_INVENTORY,
  VENDOR_GBO,
  categoryKeys,
  gboGiftToProduct,
  metaDescription,
  parseGboSlug,
  productKeys,
  type Product,
} from "@blossompot/shared";
import { docClient, PRODUCTS_TABLE, now } from "./db";
import { gboGetGift } from "./gbo-client";

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

async function upsertAtSlug(product: Product, slug: string, ts: string): Promise<Record<string, unknown>> {
  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: key,
    })
  );

  if (existing.Item) {
    await docClient.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: key,
        UpdateExpression:
          "SET #n = :n, description = :d, price = :p, images = :img, sku = :sku, inventory = :inv, vendorSlug = :vs, vendorCost = :vc, couponExcluded = :cx, published = :pub, indexable = :idx, internationalDelivery = :intl, fulfilledByName = :fn, updatedAt = :u",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: {
          ":n": product.name,
          ":d": product.description,
          ":p": product.price,
          ":img": product.images,
          ":sku": product.sku,
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
      })
    );
    return {
      ...existing.Item,
      ...product,
      slug,
      inventory: GBO_PRODUCT_INVENTORY,
      updatedAt: ts,
    };
  }

  const item = dynamoItemFromProduct(product, ts, slug);
  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
  return item;
}

export async function ensureGboProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  const ref = parseGboSlug(slug);
  if (!ref) return null;

  const gift = await gboGetGift(ref.country, ref.productId);
  const ts = now();
  const product = gboGiftToProduct(ref.country, gift, ts);
  await ensureGboCategory(ts);

  const canonical = await upsertAtSlug(product, product.slug, ts);
  if (product.slug !== slug) {
    return upsertAtSlug(product, slug, ts);
  }
  return canonical;
}
