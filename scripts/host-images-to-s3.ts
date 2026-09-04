/**
 * Download editorial / flower-guide / leftover product images and host them on S3 + CloudFront.
 *
 * Usage:
 *   ENVIRONMENT=prod \
 *   UPLOAD_BUCKET=blossompot-prod-uploadbucket-477egxwp8t34 \
 *   CLOUDFRONT_DOMAIN=d2d01h4hac5hqs.cloudfront.net \
 *   npx tsx scripts/host-images-to-s3.ts
 *
 * Optional: SKIP_PRODUCTS=1 to host editorial assets only.
 */
import { createHash } from "crypto";
import { existsSync, readFileSync, writeSync } from "fs";
import { extname, join } from "path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { resolveProductImagesForUpsert } from "@blossompot/shared";

const ENV = process.env.ENVIRONMENT ?? "prod";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const BUCKET = process.env.UPLOAD_BUCKET ?? "blossompot-prod-uploadbucket-477egxwp8t34";
const CDN = (process.env.CLOUDFRONT_DOMAIN ?? "d2d01h4hac5hqs.cloudfront.net")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const REGION = process.env.AWS_REGION ?? "us-east-1";
const SKIP_PRODUCTS = process.env.SKIP_PRODUCTS === "1";
const UA = "BlossomPotBot/1.0 (https://www.blossompot.com; support@blossompot.com)";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const WIKI_TITLES: Record<string, string> = {
  alstroemeria: "Alstroemeria",
  amaryllis: "Amaryllis",
  anemone: "Anemone coronaria",
  anthurium: "Anthurium",
  aster: "Aster (genus)",
  azalea: "Azalea",
  "babys-breath": "Gypsophila",
  begonia: "Begonia",
  "bird-of-paradise": "Strelitzia",
  bluebell: "Hyacinthoides non-scripta",
  bougainvillea: "Bougainvillea",
  "calla-lily": "Zantedeschia",
  carnation: "Dianthus caryophyllus",
  chrysanthemum: "Chrysanthemum",
  clematis: "Clematis",
  cosmos: "Cosmos (plant)",
  crocus: "Crocus",
  dahlia: "Dahlia",
  daffodil: "Narcissus (plant)",
  delphinium: "Delphinium",
  dianthus: "Dianthus",
  echinacea: "Echinacea",
  edelweiss: "Leontopodium nivale",
  "english-rose": "Garden roses",
  freesia: "Freesia",
  foxglove: "Digitalis",
  gardenia: "Gardenia",
  gerbera: "Gerbera",
  gladiolus: "Gladiolus",
  gomphrena: "Gomphrena",
  heather: "Calluna",
  hibiscus: "Hibiscus",
  honeysuckle: "Honeysuckle",
  hydrangea: "Hydrangea",
  hyacinth: "Hyacinth (plant)",
  iris: "Iris (plant)",
  ixora: "Ixora",
  jasmine: "Jasmine",
  jonquil: "Narcissus jonquilla",
  kalanchoe: "Kalanchoe",
  lavender: "Lavandula",
  lilac: "Syringa",
  lily: "Lilium",
  "lily-of-the-valley": "Convallaria majalis",
  lisianthus: "Eustoma",
  lotus: "Nelumbo nucifera",
  magnolia: "Magnolia",
  marigold: "Tagetes",
  mimosa: "Mimosa",
  "morning-glory": "Ipomoea",
  narcissus: "Narcissus (plant)",
  nasturtium: "Tropaeolum",
  nerine: "Nerine",
  orchid: "Orchid",
  osteospermum: "Osteospermum",
  peony: "Peony",
  poppy: "Papaver",
  protea: "Protea",
  primrose: "Primula",
  pansy: "Pansy",
  "queen-annes-lace": "Daucus carota",
  ranunculus: "Ranunculus asiaticus",
  rose: "Rose",
  rhododendron: "Rhododendron",
  snapdragon: "Antirrhinum",
  snowdrop: "Galanthus",
  statice: "Limonium",
  stock: "Matthiola",
  sunflower: "Helianthus",
  "sweet-pea": "Lathyrus odoratus",
  tuberose: "Agave amica",
  tulip: "Tulip",
  verbena: "Verbena",
  violet: "Viola (plant)",
  "water-lily": "Nymphaea",
  wisteria: "Wisteria",
  yarrow: "Achillea millefolium",
  zinnia: "Zinnia",
};

