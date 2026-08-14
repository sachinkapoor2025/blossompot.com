/**
 * Validate generated / seeded sample catalog quality gates.
 *   npm run validate:sample-products
 *   npm run validate:sample-products -- --from-json
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateSampleCatalog } from "./lib/sample-catalog/generate";

const fromJson = process.argv.includes("--from-json");
const jsonPath = join(process.cwd(), "scripts/data/sample-marketplace-catalog.json");

type Prod = ReturnType<typeof generateSampleCatalog>["products"][number];

function load(): Prod[] {
  if (fromJson && existsSync(jsonPath)) {
    const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as { products: Prod[] };
    return data.products;
  }
  return generateSampleCatalog(1100).products;
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return true;
    const get = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    return get.ok || get.status === 206;
  } catch {
    return false;
  }
}

async function main() {
  const products = load();
  const errors: string[] = [];
  const slugs = new Set<string>();
  let with4 = 0;
  let with3 = 0;
  let imageCount = 0;

  for (const p of products) {
    if (slugs.has(p.slug)) errors.push(`Duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
    if (!p.isSampleProduct) errors.push(`Missing isSampleProduct: ${p.slug}`);
    if (!p.price) errors.push(`Missing price: ${p.slug}`);
    if (!p.description) errors.push(`Missing description: ${p.slug}`);
    if (!p.seoTitle || !p.seoDescription) errors.push(`Missing SEO: ${p.slug}`);
    if (!p.categorySlug) errors.push(`Missing category: ${p.slug}`);
    if ((p.images?.length ?? 0) < 3) errors.push(`<3 images: ${p.slug}`);
    if (p.images.length >= 4) with4++;
    else if (p.images.length >= 3) with3++;
    imageCount += p.images.length;
    if (!p.fulfilledByName?.includes("SAMPLE VENDOR")) {
      errors.push(`Vendor not marked SAMPLE: ${p.slug}`);
    }
  }

  // Spot-check first 12 image URLs (full 4k HEAD would be slow / rate-limited)
  const sampleUrls = products.slice(0, 3).flatMap((p) => p.images);
  let broken = 0;
  for (const url of sampleUrls) {
    const ok = await headOk(url);
    if (!ok) {
      broken++;
      errors.push(`Broken image (spot-check): ${url}`);
    }
  }

  const report = {
    totalProducts: products.length,
    passMin1000: products.length >= 1000,
    totalImages: imageCount,
    productsWith4Images: with4,
    productsWith3Images: with3,
    spotCheckedImages: sampleUrls.length,
    brokenSpotChecks: broken,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  };

  console.log(JSON.stringify(report, null, 2));
  if (products.length < 1000 || errors.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
