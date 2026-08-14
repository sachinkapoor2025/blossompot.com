/**
 * Import Orange County "USA single Rakhi catalogue 2026" sheet + images.
 *
 * Pricing: sale = vendorCost × 1.6 (60% profit), compareAt = vendorCost × 2.0
 * Category: single-rakhi (homepage section). vendorSlug=orange-county for vendor API.
 *
 * Usage:
 *   ENVIRONMENT=prod UPLOAD_BUCKET=... CLOUDFRONT_DOMAIN=... \
 *     npx tsx scripts/import-oc-single-rakhi-sheet.ts
 *
 *   DRY_RUN=1 npx tsx scripts/import-oc-single-rakhi-sheet.ts
 */
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, extname, basename, resolve } from "path";
import * as XLSX from "xlsx";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  VENDOR_ORANGE_COUNTY,
  ORANGE_COUNTY_PRODUCT_INVENTORY,
  categoryKeys,
  productKeys,
  metaDescription,
  roundMoney,
  resolveProductImagesForUpsert,
} from "@blossompot/shared";
import { buildHamperHtmlDescription, buildHamperSeoDescription } from "./lib/hamper-description";

const ENV = process.env.ENVIRONMENT ?? "prod";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const BUCKET = process.env.UPLOAD_BUCKET;
const CDN = process.env.CLOUDFRONT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const SKIP_S3 = process.env.SKIP_S3 === "1" || process.env.SKIP_S3 === "true";
const ROOT = resolve(process.cwd());

const EXCEL = join(ROOT, "docs/USA single Rakhi catalouge sheet 2026 (Autosaved).xlsx");
const IMG_DIRS = [
  join(ROOT, "docs/_oc-single-rakhi-images/USA Rakhi Images1"),
  join(ROOT, "docs/_oc-single-rakhi-images/from-excel"),
  join(ROOT, "USA Rakhi Images1/USA Rakhi Images1"),
];
const PUBLIC_IMG = join(ROOT, "apps/web/public/uploads/orange-county");
const CATALOG_OUT = join(ROOT, "scripts/data/orange-county-single-rakhi-2026.json");
const API_CATALOG = join(ROOT, "apps/api/src/data/orange-county-hampers.json");
const SCRIPTS_HAMPERS = join(ROOT, "scripts/data/orange-county-hampers.json");

const SALE_MARKUP = 1.6; // 60% profit
const LIST_MARKUP = 2.0;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const NAME_BANK_SINGLE = [
  "Elegant Pearl Designer Single Rakhi",
  "Royal Blue Stone Designer Single Rakhi",
  "Golden Thread Traditional Single Rakhi",
  "Emerald Charm Designer Single Rakhi",
  "Classic Maroon Designer Single Rakhi",
  "Silver Bead Traditional Single Rakhi",
  "Festive Ruby Designer Single Rakhi",
  "Sacred Om Designer Single Rakhi",
  "Premium Velvet Designer Single Rakhi",
  "Antique Gold Traditional Single Rakhi",
  "Crystal Drop Designer Single Rakhi",
  "Heritage Motif Designer Single Rakhi",
];

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

function safeSkuFolder(sku: string): string {
  return sku.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "sku";
}