type ImageJob = {
  key: string;
  wikipedia?: string;
  unsplash?: string;
  extraUrls?: string[];
  search?: string;
};

const FLOWER_SLUGS = Object.keys(WIKI_TITLES);

const NAMED_FLOWER_FILES: { filename: string; wikipedia: string; unsplash?: string }[] = [
  { filename: "flower-guide-hero-mixed-blooms.jpg", wikipedia: "Flower", unsplash: "photo-1490750967868-88aa4486c946" },
  { filename: "red-rose-flower-close-up.jpg", wikipedia: "Rose", unsplash: "photo-1518621012118-4d0d512fdd5b" },
  { filename: "pink-rose-bouquet.jpg", wikipedia: "Bouquet", unsplash: "photo-1487530811176-3780de880c2d" },
  { filename: "pink-tulip-flowers.jpg", wikipedia: "Tulip", unsplash: "photo-1520763185298-1b434c919102" },
  { filename: "pink-peony-flower-close-up.jpg", wikipedia: "Peony", unsplash: "photo-1561181286-d3fee7d55364" },
  { filename: "white-orchid-flower-close-up.jpg", wikipedia: "Orchid", unsplash: "photo-1566938064504-a380d867ac89" },
  { filename: "white-lily-flower-close-up.jpg", wikipedia: "Lilium" },
  { filename: "yellow-sunflower-close-up.jpg", wikipedia: "Helianthus", unsplash: "photo-1597848212624-e593b1d6c0d6" },
  { filename: "blue-hydrangea-flower-close-up.jpg", wikipedia: "Hydrangea" },
  { filename: "pink-carnation-flower.jpg", wikipedia: "Dianthus caryophyllus" },
  { filename: "orange-gerbera-daisy-flower.jpg", wikipedia: "Gerbera" },
  { filename: "yellow-chrysanthemum-flower.jpg", wikipedia: "Chrysanthemum" },
  { filename: "alstroemeria-pink-flowers.jpg", wikipedia: "Alstroemeria" },
  { filename: "babys-breath-white-bouquet.jpg", wikipedia: "Gypsophila" },
  { filename: "white-calla-lily-flowers.jpg", wikipedia: "Zantedeschia" },
  { filename: "pink-dahlia-flower-close-up.jpg", wikipedia: "Dahlia" },
  { filename: "freesia-flowers-white-yellow.jpg", wikipedia: "Freesia" },
  { filename: "white-gardenia-flower-close-up.jpg", wikipedia: "Gardenia" },
  { filename: "purple-iris-flower.jpg", wikipedia: "Iris (plant)" },
  { filename: "purple-lavender-flowers.jpg", wikipedia: "Lavandula" },
  { filename: "pink-lisianthus-flowers.jpg", wikipedia: "Eustoma" },
  { filename: "peach-ranunculus-flower.jpg", wikipedia: "Ranunculus asiaticus" },
];

