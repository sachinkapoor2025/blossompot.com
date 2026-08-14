/**
 * Seed 1,000+ sample marketplace products + SAMPLE VENDOR accounts.
 *
 * Usage:
 *   npm run seed:sample-products
 *   npm run seed:sample-products -- --count=1200
 *   npm run seed:sample-products -- --dry-run
 *   npm run seed:sample-products -- --write-json
 *   npm run seed:sample-products -- --download-pool   # cache Unsplash pool locally
 *
 * Env: DYNAMODB_ENDPOINT, PRODUCTS_TABLE, CONFIG_TABLE, ENVIRONMENT, AWS_REGION
 *
 * Safe: only upserts items with isSampleProduct=true / sample-* vendor slugs.
 * Does not overwrite non-sample products. Images merge via resolveProductImagesForUpsert.
 */
import { writeFileSync, mkdirSync, existsSync, createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  productKeys,
  categoryKeys,
  marketplaceVendorKeys,
  reviewKeys,
  resolveProductImagesForUpsert,
} from "@blossompot/shared";
import { generateSampleCatalog } from "./lib/sample-catalog/generate";
import { uniquePool, unsplashUrl } from "./lib/sample-catalog/image-pool";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const writeJson = args.includes("--write-json");
const downloadPool = args.includes("--download-pool");
const countArg = args.find((a) => a.startsWith("--count="));
const TARGET = countArg ? Math.max(1000, Number(countArg.split("=")[1]) || 1100) : 1100;

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(endpoint
    ? {
        endpoint,
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {}),
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const ENV = process.env.ENVIRONMENT ?? "dev";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`;
const now = () => new Date().toISOString();

const EXTRA_CATEGORIES = [
  { slug: "flowers", name: "Flowers", description: "Fresh flowers and arrangements", sortOrder: 1 },
  { slug: "flower-bouquets", name: "Flower Bouquets", description: "Hand-tied bouquets", sortOrder: 2 },
  { slug: "cakes", name: "Cakes", description: "Celebration cakes", sortOrder: 3 },
  { slug: "birthday-gifts", name: "Birthday Gifts", description: "Birthday gift combos", sortOrder: 4 },
  { slug: "anniversary-gifts", name: "Anniversary Gifts", description: "Anniversary gifts", sortOrder: 5 },
  { slug: "gift-hampers", name: "Gift Hampers", description: "Curated hampers", sortOrder: 6 },
  { slug: "personalized-gifts", name: "Personalized Gifts", description: "Custom gifts", sortOrder: 7 },
  { slug: "same-day-gifts", name: "Same-Day Gifts", description: "Faster local delivery demos", sortOrder: 8 },
  { slug: "valentines-day-gifts", name: "Valentine's Day", description: "Valentine gifts", sortOrder: 9 },
  { slug: "mothers-day-gifts", name: "Mother's Day", description: "Mother's Day gifts", sortOrder: 10 },
  { slug: "wedding-gifts", name: "Wedding Gifts", description: "Wedding gifts", sortOrder: 11 },
  { slug: "plants", name: "Plants", description: "Indoor and gift plants", sortOrder: 12 },
  { slug: "celebration-gifts", name: "Celebration Gifts", description: "Party and celebration gifts", sortOrder: 13 },
];

async function downloadImagePool() {
  const dir = join(process.cwd(), "scripts/data/sample-product-images/pool");
  mkdirSync(dir, { recursive: true });
  const pool = uniquePool();
  console.log(`Downloading ${pool.length} Unsplash pool images → ${dir}`);
  for (const photo of pool) {
    const dest = join(dir, `${photo.category}-${photo.id}.jpg`);
    if (existsSync(dest)) continue;
    const url = unsplashUrl(photo.id, 800, 0);
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) {
        console.warn(`Skip ${photo.id}: HTTP ${res.status}`);
        continue;
      }
      await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest));
      console.log(`  saved ${photo.id}`);
    } catch (err) {
      console.warn(`Skip ${photo.id}:`, err);
    }
  }
}

async function ensureCategories(ts: string) {
  for (const cat of EXTRA_CATEGORIES) {
    const existing = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: categoryKeys.pk(cat.slug), SK: categoryKeys.sk() },
      })
    );
    if (existing.Item) continue;
    if (dryRun) continue;
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          ...cat,
          published: true,
          PK: categoryKeys.pk(cat.slug),
          SK: categoryKeys.sk(),
          GSI1PK: categoryKeys.gsi1pk(),
          GSI1SK: categoryKeys.gsi1sk(cat.sortOrder, cat.slug),
          createdAt: ts,
          updatedAt: ts,
        },
      })
    );
  }
}

async function upsertVendors(
  vendors: ReturnType<typeof generateSampleCatalog>["vendors"],
  ts: string
) {
  for (const v of vendors) {
    if (dryRun) continue;
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          PK: marketplaceVendorKeys.pk(v.vendorId),
          SK: marketplaceVendorKeys.sk(),
          vendorId: v.vendorId,
          vendorSlug: v.vendorSlug,
          status: "active",
          businessName: v.businessName,
          contactName: "Sample Partner",
          email: `${v.vendorSlug}@sample.blossompot.local`,
          phone: "+1-555-0100",
          addressLine1: "100 Sample Street",
          city: v.city,
          state: v.state,
          zip: "00000",
          businessType: v.businessType,
          productCategories: [],
          sameDayAvailable: true,
          storePhotoUrls: [],
          documentUrls: [],
          isSampleVendor: true,
          notes: "SAMPLE VENDOR for development/demo only — not a real business.",
          createdAt: ts,
          updatedAt: ts,
        },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          PK: marketplaceVendorKeys.slugPk(v.vendorSlug),
          SK: marketplaceVendorKeys.slugSk(),
          vendorId: v.vendorId,
        },
      })
    );
  }
}

async function upsertProducts(
  products: ReturnType<typeof generateSampleCatalog>["products"],
  ts: string
) {
  let written = 0;
  let skippedReal = 0;
  for (const p of products) {
    const existing = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { PK: productKeys.pk(p.slug), SK: productKeys.sk() },
      })
    );
    if (existing.Item && existing.Item.isSampleProduct !== true) {
      skippedReal++;
      continue;
    }
    const { images } = resolveProductImagesForUpsert(
      p.images,
      (existing.Item?.images as string[] | undefined) ?? [],
      { allowShrink: true } // sample re-seed intentionally replaces sample galleries
    );
    if (dryRun) {
      written++;
      continue;
    }
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          ...p,
          images,
          PK: productKeys.pk(p.slug),
          SK: productKeys.sk(),
          GSI1PK: productKeys.gsi1pk(p.categorySlug),
          GSI1SK: productKeys.gsi1sk(p.slug),
          createdAt: (existing.Item?.createdAt as string) ?? ts,
          updatedAt: ts,
        },
      })
    );
    written++;
    if (written % 100 === 0) console.log(`  products upserted: ${written}`);
  }
  return { written, skippedReal };
}

async function seedSampleReviews(
  products: ReturnType<typeof generateSampleCatalog>["products"],
  ts: string
) {
  // ~1 review per 5 products keeps demo light but visible
  let count = 0;
  for (let i = 0; i < products.length; i += 5) {
    const p = products[i]!;
    const reviewId = `sample-${p.slug}-1`;
    if (dryRun) {
      count++;
      continue;
    }
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: reviewKeys.pk(p.slug),
          SK: reviewKeys.sk(reviewId),
          GSI1PK: reviewKeys.gsi1pk(),
          GSI1SK: reviewKeys.gsi1sk(ts, reviewId),
          reviewId,
          productSlug: p.slug,
          authorName: "Demo Shopper",
          rating: 4 + (i % 2),
          title: "Sample review",
          body: "This is a sample review for marketplace demo purposes only (isSampleReview=true).",
          source: "import",
          published: true,
          isSampleReview: true,
          createdAt: ts,
          updatedAt: ts,
        },
      })
    );
    count++;
  }
  return count;
}

function buildReport(products: ReturnType<typeof generateSampleCatalog>["products"]) {
  const byCategory: Record<string, number> = {};
  const byState: Record<string, number> = {};
  let with4 = 0;
  let with3 = 0;
  let images = 0;
  for (const p of products) {
    byCategory[p.categorySlug] = (byCategory[p.categorySlug] ?? 0) + 1;
    byState[p.sampleState] = (byState[p.sampleState] ?? 0) + 1;
    images += p.images.length;
    if (p.images.length >= 4) with4++;
    else if (p.images.length >= 3) with3++;
  }
  const slugs = products.map((p) => p.slug);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  return {
    totalProducts: products.length,
    totalImages: images,
    productsWith4Images: with4,
    productsWith3Images: with3,
    productsBelow3Images: products.filter((p) => p.images.length < 3).length,
    duplicateSlugs: [...new Set(dupSlugs)],
    missingPrices: products.filter((p) => !p.price).length,
    missingSeo: products.filter((p) => !p.seoTitle || !p.seoDescription).length,
    notMarkedSample: products.filter((p) => !p.isSampleProduct).length,
    byCategory,
    byState,
    sampleVendors: SAMPLE_VENDOR_COUNT,
  };
}

const SAMPLE_VENDOR_COUNT = 20;

async function main() {
  if (downloadPool) {
    await downloadImagePool();
  }

  console.log(`Generating ${TARGET} sample products…`);
  const { products, vendors } = generateSampleCatalog(TARGET);
  const report = buildReport(products);
  console.log(JSON.stringify(report, null, 2));

  if (writeJson || dryRun) {
    const outDir = join(process.cwd(), "scripts/data");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, "sample-marketplace-catalog.json");
    writeFileSync(outPath, JSON.stringify({ vendors, products, report }, null, 2));
    console.log(`Wrote ${outPath}`);
    const reportPath = join(outDir, "sample-marketplace-report.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  if (dryRun) {
    console.log("Dry run complete — no DynamoDB writes.");
    return;
  }

  const ts = now();
  console.log(`Seeding categories → ${PRODUCTS_TABLE}`);
  await ensureCategories(ts);
  console.log(`Seeding ${vendors.length} SAMPLE VENDORs → ${CONFIG_TABLE}`);
  await upsertVendors(vendors, ts);
  console.log(`Seeding ${products.length} sample products…`);
  const { written, skippedReal } = await upsertProducts(products, ts);
  const reviews = await seedSampleReviews(products, ts);
  console.log(
    `Done. productsWritten=${written} skippedRealConflicts=${skippedReal} sampleReviews=${reviews}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
