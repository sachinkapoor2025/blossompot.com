/**
 * Read-only catalogue audit. Writes reports/BlossomPot_Missing_Product_Categories.xlsx.
 * Does not modify products, categories, APIs, or git.
 *
 * Usage: node reports/generate-missing-category-audit.mjs
 */
import { createRequire } from "module";
import { mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ExcelJS = require(process.env.EXCELJS_PATH || join(process.env.TEMP || "/tmp", "bp-exceljs", "node_modules", "exceljs"));

const LIVE_CATEGORIES = [
  { slug: "flowers", name: "Flowers", sort: 0, nav: "Flowers" },
  { slug: "flower-bouquets", name: "Flower Bouquets", sort: 1, nav: "Bouquets" },
  { slug: "cakes", name: "Cakes", sort: 2, nav: "Cakes" },
  { slug: "birthday-gifts", name: "Birthday Gifts", sort: 3, nav: "Birthday" },
  { slug: "anniversary-gifts", name: "Anniversary Gifts", sort: 4, nav: "Anniversary" },
  { slug: "valentines-day-gifts", name: "Valentine's Day Gifts", sort: 5, nav: "Valentine's" },
  { slug: "mothers-day-gifts", name: "Mother's Day Gifts", sort: 6, nav: "Mother's Day page" },
  { slug: "wedding-gifts", name: "Wedding Gifts", sort: 7, nav: "Wedding page" },
  { slug: "personalized-gifts", name: "Personalized Gifts", sort: 8, nav: "Personalized (homepage)" },
  { slug: "gift-hampers", name: "Gift Hampers", sort: 9, nav: "Hampers" },
  { slug: "plants", name: "Plants", sort: 10, nav: "Plants (homepage)" },
  { slug: "same-day-gifts", name: "Same-Day Gifts", sort: 11, nav: "Same-day delivery URL" },
  { slug: "celebration-gifts", name: "Celebration Gifts", sort: 12, nav: "Celebration page" },
  { slug: "overseas-gifts", name: "Overseas Gift Baskets", sort: 80, nav: "Gift Baskets Overseas category" },
];

const LIVE_SLUGS = new Set(LIVE_CATEGORIES.map((c) => c.slug));
const LIVE_NAME = new Map(LIVE_CATEGORIES.map((c) => [c.slug, c.name]));

const SOURCE_FILES = [
  ["BlossomPot catalogue", "scripts/data/blossompot-catalog.json"],
  ["FNP USA", "scripts/data/fnp-usa-catalog.json"],
  ["TF USA", "scripts/data/tf-usa-catalog.json"],
  ["USA Rakhi", "scripts/data/usarakhi-catalog.json"],
  ["Orange County", "scripts/data/orange-county-hampers.json"],
  ["Orange County rakhi", "scripts/data/orange-county-single-rakhi-2026.json"],
];

const RAKHI_SLUGS = {
  "single-rakhi": "Single Rakhi",
  "kids-rakhi": "Kids Rakhi",
  "lumba-rakhi": "Lumba Rakhi",
  "bhaiya-bhabhi-rakhi": "Bhaiya Bhabhi Rakhi",
  "rakhi-combo": "Rakhi Sets and Combos",
  "rakhi-hampers": "Rakhi Hampers",
  "2-set-rakhi": "Rakhi Sets and Combos",
  "3-set-rakhi": "Rakhi Sets and Combos",
  "4-set-rakhi": "Rakhi Sets and Combos",
};

const CATEGORY_COPY = {
  Rakhi: {
    description:
      "Rakhi threads, kids and lumba rakhis, bhaiya-bhabhi sets, rakhi combos, and rakhi hampers for Raksha Bandhan. This is a product and festival range, not a spelling variant of Gift Hampers or Flowers.",
    opportunity:
      "The catalogue already holds a full Rakhi range, but Rakhi is not one of the 14 live categories. Public Rakhi URLs redirect away, and non-Orange-County Rakhi products are hidden from the storefront. Putting the range back as a seasonal category makes an existing, photographed catalogue shoppable again.",
  },
  Chocolates: {
    description:
      "Boxed chocolates, truffles, and chocolate assortments sold as the gift. Chocolate cakes stay in Cakes. Flower-and-chocolate combos stay with Flowers, Bouquets, or Combos.",
    opportunity:
      "Chocolate is one of the gifts the site talks about, but there is no Chocolates category. FNP's Chocolates workbook was imported into Gift Hampers, so these products cannot be browsed on their own.",
  },
  "Wine, Champagne and Beer": {
    description:
      "Wine, champagne, and beer gifts and gift baskets. Bouquets or cakes that simply include a bottle stay in Flowers, Bouquets, or Cakes. Wine glasses without a bottle are not included here.",
    opportunity:
      "FNP keeps Wine Hampers as their own workbook. BlossomPot folded them into Gift Hampers and Celebration Gifts, so shoppers cannot browse wine. The range is large enough to merchandise on its own, with an age note separate from family hampers.",
  },
  "Spiritual Gifts": {
    description:
      "Idols, diyas, and pooja gifts, including idol-and-treat sets. A rakhi that uses a Ganesh motif stays under Rakhi. Flower arrangements stay under Flowers.",
    opportunity:
      "Religious idols and diyas are filed under Personalized Gifts, Celebration Gifts, or Gift Hampers. They are not personalized merchandise and do not match those shelves. A Spiritual Gifts category matches how these products are actually bought.",
  },
  "Sweets and Mithai": {
    description:
      "Indian sweets such as kaju katli, barfi, soan papdi, laddoo, and baklava, where the sweet is the gift. Sweets packed inside a rakhi hamper stay under Rakhi.",
    opportunity:
      "FNP's Sweets workbook was mapped onto Gift Hampers during import. A mithai box is a different purchase from a mixed gourmet hamper, and the site has no sweets category.",
  },
  "Dry Fruits": {
    description:
      "Cashew, almond, pistachio, and dry-fruit boxes where nuts are the product. Mixed wine, chocolate, or rakhi hampers that only include nuts stay in those other ranges.",
    opportunity:
      "Dry-fruit boxes were imported into Gift Hampers. Shoppers looking for nuts cannot filter them out of general hampers. The range is a standard gifting category on the source catalogues.",
  },
  "Toys and Soft Toys": {
    description:
      "Character toys, building sets, and plush toys sold as the gift. A bouquet or birthday combo that includes a teddy stays with Flowers, Bouquets, Combos, or Birthday.",
    opportunity:
      "FNP maps Soft Toys onto Gift Hampers. LEGO, Hot Wheels, Transformers, and plush toys in this catalogue are not hampers. A toys category gives birthday and kids gifting a real shelf. Teddy Day is only a special-day filter, not a category.",
  },
  "Perfumes and Fragrances": {
    description:
      "Fragrance and grooming gift sets. A bouquet whose name uses the word fragrance stays in Flower Bouquets.",
    opportunity:
      "The site has no fragrance category. These sets are split across Gift Hampers, Celebration Gifts, and Personalized Gifts even though the product is a perfume.",
  },
  Jewellery: {
    description:
      "Necklaces and jewellery gifts. A rose bouquet that includes a necklace stays in Flower Bouquets, because the flowers are the product the site already shelves.",
    opportunity:
      "FNP's Jewellery workbook was mapped onto Personalized Gifts. A necklace is not a personalized mug or cushion. The current range is small, so this is a low-volume shelf rather than a new department to build from scratch.",
  },
  "Cookies and Biscuits": {
    description: "Cookie and biscuit gifts sold as the product, not as one line inside a larger hamper.",
    opportunity:
      "FNP maps Cookies onto Gift Hampers. A cookie gift is closer to sweets than to a mixed basket, and the site has no cookie category.",
  },
  "Fruit Baskets": {
    description: "Fresh fruit baskets. Dry-fruit boxes are classified separately.",
    opportunity:
      "FNP maps Fruits onto Gift Hampers. Fresh fruit is perishable and is shopped differently from a gourmet hamper.",
  },
  "Barware and Drinkware": {
    description: "Wine glasses, flutes, and drinkware sold without a bottle of wine.",
    opportunity:
      "FNP maps Barware onto Gift Hampers. Glassware is not a hamper. The range in this catalogue is small.",
  },
};

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function plain(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function loadProducts() {
  const by = new Map();
  for (const [source, rel] of SOURCE_FILES) {
    const data = readJson(rel);
    for (const product of data.products || []) {
      if (!product?.slug) continue;
      const existing = by.get(product.slug);
      if (!existing) {
        by.set(product.slug, {
          ...product,
          sources: [source],
          categoryBySource: { [source]: product.categorySlug || "" },
        });
        continue;
      }
      existing.sources.push(source);
      existing.categoryBySource[source] = product.categorySlug || "";
      if (plain(product.description).length > plain(existing.description).length) existing.description = product.description;
      if (!existing.vendorSlug && product.vendorSlug) existing.vendorSlug = product.vendorSlug;
      if ((!existing.images || existing.images.length === 0) && product.images?.length) existing.images = product.images;
      if (!existing.tags?.length && product.tags?.length) existing.tags = product.tags;
      if (!existing.sku && product.sku) existing.sku = product.sku;
      if (!existing.currency && product.currency) existing.currency = product.currency;
      if (existing.price == null && product.price != null) existing.price = product.price;
      if (!existing.deliveryCountries?.length && product.deliveryCountries?.length) {
        existing.deliveryCountries = product.deliveryCountries;
      }
      const extras = new Set([...(existing.additionalCategorySlugs || []), ...(product.additionalCategorySlugs || [])]);
      if (extras.size) existing.additionalCategorySlugs = [...extras];
    }
  }

  const inventoryRel = "scripts/data/inventory-2-orange-county-single-rakhi.json";
  if (existsSync(join(root, inventoryRel))) {
    const inventory = readJson(inventoryRel);
    for (const product of inventory.products || []) {
      if (!product?.slug || by.has(product.slug)) continue;
      by.set(product.slug, {
        ...product,
        categorySlug: product.categorySlug || inventory.categorySlug || "single-rakhi",
        currency: product.currency || "USD",
        published: product.published !== false,
        sources: ["Orange County inventory"],
        categoryBySource: { "Orange County inventory": inventory.categorySlug || "single-rakhi" },
        vendorSlug: product.vendorSlug || inventory.vendorSlug,
      });
    }
  }

  const livePath = join(process.env.TEMP || "/tmp", "bp-products-us.json");
  let liveCount = 0;
  if (existsSync(livePath)) {
    const live = JSON.parse(readFileSync(livePath, "utf8"));
    for (const product of live.products || []) {
      liveCount += 1;
      const existing = by.get(product.slug);
      if (!existing) {
        by.set(product.slug, {
          ...product,
          sources: ["Live US storefront"],
          categoryBySource: { "Live US storefront": product.categorySlug || "" },
          live: true,
        });
      } else {
        existing.live = true;
        if (!existing.sources.includes("Live US storefront")) existing.sources.push("Live US storefront");
        existing.categoryBySource["Live US storefront"] = product.categorySlug || "";
      }
    }
  }
  return { products: [...by.values()], liveCount };
}

function nameOf(product) {
  return plain(product.name).toLowerCase();
}

function has(text, pattern) {
  return pattern.test(text);
}

function isFloralName(text) {
  if (/\b(bouquets?|tulips?|lilies|lily|orchids?|carnations?|gerberas?|sunflowers?|hydrangeas?|dais(?:y|ies)|posy|posies|blossoms?|arrangements?|hand-tied|mixed flowers?)\b/.test(text)) {
    return true;
  }
  if (/\broses?\b/.test(text) && !/\brose wine\b|\bsparkling rose\b/.test(text)) return true;
  if (/\bflowers?\b/.test(text)) return true;
  return false;
}

function isPlantName(text) {
  return /\b(plants?|succulents?|bonsai|bamboo|snake plant|peace lily|terrariums?|money plant|jade plant|haworthia|echeveria|hoya|cactus|pothos|monstera|ceramic pot|zz plant|ficus|calathea)\b/.test(text);
}

function isIdolName(text) {
  return /\b(idols?|ganesha?|laxmi|lakshmi|hanuman|durga|vishnu|adiyogi|shiva)\b/.test(text);
}

function isMithaiName(text) {
  return /\b(kaju katli|kaju roll|kaju sweets|barfi|burfi|soan papdi|laddoos?|laddus?|mithai|baklava|dodha|gulab jamun|rasgulla|traditional sweets|sweets gift box|sweets duo)\b/.test(text);
}

function isChocolateName(text) {
  return /\b(chocolates?|lindt|ferrero|truffles?|rocher|godiva|cadbury|hersheys?)\b/.test(text);
}

function isRakhi(product, text) {
  if (RAKHI_SLUGS[product.categorySlug]) return true;
  if ((product.additionalCategorySlugs || []).some((slug) => RAKHI_SLUGS[slug])) return true;
  return /\brakhis?\b|\braksha\b|\blumba\b|\bbhaiya\b|\bbhabhi\b/.test(text);
}

function rakhiSubcategory(product, text) {
  if (RAKHI_SLUGS[product.categorySlug]) return RAKHI_SLUGS[product.categorySlug];
  const extra = (product.additionalCategorySlugs || []).find((slug) => RAKHI_SLUGS[slug]);
  if (extra && !/\brakhi\b/.test(text)) return RAKHI_SLUGS[extra];
  if (/\bkids?\b/.test(text)) return "Kids Rakhi";
  if (/\blumba\b|\bbhabhi\b/.test(text) && /\bbhaiya\b|\bbhabhi\b/.test(text)) return "Bhaiya Bhabhi Rakhi";
  if (/\blumba\b/.test(text)) return "Lumba Rakhi";
  if (/\bhamper\b|\bgift box\b|\bdry fruits?\b/.test(text)) return "Rakhi Hampers";
  if (/\bcombo\b|\bset of\b|\bset\b/.test(text)) return "Rakhi Sets and Combos";
  return "Single Rakhi";
}

function alcoholKind(text) {
  if (/\bbeers?\b|\bbrew\b|\bmicrobrew\b/.test(text)) return "Beer Gifts";
  if (/\bchampagne\b|\bprosecco\b|\bmoscato\b|\bsparkling\b/.test(text)) return "Champagne and Sparkling";
  return "Wine Gift Baskets";
}

function classify(product) {
  const text = nameOf(product);
  const stored = product.categorySlug || "";

  if (isRakhi(product, text)) {
    return {
      kind: "missing",
      category: "Rakhi",
      subcategory: rakhiSubcategory(product, text),
      reason:
        "The product is a rakhi, rakhi set, or rakhi hamper. Rakhi is not one of the 14 live website categories. Public Rakhi URLs redirect away, and the storefront hides Rakhi text except Orange County hampers.",
    };
  }

  const diyaLeads = /^(floral diyas|designer diyas|diyas\b|radiant brass aarti)/.test(text);
  const diyaSide =
    !diyaLeads &&
    /\b(diyas?|aarti)\b/.test(text) &&
    (isChocolateName(text) || isMithaiName(text) || /\b(key chains?|protein bar|juice)\b/.test(text));
  if ((isIdolName(text) || (/\b(diyas?|aarti|pooja)\b/.test(text) && !diyaSide)) && !isPlantName(text)) {
    const hamper = /\b(hamper|treat|chocolate|sweet|dry fruit|laddoo|barfi|box|set)\b/.test(text);
    const diyaOnly = /\bdiyas?\b|\baarti\b/.test(text) && !isIdolName(text);
    return {
      kind: "missing",
      category: "Spiritual Gifts",
      subcategory: diyaOnly ? "Diyas and Pooja" : hamper ? "Idol and Treat Sets" : "Idols",
      reason:
        "The product is an idol, diya, or pooja gift. Personalized Gifts, Celebration Gifts, and Gift Hampers are the shelves it was given, and none of those is a spiritual category.",
    };
  }

  if (/\b(necklaces?|jewellery|jewelry|earrings?|pendants?|bangles?)\b/.test(text) && !isFloralName(text)) {
    return {
      kind: "missing",
      category: "Jewellery",
      subcategory: "Necklaces and Jewellery Gifts",
      reason:
        "The product is jewellery. FNP maps Jewellery onto Personalized Gifts, but a necklace is not the same as a mug, cushion, or custom gift, and the site has no jewellery category.",
    };
  }

  const alcohol = /\b(wines?|champagne|chardonnays?|cabernets?|merlots?|prosecco|moscato|vodka\w*|whisk(?:y|ies|ey)|beers?|cellars|vineyards?|winer(?:y|ies))\b/.test(text);
  const glassware = /\b(wine glasses?|stemless wine|decant(?:er|ers)|champagne flutes?)\b/.test(text) && !/\b(baskets?|hampers?|bottles?|cellars|vineyards?)\b/.test(text);
  if (glassware) {
    return {
      kind: "missing",
      category: "Barware and Drinkware",
      subcategory: "Glasses and Drinkware",
      reason:
        "The product is drinkware rather than a bottle or a hamper. FNP maps Barware onto Gift Hampers, and the site has no barware category.",
    };
  }

  if (alcohol && !isFloralName(text) && !/\bcakes?\b|\bcupcakes?\b|\bcheesecake\b/.test(text)) {
    return {
      kind: "missing",
      category: "Wine, Champagne and Beer",
      subcategory: alcoholKind(text),
      reason:
        "The gift is wine, champagne, or beer. Flower-and-wine and cake-and-wine products stay in the existing flower and cake categories. This one does not, and the site has no wine category. FNP's Wine Hampers workbook was folded into Gift Hampers.",
    };
  }

  if (/\b(perfumes?|fragrances?|colognes?|scented)\b/.test(text) && !isFloralName(text)) {
    return {
      kind: "missing",
      category: "Perfumes and Fragrances",
      subcategory: /\b(hamper|combo|gourmet|chocolate|grooming)\b/.test(text) ? "Fragrance Gift Sets" : "Fragrance",
      reason:
        "The product is a fragrance or grooming gift. Bouquets that only use fragrance as a flower name stay in Flower Bouquets. The site has no perfume category.",
    };
  }

  const toy = /\b(legos?|hot wheels|transformers|spiderman|spider-man|soft toys?|plush|teddy|teddies|easter bunny|rc truck)\b/.test(text) || (/\btoys?\b/.test(text) && !/\brakhi\b/.test(text));
  if (toy && !isFloralName(text) && !/\bcakes?\b/.test(text) && !isPlantName(text)) {
    const soft = /\b(soft toys?|plush|teddy|teddies|easter bunny)\b/.test(text);
    return {
      kind: "missing",
      category: "Toys and Soft Toys",
      subcategory: soft ? "Soft Toys" : "Character and Building Toys",
      reason:
        "The product is a toy or plush. FNP maps Soft Toys onto Gift Hampers. Teddy-and-flower combos stay with flowers because the bouquet is what the site already sells. This product does not fit Flowers, Cakes, Plants, or Personalized Gifts.",
    };
  }

  if (/\bcakes?\b|\bcupcakes?\b|\bcheesecakes?\b|\bbrownies?\b|\bcake pops?\b/.test(text) || stored === "cakes") {
    if (stored === "cakes" || /\bcakes?\b|\bcupcakes?\b|\bcheesecakes?\b|\bbrownies?\b|\bcake pops?\b/.test(text)) {
      return {
        kind: "existing",
        fit: LIVE_SLUGS.has(stored) ? stored : "cakes",
        reason: "Cake or dessert that already fits Cakes or an existing occasion category.",
      };
    }
  }

  if (isPlantName(text) && !isFloralName(text)) {
    return {
      kind: "existing",
      fit: LIVE_SLUGS.has(stored) && stored !== "gift-hampers" && stored !== "celebration-gifts" ? stored : "plants",
      reason: "Living plant, including plant-and-chocolate sets. The plant is the product; Plants is already a live category.",
    };
  }

  if (isFloralName(text) || stored === "flowers" || stored === "flower-bouquets") {
    const fit = stored === "flower-bouquets" || /\bbouquets?\b/.test(text) ? (LIVE_SLUGS.has(stored) ? stored : "flower-bouquets") : LIVE_SLUGS.has(stored) ? stored : "flowers";
    return { kind: "existing", fit, reason: "Floral product that fits Flowers, Bouquets, or an existing occasion category." };
  }

  if (/\b(mugs?|cushions?|water bottles?|notebooks?|photo frames?|plaques?|personalised|personalized|custom name|custom water)\b/.test(text) || stored === "personalized-gifts") {
    return {
      kind: "existing",
      fit: LIVE_SLUGS.has(stored) ? stored : "personalized-gifts",
      reason: "Custom or keepsake gift that fits Personalized Gifts, which is already a live category. Mugs, cushions, and bottles are subtypes of that category, not a new department.",
    };
  }

  if (/\b(cookies?|biscuits?|macarons?|oreos?)\b/.test(text) && !/\b(godiva gift|chocolate gift basket|chocolate basket)\b/.test(text)) {
    return {
      kind: "missing",
      category: "Cookies and Biscuits",
      subcategory: "Cookie Gifts",
      reason: "The product is a cookie or biscuit gift. FNP maps Cookies onto Gift Hampers, and the site has no cookie category.",
    };
  }

  if (isMithaiName(text) && !isChocolateName(text)) {
    return {
      kind: "missing",
      category: "Sweets and Mithai",
      subcategory: "Indian Sweets",
      reason:
        "The product is an Indian sweet. FNP maps Sweets onto Gift Hampers. A mithai box is not a mixed gift hamper, and the site has no sweets category.",
    };
  }

  if (isChocolateName(text) && isMithaiName(text)) {
    return {
      kind: "existing",
      fit: LIVE_SLUGS.has(stored) ? stored : "gift-hampers",
      reason: "The name combines chocolate and Indian sweets, so it fits Gift Hampers rather than a single-ingredient category.",
    };
  }

  if (isChocolateName(text)) {
    const mixedHamper = /\b(juice|plaques?|mens care|men's care|grooming|key chains?)\b/.test(text)
      || (/\b(hampers?|baskets?|crates?)\b/.test(text) && /\b(nuts?|snacks?|cheese|dry fruits?)\b/.test(text));
    if (!mixedHamper) {
      return {
        kind: "missing",
        category: "Chocolates",
        subcategory: /\b(hampers?|baskets?|assortments?|gift boxes?)\b/.test(text) ? "Chocolate Hampers" : "Chocolate Gifts",
        reason:
          "The product is a chocolate gift, not a cake and not a flower combo. FNP maps the Chocolates workbook onto Gift Hampers, and BlossomPot has no Chocolates category.",
      };
    }
  }

  if (isMithaiName(text)) {
    return {
      kind: "missing",
      category: "Sweets and Mithai",
      subcategory: "Indian Sweets",
      reason:
        "The product is an Indian sweet. FNP maps Sweets onto Gift Hampers. A mithai box is not a mixed gift hamper, and the site has no sweets category.",
    };
  }

  if (isChocolateName(text) && /\b(dry fruits?|dried fruits?|nuts?)\b/.test(text) && /\b(hampers?|baskets?)\b/.test(text)) {
    return {
      kind: "existing",
      fit: LIVE_SLUGS.has(stored) ? stored : "gift-hampers",
      reason: "The name is a hamper of chocolate and dry fruit together, so it fits Gift Hampers rather than a single-ingredient category.",
    };
  }

  if (/\b(dry fruits?|dryfruits?|cashews?|almonds?|pistachios?|walnuts?|dried fruits?)\b/.test(text) || (/\bnuts?\b/.test(text) && !/\b(hamper|basket)\b/.test(text))) {
    return {
      kind: "missing",
      category: "Dry Fruits",
      subcategory: "Nut and Dry Fruit Gifts",
      reason:
        "The product is a dry-fruit or nut gift. FNP maps Dry Fruits onto Gift Hampers, and the site has no dry-fruit category.",
    };
  }

  if (/\b(fruit baskets?|fresh fruits?|orchard fruit)\b/.test(text)) {
    return {
      kind: "missing",
      category: "Fruit Baskets",
      subcategory: "Fresh Fruit",
      reason: "The product is a fresh fruit basket. FNP maps Fruits onto Gift Hampers, and the site has no fruit category.",
    };
  }

  if (/\bballoons?\b/.test(text)) {
    return {
      kind: "existing",
      fit: LIVE_SLUGS.has(stored) ? stored : "celebration-gifts",
      reason: "Balloon gift that fits Celebration Gifts, which is already a live category.",
    };
  }

  if (LIVE_SLUGS.has(stored)) {
    return {
      kind: "existing",
      fit: stored,
      reason: `Stored in ${LIVE_NAME.get(stored)}, which is a live website category, and the name does not identify a different department.`,
    };
  }

  if (/\b(hampers?|gift baskets?|baskets?|gift boxes?|combos?)\b/.test(text)) {
    return {
      kind: "existing",
      fit: "gift-hampers",
      reason: "Mixed gift basket or combo that fits Gift Hampers or the Combos collection.",
    };
  }

  const desc = plain(product.description).toLowerCase().slice(0, 500);
  if (desc && text.split(/\s+/).length <= 6) {
    const fromDesc = classify({ ...product, name: desc, description: "", categorySlug: stored === "celebration-gifts" || stored === "gift-hampers" ? "" : stored });
    if (fromDesc.kind === "missing") {
      return {
        ...fromDesc,
        reason: `${fromDesc.reason} The product name is generic, so this uses the description.`,
      };
    }
    if (fromDesc.kind === "existing") return fromDesc;
  }

  return {
    kind: "unclassified",
    reason: "The name, stored category, tags, and description do not clearly match a live BlossomPot category or a new category with enough similar products.",
  };
}

function vendorOf(product) {
  const tags = (product.tags || []).join(" ").toLowerCase();
  const found = [];
  if (product.vendorSlug === "orange-county" || product.sources.some((s) => s.startsWith("Orange County"))) found.push("Orange County");
  if (tags.includes("fnp") || String(product.sourceUrl || "").includes("fnp.com") || product.sources.includes("FNP USA")) found.push("FNP");
  if (tags.includes("tf-usa") || product.sources.includes("TF USA")) found.push("TF USA");
  if (product.sources.includes("USA Rakhi")) found.push("USA Rakhi");
  if (product.vendorSlug && product.vendorSlug !== "orange-county" && product.vendorSlug !== "fnp") found.push(product.vendorSlug);
  if (found.length === 0) found.push("BlossomPot");
  return [...new Set(found)].join(", ");
}

function originalCategory(product) {
  const entries = Object.entries(product.categoryBySource).filter(([, slug]) => slug);
  const labels = entries.map(([source, slug]) => {
    const name = RAKHI_SLUGS[slug] || LIVE_NAME.get(slug) || slug;
    return entries.length === 1 ? name : `${source}: ${name}`;
  });
  let text = labels.join("; ") || "(none)";
  if (product.sources.includes("FNP USA")) {
    text += ". FNP's original workbook category was not kept; the import stored only the mapped BlossomPot category.";
  }
  const extras = (product.additionalCategorySlugs || []).filter(Boolean);
  if (extras.length) {
    text += ` Also listed under ${extras.map((slug) => RAKHI_SLUGS[slug] || LIVE_NAME.get(slug) || slug).join(", ")}.`;
  }
  return text;
}

function countryOf(product) {
  if (Array.isArray(product.deliveryCountries) && product.deliveryCountries.length) {
    return product.deliveryCountries.join(", ");
  }
  const desc = plain(product.description).toLowerCase();
  const orange = product.vendorSlug === "orange-county" || product.sources.some((s) => s.startsWith("Orange County"));
  if (orange && /only in covered orange county|orange county zip/.test(desc)) return "US — Orange County, California";
  return "US";
}

function imageOf(product) {
  const url = (product.images || []).find((item) => item && String(item).trim());
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `https://www.blossompot.com${url}`;
  return url;
}

function statusOf(product) {
  const base = product.published === false
    ? "Unpublished"
    : product.live
      ? "Published — on current US storefront"
      : "Published in catalogue file — not on current US storefront";
  if ((product.inventory ?? 1) === 0) return `${base}; inventory 0`;
  return base;
}

function priorityFor(category, count) {
  if (category === "Rakhi" || category === "Chocolates" || category === "Wine, Champagne and Beer") return "High";
  if (category === "Dry Fruits" || category === "Perfumes and Fragrances") return "Medium";
  if (count >= 20) return "High";
  if (count >= 8) return "Medium";
  return "Low";
}

function foldSmallCategories(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (row.kind !== "missing") continue;
    counts.set(row.category, (counts.get(row.category) || 0) + 1);
  }
  for (const row of rows) {
    if (row.kind !== "missing") continue;
    const count = counts.get(row.category) || 0;
    if (count >= 2) continue;
    if (row.category === "Cookies and Biscuits") {
      row.category = "Sweets and Mithai";
      row.subcategory = "Cookies and Biscuits";
      row.reason += " Grouped with sweets because this is the only cookie product.";
      continue;
    }
    row.kind = "unclassified";
    row.unclassifiedReason = `Looks like ${row.category} / ${row.subcategory}, but it is the only product of that type, so it is not recommended as its own category. ${row.reason}`;
  }
}

function themeCounts(products, rules) {
  const counts = rules.map(() => 0);
  for (const product of products) {
    const text = nameOf(product);
    rules.forEach((rule, index) => {
      if (rule[0].test(text)) counts[index] += 1;
    });
  }
  return rules
    .map((rule, index) => (counts[index] ? `${rule[1]} (${counts[index]})` : ""))
    .filter(Boolean)
    .join("; ");
}

const THEMES = {
  flowers: [[/\broses?\b/, "Roses"], [/\btulips?\b/, "Tulips"], [/\blilies|lily\b/, "Lilies"], [/\borchids?\b/, "Orchids"], [/\bsunflowers?\b/, "Sunflowers"], [/\bmixed\b/, "Mixed"]],
  "flower-bouquets": [[/\broses?\b/, "Roses"], [/\btulips?\b/, "Tulips"], [/\blilies|lily\b/, "Lilies"], [/\bmixed\b/, "Mixed"], [/\bsunflowers?\b/, "Sunflowers"]],
  cakes: [[/\bchocolate\b/, "Chocolate"], [/\bred velvet\b/, "Red velvet"], [/\bvanilla\b/, "Vanilla"], [/\bcheesecake\b/, "Cheesecake"], [/\bstrawberry\b/, "Strawberry"], [/\bblack forest\b/, "Black forest"]],
  "gift-hampers": [[/\bgourmet\b/, "Gourmet"], [/\bsnack\b/, "Snacks"], [/\bbasket\b/, "Baskets"], [/\bspa\b/, "Spa"]],
  "personalized-gifts": [[/\bmugs?\b/, "Mugs"], [/\bcushions?\b/, "Cushions"], [/\bbottles?\b/, "Water bottles"], [/\bnotebooks?\b/, "Notebooks"], [/\bphoto\b/, "Photo gifts"]],
  plants: [[/\bbamboo\b/, "Bamboo"], [/\bsucculents?\b/, "Succulents"], [/\bbonsai\b/, "Bonsai"], [/\borchid\b/, "Orchid plants"]],
  "birthday-gifts": [[/\bcake\b/, "Cakes"], [/\bbouquet|rose|flower/, "Flowers"], [/\bhamper|basket/, "Hampers"]],
  "anniversary-gifts": [[/\brose|bouquet|flower/, "Flowers"], [/\bcake\b/, "Cakes"]],
  "valentines-day-gifts": [[/\brose|bouquet|flower/, "Flowers"], [/\bmug\b/, "Mugs"]],
  "celebration-gifts": [[/\bballoon/, "Balloons"], [/\bcombo\b/, "Combos"]],
};

function styleHeader(row, color) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

function applyFilter(sheet, headerRow, columnCount) {
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: columnCount },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow, xSplit: 0 }];
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

