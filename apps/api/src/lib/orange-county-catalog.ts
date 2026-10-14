/**
 * Bundled Orange County hamper catalog — used to auto-create DynamoDB products
 * when the storefront shows catalog fallback items that were never imported.
 */
import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  VENDOR_ORANGE_COUNTY,
  ORANGE_COUNTY_CATEGORY_SLUG,
  ORANGE_COUNTY_PRODUCT_INVENTORY,
  categoryKeys,
  productKeys,
  metaDescription,
} from "@blossompot/shared";
import { insertCatalogProduct, isTransactionConflict, transactCatalogItems } from "./catalog-sku-write";
import { docClient, PRODUCTS_TABLE, now } from "./db";
import { isStoredProductUnpublished } from "./product-publication";
import catalogJson from "../data/orange-county-hampers.json";

type CatalogProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD" | "INR";
  categorySlug: string;
  additionalCategorySlugs?: string[];
  images: string[];
  sku?: string;
  inventory?: number;
  tags?: string[];
  vendorSlug?: string;
  vendorCost?: number;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
  weightOz?: number;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
};

const products = (catalogJson as { products: CatalogProduct[] }).products ?? [];
const bySlug = new Map(products.map((p) => [p.slug, p]));

/** Allows `published = true` only while the row is still missing the flag or is not exactly false. */
const PUBLISHED_STILL_ELIGIBLE = "(attribute_not_exists(published) OR published = :pub)";

function orangeCountyRefresh(keepUnpublished: boolean, values: Record<string, unknown>) {
  return {
    UpdateExpression: keepUnpublished
      ? "SET inventory = :inv, vendorSlug = :vs, updatedAt = :u, images = :images, description = :description, seoTitle = :seoTitle, seoDescription = :seoDescription, tags = :tags"
      : "SET inventory = :inv, vendorSlug = :vs, updatedAt = :u, published = :pub, images = :images, description = :description, seoTitle = :seoTitle, seoDescription = :seoDescription, tags = :tags",
    ExpressionAttributeValues: values,
  };
}

export function getBundledOrangeCountyProduct(slug: string): CatalogProduct | undefined {
  return bySlug.get(slug);
}

async function ensureCategory(ts: string) {
  const slug = ORANGE_COUNTY_CATEGORY_SLUG;
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
        name: "Rakhi Hamper",
        slug,
        description:
          "Premium Rakhi gift hampers for USA delivery — festive boxes with designer rakhis, sweets, dry fruits, and chocolates.",
        seoTitle: "Send Rakhi Hamper to USA | Free Shipping | USA Rakhi",
        seoDescription: metaDescription(
          "Shop Rakhi hamper gift boxes for USA delivery. Fast domestic shipping across America."
        ),
        published: true,
        sortOrder: 15,
        PK: categoryKeys.pk(slug),
        SK: categoryKeys.sk(),
        GSI1PK: categoryKeys.gsi1pk(),
        GSI1SK: categoryKeys.gsi1sk(15, slug),
        createdAt: ts,
        updatedAt: ts,
      },
    })
  );
}

/**
 * Load OC product from DynamoDB, creating/updating from the bundled catalog if needed.
 * Always keeps inventory at least ORANGE_COUNTY_PRODUCT_INVENTORY (500).
 */
