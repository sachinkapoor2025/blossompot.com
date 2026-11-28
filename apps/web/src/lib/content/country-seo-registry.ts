import {
  usaAnniversaryGifts,
  usaBirthdayGifts,
  usaBouquets,
  usaCakes,
  usaFlowers,
  usaHampers,
  usaValentinesGifts,
} from "./usa-page-copy";

/**
 * Approved SEO copy, keyed by ISO country and page.
 * A registry entry does not enable a country. Enablement stays on CONFIG#CATALOG_COUNTRIES.
 * Countries without an entry use the neutral article.
 */

export type CountrySeoPage =
  | "home"
  | "flowers"
  | "delivery-locations"
  | "bouquets"
  | "cakes"
  | "birthday-gifts"
  | "anniversary-gifts"
  | "valentines-day-gifts"
  | "hampers"
  | "combos";

export type SeoLink = { label: string; href: string };

export type SeoSection = {
  heading: string;
  paragraphs: string[];
  /** Paragraphs that follow the section links. */
  paragraphsAfter?: string[];
  items?: { title: string; text: string; href?: string }[];
  links?: SeoLink[];
};

export type CountrySeoContent = {
  countryCode: string;
  page: CountrySeoPage;
  availability: "approved" | "neutral";
  title: string;
  description: string;
  heading: string;
  intro: string[];
  callsToAction: SeoLink[];
  sections: SeoSection[];
  stepsHeading: string;
  steps: { title: string; text: string }[];
  /** Joiner between a step title and its text. Defaults to an em dash. */
  stepSeparator?: string;
  faqs: { q: string; a: string }[];
  /** Visible FAQ heading. Defaults to the existing question label. */
  faqHeading?: string;
  /** Place the FAQ block before the closing section. */
  faqBeforeClosing?: boolean;
  closing: { heading: string; paragraphs: string[] };
};

const SUPPORT_EMAIL = "support@blossompot.com";

/** Live USA place pages. San Diego and New York City are omitted because they are not published. */
const USA_PLACE_LINKS: SeoLink[] = [
  { label: "California", href: "/gifts-to-california" },
  { label: "New York", href: "/gifts-to-new-york" },
  { label: "Texas", href: "/gifts-to-texas" },
  { label: "Florida", href: "/gifts-to-florida" },
  { label: "New Jersey", href: "/gifts-to-new-jersey" },
  { label: "Los Angeles", href: "/gifts-to-los-angeles" },
  { label: "San Francisco", href: "/gifts-to-san-francisco" },
  { label: "Chicago", href: "/gifts-to-chicago" },
  { label: "Houston", href: "/gifts-to-houston" },
  { label: "Dallas", href: "/gifts-to-dallas" },
  { label: "Austin", href: "/gifts-to-austin" },
  { label: "Atlanta", href: "/gifts-to-atlanta" },
  { label: "Miami", href: "/gifts-to-miami" },
  { label: "Seattle", href: "/gifts-to-seattle" },
  { label: "Boston", href: "/gifts-to-boston" },
];

const USA_SHOP_LINKS: SeoLink[] = [
  { label: "Shop Flowers", href: "/flowers-to-usa" },
  { label: "Shop Cakes", href: "/cakes-to-usa" },
  { label: "Explore All Gifts", href: "/gifts-to-usa" },
];

const NEUTRAL_SHOP_LINKS: SeoLink[] = [
  { label: "Shop Flowers", href: "/flowers" },
  { label: "Shop Cakes", href: "/cakes" },
  { label: "Explore All Gifts", href: "/products" },
];

const USA_HOME_CITY_LINKS: SeoLink[] = [
  { label: "New York", href: "/gifts-to-new-york" },
  { label: "Los Angeles", href: "/gifts-to-los-angeles" },
  { label: "Chicago", href: "/gifts-to-chicago" },
  { label: "Houston", href: "/gifts-to-houston" },
  { label: "Dallas", href: "/gifts-to-dallas" },
  { label: "San Francisco", href: "/gifts-to-san-francisco" },
  { label: "Miami", href: "/gifts-to-miami" },
  { label: "Atlanta", href: "/gifts-to-atlanta" },
  { label: "Seattle", href: "/gifts-to-seattle" },
  { label: "Boston", href: "/gifts-to-boston" },
  { label: "Denver", href: "/gifts-to-denver" },
];

