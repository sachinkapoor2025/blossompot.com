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
import { docClient, PRODUCTS_TABLE, now } from "./db";
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
    if (inv < ORANGE_COUNTY_PRODUCT_INVENTORY || existing.Item.vendorSlug !== VENDOR_ORANGE_COUNTY) {
      await docClient.send(
        new UpdateCommand({
          TableName: PRODUCTS_TABLE,
          Key: key,
          UpdateExpression:
            "SET inventory = :inv, vendorSlug = :vs, updatedAt = :u, published = :pub",
          ExpressionAttributeValues: {
            ":inv": ORANGE_COUNTY_PRODUCT_INVENTORY,
            ":vs": VENDOR_ORANGE_COUNTY,
            ":u": ts,
            ":pub": true,
          },
        })
      );
      return {
        ...existing.Item,
        inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
        vendorSlug: VENDOR_ORANGE_COUNTY,
        published: true,
        updatedAt: ts,
      };
    }
    return existing.Item as Record<string, unknown>;
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

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
  console.log(`upserted orange-county product ${slug} inventory=${ORANGE_COUNTY_PRODUCT_INVENTORY}`);
  return item;
}
