import { categoryHref } from "@/lib/category-urls";

export type GiftGuideFaq = { q: string; a: string };

export type RecipientGiftPage = {
  kind: "recipient";
  slug: string;
  title: string;
  h1: string;
  primaryKeyword: string;
  intro: string;
  faqs: GiftGuideFaq[];
  categorySlug: string;
  matchTokens: string[];
};

export type PriceBandGiftPage = {
  kind: "price";
  slug: string;
  title: string;
  h1: string;
  primaryKeyword: string;
  intro: string;
  faqs: GiftGuideFaq[];
  /** Inclusive max USD price filter. */
  maxPrice: number;
  categorySlug: string;
};

export type GiftGuidePage = RecipientGiftPage | PriceBandGiftPage;

export const giftGuidePages: GiftGuidePage[] = [
  {
    kind: "recipient",
    slug: "for-her",
    title: "Gifts for Her — Flowers, Bouquets & Hampers | BlossomPot",
    h1: "Thoughtful Gifts for Her",
    primaryKeyword: "gifts for her USA",
    categorySlug: "flowers",
    matchTokens: ["her", "women", "rose", "bouquet", "feminine"],
    intro:
      "Finding a gift for her works best when you start with her taste—not a generic “for her” stereotype. BlossomPot’s ideas for women include elegant flower bouquets, soft romantic roses, celebration cakes, and curated hampers you can send across the USA. For birthdays and thank-yous, mixed seasonal blooms feel fresh; for romantic occasions, classic roses or blush arrangements still resonate. If she loves low-maintenance beauty, consider a refined bouquet with a short personal note rather than a bulky basket. Shop flowers, cakes, and gift collections, then match color and scale to her style—minimal, garden-inspired, or boldly celebratory—with clear delivery expectations on each product page.",
    faqs: [
      {
        q: "What flowers make a good gift for her?",
        a: "Mixed seasonal bouquets and rose arrangements are versatile. Choose softer palettes for everyday appreciation and classic romantic styles for anniversaries or Valentine’s Day.",
      },
      {
        q: "Can I add a personal message?",
        a: "Yes—most BlossomPot gifts support a gift message at checkout. A specific line about why you appreciate her lands better than a generic compliment.",
      },
      {
        q: "Do you deliver gifts for her nationwide?",
        a: "BlossomPot supports USA delivery with product-level timing guidance. Same-day options may appear for eligible gifts in select cities.",
      },
    ],
  },
  {
    kind: "recipient",
    slug: "for-him",
    title: "Gifts for Him — Modern Flowers & Hampers | BlossomPot",
    h1: "Modern Gifts for Him",
    primaryKeyword: "gifts for him USA",
    categorySlug: "gift-hampers",
    matchTokens: ["him", "men", "gentleman", "modern"],
    intro:
      "Gifts for him do not have to default to gadgets. BlossomPot highlights clean floral designs, greenery-forward arrangements, celebration cakes, and polished hampers that feel modern rather than fussy—ideal for birthdays, congratulations, and thank-yous across the United States. Structured bouquets in deeper tones, simple wraps, and dessert pairings often read well for partners, friends, and relatives who prefer understated presentation. Pair the gift with a straightforward note that names the occasion. Browse hamper and flower collections, avoid overly delicate styling if that is not his taste, and use checkout delivery guidance to hit the right day at a home or office address.",
    faqs: [
      {
        q: "Are flowers appropriate gifts for him?",
        a: "Yes—especially clean, modern arrangements and greenery-forward designs. Many men appreciate a well-presented bouquet with a clear, sincere note.",
      },
      {
        q: "What else pairs well with flowers for him?",
        a: "Celebration cakes and compact gourmet-style hampers make strong pairings for birthdays and congratulations.",
      },
      {
        q: "Can gifts for him be sent to an office?",
        a: "Yes—choose a manageable size, include the correct recipient name, and review delivery windows for the business address.",
      },
    ],
  },
  {
    kind: "recipient",
    slug: "for-mom",
    title: "Gifts for Mom — Flowers & Mother’s Day Ideas | BlossomPot",
    h1: "Gifts for Mom",
    primaryKeyword: "gifts for mom USA",
    categorySlug: "mothers-day-gifts",
    matchTokens: ["mom", "mother", "mum", "mama"],
    intro:
      "Gifts for mom should feel grateful and familiar—colors she loves, flavors she actually eats, and a note that sounds like you. BlossomPot offers flowers, soft bouquets, cakes, and thoughtful hampers for Mother’s Day and everyday appreciation with USA delivery. Pastel mixed blooms and garden-inspired arrangements are perennial favorites; plants suit moms who enjoy lasting greenery. If siblings are coordinating, one beautiful shared arrangement often feels more special than scattered small gifts. Explore Mother’s Day and flowers collections, schedule delivery around brunch or family plans, and keep the message specific: name a quality you admire or a recent kindness she showed.",
    faqs: [
      {
        q: "What are popular flower gifts for mom?",
        a: "Soft mixed bouquets, pink roses, and garden-style blooms are favorites. Plants are excellent for moms who like lasting greenery.",
      },
      {
        q: "Should siblings send separate gifts?",
        a: "A single polished shared gift with everyone’s names can feel more intentional, though separate notes are always welcome.",
      },
      {
        q: "Can I send gifts for mom any time of year?",
        a: "Yes—birthdays, thank-yous, and “just because” moments are perfect for flowers and cakes, not only Mother’s Day.",
      },
    ],
  },
  {
    kind: "recipient",
    slug: "for-wife",
    title: "Gifts for Wife — Romantic Flowers & Anniversary Ideas | BlossomPot",
    h1: "Romantic Gifts for Your Wife",
    primaryKeyword: "gifts for wife USA",
    categorySlug: "anniversary-gifts",
    matchTokens: ["wife", "spouse", "romantic", "anniversary", "rose"],
    intro:
      "Gifts for your wife work best when they reflect your shared history—not a one-size romance template. BlossomPot’s romantic flowers, rose bouquets, anniversary-ready arrangements, and dessert pairings are designed for USA delivery on birthdays, anniversaries, Valentine’s Day, and ordinary Tuesdays that need a lift. Classic roses remain timeless; softer blush and mixed romantic blooms feel personal when red is not her favorite. Add a note that mentions a real detail from your life together. Shop anniversary and Valentine collections, confirm delivery timing around plans, and choose presentation quality over last-minute excess. A careful bouquet with honest words still outperforms a rushed luxury upgrade.",
    faqs: [
      {
        q: "What flowers should I send my wife?",
        a: "Roses are classic; blush mixed romantic bouquets are lovely if she prefers softer tones. Match colors to what she actually wears and displays at home.",
      },
      {
        q: "Are flower-and-cake combos good for wives?",
        a: "Yes—especially for anniversaries and birthdays. Share one personal message across the gift.",
      },
      {
        q: "When should anniversary flowers for my wife arrive?",
        a: "Morning-of delivery is popular when available. Ordering for the day before is safer if timing is uncertain.",
      },
    ],
  },
  {
    kind: "recipient",
    slug: "for-boss",
    title: "Gifts for Boss — Professional Appreciation Ideas | BlossomPot",
    h1: "Professional Gifts for Your Boss",
    primaryKeyword: "gifts for boss USA",
    categorySlug: "gift-hampers",
    matchTokens: ["boss", "executive", "professional", "office"],
    intro:
      "Gifts for a boss should stay professional, proportionate, and free of awkward implications. BlossomPot suggests elegant mixed flowers, understated bouquets, and polished hampers suitable for USA office or home delivery after projects, promotions, or holiday appreciation. Keep styling refined rather than romantic, and write a brief note that thanks them for specific leadership or support—not flattery. Avoid oversized displays that create desk clutter. If gifting as a team, one shared arrangement with a clear group signature usually looks more appropriate than many individual deliveries. Browse hamper and flower collections, confirm workplace delivery rules, and choose a moderate budget that respects workplace norms.",
    faqs: [
      {
        q: "Is it appropriate to send flowers to a boss?",
        a: "Yes when kept elegant and professional—especially as a team thank-you. Avoid romantic styling and overly personal messages.",
      },
      {
        q: "What message should I write for a boss gift?",
        a: "Thank them for a specific project or support. Keep the tone respectful and concise.",
      },
      {
        q: "Should a boss gift go to the office or home?",
        a: "Office is common for team appreciation; home may suit personal milestones if you know preferences and boundaries.",
      },
    ],
  },
  {
    kind: "recipient",
    slug: "for-coworker",
    title: "Gifts for Coworkers — Office-Friendly Flowers & Thanks | BlossomPot",
    h1: "Office-Friendly Gifts for Coworkers",
    primaryKeyword: "coworker gift ideas USA",
    categorySlug: "flowers",
    matchTokens: ["coworker", "colleague", "office", "team"],
    intro:
      "Coworker gifts should feel friendly, inclusive, and easy to receive at work. BlossomPot offers cheerful mixed flowers, compact bouquets, and light appreciation hampers with USA delivery for birthdays, farewells, new-baby congratulations, and thank-yous. Choose moderate sizes, lighter fragrance, and non-romantic color stories. Group collections are ideal when a team chips in. Your note can be warm without becoming overly personal. Explore flowers and celebration gifts, confirm desk or reception delivery details, and keep budgets comfortable for workplace culture. A tidy bouquet with a sincere line of appreciation often brightens a shared office more than an elaborate private gift.",
    faqs: [
      {
        q: "What flowers are best for coworker birthdays?",
        a: "Bright mixed bouquets in manageable sizes work well. Avoid strongly romantic red-rose styling unless you know it is welcome.",
      },
      {
        q: "Can a team share one coworker gift order?",
        a: "Yes—one shared arrangement with everyone’s names is a popular, polished approach.",
      },
      {
        q: "Are edible gifts okay for coworkers?",
        a: "Often yes if dietary needs are considered. When unsure, flowers or non-edible hampers are safer.",
      },
    ],
  },
  {
    kind: "price",
    slug: "under-25",
    title: "Gifts Under $25 — Affordable Flowers & Treats | BlossomPot",
    h1: "Thoughtful Gifts Under $25",
    primaryKeyword: "gifts under $25 USA",
    maxPrice: 25,
    categorySlug: "flowers",
    intro:
      "A meaningful gift does not require a large budget. BlossomPot’s under-$25 ideas focus on compact flowers, smaller treats, and simple gestures you can send across the USA when you want to show up thoughtfully without overspending. These gifts suit teacher thank-yous, light hostess gestures, coworker birthdays, and “thinking of you” moments. Pair a modest bouquet or small item with a specific note—specificity is what makes an affordable gift feel generous. Browse the filtered selection below, confirm delivery windows, and remember that presentation and timing matter as much as price. When inventory shifts, related category links help you find the next-best option in a similar budget spirit.",
    faqs: [
      {
        q: "Can flowers really come in under $25?",
        a: "Compact arrangements and select smaller gifts may fall in this range depending on current inventory and promotions. The grid below shows live products at or under $25.",
      },
      {
        q: "What occasions fit gifts under $25?",
        a: "Thank-yous, light congratulations, coworker birthdays, and casual “just because” moments are ideal.",
      },
      {
        q: "Does under $25 include shipping?",
        a: "Listed prices are product prices. Shipping and delivery options are shown at checkout based on the recipient address.",
      },
    ],
  },
  {
    kind: "price",
    slug: "under-50",
    title: "Gifts Under $50 — Bouquets & Celebration Ideas | BlossomPot",
    h1: "Gifts Under $50",
    primaryKeyword: "gifts under $50 USA",
    maxPrice: 50,
    categorySlug: "flower-bouquets",
    intro:
      "The under-$50 range is a sweet spot for quality bouquets and celebration-ready gifts without stretching the budget. BlossomPot highlights flowers, compact cakes, and approachable hampers for USA delivery—popular for birthdays, thank-yous, get-well wishes, and housewarmings. You can usually step up from the smallest keepsakes into fuller floral presentations while staying mindful of cost. Use the filtered products below to shop live inventory at or under $50, then add a personal message that names the occasion. If you need something fuller, related collections make it easy to compare nearby options.",
    faqs: [
      {
        q: "What can I get for under $50?",
        a: "Many bouquets and select celebration gifts fall in this range. Check the live product grid for current options at or under $50.",
      },
      {
        q: "Is under $50 enough for birthday flowers?",
        a: "Yes—many birthday-ready bouquets fit comfortably in this budget, especially when paired with a sincere note.",
      },
      {
        q: "Can I filter gifts under $50 for same-day delivery?",
        a: "Same-day eligibility depends on product and location. Review each product page and checkout guidance for your recipient’s ZIP.",
      },
    ],
  },
  {
    kind: "price",
    slug: "under-75",
    title: "Gifts Under $75 — Premium Bouquets & Combos | BlossomPot",
    h1: "Gifts Under $75",
    primaryKeyword: "gifts under $75 USA",
    maxPrice: 75,
    categorySlug: "flower-bouquets",
    intro:
      "Under $75 opens the door to fuller bouquets, premium floral designs, and appealing flower-and-treat combinations for USA gifting. This range suits anniversaries, Mother’s Day, Valentine’s gestures, and congratulations when you want more presence without moving into luxury pricing. BlossomPot’s filtered selection below shows products priced at or under $75 so you can compare styles quickly. Add a gift message, confirm delivery timing, and choose packaging that still feels elevated. When you are celebrating a milestone, this band often balances visual impact and value especially well.",
    faqs: [
      {
        q: "Are premium roses available under $75?",
        a: "Select rose and premium bouquet options may appear in this range depending on current catalog pricing. Browse the live grid below.",
      },
      {
        q: "What occasions fit the under-$75 gift band?",
        a: "Anniversaries, Mother’s Day, Valentine’s Day, and major thank-yous commonly land here.",
      },
      {
        q: "Can I combine flowers and cake under $75?",
        a: "Sometimes—compare individual items or combo-style gifts in the filtered list and related collections.",
      },
    ],
  },
  {
    kind: "price",
    slug: "under-100",
    title: "Gifts Under $100 — Luxe Flowers & Gift Sets | BlossomPot",
    h1: "Gifts Under $100",
    primaryKeyword: "gifts under $100 USA",
    maxPrice: 100,
    categorySlug: "gift-hampers",
    intro:
      "Gifts under $100 are ideal when you want a luxe look—statement bouquets, refined hampers, and celebration sets—while keeping a clear budget ceiling. BlossomPot curates USA-delivery flowers, cakes, and gift boxes that make birthdays, anniversaries, corporate thank-yous, and holiday gestures feel generous. Use the live under-$100 grid to compare current inventory, then write a message worthy of the presentation. This band is also popular for shared family gifts and client appreciation when professionalism and polish both matter. Explore related premium collections if you want to step just beyond the cap for a signature design.",
    faqs: [
      {
        q: "What kinds of gifts appear under $100?",
        a: "Statement bouquets, select hampers, and celebration-ready combinations often fall at or under $100. Inventory varies—see the grid below.",
      },
      {
        q: "Is under $100 appropriate for client gifts?",
        a: "Yes for many appreciation contexts—choose elegant, non-romantic styling and keep the note professional.",
      },
      {
        q: "Does BlossomPot guarantee luxury inventory under $100?",
        a: "No fixed luxury guarantee—product availability and pricing change. This page filters current published products at or under $100.",
      },
    ],
  },
];

const bySlug = new Map(giftGuidePages.map((p) => [p.slug, p]));

export function getGiftGuide(slug: string): GiftGuidePage | undefined {
  return bySlug.get(slug);
}

export function allGiftGuideSlugs(): string[] {
  return giftGuidePages.map((p) => p.slug);
}

export function giftGuideCategoryHref(page: GiftGuidePage): string {
  return categoryHref(page.categorySlug);
}