export async function ensureOrangeCountyProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  const bundled = bySlug.get(slug);
  if (!bundled) return null;

  const ts = now();
  await ensureCategory(ts);

  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: key,
    })
  );

  if (existing.Item) {
    const inv = Number(existing.Item.inventory ?? 0);
    const images = bundled.images ?? [];
    const tags = bundled.tags ?? ["rakhi-hamper", "gift-hamper", "raksha-bandhan"];
    const inventory = Math.max(inv, ORANGE_COUNTY_PRODUCT_INVENTORY);
    // An unpublished catalog row stays unpublished. A missing flag still refreshes as published.
    const keepUnpublished = isStoredProductUnpublished(existing.Item as { published?: boolean });
    const values: Record<string, unknown> = {
      ":inv": inventory,
      ":vs": VENDOR_ORANGE_COUNTY,
      ":u": ts,
      ":images": images,
      ":description": bundled.description,
      ":seoTitle": bundled.seoTitle,
      ":seoDescription": bundled.seoDescription,
      ":tags": tags,
    };
    if (!keepUnpublished) values[":pub"] = true;
    const refreshed = {
      ...existing.Item,
      inventory,
      vendorSlug: VENDOR_ORANGE_COUNTY,
      published: keepUnpublished ? false : true,
      updatedAt: ts,
      images,
      description: bundled.description,
      seoTitle: bundled.seoTitle,
      seoDescription: bundled.seoDescription,
      tags,
    };
    if (keepUnpublished) {
      await docClient.send(
        new UpdateCommand({
          TableName: PRODUCTS_TABLE,
          Key: key,
          ...orangeCountyRefresh(true, values),
        })
      );
      return refreshed;
    }

    // Setting published true must fail if an unpublish landed after the read.
    const publishing = orangeCountyRefresh(false, values);
    try {
      await transactCatalogItems([
        {
          Update: {
            TableName: PRODUCTS_TABLE,
            Key: key,
            ...publishing,
            ConditionExpression: PUBLISHED_STILL_ELIGIBLE,
          },
        },
      ]);
    } catch (err) {
      if (!isTransactionConflict(err)) throw err;
      const current = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: key }));
      if (!current.Item) throw err;
      const unpublishedNow = isStoredProductUnpublished(current.Item as { published?: boolean });
      const { ":pub": _published, ...safeValues } = values;
      try {
        if (unpublishedNow) {
          await docClient.send(
            new UpdateCommand({
              TableName: PRODUCTS_TABLE,
              Key: key,
              ...orangeCountyRefresh(true, safeValues),
            })
          );
        } else {
          await transactCatalogItems([
            {
              Update: {
                TableName: PRODUCTS_TABLE,
                Key: key,
                ...publishing,
                ConditionExpression: `attribute_exists(PK) AND ${PUBLISHED_STILL_ELIGIBLE}`,
              },
            },
          ]);
        }
      } catch (retryErr) {
        if (!isTransactionConflict(retryErr)) throw retryErr;
        await docClient.send(
          new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: key,
            ...orangeCountyRefresh(true, safeValues),
          })
        );
      }
      const fresh = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: key }));
      if (!fresh.Item) throw err;
      return fresh.Item as Record<string, unknown>;
    }
    return refreshed;
  }

  const categorySlug = bundled.categorySlug || ORANGE_COUNTY_CATEGORY_SLUG;
  const item = {
    name: bundled.name,
    slug: bundled.slug,
    description: bundled.description,
    price: bundled.price,
    compareAtPrice: bundled.compareAtPrice,
    currency: bundled.currency ?? "USD",
    categorySlug,
    additionalCategorySlugs: bundled.additionalCategorySlugs,
    images: bundled.images ?? [],
    sku: bundled.sku,
    inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
    tags: bundled.tags ?? ["rakhi-hamper", "gift-hamper", "raksha-bandhan", "send-rakhi-to-usa"],
    vendorSlug: VENDOR_ORANGE_COUNTY,
    vendorCost: bundled.vendorCost,
    seoTitle: bundled.seoTitle,
    seoDescription: bundled.seoDescription,
    published: true,
    weightOz: bundled.weightOz ?? 32,
    lengthIn: bundled.lengthIn ?? 10,
    widthIn: bundled.widthIn ?? 8,
    heightIn: bundled.heightIn ?? 4,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: ts,
    updatedAt: ts,
  };

  try {
    await insertCatalogProduct(item);
  } catch (err) {
    if (!isTransactionConflict(err)) throw err;
    const raced = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: key }));
    if (raced.Item) return raced.Item as Record<string, unknown>;
    throw err;
  }
  console.log(`upserted orange-county product ${slug} inventory=${ORANGE_COUNTY_PRODUCT_INVENTORY}`);
  return item;
}