const EDITORIAL_JOBS: ImageJob[] = [
  { key: "uploads/editorial/home-banner-flowers.jpg", wikipedia: "Bouquet", unsplash: "photo-1490750967868-88aa4486c946", search: "flower bouquet" },
  { key: "uploads/editorial/home-banner-cakes.jpg", wikipedia: "Cake", unsplash: "photo-1578985545062-69928b1d9587", search: "birthday cake" },
  { key: "uploads/editorial/home-banner-hampers.jpg", wikipedia: "Gift basket", unsplash: "photo-1513885535751-8b9238bd345a", search: "gift hamper" },
  { key: "uploads/editorial/tile-flowers.jpg", wikipedia: "Flower", search: "cut flowers" },
  { key: "uploads/editorial/tile-bouquets.jpg", wikipedia: "Bouquet", search: "hand tied bouquet" },
  { key: "uploads/editorial/tile-birthday.jpg", wikipedia: "Birthday", search: "birthday flowers" },
  { key: "uploads/editorial/tile-anniversary.jpg", wikipedia: "Rose", search: "red roses" },
  { key: "uploads/editorial/tile-valentines.jpg", wikipedia: "Valentine's Day", search: "valentine roses" },
  { key: "uploads/editorial/tile-mothers-day.jpg", wikipedia: "Peony", search: "pink peony" },
  { key: "uploads/editorial/tile-wedding.jpg", wikipedia: "Wedding", search: "wedding bouquet" },
  { key: "uploads/editorial/tile-cakes.jpg", wikipedia: "Cake", search: "celebration cake" },
  { key: "uploads/editorial/tile-hampers.jpg", wikipedia: "Gift basket", search: "gift box" },
  { key: "uploads/editorial/tile-same-day.jpg", wikipedia: "Tulip", search: "fresh tulips" },
  { key: "uploads/editorial/tile-plants.jpg", wikipedia: "Houseplant", search: "indoor plant" },
  { key: "uploads/editorial/tile-personalized.jpg", wikipedia: "Gift", search: "gift box" },
  { key: "uploads/editorial/tile-celebration.jpg", wikipedia: "Party", search: "celebration balloons" },
  { key: "uploads/editorial/testimonial-emily.jpg", unsplash: "photo-1494790108377-be9c29b29330" },
  { key: "uploads/editorial/testimonial-sarah.jpg", unsplash: "photo-1438761681033-6461ffad8d80" },
  { key: "uploads/editorial/testimonial-priya.jpg", unsplash: "photo-1544005313-94ddf0286df2" },
  { key: "uploads/editorial/testimonial-jessica.jpg", unsplash: "photo-1580489944761-15a19d654956" },
  { key: "uploads/editorial/testimonial-amanda.jpg", unsplash: "photo-1531123897727-8f129e1688ce" },
];

function log(message: string): void {
  writeSync(1, `${message}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cdnUrl(key: string): string {
  return `https://${CDN}/${key}`;
}

function isCurrentCdn(url: string): boolean {
  return url.includes(CDN);
}

function extFromContentType(type: string | null, fallback = ".jpg"): string {
  if (!type) return fallback;
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  return fallback;
}

async function fetchBuffer(url: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("svg") || type.includes("html") || type.includes("xml")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 2000) return null;
    return { bytes, contentType: type || "image/jpeg" };
  } catch {
    return null;
  }
}

type WikiQuery = {
  query?: {
    redirects?: { to: string }[];
    pages?: Record<
      string,
      {
        missing?: string;
        thumbnail?: { source: string };
        original?: { source: string };
      }
    >;
  };
};

async function wikipediaThumb(title: string): Promise<string | null> {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("titles", title);
  api.searchParams.set("prop", "pageimages");
  api.searchParams.set("pithumbsize", "1600");
  api.searchParams.set("piprop", "thumbnail|original");
  api.searchParams.set("redirects", "1");
  api.searchParams.set("format", "json");
  const res = await fetch(api, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = (await res.json()) as WikiQuery;
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing != null) return null;
  return page.original?.source || page.thumbnail?.source || null;
}

type CommonsSearch = {
  query?: { search?: { title: string }[] };
};

type CommonsInfo = {
  query?: { pages?: Record<string, { imageinfo?: { url?: string; thumburl?: string; mime?: string }[] }> };
};