async function main() {
  const { products, liveCount } = loadProducts();
  const classified = products.map((product) => ({ product, ...classify(product) }));
  foldSmallCategories(classified);

  const missingRows = classified.filter((row) => row.kind === "missing");
  const existingRows = classified.filter((row) => row.kind === "existing");
  const unclassifiedRows = classified.filter((row) => row.kind === "unclassified");

  const byCategory = new Map();
  for (const row of missingRows) {
    if (!byCategory.has(row.category)) byCategory.set(row.category, []);
    byCategory.get(row.category).push(row);
  }

  const categorySummaries = [...byCategory.entries()].map(([category, rows]) => {
    const subs = new Map();
    for (const row of rows) subs.set(row.subcategory, (subs.get(row.subcategory) || 0) + 1);
    const subcategory = [...subs.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${name} (${count})`)
      .join("; ");
    const copy = CATEGORY_COPY[category] || {
      description: `${category} products in the catalogue that do not match a live BlossomPot category.`,
      opportunity: "These products are present in the catalogue but have no matching category on the website.",
    };
    return {
      category,
      subcategory,
      count: rows.length,
      description: copy.description,
      opportunity: copy.opportunity,
      priority: priorityFor(category, rows.length),
    };
  });
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  categorySummaries.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.count - a.count);

  const fitCounts = new Map(LIVE_CATEGORIES.map((category) => [category.slug, []]));
  const assignedCounts = new Map(LIVE_CATEGORIES.map((category) => [category.slug, 0]));
  for (const product of products) {
    if (LIVE_SLUGS.has(product.categorySlug)) assignedCounts.set(product.categorySlug, (assignedCounts.get(product.categorySlug) || 0) + 1);
  }
  for (const row of existingRows) {
    const fit = LIVE_SLUGS.has(row.fit) ? row.fit : "celebration-gifts";
    if (!fitCounts.has(fit)) fitCounts.set(fit, []);
    fitCounts.get(fit).push(row.product);
  }

  const outDir = join(root, "reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "BlossomPot_Missing_Product_Categories.xlsx");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BlossomPot catalogue audit";
  workbook.created = new Date("2026-11-21T13:30:00Z");
  workbook.title = "BlossomPot missing product categories";

  const summary = workbook.addWorksheet("Missing Categories", { views: [{ showGridLines: false }] });
  summary.getCell("A1").value = "BlossomPot catalogue audit — categories the website does not currently offer";
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF1A3D34" }, name: "Calibri" };
  summary.mergeCells("A1:F1");
  summary.getCell("A2").value = "Generated 21 Nov 2026. Read-only audit. No products, categories, or site files were changed. The product sheet tab is \"Products Under Missing Category\" because Excel limits sheet names to 31 characters.";
  summary.mergeCells("A2:F2");
  summary.getCell("A2").font = { italic: true, color: { argb: "FF555555" }, name: "Calibri" };

  const summaryRows = [
    ["Total products scanned", products.length],
    ["Total existing catalogue categories", LIVE_CATEGORIES.length],
    ["Total suggested new categories", categorySummaries.length],
    ["Total products belonging to missing categories", missingRows.length],
    ["Total unclassified products", unclassifiedRows.length],
    ["Products that already fit an existing category", existingRows.length],
    ["Products on the current US storefront", products.filter((product) => product.live).length],
    ["Live storefront rows returned by the API", liveCount],
  ];
  summary.getCell("A4").value = "Summary";
  summary.getCell("A4").font = { bold: true, size: 13, color: { argb: "FF1A3D34" } };
  summaryRows.forEach((pair, index) => {
    const row = summary.getRow(5 + index);
    row.getCell(1).value = pair[0];
    row.getCell(2).value = pair[1];
    row.getCell(1).font = { bold: true, name: "Calibri" };
    row.getCell(2).font = { name: "Calibri" };
    row.getCell(2).alignment = { horizontal: "left" };
  });

  const limitRow = 5 + summaryRows.length + 1;
  summary.getCell(`A${limitRow}`).value = "Scan coverage and limits";
  summary.getCell(`A${limitRow}`).font = { bold: true, size: 13, color: { argb: "FF1A3D34" } };
  summary.mergeCells(`A${limitRow + 1}:F${limitRow + 4}`);
  summary.getCell(`A${limitRow + 1}`).value =
    "Scanned the live production category API (14 categories) and the live US product API, then united that with the bundled catalogues: BlossomPot, FNP USA, TF USA, USA Rakhi, and Orange County (including the single-rakhi file and inventory-2 SKUs that were not already present). Duplicate slugs were merged. apps/api copies of the same JSON files were not counted twice. No bundled product had published set to false, and zero-inventory products were not dropped. DynamoDB was not scanned: the AWS session had expired, so unpublished products that exist only in blossompot-products-prod are outside this file. The public product API also hides unpublished rows, zero inventory, most Rakhi text, and Gift Baskets Overseas while that storefront flag is off. GBO's partner catalogue is not stored in the repo and did not appear in the public product response. Country queries for GB, CA, AU, AE, IN, DE, and FR all came back as the US catalogue. Orange County availability is taken from the product description when it says delivery is limited to Orange County ZIP codes; otherwise country is US.";
  summary.getCell(`A${limitRow + 1}`).alignment = { wrapText: true, vertical: "top" };
  summary.getRow(limitRow + 1).height = 78;

  const headerRowNumber = limitRow + 6;
  const headers = [
    "Suggested New Category",
    "Suggested Subcategory",
    "Number of Products",
    "Category Description",
    "Business Opportunity",
    "Priority (High / Medium / Low)",
  ];
  const header = summary.getRow(headerRowNumber);
  headers.forEach((title, index) => {
    header.getCell(index + 1).value = title;
  });
  styleHeader(header, "FF1A3D34");
  categorySummaries.forEach((item, index) => {
    const row = summary.getRow(headerRowNumber + 1 + index);
    row.getCell(1).value = item.category;
    row.getCell(2).value = item.subcategory;
    row.getCell(3).value = item.count;
    row.getCell(4).value = item.description;
    row.getCell(5).value = item.opportunity;
    row.getCell(6).value = item.priority;
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { name: "Calibri", size: 11 };
    const fill = item.priority === "High" ? "FFF8D7E3" : item.priority === "Medium" ? "FFFFF2CC" : "FFE2EFDA";
    for (let column = 1; column <= 6; column += 1) {
      row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      row.getCell(column).border = { bottom: { style: "thin", color: { argb: "FFE5E5E5" } } };
    }
    row.getCell(6).font = { bold: true, name: "Calibri", size: 11 };
    row.height = 64;
  });
  applyFilter(summary, headerRowNumber, headers.length);
  setWidths(summary, [34, 42, 22, 62, 62, 28]);
  summary.getColumn(3).alignment = { horizontal: "center", vertical: "top" };
  summary.autoFilter.from.row = headerRowNumber;

  const productsSheet = workbook.addWorksheet("Products Under Missing Category");
  const productHeaders = [
    "Product ID",
    "Product Name",
    "Product Description",
    "Vendor",
    "Original Vendor Category",
    "Suggested Website Category",
    "Suggested Subcategory",
    "Product Price",
    "Currency",
    "Country Availability",
    "Product Image URL",
    "Product Status",
    "Reason for Classification",
  ];
  const productHeader = productsSheet.getRow(1);
  productHeaders.forEach((title, index) => productHeader.getCell(index + 1).value = title);
  styleHeader(productHeader, "FF1A3D34");
  const priorityByCategory = new Map(categorySummaries.map((item) => [item.category, item.priority]));
  missingRows.sort((a, b) => {
    const pr = priorityRank[priorityByCategory.get(a.category) || "Low"] - priorityRank[priorityByCategory.get(b.category) || "Low"];
    if (pr !== 0) return pr;
    return a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory) || a.product.name.localeCompare(b.product.name);
  });
  missingRows.forEach((row, index) => {
    const excelRow = productsSheet.getRow(index + 2);
    const price = typeof row.product.price === "number" ? row.product.price : null;
    const currency = row.product.currency || "USD";
    const values = [
      row.product.slug,
      row.product.name,
      plain(row.product.description).slice(0, 1200),
      vendorOf(row.product),
      originalCategory(row.product),
      row.category,
      row.subcategory,
      price,
      currency,
      countryOf(row.product),
      imageOf(row.product),
      statusOf(row.product),
      row.reason,
    ];
    values.forEach((value, column) => {
      excelRow.getCell(column + 1).value = value == null ? "" : value;
    });
    if (price != null) {
      excelRow.getCell(8).numFmt = currency === "INR" ? '"₹"#,##0.00' : '"$"#,##0.00';
    }
    excelRow.alignment = { vertical: "top", wrapText: true };
    excelRow.font = { name: "Calibri", size: 10 };
    const priority = priorityByCategory.get(row.category);
    if (priority === "High") {
      excelRow.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7E3" } };
    } else if (priority === "Medium") {
      excelRow.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    }
  });
  applyFilter(productsSheet, 1, productHeaders.length);
  setWidths(productsSheet, [36, 42, 55, 24, 46, 32, 32, 16, 12, 36, 55, 46, 62]);

  const existingSheet = workbook.addWorksheet("Existing Categories");
  const existingHeaders = ["Existing Website Category", "Number of Products", "Subcategories", "Category Source"];
  const existingHeader = existingSheet.getRow(1);
  existingHeaders.forEach((title, index) => existingHeader.getCell(index + 1).value = title);
  styleHeader(existingHeader, "FF1A3D34");

  const existingTable = LIVE_CATEGORIES.map((category) => {
    const fitting = fitCounts.get(category.slug) || [];
    const themes = themeCounts(fitting, THEMES[category.slug] || []);
    const assigned = assignedCounts.get(category.slug) || 0;
    return {
      name: category.name,
      count: fitting.length,
      subcategories: themes || "(no extra subtype grouping in product names)",
      source: `Live production category (sort ${category.sort}). Navigation: ${category.nav}. Catalogue rows stored in this slug: ${assigned}. Products that still fit here after the audit: ${fitting.length}. Parent slug: none.`,
    };
  });

  const filters = [
    {
      name: "Combos",
      count: 10,
      subcategories: "Flower and cake bundles and other paired gifts",
      source: "Live /combos page and production /combos API (10 published combo records). A collection of existing products, not an extra catalogue department. Not included in the 14 category total.",
    },
    {
      name: "Gift collections menu",
      count: "",
      subcategories: "Flowers; Flower Bouquets; Cakes; Gift Hampers; Gift Catalog",
      source: "Header gift-collections menu in the storefront. Links into existing categories. Not included in the 14 category total.",
    },
    {
      name: "Red roses collection",
      count: "",
      subcategories: "Roses",
      source: "Storefront collection /collections/red-roses. Filter over Flowers. Not a separate category.",
    },
    {
      name: "Birthday flowers collection",
      count: "",
      subcategories: "Birthday",
      source: "Storefront collection /collections/birthday-flowers. Filter over Birthday Gifts. Not a separate category.",
    },
    {
      name: "Anniversary roses collection",
      count: "",
      subcategories: "Anniversary",
      source: "Storefront collection /collections/anniversary-roses. Filter over Anniversary Gifts. Not a separate category.",
    },
    {
      name: "Gift hampers collection",
      count: "",
      subcategories: "Hampers",
      source: "Storefront collection /collections/gift-hampers. Same shelf as Gift Hampers.",
    },
    {
      name: "Cakes collection",
      count: "",
      subcategories: "Cakes",
      source: "Storefront collection /collections/cakes. Same shelf as Cakes.",
    },
    {
      name: "Under $50 collection",
      count: "",
      subcategories: "Price filter",
      source: "Storefront collection /collections/under-50. Price filter, not a product department.",
    },
    {
      name: "Under $100 collection",
      count: "",
      subcategories: "Price filter",
      source: "Storefront collection /collections/under-100. Price filter, not a product department.",
    },
    {
      name: "Birthday occasion",
      count: "",
      subcategories: "Uses Birthday Gifts",
      source: "Occasion page /occasions/birthday. Uses the Birthday Gifts category.",
    },
    {
      name: "Anniversary occasion",
      count: "",
      subcategories: "Uses Anniversary Gifts",
      source: "Occasion page /occasions/anniversary. Uses the Anniversary Gifts category.",
    },
    {
      name: "Valentine's occasion",
      count: "",
      subcategories: "Uses Valentine's Day Gifts",
      source: "Occasion page /occasions/valentines. Uses the Valentine's Day Gifts category.",
    },
    {
      name: "Mother's Day occasion",
      count: "",
      subcategories: "Uses Mother's Day Gifts",
      source: "Occasion page /occasions/mothers-day. Uses the Mother's Day Gifts category.",
    },
    {
      name: "Wedding occasion",
      count: "",
      subcategories: "Uses Wedding Gifts",
      source: "Occasion page /occasions/wedding. Uses the Wedding Gifts category.",
    },
    {
      name: "Sympathy occasion",
      count: "",
      subcategories: "Uses Flowers",
      source: "Occasion page /occasions/sympathy. Uses Flowers. Not a separate catalogue category.",
    },
    {
      name: "Get well occasion",
      count: "",
      subcategories: "Uses Flowers",
      source: "Occasion page /occasions/get-well. Uses Flowers.",
    },
    {
      name: "Thank you occasion",
      count: "",
      subcategories: "Uses Gift Hampers",
      source: "Occasion page /occasions/thank-you. Uses Gift Hampers.",
    },
    {
      name: "Congratulations occasion",
      count: "",
      subcategories: "Uses Celebration Gifts",
      source: "Occasion page /occasions/congratulations. Uses Celebration Gifts.",
    },
    {
      name: "New baby occasion",
      count: "",
      subcategories: "Uses Gift Hampers",
      source: "Occasion page /occasions/new-baby. Uses Gift Hampers. Not a separate Baby Gifts category.",
    },
    {
      name: "Housewarming occasion",
      count: "",
      subcategories: "Uses Plants",
      source: "Occasion page /occasions/housewarming. Uses Plants.",
    },
    {
      name: "Graduation occasion",
      count: "",
      subcategories: "Uses Celebration Gifts",
      source: "Occasion page /occasions/graduation. Uses Celebration Gifts.",
    },
    {
      name: "Rose Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /rose-day-gifts. Filter, not a catalogue category.",
    },
    {
      name: "Propose Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /propose-day-gifts. Filter, not a catalogue category.",
    },
    {
      name: "Chocolate Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /chocolate-day-gifts. A date filter only. There is still no Chocolates catalogue category.",
    },
    {
      name: "Teddy Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /teddy-day-gifts. A date filter only. There is still no Soft Toys catalogue category.",
    },
    {
      name: "Promise Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /promise-day-gifts. Filter, not a catalogue category.",
    },
    {
      name: "Hug Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /hug-day-gifts. Filter, not a catalogue category.",
    },
    {
      name: "Kiss Day",
      count: "",
      subcategories: "Special-day filter",
      source: "Special-day page /kiss-day-gifts. Filter, not a catalogue category.",
    },
    {
      name: "Gift guides",
      count: "",
      subcategories: "By recipient and by budget",
      source: "Pages under /gifts. Guides over flowers, cakes, and hampers, not separate product departments.",
    },
  ];

  [...existingTable, ...filters].forEach((item, index) => {
    const row = existingSheet.getRow(index + 2);
    row.getCell(1).value = item.name;
    row.getCell(2).value = item.count === "" ? null : item.count;
    row.getCell(3).value = item.subcategories;
    row.getCell(4).value = item.source;
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { name: "Calibri", size: 11 };
    if (index < LIVE_CATEGORIES.length) {
      row.getCell(1).font = { bold: true, name: "Calibri", size: 11 };
    } else {
      row.getCell(1).font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF555555" } };
    }
    row.height = 36;
  });
  applyFilter(existingSheet, 1, existingHeaders.length);
  setWidths(existingSheet, [36, 22, 55, 78]);

  const unclassifiedSheet = workbook.addWorksheet("Unclassified Products");
  const unclassifiedHeaders = ["Product ID", "Product Name", "Original Category", "Product Description", "Reason for Unclassified Status"];
  const unclassifiedHeader = unclassifiedSheet.getRow(1);
  unclassifiedHeaders.forEach((title, index) => unclassifiedHeader.getCell(index + 1).value = title);
  styleHeader(unclassifiedHeader, "FF1A3D34");
  unclassifiedRows
    .sort((a, b) => a.product.name.localeCompare(b.product.name))
    .forEach((row, index) => {
      const excelRow = unclassifiedSheet.getRow(index + 2);
      const values = [
        row.product.slug,
        row.product.name,
        originalCategory(row.product),
        plain(row.product.description).slice(0, 1200),
        row.unclassifiedReason || row.reason,
      ];
      values.forEach((value, column) => {
        excelRow.getCell(column + 1).value = value;
      });
      excelRow.alignment = { vertical: "top", wrapText: true };
      excelRow.font = { name: "Calibri", size: 10 };
    });
  applyFilter(unclassifiedSheet, 1, unclassifiedHeaders.length);
  setWidths(unclassifiedSheet, [36, 42, 46, 70, 70]);

  await workbook.xlsx.writeFile(outPath);

  console.log(JSON.stringify({
    scanned: products.length,
    liveFlag: products.filter((product) => product.live).length,
    liveApi: liveCount,
    missingProducts: missingRows.length,
    existingProducts: existingRows.length,
    unclassified: unclassifiedRows.length,
    existingFit: LIVE_CATEGORIES.map((category) => ({ name: category.name, fit: (fitCounts.get(category.slug) || []).length, stored: assignedCounts.get(category.slug) || 0 })),
    categories: categorySummaries.map((item) => ({ category: item.category, count: item.count, priority: item.priority, subcategory: item.subcategory })),
    unclassifiedNames: unclassifiedRows.map((row) => `${row.product.categorySlug || ""} | ${row.product.name}`),
    outPath,
  }, null, 2));

  for (const item of categorySummaries) {
    if (item.category === "Rakhi") continue;
    const names = byCategory.get(item.category).map((row) => row.product.name);
    console.log(`\n## ${item.category} (${names.length})`);
    names.forEach((name) => console.log(name));
  }
}

export {
  LIVE_CATEGORIES,
  loadProducts,
  classify,
  vendorOf,
  originalCategory,
  countryOf,
  imageOf,
  plain,
};

const ranDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ranDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
