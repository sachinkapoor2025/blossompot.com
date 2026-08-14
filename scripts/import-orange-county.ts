/**
 * Import Orange County Rakhi Hampers from scripts/data/orange-county-hampers.json
 * (generate first: COPY_IMAGES=1 npm run generate:orange-county-catalog).
 *
 * Pricing already applied in the catalog JSON (sale = cost × 2.0, list = cost × 2.5).
 * Products tagged vendorSlug=orange-county, category=rakhi-hampers (+ additionalCategorySlugs).
 *
 * Usage:
 *   ENVIRONMENT=prod \
 *   UPLOAD_BUCKET=... \
 *   CLOUDFRONT_DOMAIN=... \
 *   npm run import:orange-county
 *
 *   DRY_RUN=1 npm run import:orange-county
 *   SKIP_S3=1 ENVIRONMENT=local npm run import:orange-county
 */
import { readFileSync, existsSync } from "fs";
import { join, extname, basename, resolve } from "path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  VENDOR_ORANGE_COUNTY,
  ORANGE_COUNTY_CATEGORY_SLUG,
  ORANGE_COUNTY_PRODUCT_INVENTORY,
  categoryKeys,
  productKeys,
  metaDescription,
  resolveProductImagesForUpsert,
} from "@blossompot/shared";

const ENV = process.env.ENVIRONMENT ?? "prod";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const BUCKET = process.env.UPLOAD_BUCKET;
const CDN = process.env.CLOUDFRONT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const SKIP_S3 = process.env.SKIP_S3 === "1" || process.env.SKIP_S3 === "true";
const ROOT = resolve(process.cwd());
const CATALOG_PATH = join(ROOT, "scripts/data/orange-county-hampers.json");
const PUBLIC_ROOT = join(ROOT, "apps/web/public");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function nowIso() {
  return new Date().toISOString();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  inventory: number;
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

async function ensureS3Image(
  s3: S3Client,
  localPath: string,
  key: string,
  cache: Map<string, string>
): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;

  if (DRY_RUN) {
    const url = CDN ? `https://${CDN}/${key}` : `https://cdn.example/${key}`;
    console.log(`  [dry-run] would upload ${key}`);
    cache.set(key, url);
    return url;
  }

  if (!BUCKET || !CDN) throw new Error("UPLOAD_BUCKET and CLOUDFRONT_DOMAIN required");

  const url = `https://${CDN}/${key}`;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    cache.set(key, url);
    return url;
  } catch {
    /* upload */
  }

  const ext = extname(localPath).toLowerCase();
  const body = readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: MIME[ext] ?? "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  cache.set(key, url);
  console.log(`  ↑ ${key}`);
  return url;
}