async function commonsSearchUrl(query: string): Promise<string | null> {
  const search = new URL("https://commons.wikimedia.org/w/api.php");
  search.searchParams.set("action", "query");
  search.searchParams.set("list", "search");
  search.searchParams.set("srsearch", query);
  search.searchParams.set("srnamespace", "6");
  search.searchParams.set("srlimit", "3");
  search.searchParams.set("format", "json");
  const found = await fetch(search, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!found.ok) return null;
  const data = (await found.json()) as CommonsSearch;
  for (const hit of data.query?.search ?? []) {
    const info = new URL("https://commons.wikimedia.org/w/api.php");
    info.searchParams.set("action", "query");
    info.searchParams.set("titles", hit.title);
    info.searchParams.set("prop", "imageinfo");
    info.searchParams.set("iiprop", "url|mime");
    info.searchParams.set("iiurlwidth", "1600");
    info.searchParams.set("format", "json");
    const infoRes = await fetch(info, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!infoRes.ok) continue;
    const infoData = (await infoRes.json()) as CommonsInfo;
    const page = Object.values(infoData.query?.pages ?? {})[0];
    const image = page?.imageinfo?.[0];
    if (!image?.url || image.mime?.includes("svg") || image.mime?.includes("pdf")) continue;
    return image.thumburl || image.url;
  }
  return null;
}

function unsplashUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1600&q=75`;
}

async function tryDownload(
  url: string,
  label: string
): Promise<{ bytes: Buffer; contentType: string; source: string } | null> {
  const downloaded = await fetchBuffer(url);
  return downloaded ? { ...downloaded, source: label } : null;
}

async function resolveSource(job: ImageJob): Promise<{ bytes: Buffer; contentType: string; source: string } | null> {
  if (job.wikipedia) {
    await sleep(80);
    const wiki = await wikipediaThumb(job.wikipedia);
    if (wiki) {
      const downloaded = await tryDownload(wiki, `wikipedia:${job.wikipedia}`);
      if (downloaded) return downloaded;
    }
  }

  if (job.search || job.wikipedia) {
    await sleep(80);
    const commons = await commonsSearchUrl(`${job.search ?? job.wikipedia} flower`);
    if (commons) {
      const downloaded = await tryDownload(commons, `commons:${job.search ?? job.wikipedia}`);
      if (downloaded) return downloaded;
    }
  }

  if (job.unsplash) {
    const downloaded = await tryDownload(unsplashUrl(job.unsplash), `unsplash:${job.unsplash}`);
    if (downloaded) return downloaded;
  }

  for (const extra of job.extraUrls ?? []) {
    const downloaded = await tryDownload(extra, extra);
    if (downloaded) return downloaded;
  }
  return null;
}

async function objectExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadBytes(
  s3: S3Client,
  key: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return cdnUrl(key);
}

async function uploadJob(s3: S3Client, job: ImageJob, logo: Buffer): Promise<{ url: string; fallback: boolean; source: string }> {
  if (await objectExists(s3, job.key)) {
    return { url: cdnUrl(job.key), fallback: false, source: "already-on-s3" };
  }

  const found = await resolveSource(job);
  if (found) {
    const url = await uploadBytes(s3, job.key, found.bytes, found.contentType);
    return { url, fallback: false, source: found.source };
  }

  const url = await uploadBytes(s3, job.key, logo, "image/png");
  return { url, fallback: true, source: "blossompot-logo" };
}

function editorialJobs(): ImageJob[] {
  const jobs: ImageJob[] = [...EDITORIAL_JOBS];
  for (const slug of FLOWER_SLUGS) {
    jobs.push({
      key: `uploads/flower-guide/${slug}.jpg`,
      wikipedia: WIKI_TITLES[slug],
      search: slug.replace(/-/g, " "),
    });
  }
  for (const named of NAMED_FLOWER_FILES) {
    jobs.push({
      key: `uploads/flower-guide/${named.filename}`,
      wikipedia: named.wikipedia,
      unsplash: named.unsplash,
      search: named.wikipedia,
    });
  }
  return jobs;
}

function hashUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

async function urlLooksAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return true;
    const get = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return get.ok;
  } catch {
    return false;
  }
}

async function rehostProducts(s3: S3Client, logoKey: string): Promise<void> {
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
  const logoUrl = cdnUrl(logoKey);
  let lastKey: Record<string, unknown> | undefined;
  let scanned = 0;
  let updated = 0;
  let rehosted = 0;
  let fallbacks = 0;

  do {
    const page = await doc.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of page.Items ?? []) {
      if (item.SK !== "META" || !String(item.PK ?? "").startsWith("PRODUCT#")) continue;
      scanned += 1;
      const images = Array.isArray(item.images) ? (item.images as string[]).filter(Boolean) : [];
      const next: string[] = [];

      if (images.length === 0) {
        next.push(logoUrl);
        fallbacks += 1;
      } else {
        for (const image of images) {
          if (isCurrentCdn(image)) {
            next.push(image);
            continue;
          }
          const downloaded = await fetchBuffer(image);
          if (downloaded) {
            const ext = extFromContentType(downloaded.contentType, extname(new URL(image, "https://x").pathname) || ".jpg");
            const key = `uploads/rehosted/${hashUrl(image)}${ext}`;
            if (!(await objectExists(s3, key))) {
              await uploadBytes(s3, key, downloaded.bytes, downloaded.contentType);
            }
            next.push(cdnUrl(key));
            rehosted += 1;
            continue;
          }
        }
        if (next.length === 0) {
          next.push(logoUrl);
          fallbacks += 1;
        }
      }

      const { images: safe } = resolveProductImagesForUpsert(next, images, { allowShrink: true });
      if (safe.join("|") === images.join("|")) continue;

      await doc.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: { ...item, images: safe, updatedAt: new Date().toISOString() },
        })
      );
      updated += 1;
      log(`  product ${item.slug ?? item.PK}: ${images.length} → ${safe.length} image(s)`);
    }

    lastKey = page.LastEvaluatedKey;
  } while (lastKey);

  log(`Products scanned=${scanned} updated=${updated} rehosted=${rehosted} logo-fallback=${fallbacks}`);
}

async function main() {
  if (!BUCKET || !CDN) {
    throw new Error("UPLOAD_BUCKET and CLOUDFRONT_DOMAIN are required");
  }

  log(`Hosting images to s3://${BUCKET} via ${CDN}`);
  const s3 = new S3Client({ region: REGION, maxAttempts: 2 });
  const logoPath = join(process.cwd(), "apps/web/public/logo.png");
  if (!existsSync(logoPath)) throw new Error(`Missing logo at ${logoPath}`);
  const logo = readFileSync(logoPath);
  const logoKey = "uploads/editorial/blossompot-logo.png";
  if (!(await objectExists(s3, logoKey))) {
    await uploadBytes(s3, logoKey, logo, "image/png");
    log("Uploaded BlossomPot logo fallback");
  }

  const jobs = editorialJobs();
  let hosted = 0;
  let reused = 0;
  let fallback = 0;
  for (const [index, job] of jobs.entries()) {
    const result = await uploadJob(s3, job, logo);
    if (result.source === "already-on-s3") reused += 1;
    else if (result.fallback) fallback += 1;
    else hosted += 1;
    log(`[${index + 1}/${jobs.length}] ${result.fallback ? "LOGO" : "OK"} ${job.key} ← ${result.source}`);
  }
  log(`Editorial done. hosted=${hosted} reused=${reused} logo-fallback=${fallback}`);

  if (!SKIP_PRODUCTS) {
    log(`Scanning ${PRODUCTS_TABLE} for off-CDN or broken product images...`);
    await rehostProducts(s3, logoKey);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
