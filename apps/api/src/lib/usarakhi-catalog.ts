/**
 * Bundled BlossomPot catalog — auto-creates DynamoDB products when the storefront
 * lists catalog fallback items that were never imported (or were deleted).
 *
 * Same pattern as orange-county-catalog.ts for hampers.
 */
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys, categoryKeys, DEFAULT_PRODUCT_INVENTORY } from "@blossompot/shared";
import { docClient, PRODUCTS_TABLE, now } from "./db";
import catalogJson from "../data/blossompot-catalog.json";

type CatalogCategory = {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
};

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
  couponExcluded?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
};

const categories = (catalogJson as { categories?: CatalogCategory[] }).categories ?? [];
const products = (catalogJson as { products: CatalogProduct[] }).products ?? [];
const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getBundledUsarakhiProduct(slug: string): CatalogProduct | undefined {
  return bySlug.get(slug);
}

/**
 * Ensure WooCommerce/catalog categories exist in Dynamo with GSI1 list keys.
 * Creates missing rows only — does not overwrite admin edits.
 */
export async function ensureUsarakhiCategoriesInDb(): Promise<number> {
  if (categories.length === 0) return 0;
  const ts = now();
  let created = 0;

  await Promise.all(
    categories.map(async (cat) => {
      const existing = await docClient.send(
        new GetCommand({
          TableName: PRODUCTS_TABLE,
          Key: { PK: categoryKeys.pk(cat.slug), SK: categoryKeys.sk() },
        })
      );
      if (existing.Item) {
        // Repair list index if a prior import wrote CATEGORY# without GSI1.
        if (existing.Item.GSI1PK !== categoryKeys.gsi1pk()) {
          const sortOrder =
            typeof existing.Item.sortOrder === "number"
              ? existing.Item.sortOrder
              : typeof cat.sortOrder === "number"
                ? cat.sortOrder
                : 0;
          await docClient.send(
            new PutCommand({
              TableName: PRODUCTS_TABLE,
              Item: {
                ...existing.Item,
                GSI1PK: categoryKeys.gsi1pk(),
                GSI1SK: categoryKeys.gsi1sk(sortOrder, cat.slug),
                updatedAt: ts,
              },
            })
          );
        }
        return;
      }

      const sortOrder = typeof cat.sortOrder === "number" ? cat.sortOrder : 0;
      await docClient.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? "",
            published: true,
            sortOrder,
            PK: categoryKeys.pk(cat.slug),
            SK: categoryKeys.sk(),
            GSI1PK: categoryKeys.gsi1pk(),
            GSI1SK: categoryKeys.gsi1sk(sortOrder, cat.slug),
            createdAt: ts,
            updatedAt: ts,
          },
        })
      );
      created += 1;
    })
  );

  if (created > 0) {
    console.log(`ensured ${created} blossompot catalog categories`);
  }
  return created;
}

/**
 * If the slug exists in the bundled catalog but not in DynamoDB, create it.
 * Does not overwrite existing products (prices/inventory stay admin-controlled).
 */
export async function ensureUsarakhiCatalogProductInDb(
  slug: string
): Promise<Record<string, unknown> | null> {
  const bundled = bySlug.get(slug);
  if (!bundled) return null;

  const key = { PK: productKeys.pk(slug), SK: productKeys.sk() };
  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: key,
    })
  );
  if (existing.Item) return existing.Item as Record<string, unknown>;

  const ts = now();
  const categorySlug = bundled.categorySlug;
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
    inventory: bundled.inventory ?? DEFAULT_PRODUCT_INVENTORY,
    tags: bundled.tags ?? [],
    ...(bundled.couponExcluded ? { couponExcluded: true } : {}),
    seoTitle: bundled.seoTitle,
    seoDescription: bundled.seoDescription,
    published: bundled.published !== false,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    createdAt: ts,
    updatedAt: ts,
  };

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
  console.log(`upserted blossompot catalog product ${slug}`);
  return item;
}