const usaHome: CountrySeoContent = {
  countryCode: "US",
  page: "home",
  availability: "approved",
  title: "Send Flowers, Cakes & Gifts to USA | Online Gift Delivery to USA – BlossomPot",
  description:
    "Send flowers, cakes and gifts to USA with BlossomPot. Order online from India or worldwide for birthday, anniversary and Valentine’s gift delivery across USA.",
  heading: "Send Flowers, Cakes & Gifts to USA – Online Gift Delivery Across the United States",
  intro: [
    "Make every celebration special, no matter how many miles lie between you and your loved ones. With BlossomPot, you can send flowers to USA, order delicious cakes and choose thoughtful gift hampers with convenient gift delivery to USA. Birthday, anniversary, Valentine’s Day or a simple “thinking of you” moment — we help you send the perfect surprise to any supported address in the United States.",
    "Whether you are ordering from India, the UK, Canada, Australia or anywhere else, BlossomPot makes it easy to send gifts to USA online. Browse the collection, pick your favourite gift, enter the recipient’s ZIP code and check delivery availability in a few simple steps.",
  ],
  callsToAction: [],
  sections: [
    {
      heading: "Shop Flowers, Cakes & Gifts Online for Delivery to USA",
      paragraphs: [
        "Finding the right gift is simple with BlossomPot. Our collection brings together fresh flowers, elegant bouquets, celebration cakes and curated hampers — all available for online gift delivery in USA. From classic red roses to rich chocolate cakes and gourmet gift baskets, there is something for every occasion and budget.",
      ],
      items: [
        {
          title: "Fresh Flowers and Bouquets – Flower Delivery to USA",
          text: "Flowers are a timeless way to share love and happiness. Explore rose bouquets, lilies, orchids, sunflowers and mixed floral arrangements with reliable flower delivery to USA. Choose birthday flowers, romantic roses or cheerful seasonal blooms and send flowers to USA online in just a few clicks.",
          href: "/flowers",
        },
        {
          title: "Delicious Cakes – Cake Delivery to USA",
          text: "A celebration is never complete without cake. Explore chocolate cakes, birthday cakes, cheesecakes and celebration cakes with convenient cake delivery to USA. Pick a flavour your loved one enjoys and check the delivery options for the recipient’s location.",
          href: "/cakes",
        },
        {
          title: "Gift Hampers – Gift Hamper Delivery to USA",
          text: "Looking for something beyond flowers and cakes? Explore gift baskets filled with chocolates, gourmet snacks, dry fruits and festive treats. Our gift hampers delivery to USA is perfect for birthdays, anniversaries, festivals and corporate gifting.",
          href: "/gift-hampers",
        },
      ],
    },
    {
      heading: "Send Birthday and Anniversary Gifts to USA",
      paragraphs: [
        "Every milestone deserves a meaningful surprise. BlossomPot offers gifting ideas for every relationship and occasion, with easy birthday gifts delivery to USA and anniversary gifts delivery to USA.",
      ],
      items: [
        {
          title: "Birthday Gifts to USA",
          text: "Make someone’s birthday unforgettable with colourful bouquets, a delicious cake or a birthday gift hamper. Explore our birthday gifts to USA collection and surprise friends, family and loved ones on their big day.",
          href: "/birthday-gifts",
        },
        {
          title: "Anniversary Gifts to USA",
          text: "Celebrate love and togetherness with elegant roses, romantic flower arrangements and thoughtful gift combos. Our anniversary gifts to USA help you mark every year together, even from far away.",
          href: "/anniversary-gifts",
        },
        {
          title: "Valentine’s Day Gifts to USA",
          text: "Say “I love you” with red roses, chocolates and romantic surprises. Explore our Valentine’s Day gifts delivery to USA collection and make your partner feel cherished.",
          href: "/valentines-day-gifts",
        },
        {
          title: "Mother’s Day Gifts to USA",
          text: "Show Mom how much she means to you with flowers, cakes and heartfelt gifts. Browse Mother’s Day gifts delivery to USA and make her day extra special.",
          href: "/mothers-day-gifts",
        },
        {
          title: "Wedding and Congratulations Gifts to USA",
          text: "Celebrate weddings, graduations, promotions and new beginnings with flower bouquets, cakes and curated hampers. Discover wedding gifts delivery to USA for friends and family.",
          href: "/wedding-gifts",
        },
      ],
    },
    {
      heading: "Flower and Gift Delivery Across Major Cities in USA",
      paragraphs: [
        "Distance should never keep you from celebrating the people you love. BlossomPot supports gift delivery across USA, helping you send flowers, cakes and gifts to popular destinations, including:",
      ],
      links: USA_HOME_CITY_LINKS,
      paragraphsAfter: [
        "Whether you want to send flowers to New York, arrange cake delivery in Los Angeles or send anniversary gifts to Chicago, simply enter the recipient’s ZIP code to check product availability and delivery dates.",
      ],
    },
    {
      heading: "Send Gifts to USA from India and Worldwide",
      paragraphs: [
        "Living far from your loved ones does not mean missing their special days. With BlossomPot, you can send gifts to USA from India and other countries through one simple online store. Choose a gift, enter the recipient’s US delivery address and check available delivery dates and charges before you pay.",
        "Enjoy hassle-free online gift delivery to USA from India, the UK, Canada and Australia — and make birthdays, anniversaries and festivals special for the people who matter most.",
      ],
    },
    {
      heading: "Why Choose BlossomPot for Gift Delivery to USA?",
      paragraphs: [],
      items: [
        {
          title: "Wide collection",
          text: "Flowers, bouquets, cakes, plants and gift hampers for delivery to USA.",
        },
        {
          title: "Gifts for every occasion",
          text: "Birthdays, anniversaries, Valentine’s Day, Mother’s Day and weddings.",
        },
        {
          title: "Easy online ordering",
          text: "Browse and order from anywhere in the world.",
        },
        {
          title: "Delivery across USA",
          text: "Check availability, delivery dates and charges by ZIP code before ordering.",
        },
        {
          title: "Secure payments",
          text: "Complete your order through our secure checkout.",
        },
        {
          title: "Customer support",
          text: `Get help on WhatsApp and email at ${SUPPORT_EMAIL} for product, order and delivery questions.`,
        },
      ],
    },
  ],
  stepsHeading: "How to Order Flowers, Cakes and Gifts for Delivery to USA",
  stepSeparator: ": ",
  steps: [
    {
      title: "Explore the collection",
      text: "Browse flowers, bouquets, cakes and gift hampers.",
    },
    {
      title: "Choose your gift",
      text: "Select a product that suits the occasion and your budget.",
    },
    {
      title: "Enter delivery details",
      text: "Add the recipient’s complete US address and ZIP code.",
    },
    {
      title: "Check delivery availability",
      text: "Review available delivery dates and charges.",
    },
    {
      title: "Complete your order",
      text: "Add a gift message where available and pay securely.",
    },
  ],
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I send flowers to USA from anywhere in the world?",
      a: "Yes. You can browse BlossomPot from any country and enter your recipient’s US address to check available flower delivery to USA options.",
    },
    {
      q: "Does BlossomPot offer online flower delivery in USA?",
      a: "Yes. Explore our bouquets and floral arrangements for online flower delivery in USA. Available products and delivery dates depend on the recipient’s location.",
    },
    {
      q: "Can I send birthday cakes and gifts to USA?",
      a: "Yes. Explore birthday cakes, flowers and gift combinations with convenient birthday gifts delivery to USA.",
    },
    {
      q: "Can I send anniversary flowers to USA?",
      a: "Yes. Choose from romantic roses, bouquets and anniversary gift options with anniversary gifts delivery to USA.",
    },
    {
      q: "Is same-day flower delivery available in USA?",
      a: "Delivery options depend on the product and the recipient’s ZIP code. Please check the delivery dates shown at checkout before placing your order.",
    },
    {
      q: "Can I send gifts to New York, California and Texas?",
      a: "Yes. Enter the recipient’s city, state and ZIP code to check available products and gift delivery to USA options.",
    },
    {
      q: "What types of gifts can I send to USA?",
      a: "You can choose from flower bouquets, roses, cakes, gift hampers, plants and occasion-based gifts with delivery across USA.",
    },
    {
      q: "How can I check my gift delivery date?",
      a: "Enter the recipient’s delivery address and ZIP code on the product or checkout page to see available delivery dates.",
    },
  ],
  closing: {
    heading: "Make Every Moment Memorable with BlossomPot",
    paragraphs: [
      "A thoughtful gift can turn an ordinary day into a special one. From birthday flowers and anniversary bouquets to delicious cakes and gift hampers, BlossomPot is your trusted partner for flowers, cakes and gifts delivery to USA. Order today and enjoy simple, secure online gift delivery in USA.",
    ],
  },
};