function stemOf(file: string): string {
  return file
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[`']/g, "")
    .replace(/\s+/g, "")
    .replace(/\(1\)/g, "");
}

function imagesForSku(sku: string, files: string[]): string[] {
  const base = sku.toLowerCase().replace(/[`'\s]/g, "");
  const scored: { file: string; score: number }[] = [];
  for (const file of files) {
    const stem = stemOf(file);
    if (stem === base) {
      scored.push({ file, score: 100 });
      continue;
    }
    // SKUa / SKUb letter variants
    if (new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]$`, "i").test(stem)) {
      scored.push({ file, score: 95 });
      continue;
    }
    // Same SKU variants: letter suffix, QT2 pack codes, or -SETof2a style tails
    if (stem.startsWith(base)) {
      const rest = stem.slice(base.length);
      if (!rest || /^[a-z]$/i.test(rest)) {
        scored.push({ file, score: 95 });
        continue;
      }
      // Only "-SETof2a" tails for THIS sku — not sibling SKUs like TFPRD00312-338-SETof2
      if (/^[-_]?setof?\d*/i.test(rest)) {
        scored.push({ file, score: 90 });
        continue;
      }
      // TFPRD00298QT2 — letters then optional digits (not -338 numeric sibling SKUs)
      if (/^[a-z]{2,}\d*/i.test(rest) && !/^[-_]?\d/.test(rest)) {
        scored.push({ file, score: 80 });
        continue;
      }
    }
  }
  if (!scored.length) return [];
  // Keep all decent matches (primary + a/b/A + QT2 pack shots). Do not drop
  // score-80 variants just because an exact primary scored 100.
  return scored
    .filter((s) => s.score >= 80)
    .map((s) => s.file)
    .sort((a, b) => {
      const sa = stemOf(a);
      const sb = stemOf(b);
      if (sa === base) return -1;
      if (sb === base) return 1;
      return sa.localeCompare(sb);
    });
}

function detectSetSize(sku: string, imageNames: string[]): number {
  const skuL = sku.toLowerCase();
  if (/md005set5|set5$/i.test(skuL)) return 5;
  if (/set4$/i.test(skuL)) return 4;
  if (/set3$/i.test(skuL)) return 3;
  // Image filename must belong to this SKU (already filtered) and mention set size
  const blob = imageNames.join(" ").toLowerCase();
  if (/setof?5|set\s*of\s*5/.test(blob)) return 5;
  if (/setof?4|set\s*of\s*4/.test(blob)) return 4;
  if (/setof?3|set\s*of\s*3/.test(blob)) return 3;
  if (/setof?2|set\s*of\s*2/.test(blob)) return 2;
  return 1;
}

function attractiveName(sku: string, index: number, setSize: number): string {
  if (setSize >= 5) return `Premium Designer Rakhi Gift Set of 5 for Brother`;
  if (setSize === 4) return `Designer Rakhi Gift Set of 4 for Family`;
  if (setSize === 3) return `Designer Rakhi Gift Set of 3 for Brother`;
  if (setSize === 2) {
    return index % 2 === 0
      ? `Set of 2 Traditional Designer Rakhis for Brother`
      : `Twin Designer Rakhi Set of 2 — Premium Gift`;
  }
  return NAME_BANK_SINGLE[index % NAME_BANK_SINGLE.length]!;
}

function inclusionsFor(setSize: number): string {
  if (setSize >= 2) {
    return [`Set of ${setSize} designer Rakhis`, "Roli", "Chawal"].join("\n");
  }
  return ["1 designer Single Rakhi", "Roli", "Chawal"].join("\n");
}

function listAllImages(): { file: string; dir: string }[] {
  const out: { file: string; dir: string }[] = [];
  for (const dir of IMG_DIRS) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (/\.(jpe?g|png|webp)$/i.test(file)) out.push({ file, dir });
    }
  }
  return out;
}

function findImagePath(file: string, dirHint?: string): string | null {
  if (dirHint) {
    const p = join(dirHint, file);
    if (existsSync(p)) return p;
  }
  for (const dir of IMG_DIRS) {
    const p = join(dir, file);
    if (existsSync(p)) return p;
  }
  return null;
}

type BuiltProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: "USD";
  categorySlug: string;
  additionalCategorySlugs?: string[];
  images: string[];
  sku: string;
  inventory: number;
  tags: string[];
  vendorSlug: string;
  vendorCost: number;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  weightOz: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  createdAt: string;
  updatedAt: string;
  setSize: number;
  inventoryBatch?: string;
};

function parseSheet(): { sku: string; vendorCost: number }[] {
  const wb = XLSX.readFile(EXCEL);
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", header: 1 }) as unknown[][];
  const products: { sku: string; vendorCost: number }[] = [];
  for (const row of rows) {
    const cells = row as unknown[];
    const sku = String(cells[2] ?? "").trim();
    const price = Number(cells[3]);
    if (!sku || sku.toLowerCase() === "sku") continue;
    if (!Number.isFinite(price) || price <= 0) continue;
    products.push({ sku, vendorCost: price });
  }
  return products;
}

async function ensureS3Image(
  s3: S3Client,
  localPath: string,
  key: string,
  cache: Map<string, string>
): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;
  if (DRY_RUN) {
    const url = CDN ? `https://${CDN}/${key}` : `https://cdn.example/${key}`;
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
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: readFileSync(localPath),
      ContentType: MIME[ext] ?? "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  cache.set(key, url);
  console.log(`  ↑ ${key}`);
  return url;
}

function buildCatalog(): BuiltProduct[] {
  if (!existsSync(EXCEL)) throw new Error(`Missing excel: ${EXCEL}`);
  const rows = parseSheet();
  const allImgs = listAllImages();
  const fileNames = allImgs.map((i) => i.file);
  const ts = nowIso();
  const seenSlug = new Set<string>();
  const seenName = new Set<string>();
  const products: BuiltProduct[] = [];

  mkdirSync(PUBLIC_IMG, { recursive: true });

  rows.forEach((row, index) => {
    const matched = imagesForSku(row.sku, fileNames);
    const setSize = detectSetSize(row.sku, matched);
    let name = attractiveName(row.sku, index, setSize);
    if (seenName.has(name.toLowerCase())) {
      name = `${name} — Style ${index + 1}`;
    }
    seenName.add(name.toLowerCase());
    let slug = slugify(name);
    if (seenSlug.has(slug)) slug = `${slug}-${slugify(row.sku).slice(0, 20)}`;
    seenSlug.add(slug);

    const vendorCost = roundMoney(row.vendorCost, "USD");
    const price = roundMoney(vendorCost * SALE_MARKUP, "USD");
    const compareAtPrice = roundMoney(vendorCost * LIST_MARKUP, "USD");
    const inclusions = inclusionsFor(setSize);

    const folder = safeSkuFolder(row.sku);
    const destDir = join(PUBLIC_IMG, folder);
    mkdirSync(destDir, { recursive: true });

    const imageUrls: string[] = [];
    const used = new Set<string>();
    for (const file of matched) {
      const src = findImagePath(file);
      if (!src) continue;
      const safeName = basename(file).replace(/[`']/g, "").replace(/\s+/g, "-");
      if (used.has(safeName.toLowerCase())) continue;
      used.add(safeName.toLowerCase());
      copyFileSync(src, join(destDir, safeName));
      imageUrls.push(`/uploads/orange-county/${folder}/${safeName}`);
    }
    // Prefer excel thumbnail if still no images
    if (!imageUrls.length) {
      const excelFallback = findImagePath(`${row.sku}.jpg`, join(ROOT, "docs/_oc-single-rakhi-images/from-excel"));
      if (excelFallback) {
        const safeName = `${row.sku}.jpg`;
        copyFileSync(excelFallback, join(destDir, safeName));
        imageUrls.push(`/uploads/orange-county/${folder}/${safeName}`);
      }
    }

    const additionalCategorySlugs: string[] = [];
    if (setSize === 2) additionalCategorySlugs.push("2-set-rakhi");
    if (setSize === 3) additionalCategorySlugs.push("3-set-rakhi");
    if (setSize >= 4) additionalCategorySlugs.push("4-set-rakhi");

    products.push({
      name,
      slug,
      description: buildHamperHtmlDescription(name, inclusions, row.sku)
        .replace(/Rakhi hamper/gi, setSize >= 2 ? "Rakhi set" : "designer Rakhi")
        .replace(/gift hamper/gi, "Rakhi gift")
        .replace(/What's included in this hamper:/g, "What's included:"),
      price,
      compareAtPrice,
      currency: "USD",
      categorySlug: "single-rakhi",
      additionalCategorySlugs: additionalCategorySlugs.length ? additionalCategorySlugs : undefined,
      images: imageUrls,
      sku: row.sku,
      inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
      tags: [
        "single-rakhi",
        "designer-rakhi",
        "raksha-bandhan",
        "send-rakhi-to-usa",
        "inventory-2",
        setSize >= 2 ? `${setSize}-set-rakhi` : "single-rakhi-thread",
      ],
      /** Batch id — say “inventory 2” later to retarget these SKUs for price changes. */
      inventoryBatch: "inventory-2",
      vendorSlug: VENDOR_ORANGE_COUNTY,
      vendorCost,
      seoTitle: `Send ${name} to USA | Free Shipping | BlossomPot`,
      seoDescription: metaDescription(buildHamperSeoDescription(name, inclusions, price)),
      published: true,
      weightOz: setSize >= 2 ? 8 * setSize : 6,
      lengthIn: 8,
      widthIn: 6,
      heightIn: 2,
      createdAt: ts,
      updatedAt: ts,
      setSize,
    });
  });

  mkdirSync(join(ROOT, "scripts/data"), { recursive: true });
  writeFileSync(CATALOG_OUT, JSON.stringify({ products }, null, 2));

  // Merge into OC hamper catalogs so Lambda vendor upsert + SSR fallback include them
  for (const path of [API_CATALOG, SCRIPTS_HAMPERS]) {
    let existing: { products: BuiltProduct[] } = { products: [] };
    if (existsSync(path)) {
      existing = JSON.parse(readFileSync(path, "utf-8")) as { products: BuiltProduct[] };
    }
    const bySku = new Map(
      (existing.products ?? []).map((p) => [(p.sku ?? p.slug).toLowerCase(), p])
    );
    for (const p of products) bySku.set(p.sku.toLowerCase(), p);
    writeFileSync(path, JSON.stringify({ products: [...bySku.values()] }, null, 2));
  }

  return products;
}

async function importToAws(products: BuiltProduct[]) {
  console.log(`Import ${products.length} → table=${PRODUCTS_TABLE} DRY_RUN=${DRY_RUN} SKIP_S3=${SKIP_S3}`);
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

  const categoryItem = {
    name: "Single Rakhi",
    slug: "single-rakhi",
    description:
      "Designer and traditional single rakhis for USA delivery — roli chawal included, shipped from California.",
    seoTitle: "Send Single Rakhi to USA | Free Shipping | BlossomPot",
    seoDescription: metaDescription(
      "Shop designer single rakhi for USA delivery. Traditional and premium styles with roli chawal. Fast domestic shipping across America."
    ),
    published: true,
    sortOrder: 1,
    PK: categoryKeys.pk("single-rakhi"),
    SK: categoryKeys.sk(),
    GSI1PK: categoryKeys.gsi1pk(),
    GSI1SK: categoryKeys.gsi1sk(1, "single-rakhi"),
    createdAt: ts,
    updatedAt: ts,
  };

  if (!DRY_RUN) {
    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: categoryItem }));
    console.log("✓ category single-rakhi");
  }

  const report: Array<{
    sku: string;
    name: string;
    slug: string;
    vendorCost: number;
    price: number;
    images: number;
    status: string;
  }> = [];

  for (const row of products) {
    const imageUrls: string[] = [];
    if (!SKIP_S3) {
      for (const img of row.images) {
        if (img.startsWith("http")) {
          imageUrls.push(img);
          continue;
        }
        const rel = img.startsWith("/") ? img.slice(1) : img;
        const localPath = join(ROOT, "apps/web/public", rel.startsWith("uploads/") ? rel : img);
        if (!existsSync(localPath)) {
          console.warn(`  missing ${localPath}`);
          continue;
        }
        const key = rel.startsWith("uploads/") ? rel : `uploads/orange-county/${basename(localPath)}`;
        const url = await ensureS3Image(s3, localPath, key, uploadCache);
        if (url) imageUrls.push(url);
      }
    } else {
      imageUrls.push(...row.images);
    }

    const item = {
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      currency: "USD" as const,
      categorySlug: "single-rakhi",
      additionalCategorySlugs: row.additionalCategorySlugs,
      images: imageUrls,
      sku: row.sku,
      inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
      tags: row.tags,
      inventoryBatch: row.inventoryBatch ?? "inventory-2",
      vendorSlug: VENDOR_ORANGE_COUNTY,
      vendorCost: row.vendorCost,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      published: true,
      weightOz: row.weightOz,
      lengthIn: row.lengthIn,
      widthIn: row.widthIn,
      heightIn: row.heightIn,
      PK: productKeys.pk(row.slug),
      SK: productKeys.sk(),
      GSI1PK: productKeys.gsi1pk("single-rakhi"),
      GSI1SK: productKeys.gsi1sk(row.slug),
      createdAt: ts,
      updatedAt: ts,
    };

    let status = "created";
    if (!DRY_RUN) {
      const existing = await ddb.send(
        new GetCommand({
          TableName: PRODUCTS_TABLE,
          Key: { PK: productKeys.pk(row.slug), SK: productKeys.sk() },
        })
      );
      if (existing.Item) {
        status = "updated";
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
    } else {
      status = "dry-run";
    }

    report.push({
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      vendorCost: row.vendorCost,
      price: row.price,
      images: imageUrls.length,
      status,
    });
    console.log(
      `• ${row.sku} → $${row.price} (${row.vendorCost}×1.6) images=${imageUrls.length} /products/${row.slug}`
    );
  }

  return report;
}

async function main() {
  console.log("Building Orange County single-rakhi catalog (60% profit markup)…");
  const products = buildCatalog();
  console.log(`Catalog: ${products.length} products → ${CATALOG_OUT}`);
  const report = await importToAws(products);
  console.log("\n=== SUCCESS REPORT ===");
  console.log(
    [
      "SKU".padEnd(16),
      "Vendor$".padStart(8),
      "Sale$".padStart(8),
      "Imgs".padStart(4),
      "Status".padEnd(10),
      "Name",
    ].join(" | ")
  );
  for (const r of report) {
    console.log(
      [
        r.sku.padEnd(16),
        r.vendorCost.toFixed(2).padStart(8),
        r.price.toFixed(2).padStart(8),
        String(r.images).padStart(4),
        r.status.padEnd(10),
        r.name,
      ].join(" | ")
    );
  }
  writeFileSync(
    join(ROOT, "docs/_oc-single-rakhi-import-report.json"),
    JSON.stringify({ at: nowIso(), count: report.length, report }, null, 2)
  );
  console.log(`\nDone. ${report.filter((r) => r.status !== "dry-run" || DRY_RUN).length}/${report.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
