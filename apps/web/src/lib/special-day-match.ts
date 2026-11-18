type Matchable = {
  slug: string;
  name: string;
  description?: string;
  tags?: string[];
  categorySlug?: string;
  additionalCategorySlugs?: string[];
};

function textOf(product: Matchable): string {
  return `${product.name} ${product.description ?? ""} ${(product.tags ?? []).join(" ")}`.toLowerCase();
}

function inCategory(product: Matchable, slug: string): boolean {
  return product.categorySlug === slug || (product.additionalCategorySlugs ?? []).includes(slug);
}

/** Higher scores surface first. Zero means the product does not belong on that day. */
export function specialDayScore(dayId: string, product: Matchable): number {
  const text = textOf(product);
  const rose = /\brose/.test(text);
  const redRose = /red rose/.test(text);
  const chocolate = /chocolate|truffle|brownie|cocoa/.test(text);
  const nameTags = `${product.name} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  const personalized = /personali[sz]ed|keepsake|engrav/.test(text) || inCategory(product, "personalized-gifts");
  const valentine = /valentine/.test(text) || inCategory(product, "valentines-day-gifts");
  const warmBunch = /mixed|sunflower|daisy|pastel|blush|cheerful|color splash|bright smile/.test(text);

  switch (dayId) {
    case "rose-day": {
      if (!rose) return 0;
      const variety = /pink|white|yellow|peach|orange|lavender|purple|mixed|rainbow|blush/.test(text) ? 4 : 0;
      return (redRose ? 2 : 4) + variety + (inCategory(product, "flowers") || inCategory(product, "flower-bouquets") ? 2 : 0);
    }
    case "propose-day":
      return (
        (/propos|engagement/.test(text) ? 8 : 0) +
        (inCategory(product, "anniversary-gifts") && rose ? 6 : 0) +
        (/romantic/.test(text) && rose ? 5 : 0) +
        (/premium|luxury|masterpiece/.test(nameTags) && redRose ? 3 : 0)
      );
    case "chocolate-day":
      return chocolate ? 7 + (inCategory(product, "cakes") || inCategory(product, "gift-hampers") ? 2 : 0) : 0;
    case "teddy-day":
      return /teddy|\bplush\b/.test(nameTags) ? 8 : 0;
    case "promise-day": {
      const romanticKeep =
        /keepsake|engrav|promise|forever|couple|photo frame|name cushion|love cushion/.test(nameTags) ||
        (/personali[sz]ed/.test(nameTags) && /cushion|frame|heart|love|couple|mug/.test(nameTags));
      if (!romanticKeep) return 0;
      if (/\bbro\b|bhai|sister|rakhi|birthday|friend|idol|ganesh|durga|diwali|notebook|class year/.test(nameTags)) return 0;
      return 6 + (personalized ? 2 : 0);
    }
    case "hug-day":
      if (redRose || (rose && !warmBunch)) return 0;
      return warmBunch ? 5 + (inCategory(product, "flower-bouquets") ? 2 : 0) : 0;
    case "kiss-day":
      return redRose ? 8 : /kiss/.test(text) ? 6 : 0;
    case "valentines-day":
      return valentine ? 8 : rose && /romantic|love/.test(text) ? 3 : 0;
    default:
      return 0;
  }
}

const SPECIAL_DAY_LIMIT = 24;

export function selectSpecialDayProducts<T extends Matchable>(dayId: string, products: readonly T[]): T[] {
  return products
    .filter((product) => specialDayScore(dayId, product) > 0)
    .sort((a, b) => {
      const score = specialDayScore(dayId, b) - specialDayScore(dayId, a);
      if (score !== 0) return score;
      return a.name.localeCompare(b.name);
    })
    .filter((product, index, list) => list.findIndex((item) => item.slug === product.slug) === index)
    .slice(0, SPECIAL_DAY_LIMIT);
}