async function main() {
  if (!existsSync(CATALOG_PATH)) {
    throw new Error(`Catalog not found: ${CATALOG_PATH}. Run: COPY_IMAGES=1 npm run generate:orange-county-catalog`);
  }

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8")) as { products: CatalogProduct[] };
  const rows = catalog.products ?? [];
  console.log(`Orange County import: ${rows.length} products from catalog`);
  console.log(`Table=${PRODUCTS_TABLE} DRY_RUN=${DRY_RUN} SKIP_S3=${SKIP_S3}`);

  if (!SKIP_S3 && (!BUCKET || !CDN) && !DRY_RUN) {
    throw new Error("Set UPLOAD_BUCKET and CLOUDFRONT_DOMAIN (or SKIP_S3=1 / DRY_RUN=1)");
  }

  const ddb = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" }),
    { marshallOptions: { removeUndefinedValues: true } }
  );
  const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });
  const uploadCache = new Map<string, string>();
  const ts = nowIso();
  const categorySlug = ORANGE_COUNTY_CATEGORY_SLUG;

  const categoryItem = {
    name: "Rakhi Hamper",
    slug: categorySlug,
    description:
      "Premium Rakhi gift hampers for USA delivery — festive boxes with designer rakhis, sweets, dry fruits, and chocolates.",
    seoTitle: "Send Rakhi Hamper to USA | Free Shipping | USA Rakhi",
    seoDescription: metaDescription(
      "Shop Rakhi hamper gift boxes for USA delivery. Combos with rakhi, kaju katli, dry fruits, and Ferrero. Fast domestic shipping across America."
    ),
    published: true,
    sortOrder: 15,
    PK: categoryKeys.pk(categorySlug),
    SK: categoryKeys.sk(),
    GSI1PK: categoryKeys.gsi1pk(),
    GSI1SK: categoryKeys.gsi1sk(15, categorySlug),
    createdAt: ts,
    updatedAt: ts,
  };

  if (DRY_RUN) {
    console.log("[dry-run] category", categoryItem.slug);
  } else {
    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: categoryItem }));
    console.log("✓ category", categorySlug);
  }

  let imported = 0;
  for (const row of rows) {
    const slug = row.slug || slugify(row.name);
    const imageUrls: string[] = [];

    if (!SKIP_S3) {
      for (const img of row.images ?? []) {
        if (img.startsWith("http")) {
          imageUrls.push(img);
          continue;
        }
        const rel = img.startsWith("/") ? img.slice(1) : img;
        const localPath = join(PUBLIC_ROOT, rel);
        if (!existsSync(localPath)) {
          console.warn(`  missing local image ${localPath}`);
          continue;
        }
        const key = rel.startsWith("uploads/") ? rel : `uploads/orange-county/${basename(localPath)}`;
        const url = await ensureS3Image(s3, localPath, key, uploadCache);
        if (url) imageUrls.push(url);
      }
    } else {
      imageUrls.push(...(row.images ?? []));
    }

    const item = {
      name: row.name,
      slug,
      description: row.description,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      currency: row.currency ?? "USD",
      categorySlug: row.categorySlug || categorySlug,
      additionalCategorySlugs: row.additionalCategorySlugs,
      images: imageUrls,
      sku: row.sku,
      inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
      tags: row.tags ?? ["rakhi-hamper", "gift-hamper", "raksha-bandhan", "dry-fruits", "send-rakhi-to-usa"],
      vendorSlug: row.vendorSlug ?? VENDOR_ORANGE_COUNTY,
      vendorCost: row.vendorCost,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      published: row.published !== false,
      weightOz: row.weightOz ?? 32,
      lengthIn: row.lengthIn ?? 10,
      widthIn: row.widthIn ?? 8,
      heightIn: row.heightIn ?? 4,
      PK: productKeys.pk(slug),
      SK: productKeys.sk(),
      GSI1PK: productKeys.gsi1pk(row.categorySlug || categorySlug),
      GSI1SK: productKeys.gsi1sk(slug),
      createdAt: ts,
      updatedAt: ts,
    };

    console.log(
      `• ${row.sku} → $${row.price} slug=${slug} extras=[${(row.additionalCategorySlugs ?? []).join(",")}] images=${imageUrls.length}`
    );

    if (DRY_RUN) continue;

    const existing = await ddb.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
      })
    );
    if (existing.Item) {
      // Always refresh OC stock to the catalog default (500) so cart never blocks on 0.
      item.inventory = ORANGE_COUNTY_PRODUCT_INVENTORY;
      item.createdAt = (existing.Item.createdAt as string) ?? ts;
      if (existing.Item.unitsSold != null) {
        (item as { unitsSold?: number }).unitsSold = existing.Item.unitsSold as number;
      }
      const { images } = resolveProductImagesForUpsert(
        imageUrls,
        existing.Item.images as string[] | undefined,
        { allowShrink: process.env.REPLACE_IMAGES === "1" || process.env.REPLACE_IMAGES === "true" }
      );
      item.images = images;
    }

    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));

    if (row.sku) {
      const legacySlug = slugify(`${row.name}-${row.sku}`);
      if (legacySlug !== slug) {
        await ddb.send(
          new DeleteCommand({
            TableName: PRODUCTS_TABLE,
            Key: { PK: productKeys.pk(legacySlug), SK: productKeys.sk() },
          })
        );
      }
    }

    imported += 1;
  }

  console.log(`Done. Imported/updated ${imported}/${rows.length} Orange County hampers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
