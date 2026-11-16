import { countryDisplayName } from "./location-seo-urls";
import type { SpecialDayId } from "./special-day-slugs";

export type SpecialDayFaq = { q: string; a: string };

export type SpecialDayArticle = {
  title: string;
  description: string;
  h1: string;
  intro: readonly string[];
  deliveryHeading: string;
  delivery: string;
  ideasHeading: string;
  ideas: readonly string[];
  tipHeading: string;
  tip: string;
  whyHeading: string;
  why: readonly string[];
  faqHeading: string;
  faqs: readonly SpecialDayFaq[];
};

const WHY = [
  "Roses, cakes and hampers in one checkout",
  "Delivery dates shown before payment",
  "Personal gift message on most products",
  "Secure payment with Stripe (USD) or Razorpay (INR)",
  "WhatsApp and email support",
] as const;

const SHIP = "Orders of $14 and above ship free.";

const ARTICLES: Record<SpecialDayId, SpecialDayArticle> = {
  "rose-day": {
    title: "Rose Day Gifts to USA | Send Red Roses Online | BlossomPot",
    description:
      "Start Valentine week with roses. Send Rose Day flowers and gifts to the USA with a personal love note. Free shipping on orders $14+.",
    h1: "Rose Day Gifts to the USA — Begin the Week of Love with Roses",
    intro: [
      "Valentine week begins with a rose, and it still says what words sometimes cannot. If someone special lives in the USA, BlossomPot can carry your Rose Day message across the miles.",
      "Pick a dozen classic red roses, a grand 50-rose bouquet or a soft pink and mixed arrangement. Add a note in your own words and we take care of the rest.",
    ],
    deliveryHeading: "Rose Day Delivery in the USA",
    delivery: `We deliver roses across the USA. In select cities, same-day delivery is available when you order before the local cut-off. Choose your delivery date at checkout so the roses arrive on February 7. ${SHIP}`,
    ideasHeading: "Rose Day Gift Ideas",
    ideas: [
      "A dozen red roses for a timeless first gesture",
      "Large rose bouquets for a bold statement",
      "Rose and cake combos for a sweeter surprise",
      "Rose and wine combos for a romantic evening",
    ],
    tipHeading: "What Each Rose Colour Means",
    tip: "Red says love, pink says affection, white says a fresh start and yellow says friendship. Pick the colour that matches your relationship and mention it in the note.",
    whyHeading: "Why Order Rose Day Gifts from BlossomPot",
    why: WHY,
    faqHeading: "Frequently Asked Questions — Rose Day Gifts to USA",
    faqs: [
      {
        q: "Can I send roses to the USA for Rose Day from India?",
        a: "Yes. Enter the USA address at checkout and pay in USD with Stripe or in INR with Razorpay.",
      },
      {
        q: "How can I make sure the roses arrive on February 7?",
        a: "Choose your preferred delivery date at checkout and order early. Valentine week is busy, so a few extra days gives you more choice.",
      },
      {
        q: "Which rose colour is best for Rose Day?",
        a: "Red roses are the classic romantic choice. Pink suits a new relationship, and white suits a calm, sincere message.",
      },
      {
        q: "Can I add a love note?",
        a: "Yes. Most arrangements support a personal gift message.",
      },
      {
        q: "Is same-day rose delivery available?",
        a: "In select cities, yes, for orders placed before the local cut-off. Checkout will show your options.",
      },
    ],
  },
  "propose-day": {
    title: "Propose Day Gifts to USA | Roses & Romantic Gift Boxes | BlossomPot",
    description:
      "Make your proposal unforgettable. Send Propose Day roses and romantic gift boxes to the USA with a personal message. Free shipping on orders $14+.",
    h1: "Propose Day Gifts to the USA — Say What You Have Been Meaning to Say",
    intro: [
      "Some moments need courage, and a good gift helps. Whether you are confessing feelings, proposing a future together or renewing a promise, a beautiful gift makes the moment feel real.",
      "BlossomPot has rose boxes, preserved rose gift boxes and romantic bouquets that are ready to carry your Propose Day message to the USA.",
    ],
    deliveryHeading: "Propose Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day options in select cities when you order before the local cut-off. Pick February 8 as the delivery date at checkout and add your message. ${SHIP}`,
    ideasHeading: "Propose Day Gift Ideas",
    ideas: [
      "Red rose bouquets for a classic confession",
      "Eternal and preserved rose boxes that last long after the day",
      "Rose and cake combos to celebrate a yes",
      "Personalised gifts with a name or message",
    ],
    tipHeading: "Writing the Perfect Proposal Note",
    tip: "Keep it short and honest. Something like “I like who I am when I am with you” feels warmer than a long poem. Say it once, clearly, and let the flowers do the rest.",
    whyHeading: "Why Order Propose Day Gifts from BlossomPot",
    why: [
      "Roses, preserved flowers and cakes on one site",
      "Clear delivery windows",
      "Personal gift message on most products",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email help",
    ],
    faqHeading: "Frequently Asked Questions — Propose Day Gifts to USA",
    faqs: [
      {
        q: "What is a good Propose Day gift for someone far away?",
        a: "A rose bouquet or a preserved rose gift box with a heartfelt note is a popular choice.",
      },
      {
        q: "Can I send a surprise to their home or office?",
        a: "Yes. Enter any USA address and add a contact number so delivery goes smoothly.",
      },
      {
        q: "What is the difference between fresh and preserved roses?",
        a: "Fresh roses are beautiful for a week or so. Preserved roses are treated to keep their look for much longer, so they work as a keepsake.",
      },
      {
        q: "Can I add a message to my gift?",
        a: "Yes. Most products support a gift message at checkout.",
      },
      {
        q: "Can I order for Propose Day at the last minute?",
        a: "Same-day delivery exists in select cities before the local cut-off, but we recommend ordering early to keep your date safe.",
      },
    ],
  },
  "chocolate-day": {
    title: "Chocolate Day Gifts to USA | Chocolate Hampers & Cakes | BlossomPot",
    description:
      "Send sweet Chocolate Day gifts to the USA. Chocolate hampers, brownie cakes and cake pops with a love note. Free shipping on orders $14+.",
    h1: "Chocolate Day Gifts to the USA — Sweeter Together",
    intro: [
      "Chocolate is the easiest way to make someone smile. On Chocolate Day, even a small box carries a big message: you are sweet to me.",
      "Explore chocolate hampers, rich brownie cakes, Belgian chocolate cake pops and chocolate gift combos, all ready for delivery in the USA.",
    ],
    deliveryHeading: "Chocolate Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day options in select cities before the local cut-off. Choose February 9 at checkout and add a message for the card. ${SHIP}`,
    ideasHeading: "Chocolate Day Gift Ideas",
    ideas: [
      "Chocolate and Ferrero-style hampers",
      "Triple chocolate brownie cakes",
      "Belgian chocolate cake pops",
      "Chocolate cake and rose combos",
    ],
    tipHeading: "Sweet Ideas for Every Taste",
    tip: "Dark, milk, white or hazelnut, everyone has a favourite. If you are not sure, pick a mixed hamper or a rich brownie cake, because most chocolate lovers will enjoy both.",
    whyHeading: "Why Order Chocolate Day Gifts from BlossomPot",
    why: [
      "Chocolates, cakes and flowers in one order",
      "Delivery dates shown before payment",
      "Gift message on most products",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email support",
    ],
    faqHeading: "Frequently Asked Questions — Chocolate Day Gifts to USA",
    faqs: [
      {
        q: "Can I send chocolates to the USA from outside the country?",
        a: "Yes. Enter the USA address at checkout and pay in USD or INR.",
      },
      {
        q: "Are chocolate cakes available for Chocolate Day?",
        a: "Yes. We have chocolate cakes, brownie cakes and cake pops that suit the day.",
      },
      {
        q: "What if the recipient has a nut allergy?",
        a: "Please check each product description and contact us on WhatsApp before ordering so we can guide you.",
      },
      {
        q: "Can I combine chocolate with flowers?",
        a: "Yes. Add a bouquet or a rose combo to the same order.",
      },
      {
        q: "Do chocolates survive delivery in warm weather?",
        a: "Tell us the delivery location and date in your message to support, and we will advise on the best option.",
      },
    ],
  },
  "teddy-day": {
    title: "Teddy Day Gifts to USA | Teddy Bear Gift Sets | BlossomPot",
    description:
      "Send cuddly Teddy Day gifts to the USA. Teddy and flower combos, gift sets and treats with a personal message. Free shipping on orders $14+.",
    h1: "Teddy Day Gifts to the USA — A Little Something to Cuddle",
    intro: [
      "A teddy bear says “I am always with you” without a word. For long-distance couples, it is something warm to hold when you cannot be there.",
      "Choose a teddy-themed gift set and pair it with roses, chocolates or a cake to make the surprise even bigger.",
    ],
    deliveryHeading: "Teddy Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day delivery in select cities before the local cut-off. Pick February 10 at checkout and add a short note. ${SHIP}`,
    ideasHeading: "Teddy Day Gift Ideas",
    ideas: [
      "Teddy bear and rose combos",
      "Teddy and chocolate gift sets",
      "Cuddly gifts with cake or cupcakes",
      "Cute hampers that feel like a hug",
    ],
    tipHeading: "Why Teddy Gifts Work",
    tip: "They are playful, they are personal and they stay on a bed or shelf long after the flowers fade. Write a funny or sweet line on the card, such as “Hug this until I can.”",
    whyHeading: "Why Order Teddy Day Gifts from BlossomPot",
    why: [
      "Teddy gifts, flowers and cakes together",
      "Clear delivery windows",
      "Personal gift message",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email support",
    ],
    faqHeading: "Frequently Asked Questions — Teddy Day Gifts to USA",
    faqs: [
      {
        q: "Can I send a teddy bear to the USA?",
        a: "Yes. Enter the USA address at checkout and choose the gift set you like.",
      },
      {
        q: "Can I send a teddy with flowers?",
        a: "Yes. Add a bouquet or a rose combo to your cart for a bigger gift.",
      },
      {
        q: "What size are the teddy bears?",
        a: "Sizes differ by product, so please check the listing or message us for help.",
      },
      {
        q: "Can I add a note with the gift?",
        a: "Yes. Most products support a personal gift message.",
      },
      {
        q: "Is Teddy Day only for couples?",
        a: "Not at all. Teddy gifts also work for friends, siblings and kids.",
      },
    ],
  },
  "promise-day": {
    title: "Promise Day Gifts to USA | Personalised & Romantic Gifts | BlossomPot",
    description:
      "Send meaningful Promise Day gifts to the USA. Personalised gifts, keepsakes and flowers with your own promise. Free shipping on orders $14+.",
    h1: "Promise Day Gifts to the USA — Gifts That Hold a Promise",
    intro: [
      "Promises are easy to make and harder to keep, which is why a gift that lasts matters on Promise Day. A keepsake on a desk or a shelf quietly reminds someone every day.",
      "Explore personalised gifts, love frames and charm gifts that can be delivered in the USA, and pair them with flowers for the day itself.",
    ],
    deliveryHeading: "Promise Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day options in select cities before the local cut-off. Choose February 11 at checkout and write your promise on the card. ${SHIP}`,
    ideasHeading: "Promise Day Gift Ideas",
    ideas: [
      "Personalised gift sets with a name or message",
      "Love frames and charm gifts to keep for years",
      "Rose bouquets for a heartfelt gesture",
      "Cake or hamper combos to make the day feel special",
    ],
    tipHeading: "Writing a Promise That Feels Real",
    tip: "Make it small and specific. “I will call you every Sunday” means more than “I will love you forever.” The best promises are the ones you can keep.",
    whyHeading: "Why Order Promise Day Gifts from BlossomPot",
    why: [
      "Personalised gifts, flowers and cakes on one site",
      "Delivery dates shown clearly",
      "Gift message on most products",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email support",
    ],
    faqHeading: "Frequently Asked Questions — Promise Day Gifts to USA",
    faqs: [
      {
        q: "What is a good Promise Day gift?",
        a: "A personalised gift or a charm keepsake with a handwritten-style note is a popular and lasting choice.",
      },
      {
        q: "Can I personalise my gift?",
        a: "Some gifts allow a name or message. Check the product page for what can be customised.",
      },
      {
        q: "Can I send Promise Day gifts to friends or family?",
        a: "Yes. Promise Day is just as nice for friends, siblings and parents.",
      },
      {
        q: "Can I schedule delivery for February 11?",
        a: "Yes. Choose the preferred date at checkout and order a few days ahead.",
      },
      {
        q: "Can I add flowers to my gift?",
        a: "Yes. Add any bouquet to the same order.",
      },
    ],
  },
  "hug-day": {
    title: "Hug Day Gifts to USA | Cozy Hampers & Comfort Gifts | BlossomPot",
    description:
      "Send a hug across the miles. Hug Day gift hampers, spa baskets and flowers delivered to the USA with a warm message. Free shipping on orders $14+.",
    h1: "Hug Day Gifts to the USA — A Warm Hug, Delivered",
    intro: [
      "Sometimes the thing we miss most about someone is just a hug. When you cannot give one in person, a cosy gift is the next best thing.",
      "BlossomPot hampers, spa baskets and “hugs” themed gifts are made to feel like a warm embrace when they reach the USA.",
    ],
    deliveryHeading: "Hug Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day delivery in select cities before the local cut-off. Choose February 12 at checkout and add a loving message. ${SHIP}`,
    ideasHeading: "Hug Day Gift Ideas",
    ideas: [
      "Spa and self-care baskets for a relaxing day",
      "Comfort snack baskets and treat boxes",
      "“Bear hugs” style thank-you hampers",
      "Soft pink and white flower bouquets",
    ],
    tipHeading: "Gifts That Feel Like a Hug",
    tip: "Think warmth and comfort: soft textures, sweet snacks, calming self-care. Pair a basket with a short card, such as “Consider this a big hug from me.”",
    whyHeading: "Why Order Hug Day Gifts from BlossomPot",
    why: [
      "Hampers, flowers and cakes together",
      "Clear delivery windows",
      "Gift message on most products",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email support",
    ],
    faqHeading: "Frequently Asked Questions — Hug Day Gifts to USA",
    faqs: [
      {
        q: "What can I send for Hug Day?",
        a: "A comfort hamper, a spa basket or a soft bouquet are all good choices.",
      },
      {
        q: "Is Hug Day only for couples?",
        a: "No. It works well for friends, family members or anyone who needs some comfort.",
      },
      {
        q: "Can I include a personal message?",
        a: "Yes. Add your note at checkout.",
      },
      {
        q: "Can I send a Hug Day gift to an office?",
        a: "Yes. Enter the office address with a contact number.",
      },
      {
        q: "How early should I order?",
        a: "We recommend ordering at least a few days ahead to secure your delivery date.",
      },
    ],
  },
  "kiss-day": {
    title: "Kiss Day Gifts to USA | Sweet Treats & Romantic Gifts | BlossomPot",
    description:
      "Send romantic Kiss Day gifts to the USA. Sweet treats, cupcakes, roses and gift sets with a love note. Free shipping on orders $14+.",
    h1: "Kiss Day Gifts to the USA — Sweet Gestures for the One You Love",
    intro: [
      "Kiss Day is tender and a little playful. If you cannot give one in person, you can still make your partner smile with something sweet.",
      "Choose Valentine cupcakes, cake and rose combos, wine gift sets or a romantic hamper, then finish with a card full of kisses.",
    ],
    deliveryHeading: "Kiss Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day delivery in select cities before the local cut-off. Pick February 13 at checkout and add your message. ${SHIP}`,
    ideasHeading: "Kiss Day Gift Ideas",
    ideas: [
      "Valentine cupcakes and sweet treats",
      "Rose and cake combos",
      "“Sip of love” style gift sets",
      "Romantic hampers",
    ],
    tipHeading: "Keep It Sweet and Simple",
    tip: "A short, charming note works best, such as “Counting down until I see you.” Let the treats and flowers do the talking.",
    whyHeading: "Why Order Kiss Day Gifts from BlossomPot",
    why: [
      "Treats, flowers and cakes on one site",
      "Delivery dates shown before payment",
      "Gift message on most products",
      "Secure Stripe and Razorpay checkout",
      "WhatsApp and email support",
    ],
    faqHeading: "Frequently Asked Questions — Kiss Day Gifts to USA",
    faqs: [
      {
        q: "What is a good Kiss Day gift for a partner far away?",
        a: "A sweet treat box, cupcakes or a rose and cake combo with a playful note is a lovely choice.",
      },
      {
        q: "Can I send a surprise to the USA?",
        a: "Yes. Enter the USA address and your message at checkout.",
      },
      {
        q: "Can I pair Kiss Day gifts with flowers?",
        a: "Yes. Add roses or a bouquet to the same order.",
      },
      {
        q: "Is same-day delivery available?",
        a: "In select cities, yes, when ordered before the local cut-off.",
      },
      {
        q: "Can I order Kiss Day and Valentine’s Day gifts together?",
        a: "Yes. Add both to your cart and choose different delivery dates if the options allow, or message us and we will help.",
      },
    ],
  },
  "valentines-day": {
    title: "Valentine's Day Gifts to USA | Flowers, Cakes & Hampers | BlossomPot",
    description:
      "Send Valentine’s Day flowers and gifts to the USA. Roses, cakes and romantic hampers with a personal note. Free shipping on orders $14+.",
    h1: "Valentine's Day Gifts to the USA — The Heart of the Week",
    intro: [
      "February 14 is the day the whole week has been building toward. A bouquet, a cake or a hamper can say what a long-distance call cannot.",
      "Choose romantic roses, Valentine arrangements, chocolate and flower combinations, or a celebration hamper, then add a note in your own words.",
    ],
    deliveryHeading: "Valentine's Day Delivery in the USA",
    delivery: `We deliver across the USA, with same-day options in select cities when you order before the local cut-off. Choose February 14 at checkout so the gift arrives on the day. ${SHIP}`,
    ideasHeading: "Valentine's Day Gift Ideas",
    ideas: [
      "Classic red and mixed rose bouquets",
      "Rose and cake combinations",
      "Chocolate and flower gifts",
      "Romantic hampers for the evening",
    ],
    tipHeading: "Order Before the Day Fills Up",
    tip: "Valentine’s Day is the busiest date of the week. Choose the delivery date a few days ahead so you still have the arrangement you wanted.",
    whyHeading: "Why Order Valentine's Day Gifts from BlossomPot",
    why: WHY,
    faqHeading: "Frequently Asked Questions — Valentine's Day Gifts to USA",
    faqs: [
      {
        q: "Can I send Valentine’s Day gifts to the USA from another country?",
        a: "Yes. Enter the USA address at checkout and pay in USD with Stripe or in INR with Razorpay.",
      },
      {
        q: "How do I get the gift there on February 14?",
        a: "Choose February 14 as the delivery date at checkout and order early. Same-day delivery is available in select cities before the local cut-off.",
      },
      {
        q: "What should I send for Valentine’s Day?",
        a: "Red roses, a rose and cake combo, or a romantic hamper are the gifts most people choose for the day.",
      },
      {
        q: "Can I add a personal message?",
        a: "Yes. Most products support a gift message at checkout.",
      },
      {
        q: "Can I send gifts for the earlier days of the week as well?",
        a: "Yes. Each day of Valentine week has its own page, and you can add more than one gift to the cart.",
      },
    ],
  },
};

function mapArticle(article: SpecialDayArticle, map: (value: string) => string): SpecialDayArticle {
  return {
    title: map(article.title),
    description: map(article.description),
    h1: map(article.h1),
    intro: article.intro.map(map),
    deliveryHeading: map(article.deliveryHeading),
    delivery: map(article.delivery),
    ideasHeading: map(article.ideasHeading),
    ideas: article.ideas.map(map),
    tipHeading: map(article.tipHeading),
    tip: map(article.tip),
    whyHeading: map(article.whyHeading),
    why: article.why.map(map),
    faqHeading: map(article.faqHeading),
    faqs: article.faqs.map((faq) => ({ q: map(faq.q), a: map(faq.a) })),
  };
}

export function specialDayArticle(id: string, countryIso = "US"): SpecialDayArticle | null {
  const article = ARTICLES[id as SpecialDayId];
  if (!article) return null;
  const label = countryDisplayName(countryIso || "US");
  if (label === "USA") return article;
  return mapArticle(article, (value) => value.replaceAll("USA", label));
}
