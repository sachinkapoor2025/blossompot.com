import { cdnUploadUrl } from "./image-url";

/** Hosted under CloudFront `/uploads/catalog/<file>`. Product-only photos — no people. */
export const CATALOG_IMAGE_FILES = [
  "roses-red-1.jpg",
  "roses-red-2.jpg",
  "roses-pink-1.jpg",
  "roses-pink-2.jpg",
  "roses-white-1.jpg",
  "mixed-bouquet-1.jpg",
  "mixed-bouquet-2.jpg",
  "peony-bouquet-1.jpg",
  "sunflower-1.jpg",
  "sunflower-2.jpg",
  "sunflower-3.jpg",
  "orchid-1.jpg",
  "tulip-1.jpg",
  "lily-1.jpg",
  "carnation-1.jpg",
  "cake-red-velvet-1.jpg",
  "cake-birthday-1.jpg",
  "cake-birthday-2.jpg",
  "cake-chocolate-1.jpg",
  "cake-sprinkle-1.jpg",
  "teddy-1.jpg",
  "teddy-2.jpg",
  "hamper-1.jpg",
  "hamper-2.jpg",
  "plant-1.jpg",
  "plant-2.jpg",
  "balloon-1.jpg",
  "balloon-2.jpg",
] as const;

export type CatalogImageFile = (typeof CATALOG_IMAGE_FILES)[number];

const SETS: Record<string, CatalogImageFile[]> = {
  sunflower: ["sunflower-1.jpg", "sunflower-2.jpg", "sunflower-3.jpg"],
  rosesRed: ["roses-red-1.jpg", "roses-red-2.jpg", "mixed-bouquet-1.jpg"],
  rosesPink: ["roses-pink-1.jpg", "roses-pink-2.jpg", "peony-bouquet-1.jpg"],
  rosesWhite: ["roses-white-1.jpg", "mixed-bouquet-2.jpg", "roses-pink-2.jpg"],
  orchid: ["orchid-1.jpg", "plant-1.jpg", "mixed-bouquet-2.jpg"],
  tulip: ["tulip-1.jpg", "mixed-bouquet-1.jpg", "peony-bouquet-1.jpg"],
  lily: ["lily-1.jpg", "mixed-bouquet-2.jpg", "roses-white-1.jpg"],
  carnation: ["carnation-1.jpg", "roses-pink-1.jpg", "mixed-bouquet-1.jpg"],
  peony: ["peony-bouquet-1.jpg", "roses-pink-2.jpg", "mixed-bouquet-2.jpg"],
  flowers: ["mixed-bouquet-1.jpg", "mixed-bouquet-2.jpg", "roses-pink-1.jpg"],
  redVelvet: ["cake-red-velvet-1.jpg", "cake-birthday-1.jpg", "cake-chocolate-1.jpg"],
  cakeKids: ["cake-sprinkle-1.jpg", "cake-birthday-2.jpg", "cake-birthday-1.jpg"],
  cake: ["cake-birthday-1.jpg", "cake-birthday-2.jpg", "cake-chocolate-1.jpg"],
  teddy: ["teddy-1.jpg", "teddy-2.jpg", "roses-red-1.jpg"],
  hamper: ["hamper-1.jpg", "hamper-2.jpg", "teddy-2.jpg"],
  plant: ["plant-1.jpg", "orchid-1.jpg", "plant-2.jpg"],
  balloon: ["balloon-1.jpg", "balloon-2.jpg", "cake-sprinkle-1.jpg"],
};

function catalogUrl(file: string): string {
  return cdnUploadUrl(`catalog/${file}`);
}

export function catalogImageUrls(files: readonly string[]): string[] {
  return files.map(catalogUrl);
}

/** Pick 3 product-only photos that match the SKU name/category. */
export function catalogImagesForProduct(input: {
  name?: string;
  slug?: string;
  categorySlug?: string;
  tags?: string[];
}): string[] {
  const hay = `${input.slug ?? ""} ${input.name ?? ""} ${(input.tags ?? []).join(" ")} ${input.categorySlug ?? ""}`.toLowerCase();
  const category = (input.categorySlug ?? "").toLowerCase();

  let files: CatalogImageFile[];
  if (/sunflower/.test(hay)) files = SETS.sunflower;
  else if (/teddy|plush/.test(hay)) files = SETS.teddy;
  else if (/red velvet|red-velvet/.test(hay)) files = SETS.redVelvet;
  else if (/kids|sprinkle|fun cake/.test(hay)) files = SETS.cakeKids;
  else if (/orchid/.test(hay)) files = SETS.orchid;
  else if (/tulip/.test(hay)) files = SETS.tulip;
  else if (/lil(y|ies)/.test(hay)) files = SETS.lily;
  else if (/carnation/.test(hay)) files = SETS.carnation;
  else if (/peony|blush/.test(hay)) files = SETS.peony;
  else if (/white rose/.test(hay)) files = SETS.rosesWhite;
  else if (/pink rose|blush bouquet/.test(hay)) files = SETS.rosesPink;
  else if (/red rose|premium red/.test(hay)) files = SETS.rosesRed;
  else if (/hamper|gift box|gift set/.test(hay) || /gift-hampers|personalized/.test(category)) files = SETS.hamper;
  else if (/balloon/.test(hay) || category.includes("balloon")) files = SETS.balloon;
  else if (/plant|succulent|bonsai|bamboo/.test(hay) || category === "plants") files = SETS.plant;
  else if (/cake|cupcake|truffle|cheesecake/.test(hay) || category === "cakes") files = SETS.cake;
  else if (/rose/.test(hay)) files = SETS.rosesRed;
  else files = SETS.flowers;

  const seed = Math.abs(
    Array.from(input.slug ?? input.name ?? "x").reduce((n, ch) => n + ch.charCodeAt(0), 0)
  );
  const rotated = files.map((_, i) => files[(i + (seed % files.length)) % files.length]!);
  return catalogImageUrls(rotated.slice(0, 3));
}