const usaDeliveryLocations: CountrySeoContent = {
  countryCode: "US",
  page: "delivery-locations",
  availability: "approved",
  title: "Explore Our USA Delivery Locations",
  description:
    "BlossomPot serves eligible delivery addresses across the United States. Explore our state and city pages to find relevant delivery information and discover flowers, cakes, and gifts for your recipient’s location.",
  heading: "Explore Our USA Delivery Locations",
  intro: [
    "BlossomPot serves eligible delivery addresses across the United States. Explore our state and city pages to find relevant delivery information and discover flowers, cakes, and gifts for your recipient’s location.",
  ],
  callsToAction: USA_SHOP_LINKS,
  sections: [
    {
      heading: "Popular USA Delivery Locations",
      paragraphs: [],
      items: [
        {
          title: "California",
          text: "Send flowers, cakes, and gifts to loved ones across eligible California locations.",
          href: "/gifts-to-california",
        },
        {
          title: "New York",
          text: "Celebrate birthdays, anniversaries, and special occasions with gifts delivered to eligible New York addresses.",
          href: "/gifts-to-new-york",
        },
        {
          title: "Texas",
          text: "Explore flowers, cakes, and hampers for celebrations across eligible Texas locations.",
          href: "/gifts-to-texas",
        },
        {
          title: "Florida",
          text: "Surprise friends and family with thoughtful gifts delivered to eligible Florida addresses.",
          href: "/gifts-to-florida",
        },
        {
          title: "New Jersey",
          text: "Find flowers and gifts for birthdays, anniversaries, and other special occasions.",
          href: "/gifts-to-new-jersey",
        },
        {
          title: "Los Angeles",
          text: "Explore gifting options for your loved ones in eligible Los Angeles ZIP codes.",
          href: "/gifts-to-los-angeles",
        },
        {
          title: "San Francisco",
          text: "Send a thoughtful surprise with flowers, cakes, and gifts available for delivery.",
          href: "/gifts-to-san-francisco",
        },
        {
          title: "Chicago",
          text: "Make celebrations memorable with convenient online gifting options.",
          href: "/gifts-to-chicago",
        },
        {
          title: "Houston",
          text: "Discover flowers, cakes, and gifts for special moments in Houston.",
          href: "/gifts-to-houston",
        },
        {
          title: "Dallas",
          text: "Choose a thoughtful gift for birthdays, anniversaries, and celebrations in Dallas.",
          href: "/gifts-to-dallas",
        },
        {
          title: "Austin",
          text: "Explore gifting options for friends and family in eligible Austin locations.",
          href: "/gifts-to-austin",
        },
        {
          title: "Atlanta",
          text: "Send a special surprise to loved ones in eligible Atlanta delivery areas.",
          href: "/gifts-to-atlanta",
        },
      ],
    },
    {
      heading: "Celebrate Every Occasion with BlossomPot",
      paragraphs: [
        "Every celebration deserves a thoughtful surprise. BlossomPot helps you share happiness with loved ones across the USA through flowers, cakes, and gifts for life’s most meaningful moments.",
      ],
      items: [
        {
          title: "Birthday Celebrations",
          text: "Make someone’s birthday memorable with fresh-looking floral arrangements, delicious cakes, and thoughtful gifts. Choose a surprise that makes your loved one feel special.",
        },
        {
          title: "Anniversary Surprises",
          text: "Celebrate love and togetherness with beautiful bouquets, celebration cakes, and carefully selected gifts for your partner, friends, or family members.",
        },
        {
          title: "Valentine’s Day",
          text: "Express your love with romantic flowers and thoughtful gifts. Explore suitable options to make Valentine’s Day special for someone you cherish.",
        },
        {
          title: "Mother’s Day and Family Celebrations",
          text: "Show appreciation to the people who matter most with flowers, cakes, and gifts for Mother’s Day, family gatherings, and other important occasions.",
        },
      ],
    },
    {
      heading: "Why Choose BlossomPot for USA Gift Delivery?",
      paragraphs: [],
      items: [
        { title: "Convenient online ordering", text: "Browse and order gifts from wherever you are." },
        {
          title: "Gifts for different occasions",
          text: "Find options for birthdays, anniversaries, holidays, and personal milestones.",
        },
        {
          title: "Multiple gifting categories",
          text: "Explore flowers, bouquets, cakes, and hampers in one place.",
        },
        {
          title: "Location-based availability",
          text: "Check delivery options for the recipient’s ZIP code.",
        },
        {
          title: "A thoughtful way to stay connected",
          text: "Send a meaningful surprise to friends, family, and loved ones across the USA.",
        },
      ],
    },
  ],
  stepsHeading: "How to Order Flowers, Cakes & Gifts in the USA",
  steps: [
    { title: "Choose your gift", text: "Browse flowers, bouquets, cakes." },
    {
      title: "Enter the delivery location",
      text: "Provide the recipient’s USA address or ZIP code to check availability.",
    },
    {
      title: "Select your preferred date",
      text: "Review the available delivery options before placing your order.",
    },
    {
      title: "Complete your order",
      text: "Enter the required details and proceed through the secure checkout.",
    },
    {
      title: "Share the celebration",
      text: "Let your thoughtful gift help make the occasion memorable.",
    },
  ],
  faqs: [
    {
      q: "Can I send flowers to the USA through BlossomPot?",
      a: "Yes. You can explore BlossomPot’s flower collection and check delivery availability for your recipient’s US address.",
    },
    {
      q: "Can I send cakes and gifts to the USA?",
      a: "Yes. Browse available cakes, flowers, and gift hampers, then confirm product and delivery availability for the recipient’s ZIP code.",
    },
    {
      q: "Does BlossomPot offer delivery across the USA?",
      a: "BlossomPot lists nationwide US destination coverage. However, individual product availability, delivery dates, and service options depend on the destination and checkout details.",
    },
    {
      q: "How can I check delivery availability?",
      a: "Select your preferred product, enter the recipient’s US delivery details, and review the options available at checkout before completing your purchase.",
    },
  ],
  closing: {
    heading: "Send Happiness Across the USA with BlossomPot",
    paragraphs: [
      "Make every celebration more meaningful with flowers, cakes, and gifts delivered to eligible locations across the United States. Whether you are planning a birthday surprise, celebrating an anniversary, or simply reminding someone that you care, BlossomPot helps you find a thoughtful way to connect.",
      "Explore BlossomPot’s USA delivery locations and send a memorable surprise today.",
    ],
  },
};


