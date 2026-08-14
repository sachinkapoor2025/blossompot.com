/**
 * Curated Unsplash photos for sample catalog (https://unsplash.com/license).
 * IDs verified live (HTTP 200) — do not reintroduce dead photo IDs.
 */
export type SampleImageRef = {
  id: string;
  photographer: string;
  category: "flowers" | "cakes" | "gifts" | "plants" | "balloons";
};

export const SAMPLE_IMAGE_POOL: SampleImageRef[] = [
  // Flowers
  { id: "1518895949257-7621c3c786d7", photographer: "Unsplash", category: "flowers" },
  { id: "1468327768560-75b778cbb551", photographer: "Unsplash", category: "flowers" },
  { id: "1525310072745-f49212b5ac6d", photographer: "Unsplash", category: "flowers" },
  { id: "1487530811176-3780de880c2d", photographer: "Unsplash", category: "flowers" },
  { id: "1508610048659-a06b669e3321", photographer: "Teodor Kuduschiev", category: "flowers" },
  { id: "1462275646964-a0e3386b89fa", photographer: "Annie Spratt", category: "flowers" },
  { id: "1457089328109-e5d9bd499191", photographer: "LoboStudio Hamburg", category: "flowers" },
  { id: "1465146633011-14f8e0781093", photographer: "Annie Spratt", category: "flowers" },
  { id: "1470506028280-a011fb34b6f7", photographer: "Annie Spratt", category: "flowers" },
  { id: "1494976388531-d1058494cdd8", photographer: "Brandon Morgan", category: "flowers" },
  { id: "1563241527-3004b7be0ffd", photographer: "Unsplash", category: "flowers" },
  { id: "1518709268805-4e9042af9f23", photographer: "Annie Spratt", category: "flowers" },
  { id: "1591886960571-74d43a9d4166", photographer: "Unsplash", category: "flowers" },
  { id: "1446071103084-c257b5f70672", photographer: "Unsplash", category: "flowers" },
  // Cakes
  { id: "1578985545062-69928b1d9587", photographer: "American Heritage Chocolate", category: "cakes" },
  { id: "1464349095431-e9a21285b5f3", photographer: "American Heritage Chocolate", category: "cakes" },
  { id: "1488477181946-6428a0291777", photographer: "Caitlyn de Wild", category: "cakes" },
  { id: "1563729784474-d77dbb933a9e", photographer: "American Heritage Chocolate", category: "cakes" },
  { id: "1551024506-0bccd828d307", photographer: "Mae Mu", category: "cakes" },
  { id: "1481391319762-47dff72954d9", photographer: "Brooke Lark", category: "cakes" },
  { id: "1535141192574-5d4897c12636", photographer: "Heidi Fin", category: "cakes" },
  { id: "1571115177098-24ec42ed204d", photographer: "Calum Lewis", category: "cakes" },
  { id: "1565958011703-44f9829ba187", photographer: "Unsplash", category: "cakes" },
  { id: "1486427944299-d1955d23e34d", photographer: "Unsplash", category: "cakes" },
  { id: "1614707267537-b85aaf00c4b7", photographer: "Unsplash", category: "cakes" },
  { id: "1606313564200-e75d5e30476c", photographer: "Unsplash", category: "cakes" },
  { id: "1621303837174-89787a7d4729", photographer: "Unsplash", category: "cakes" },
  // Gifts
  { id: "1549465220-1a8b9238cd48", photographer: "Unsplash", category: "gifts" },
  { id: "1512909006721-3d6018887383", photographer: "Unsplash", category: "gifts" },
  { id: "1607344645866-009c320b63e0", photographer: "Unsplash", category: "gifts" },
  { id: "1607083206869-4c7672e72a8a", photographer: "Unsplash", category: "gifts" },
  { id: "1607082348824-0a96f2a4b9da", photographer: "Unsplash", category: "gifts" },
  // Plants
  { id: "1416879595882-3373a0480b5b", photographer: "Scott Webb", category: "plants" },
  { id: "1501004318641-b39e6451bec6", photographer: "Scott Webb", category: "plants" },
  { id: "1459411621453-7b03977f4bfc", photographer: "Unsplash", category: "plants" },
  { id: "1509423350716-97f9360b4e09", photographer: "Unsplash", category: "plants" },
  // Balloons / celebration
  { id: "1530103862676-de8c9debad1d", photographer: "Unsplash", category: "balloons" },
  { id: "1513151233558-d860c5398176", photographer: "Unsplash", category: "balloons" },
  { id: "1492684223066-81342ee5ff30", photographer: "Unsplash", category: "balloons" },
];

/** Deduplicate pool by id while preserving order. */
export function uniquePool(): SampleImageRef[] {
  const seen = new Set<string>();
  return SAMPLE_IMAGE_POOL.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function unsplashUrl(id: string, w = 800, variant = 0): string {
  const crops = [
    `w=${w}&h=${w}&fit=crop`,
    `w=${w}&h=${Math.round(w * 1.1)}&fit=crop&crop=entropy`,
    `w=${w}&h=${w}&fit=crop&crop=edges`,
    `w=${Math.round(w * 1.05)}&h=${w}&fit=crop&crop=faces`,
  ];
  return `https://images.unsplash.com/photo-${id}?auto=format&${crops[variant % 4]}&q=80`;
}

/** Reliable fallback when a category pool is thin. */
export function picsumUrl(seed: string, w = 800): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${w}`;
}

export function imagesForProduct(
  categoryKey: "flowers" | "cakes" | "gifts" | "plants" | "balloons",
  productIndex: number,
  name: string
): {
  images: string[];
  imageAssets: Array<{
    url: string;
    role: "main" | "side" | "detail" | "lifestyle";
    source: string;
    license: string;
    attribution: string;
    isSampleImage: boolean;
    alt: string;
  }>;
} {
  const all = uniquePool();
  const pool = all.filter((p) => p.category === categoryKey);
  const use = pool.length >= 4 ? pool : all;
  const roles = ["main", "side", "detail", "lifestyle"] as const;
  // Ensure 4 distinct IDs when the category pool is large enough.
  const uniquePicks: SampleImageRef[] = [];
  for (let offset = 0; uniquePicks.length < 4 && offset < use.length * 2; offset++) {
    const idx = (productIndex * 4 + offset * 7) % use.length;
    const cand = use[idx]!;
    if (!uniquePicks.some((p) => p.id === cand.id)) uniquePicks.push(cand);
  }
  while (uniquePicks.length < 4) {
    uniquePicks.push(use[uniquePicks.length % use.length]!);
  }

  const images = uniquePicks.map((p, i) => unsplashUrl(p.id, 800, i));
  const imageAssets = uniquePicks.map((p, i) => ({
    url: images[i]!,
    role: roles[i]!,
    source: "unsplash",
    license: "Unsplash License",
    attribution: `Photo by ${p.photographer} on Unsplash (https://unsplash.com)`,
    isSampleImage: true,
    alt: `${name} — ${roles[i]} view`,
  }));
  return { images, imageAssets };
}
