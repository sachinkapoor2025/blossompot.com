import { imagesForProduct } from "./image-pool";

export type SampleVendorDef = {
  vendorId: string;
  vendorSlug: string;
  businessName: string;
  city: string;
  state: string;
  businessType: string;
  isSampleVendor: true;
};

export const SAMPLE_VENDORS: SampleVendorDef[] = [
  { vendorId: "sample-la-florist", vendorSlug: "sample-la-florist", businessName: "SAMPLE VENDOR — Los Angeles Florist Demo", city: "Los Angeles", state: "CA", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-sf-flowers", vendorSlug: "sample-sf-flowers", businessName: "SAMPLE VENDOR — San Francisco Flower Studio Demo", city: "San Francisco", state: "CA", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-sd-floral", vendorSlug: "sample-sd-floral", businessName: "SAMPLE VENDOR — San Diego Floral Boutique Demo", city: "San Diego", state: "CA", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-sj-cakes", vendorSlug: "sample-sj-cakes", businessName: "SAMPLE VENDOR — San Jose Cake House Demo", city: "San Jose", state: "CA", businessType: "cake_shop", isSampleVendor: true },
  { vendorId: "sample-sac-gifts", vendorSlug: "sample-sac-gifts", businessName: "SAMPLE VENDOR — Sacramento Gift Studio Demo", city: "Sacramento", state: "CA", businessType: "gift_shop", isSampleVendor: true },
  { vendorId: "sample-irvine-cakes", vendorSlug: "sample-irvine-cakes", businessName: "SAMPLE VENDOR — Irvine Celebration Cakes Demo", city: "Irvine", state: "CA", businessType: "cake_shop", isSampleVendor: true },
  { vendorId: "sample-oakland-flowers", vendorSlug: "sample-oakland-flowers", businessName: "SAMPLE VENDOR — Oakland Flower Market Demo", city: "Oakland", state: "CA", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-nyc-gifts", vendorSlug: "sample-nyc-gifts", businessName: "SAMPLE VENDOR — New York Celebration Gifts Demo", city: "New York", state: "NY", businessType: "gift_shop", isSampleVendor: true },
  { vendorId: "sample-austin-flowers", vendorSlug: "sample-austin-flowers", businessName: "SAMPLE VENDOR — Austin Bloom Co Demo", city: "Austin", state: "TX", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-miami-cakes", vendorSlug: "sample-miami-cakes", businessName: "SAMPLE VENDOR — Miami Sweet Studio Demo", city: "Miami", state: "FL", businessType: "cake_shop", isSampleVendor: true },
  { vendorId: "sample-chicago-gifts", vendorSlug: "sample-chicago-gifts", businessName: "SAMPLE VENDOR — Chicago Gift Atelier Demo", city: "Chicago", state: "IL", businessType: "gift_shop", isSampleVendor: true },
  { vendorId: "sample-seattle-plants", vendorSlug: "sample-seattle-plants", businessName: "SAMPLE VENDOR — Seattle Plant Studio Demo", city: "Seattle", state: "WA", businessType: "other", isSampleVendor: true },
  { vendorId: "sample-boston-flowers", vendorSlug: "sample-boston-flowers", businessName: "SAMPLE VENDOR — Boston Petals Demo", city: "Boston", state: "MA", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-atlanta-gifts", vendorSlug: "sample-atlanta-gifts", businessName: "SAMPLE VENDOR — Atlanta Celebrate Demo", city: "Atlanta", state: "GA", businessType: "gift_shop", isSampleVendor: true },
  { vendorId: "sample-denver-flowers", vendorSlug: "sample-denver-flowers", businessName: "SAMPLE VENDOR — Denver Mountain Blooms Demo", city: "Denver", state: "CO", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-phoenix-gifts", vendorSlug: "sample-phoenix-gifts", businessName: "SAMPLE VENDOR — Phoenix Desert Gifts Demo", city: "Phoenix", state: "AZ", businessType: "gift_shop", isSampleVendor: true },
  { vendorId: "sample-vegas-party", vendorSlug: "sample-vegas-party", businessName: "SAMPLE VENDOR — Las Vegas Party Decor Demo", city: "Las Vegas", state: "NV", businessType: "balloon_decor", isSampleVendor: true },
  { vendorId: "sample-philly-cakes", vendorSlug: "sample-philly-cakes", businessName: "SAMPLE VENDOR — Philadelphia Cake Lab Demo", city: "Philadelphia", state: "PA", businessType: "cake_shop", isSampleVendor: true },
  { vendorId: "sample-dc-flowers", vendorSlug: "sample-dc-flowers", businessName: "SAMPLE VENDOR — Washington DC Florals Demo", city: "Washington", state: "DC", businessType: "florist", isSampleVendor: true },
  { vendorId: "sample-nj-gifts", vendorSlug: "sample-nj-gifts", businessName: "SAMPLE VENDOR — Newark Gift Hub Demo", city: "Newark", state: "NJ", businessType: "gift_shop", isSampleVendor: true },
];

export type GeneratedSampleProduct = {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD";
  categorySlug: string;
  subcategory: string;
  images: string[];
  imageAssets: ReturnType<typeof imagesForProduct>["imageAssets"];
  sku: string;
  inventory: number;
  tags: string[];
  vendorSlug: string;
  vendorCost: number;
  fulfilledByName: string;
  isSampleProduct: true;
  seoTitle: string;
  seoDescription: string;
  published: true;
  featured: boolean;
  sameDayAvailable: boolean;
  nextDayAvailable: boolean;
  deliveryFee: number;
  prepTimeHours: number;
  occasion?: string;
  recipient?: string;
  sampleCity: string;
  sampleState: string;
  variants?: Array<{ label: string; sku?: string; price?: number; inventory?: number }>;
  weightOz: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  ratingAggregate: { ratingValue: number; reviewCount: number; bestRating: 5; worstRating: 1 };
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function pickPrice(tier: number[], i: number) {
  return tier[i % tier.length]!;
}

const FLOWER_PRICES = [39.99, 49.99, 59.99, 69.99, 89.99, 119.99];
const CAKE_PRICES = [39.99, 49.99, 59.99, 79.99, 99.99];
const COMBO_PRICES = [59.99, 79.99, 99.99, 129.99, 149.99];
const GIFT_PRICES = [29.99, 39.99, 49.99, 69.99, 89.99];
const PLANT_PRICES = [24.99, 34.99, 44.99, 54.99, 74.99];
const BALLOON_PRICES = [29.99, 39.99, 49.99, 59.99, 79.99];

const ADJECTIVES = [
  "Classic",
  "Premium",
  "Luxury",
  "Elegant",
  "Signature",
  "Garden",
  "Sunset",
  "Sunrise",
  "Velvet",
  "Crystal",
  "Golden",
  "Blush",
  "Ivory",
  "Radiant",
  "Heirloom",
  "Artisan",
  "Boutique",
  "Festival",
  "Romantic",
  "Celebration",
];

const FLOWER_TYPES = [
  { name: "Red Roses", sub: "red-roses", cat: "flowers" as const },
  { name: "White Roses", sub: "white-roses", cat: "flowers" as const },
  { name: "Pink Roses", sub: "pink-roses", cat: "flowers" as const },
  { name: "Yellow Roses", sub: "yellow-roses", cat: "flowers" as const },
  { name: "Mixed Roses", sub: "roses", cat: "flowers" as const },
  { name: "Carnations", sub: "carnations", cat: "flower-bouquets" as const },
  { name: "Lilies", sub: "lilies", cat: "flower-bouquets" as const },
  { name: "Tulips", sub: "tulips", cat: "flower-bouquets" as const },
  { name: "Orchids", sub: "orchids", cat: "flowers" as const },
  { name: "Sunflowers", sub: "sunflowers", cat: "flower-bouquets" as const },
  { name: "Gerberas", sub: "gerberas", cat: "flower-bouquets" as const },
  { name: "Seasonal Blooms", sub: "seasonal", cat: "flowers" as const },
  { name: "Mixed Bouquet", sub: "mixed-bouquets", cat: "flower-bouquets" as const },
  { name: "Flower Basket", sub: "flower-baskets", cat: "flower-bouquets" as const },
  { name: "Luxury Arrangement", sub: "luxury-arrangements", cat: "flowers" as const },
];

const PRESENTATIONS = ["Bouquet", "Arrangement", "Vase Set", "Wrapped Hand-Tied", "Designer Display"];
const STEM_COUNTS = ["12 stems", "18 stems", "24 stems", "36 stems", "50 stems"];

const CAKE_FLAVORS = [
  "Chocolate",
  "Black Forest",
  "Red Velvet",
  "Vanilla",
  "Butterscotch",
  "Strawberry",
  "Pineapple",
  "Cheesecake",
  "Photo Cake",
  "Designer Frosted",
  "Wedding Tier",
  "Anniversary",
  "Cupcake Dozen",
  "Bento",
  "Premium Truffle",
];
const CAKE_OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Congratulations", "Thank You", "Celebration"];

const GIFT_TYPES = [
  "Chocolate Hamper",
  "Gourmet Gift Box",
  "Personalized Mug Set",
  "Cushion Gift",
  "Photo Frame Gift",
  "Greeting Card Bundle",
  "Plush Teddy Gift",
  "Jewelry Keepsake Box",
  "Celebration Gift Set",
  "Spa Relaxation Kit",
];

const PLANT_TYPES = [
  "Indoor Peace Lily",
  "Flowering Orchid Plant",
  "Succulent Trio",
  "Mini Bonsai",
  "Lucky Bamboo Set",
  "Plant Gift Set",
  "Decorative Planter Duo",
  "Snake Plant",
  "Money Plant",
  "Jade Plant",
];

const BALLOON_TYPES = [
  "Birthday Balloon Set",
  "Anniversary Decoration Kit",
  "Number Balloon Duo",
  "Helium Balloon Bouquet",
  "Balloon Bouquet Deluxe",
  "Party Decoration Kit",
  "Congratulations Balloon Arch Mini",
  "Foil Balloon Mix",
];

const COMBOS = [
  { name: "Flowers + Cake", tags: ["combo", "flowers", "cake"] },
  { name: "Flowers + Chocolates", tags: ["combo", "flowers", "chocolates"] },
  { name: "Roses + Teddy", tags: ["combo", "roses", "plush"] },
  { name: "Cake + Balloons", tags: ["combo", "cake", "balloons"] },
  { name: "Flowers + Gift Hamper", tags: ["combo", "flowers", "hamper"] },
  { name: "Cake + Chocolates", tags: ["combo", "cake", "chocolates"] },
  { name: "Birthday Combo", tags: ["combo", "birthday"] },
  { name: "Anniversary Combo", tags: ["combo", "anniversary"] },
  { name: "Romantic Combo", tags: ["combo", "romantic"] },
  { name: "Congratulations Combo", tags: ["combo", "congratulations"] },
  { name: "Thank You Combo", tags: ["combo", "thank-you"] },
  { name: "Get Well Soon Combo", tags: ["combo", "get-well"] },
  { name: "Mother's Day Combo", tags: ["combo", "mothers-day"] },
  { name: "Valentine's Day Combo", tags: ["combo", "valentines"] },
];

const OCCASIONS = ["birthday", "anniversary", "wedding", "thank-you", "congratulations", "get-well", "romance", "celebration"];
const RECIPIENTS = ["partner", "parent", "friend", "colleague", "family", "self"];

function vendorFor(i: number, prefer: "florist" | "cake_shop" | "gift_shop" | "other" | "balloon_decor") {
  const matched = SAMPLE_VENDORS.filter((v) => v.businessType === prefer);
  const pool = matched.length ? matched : SAMPLE_VENDORS;
  return pool[i % pool.length]!;
}

function desc(name: string, city: string, state: string, kind: string): { long: string; short: string; seoTitle: string; seoDesc: string } {
  const short = `${name} — demo sample gift for ${city}, ${state}. Temporary BlossomPot marketplace catalog item.`;
  const long = [
    `${name} is a sample marketplace listing for BlossomPot development and vendor onboarding demos.`,
    `Styled as a ${kind} gift available for local delivery simulation around ${city}, ${state}.`,
    `This product is marked isSampleProduct=true and uses Unsplash sample photography under the Unsplash License.`,
    `Replace with a real vendor product when onboarding completes — do not treat this as live inventory.`,
    `Customers see BlossomPot as the brand; fulfillment is attributed to a clearly labeled SAMPLE VENDOR for demo only.`,
  ].join(" ");
  return {
    short,
    long,
    seoTitle: `${name} | Sample Gift Demo | BlossomPot`,
    seoDesc: `Sample ${kind} listing: ${name}. Demo catalog for BlossomPot USA marketplace testing in ${city}, ${state}.`,
  };
}

export function generateSampleCatalog(target = 1100): {
  products: GeneratedSampleProduct[];
  vendors: SampleVendorDef[];
} {
  const products: GeneratedSampleProduct[] = [];
  const usedSlugs = new Set<string>();
  let idx = 0;

  const quotas = {
    flowers: Math.floor(target * 0.28),
    cakes: Math.floor(target * 0.22),
    gifts: Math.floor(target * 0.16),
    plants: Math.floor(target * 0.1),
    balloons: Math.floor(target * 0.08),
    combos: Math.floor(target * 0.16),
  };

  const push = (
    partial: Omit<GeneratedSampleProduct, "slug" | "sku" | "images" | "imageAssets" | "ratingAggregate"> & {
      imageCat: "flowers" | "cakes" | "gifts" | "plants" | "balloons";
    },
    quotaKey?: keyof typeof quotas
  ) => {
    if (quotaKey && products.filter((p) => {
      if (quotaKey === "flowers") return p.categorySlug === "flowers" || p.categorySlug === "flower-bouquets";
      if (quotaKey === "cakes") return p.categorySlug === "cakes";
      if (quotaKey === "plants") return p.categorySlug === "plants";
      if (quotaKey === "balloons") return (p.tags ?? []).includes("balloons");
      if (quotaKey === "combos") return (p.tags ?? []).includes("combo");
      return ["gift-hampers", "personalized-gifts", "celebration-gifts"].includes(p.categorySlug);
    }).length >= quotas[quotaKey]) {
      return false;
    }
    if (products.length >= target) return false;

    let base = slugify(`sample-${partial.name}`);
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n++}`;
    }
    usedSlugs.add(slug);
    const { images, imageAssets } = imagesForProduct(partial.imageCat, idx, partial.name);
    const { imageCat: _ic, ...rest } = partial;
    products.push({
      ...rest,
      slug,
      sku: `SMP-${String(idx + 1).padStart(5, "0")}`,
      images,
      imageAssets,
      ratingAggregate: {
        ratingValue: money(Math.min(5, 3.8 + ((idx % 12) / 10))),
        reviewCount: 2 + (idx % 28),
        bestRating: 5,
        worstRating: 1,
      },
    });
    idx++;
    return true;
  };

  // Flowers — combinatorial uniqueness
  for (const flower of FLOWER_TYPES) {
    for (const adj of ADJECTIVES) {
      for (const presentation of PRESENTATIONS) {
        if (products.length >= target) break;
        const stem = STEM_COUNTS[idx % STEM_COUNTS.length]!;
        const name = `${adj} ${flower.name} ${presentation}`;
        const vendor = vendorFor(idx, "florist");
        const price = pickPrice(FLOWER_PRICES, idx);
        const copy = desc(name, vendor.city, vendor.state, "flower");
        push({
          imageCat: "flowers",
          name,
          description: copy.long,
          shortDescription: copy.short,
          price,
          compareAtPrice: money(price * 1.25),
          currency: "USD",
          categorySlug: flower.cat,
          subcategory: flower.sub,
          inventory: 25 + (idx % 80),
          tags: ["sample-product", "flowers", flower.sub, presentation.toLowerCase().replace(/\s+/g, "-")],
          vendorSlug: vendor.vendorSlug,
          vendorCost: money(price * 0.65),
          fulfilledByName: vendor.businessName,
          isSampleProduct: true,
          seoTitle: copy.seoTitle,
          seoDescription: copy.seoDesc,
          published: true,
          featured: idx % 17 === 0,
          sameDayAvailable: vendor.state === "CA" || idx % 3 === 0,
          nextDayAvailable: true,
          deliveryFee: idx % 5 === 0 ? 0 : 9.99,
          prepTimeHours: 2 + (idx % 6),
          occasion: OCCASIONS[idx % OCCASIONS.length],
          recipient: RECIPIENTS[idx % RECIPIENTS.length],
          sampleCity: vendor.city,
          sampleState: vendor.state,
          variants: STEM_COUNTS.map((label, vi) => ({
            label,
            sku: `SMP-V-${idx}-${vi}`,
            price: money(price + vi * 10),
            inventory: 10 + vi,
          })),
          weightOz: 24 + (idx % 20),
          lengthIn: 12,
          widthIn: 10,
          heightIn: 14,
        }, "flowers");
      }
    }
  }

  // Cakes
  for (const flavor of CAKE_FLAVORS) {
    for (const occ of CAKE_OCCASIONS) {
      for (const adj of ADJECTIVES.slice(0, 12)) {
        if (products.length >= target) break;
        const name = `${adj} ${flavor} ${occ} Cake`;
        const vendor = vendorFor(idx, "cake_shop");
        const price = pickPrice(CAKE_PRICES, idx);
        const copy = desc(name, vendor.city, vendor.state, "cake");
        push({
          imageCat: "cakes",
          name,
          description: copy.long,
          shortDescription: copy.short,
          price,
          compareAtPrice: money(price * 1.2),
          currency: "USD",
          categorySlug: "cakes",
          subcategory: flavor.toLowerCase().replace(/\s+/g, "-"),
          inventory: 15 + (idx % 40),
          tags: ["sample-product", "cakes", occ.toLowerCase(), flavor.toLowerCase().replace(/\s+/g, "-")],
          vendorSlug: vendor.vendorSlug,
          vendorCost: money(price * 0.6),
          fulfilledByName: vendor.businessName,
          isSampleProduct: true,
          seoTitle: copy.seoTitle,
          seoDescription: copy.seoDesc,
          published: true,
          featured: idx % 19 === 0,
          sameDayAvailable: idx % 2 === 0,
          nextDayAvailable: true,
          deliveryFee: 7.99,
          prepTimeHours: 4 + (idx % 8),
          occasion: occ.toLowerCase(),
          recipient: RECIPIENTS[idx % RECIPIENTS.length],
          sampleCity: vendor.city,
          sampleState: vendor.state,
          variants: ["0.5 kg", "1 kg", "1.5 kg", "2 kg"].map((label, vi) => ({
            label,
            sku: `SMP-C-${idx}-${vi}`,
            price: money(price + vi * 12),
            inventory: 8 + vi,
          })),
          weightOz: 32 + (idx % 24),
          lengthIn: 10,
          widthIn: 10,
          heightIn: 8,
        }, "cakes");
      }
    }
  }

  // Gifts
  for (const gift of GIFT_TYPES) {
    for (const adj of ADJECTIVES) {
      if (products.length >= target) break;
      const name = `${adj} ${gift}`;
      const vendor = vendorFor(idx, "gift_shop");
      const price = pickPrice(GIFT_PRICES, idx);
      const categorySlug =
        gift.includes("Hamper") || gift.includes("Box")
          ? "gift-hampers"
          : gift.includes("Personalized") || gift.includes("Photo") || gift.includes("Mug")
            ? "personalized-gifts"
            : "celebration-gifts";
      const copy = desc(name, vendor.city, vendor.state, "gift");
      push({
        imageCat: "gifts",
        name,
        description: copy.long,
        shortDescription: copy.short,
        price,
        compareAtPrice: money(price * 1.3),
        currency: "USD",
        categorySlug,
        subcategory: gift.toLowerCase().replace(/\s+/g, "-"),
        inventory: 40 + (idx % 60),
        tags: ["sample-product", "gifts", categorySlug],
        vendorSlug: vendor.vendorSlug,
        vendorCost: money(price * 0.55),
        fulfilledByName: vendor.businessName,
        isSampleProduct: true,
        seoTitle: copy.seoTitle,
        seoDescription: copy.seoDesc,
        published: true,
        featured: idx % 23 === 0,
        sameDayAvailable: false,
        nextDayAvailable: true,
        deliveryFee: 5.99,
        prepTimeHours: 24,
        occasion: OCCASIONS[idx % OCCASIONS.length],
        recipient: RECIPIENTS[idx % RECIPIENTS.length],
        sampleCity: vendor.city,
        sampleState: vendor.state,
        weightOz: 16 + (idx % 30),
        lengthIn: 12,
        widthIn: 9,
        heightIn: 6,
      }, "gifts");
    }
  }

  // Plants
  for (const plant of PLANT_TYPES) {
    for (const adj of ADJECTIVES) {
      if (products.length >= target) break;
      const name = `${adj} ${plant}`;
      const vendor = vendorFor(idx, "other");
      const price = pickPrice(PLANT_PRICES, idx);
      const copy = desc(name, vendor.city, vendor.state, "plant");
      push({
        imageCat: "plants",
        name,
        description: copy.long,
        shortDescription: copy.short,
        price,
        currency: "USD",
        categorySlug: "plants",
        subcategory: plant.toLowerCase().replace(/\s+/g, "-"),
        inventory: 20 + (idx % 50),
        tags: ["sample-product", "plants"],
        vendorSlug: vendor.vendorSlug,
        vendorCost: money(price * 0.5),
        fulfilledByName: vendor.businessName,
        isSampleProduct: true,
        seoTitle: copy.seoTitle,
        seoDescription: copy.seoDesc,
        published: true,
        featured: false,
        sameDayAvailable: false,
        nextDayAvailable: true,
        deliveryFee: 8.99,
        prepTimeHours: 12,
        occasion: "thank-you",
        recipient: "colleague",
        sampleCity: vendor.city,
        sampleState: vendor.state,
        weightOz: 40 + (idx % 40),
        lengthIn: 10,
        widthIn: 10,
        heightIn: 16,
      }, "plants");
    }
  }

  // Balloons
  for (const balloon of BALLOON_TYPES) {
    for (const adj of ADJECTIVES.slice(0, 15)) {
      if (products.length >= target) break;
      const name = `${adj} ${balloon}`;
      const vendor = vendorFor(idx, "balloon_decor");
      const price = pickPrice(BALLOON_PRICES, idx);
      const copy = desc(name, vendor.city, vendor.state, "balloon décor");
      push({
        imageCat: "balloons",
        name,
        description: copy.long,
        shortDescription: copy.short,
        price,
        currency: "USD",
        categorySlug: "celebration-gifts",
        subcategory: "balloons",
        inventory: 30 + (idx % 40),
        tags: ["sample-product", "balloons", "decor"],
        vendorSlug: vendor.vendorSlug,
        vendorCost: money(price * 0.45),
        fulfilledByName: vendor.businessName,
        isSampleProduct: true,
        seoTitle: copy.seoTitle,
        seoDescription: copy.seoDesc,
        published: true,
        featured: idx % 29 === 0,
        sameDayAvailable: true,
        nextDayAvailable: true,
        deliveryFee: 6.99,
        prepTimeHours: 2,
        occasion: OCCASIONS[idx % OCCASIONS.length],
        recipient: RECIPIENTS[idx % RECIPIENTS.length],
        sampleCity: vendor.city,
        sampleState: vendor.state,
        weightOz: 8,
        lengthIn: 14,
        widthIn: 14,
        heightIn: 20,
      }, "balloons");
    }
  }

  // Combos
  for (const combo of COMBOS) {
    for (const adj of ADJECTIVES) {
      if (products.length >= target) break;
      const name = `${adj} ${combo.name}`;
      const vendor = vendorFor(idx, idx % 2 === 0 ? "florist" : "cake_shop");
      const price = pickPrice(COMBO_PRICES, idx);
      const categorySlug =
        combo.name.includes("Birthday")
          ? "birthday-gifts"
          : combo.name.includes("Anniversary")
            ? "anniversary-gifts"
            : combo.name.includes("Valentine")
              ? "valentines-day-gifts"
              : combo.name.includes("Mother")
                ? "mothers-day-gifts"
                : "same-day-gifts";
      const copy = desc(name, vendor.city, vendor.state, "gift combo");
      push({
        imageCat: idx % 2 === 0 ? "flowers" : "cakes",
        name,
        description: copy.long,
        shortDescription: copy.short,
        price,
        compareAtPrice: money(price * 1.15),
        currency: "USD",
        categorySlug,
        subcategory: "combos",
        inventory: 18 + (idx % 35),
        tags: ["sample-product", ...combo.tags],
        vendorSlug: vendor.vendorSlug,
        vendorCost: money(price * 0.62),
        fulfilledByName: vendor.businessName,
        isSampleProduct: true,
        seoTitle: copy.seoTitle,
        seoDescription: copy.seoDesc,
        published: true,
        featured: idx % 11 === 0,
        sameDayAvailable: true,
        nextDayAvailable: true,
        deliveryFee: 0,
        prepTimeHours: 3,
        occasion: combo.tags.find((t) => !["combo", "flowers", "cake", "chocolates", "roses", "plush", "balloons", "hamper"].includes(t)),
        recipient: RECIPIENTS[idx % RECIPIENTS.length],
        sampleCity: vendor.city,
        sampleState: vendor.state,
        weightOz: 48,
        lengthIn: 14,
        widthIn: 12,
        heightIn: 12,
      }, "combos");
    }
  }

  // Top up if still short (extra CA-heavy flower styles)
  let fill = 0;
  while (products.length < target) {
    const flower = FLOWER_TYPES[fill % FLOWER_TYPES.length]!;
    const adj = ADJECTIVES[fill % ADJECTIVES.length]!;
    const name = `${adj} ${flower.name} Studio Collection ${fill + 1}`;
    const vendor = SAMPLE_VENDORS[fill % 7]!; // CA-first vendors
    const price = pickPrice(FLOWER_PRICES, fill);
    const copy = desc(name, vendor.city, vendor.state, "flower");
    push({
      imageCat: "flowers",
      name,
      description: copy.long,
      shortDescription: copy.short,
      price,
      currency: "USD",
      categorySlug: flower.cat,
      subcategory: flower.sub,
      inventory: 50,
      tags: ["sample-product", "flowers", "california"],
      vendorSlug: vendor.vendorSlug,
      vendorCost: money(price * 0.65),
      fulfilledByName: vendor.businessName,
      isSampleProduct: true,
      seoTitle: copy.seoTitle,
      seoDescription: copy.seoDesc,
      published: true,
      featured: false,
      sameDayAvailable: true,
      nextDayAvailable: true,
      deliveryFee: 9.99,
      prepTimeHours: 2,
      sampleCity: vendor.city,
      sampleState: vendor.state,
      weightOz: 20,
      lengthIn: 12,
      widthIn: 10,
      heightIn: 12,
    }); // no quota — fill remainder
    fill++;
  }

  return { products: products.slice(0, target), vendors: SAMPLE_VENDORS };
}