const usaCombos: CountrySeoContent = {
  countryCode: "US",
  page: "combos",
  availability: "approved",
  title: "Combo Gifts to USA | Flower, Cake & Gift Combos | BlossomPot",
  description:
    "Shop gift combos for delivery in the USA. Pair beautiful flower bouquets with cakes, treats and curated gifts to make every celebration special.",
  heading: "Combo Gifts Delivered to the USA — Make Every Gift More Special",
  intro: [
    "Sometimes one gift says it all. Other times, combining two thoughtful gifts makes the moment even more memorable. BlossomPot brings together flowers, cakes, treats and curated gifts in combinations designed to make birthdays, anniversaries and everyday surprises feel special.",
    "Explore our available gift combos, discover pairings for different occasions and choose a combination that feels right for the person you are celebrating.",
  ],
  callsToAction: [],
  sections: [
    {
      heading: "Gift Combos for Every Celebration",
      paragraphs: [
        "Every celebration has its own personality. A beautiful bouquet paired with a cake can make a birthday feel complete, while flowers alongside a box of treats can turn an ordinary day into a thoughtful surprise.",
      ],
      items: [
        {
          title: "Flowers and Cake Combos",
          text: "Pair colourful bouquets with cakes for birthdays, anniversaries and celebrations.",
        },
        {
          title: "Flowers and Treats",
          text: "Combine fresh-looking floral arrangements with snacks or sweet treats.",
        },
        {
          title: "Cake and Gift Combos",
          text: "Bring together a celebratory cake and a curated gift for an extra-special surprise.",
        },
        {
          title: "Thoughtful Gift Pairings",
          text: "Discover combinations that bring together different gifts in one convenient selection.",
        },
      ],
    },
    {
      heading: "Choose a Combo That Matches the Moment",
      paragraphs: [
        "Think about the occasion and the person receiving your gift. Bright flowers and a celebration cake work well for birthdays. Romantic blooms with a favourite treat can make an anniversary feel more personal. For a simple gesture of appreciation, choose a combination that reflects the recipient's tastes.",
        "Add a personal message where the selected products support one, and let your gift express what words sometimes cannot.",
      ],
    },
    {
      heading: "Combo Gift Delivery Across the USA",
      paragraphs: [
        "Shopping for someone who lives far away can still feel personal. Browse the available combos, choose your preferred combination and enter the recipient's delivery address to check the options available for their location.",
        "Delivery dates, availability and applicable charges depend on the selected products and destination. Review the details shown during checkout before completing your order.",
      ],
    },
    {
      heading: "Why Choose BlossomPot Gift Combos?",
      paragraphs: [],
      items: [
        {
          title: "Thoughtful pairings",
          text: "Bring two complementary gifts together in one selection.",
        },
        {
          title: "More ways to celebrate",
          text: "Explore combinations for birthdays, anniversaries and other special moments.",
        },
        {
          title: "Convenient online shopping",
          text: "Browse available combos in one place.",
        },
        {
          title: "Personal touches",
          text: "Add a gift message where supported by the selected products.",
        },
        {
          title: "Clear checkout details",
          text: "Review product availability, pricing and delivery options before ordering.",
        },
      ],
    },
  ],
  stepsHeading: "How to Order a Gift Combo Online",
  steps: [
    { title: "", text: "Browse the available combos on this page." },
    { title: "", text: "Choose a combination that suits your occasion and budget." },
    { title: "", text: "Add the combo to your cart and review its items." },
    { title: "", text: "Enter the recipient's address and check the available delivery options." },
    { title: "", text: "Review your order and complete checkout." },
  ],
  faqHeading: "Frequently Asked Questions About Gift Combos",
  faqBeforeClosing: true,
  faqs: [
    {
      q: "What is included in a BlossomPot gift combo?",
      a: "Each combo combines the products shown on its product card. Open the selected combo to review its contents before ordering.",
    },
    {
      q: "Can I send a flower and cake combo for a birthday?",
      a: "Yes, you can choose a flower and cake combination when one is available. Check the individual combo details to confirm its contents.",
    },
    {
      q: "Can I send a combo gift to someone in the USA from another country?",
      a: "You can shop for delivery to a supported USA address. Enter the recipient's address during checkout to check the available delivery options.",
    },
    {
      q: "Can I add a personal message to a combo?",
      a: "Message availability depends on the selected products and the options offered during checkout.",
    },
    {
      q: "How much does a gift combo cost?",
      a: "Prices vary by combination. Review the displayed price and order total before completing checkout.",
    },
    {
      q: "Can I choose the delivery date for my combo?",
      a: "Check the delivery options shown for the recipient's address during checkout. Available dates depend on the selected products and destination.",
    },
  ],
  closing: {
    heading: "Make Their Day Extra Special with BlossomPot",
    paragraphs: [
      "From flowers paired with cakes to combinations of treats and thoughtful gifts, the right pairing can make a celebration feel more personal. Explore BlossomPot's available combos and find a meaningful way to send a little happiness to someone in the USA.",
    ],
  },
};

const approvedSeo: Record<CountrySeoPage, Record<string, CountrySeoContent>> = {
  home: { US: usaHome },
  flowers: { US: usaFlowers },
  "delivery-locations": { US: usaDeliveryLocations },
  bouquets: { US: usaBouquets },
  cakes: { US: usaCakes },
  "birthday-gifts": { US: usaBirthdayGifts },
  "anniversary-gifts": { US: usaAnniversaryGifts },
  "valentines-day-gifts": { US: usaValentinesGifts },
  hampers: { US: usaHampers },
  combos: { US: usaCombos },
};

function neutralCountrySeo(page: CountrySeoPage): CountrySeoContent {
  return {
    countryCode: "",
    page,
    availability: "neutral",
    title: "Send Flowers, Cakes & Gifts | BlossomPot",
    description:
      "Shop flowers, cakes, and gifts on BlossomPot. Choose a product and check delivery availability for the recipient’s address at checkout.",
    heading: "Send Flowers, Cakes & Gifts",
    intro: [
      "BlossomPot is an online shop for flowers, cakes, and gifts. Browse the collection, add a personal message where that option is offered, and review delivery details for the recipient’s address before you order.",
      "Product availability and delivery dates are confirmed at checkout. They depend on the product and the destination.",
    ],
    callsToAction: NEUTRAL_SHOP_LINKS,
    sections: [
      {
        heading: "Shop flowers, cakes, and gifts",
        paragraphs: [
          "The collection includes flowers, bouquets, cakes, and gift hampers, subject to what is available for the recipient’s address.",
          "Select a product, enter the delivery address, and review the dates and charges shown before you pay.",
        ],
      },
    ],
    stepsHeading: "How to order",
    steps: [
      { title: "Choose a gift", text: "Browse flowers, cakes, and gifts." },
      {
        title: "Enter the delivery address",
        text: "Use the recipient’s address to check which products and dates are available.",
      },
      {
        title: "Review the order",
        text: "Confirm the delivery details shown at checkout, and add a message where the product allows it.",
      },
      {
        title: "Complete checkout",
        text: "Pay with an available payment method. Order updates follow after the order is confirmed.",
      },
    ],
    faqs: [
      {
        q: "How do I know if a gift can be delivered?",
        a: "Enter the recipient’s address at checkout and review the products, dates, and charges shown for that order.",
      },
      {
        q: "Can I add a message?",
        a: "A personal message can be added when the product supports it.",
      },
      {
        q: "How can I contact BlossomPot?",
        a: `Contact the team at ${SUPPORT_EMAIL}.`,
      },
    ],
    closing: {
      heading: "Shop gifts online",
      paragraphs: [
        "Choose a gift and check delivery availability for the recipient’s address before you complete the order.",
      ],
    },
  };
}

export function hasApprovedCountrySeo(countryCode: string, page: CountrySeoPage = "home"): boolean {
  const iso = countryCode.trim().toUpperCase();
  return Boolean(approvedSeo[page][iso]);
}

/** Approved copy for a country and page, or the neutral article when none is approved. */
export function countrySeoContent(countryCode: string, page: CountrySeoPage = "home"): CountrySeoContent {
  const iso = countryCode.trim().toUpperCase();
  return approvedSeo[page][iso] ?? { ...neutralCountrySeo(page), countryCode: iso };
}

export function countrySeoHrefs(content: CountrySeoContent): string[] {
  return [
    ...content.callsToAction.map((link) => link.href),
    ...content.sections.flatMap((section) => [
      ...(section.links ?? []).map((link) => link.href),
      ...(section.items ?? []).flatMap((item) => (item.href ? [item.href] : [])),
    ]),
  ];
}
