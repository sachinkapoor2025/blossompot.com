/**
 * Approved SEO copy, keyed by ISO country and page.
 * A registry entry does not enable a country. Enablement stays on CONFIG#CATALOG_COUNTRIES.
 * Countries without an entry use the neutral article.
 */

export type CountrySeoPage = "home" | "flowers" | "delivery-locations";

export type SeoLink = { label: string; href: string };

export type SeoSection = {
  heading: string;
  paragraphs: string[];
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
  faqs: { q: string; a: string }[];
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

const usaHome: CountrySeoContent = {
  countryCode: "US",
  page: "home",
  availability: "approved",
  title: "Send Flowers & Cakes to USA | Online Gift Delivery – BlossomPot",
  description:
    "Send flowers, beautiful bouquets, cakes and thoughtful gifts across the USA with BlossomPot. Shop birthday and anniversary gifts with convenient delivery options.",
  heading: "Send Flowers, Cakes & Gifts Across the USA",
  intro: [
    "Make every celebration memorable with BlossomPot. Explore beautiful flower bouquets, delicious cakes, and thoughtful gifts for birthdays, anniversaries, Valentine’s Day, Mother’s Day, and other special moments. Whether you’re surprising someone in New York, Los Angeles, Chicago, Houston, or another US city, find a gift that makes them feel loved.",
    "Shop online, add a personal message, and check delivery availability for your recipient’s address.",
  ],
  callsToAction: USA_SHOP_LINKS,
  sections: [
    {
      heading: "Shop Flowers, Cakes & Gifts Online at BlossomPot",
      paragraphs: [
        "Find the perfect way to celebrate life’s special moments with BlossomPot. Our online gift collection brings together beautiful flowers, elegant bouquets, delicious cakes, and thoughtful gift hampers for every occasion. Whether you want to surprise a loved one, celebrate a milestone, or send a heartfelt thank-you, discover gifts that help you express your feelings.",
        "From classic red roses and cheerful mixed bouquets to chocolate cakes and birthday gift combinations, explore a variety of options for different tastes, occasions, and budgets.",
        "Order flowers online, send cakes to the USA, and explore gift delivery options for your recipient’s location with BlossomPot.",
      ],
    },
    {
      heading: "Flower, Cake & Gift Delivery Across Major US Cities",
      paragraphs: [
        "Looking to send flowers or surprise someone with a cake in the United States? BlossomPot helps you discover thoughtful gifts for recipients across major US destinations. Explore our delivery options for popular cities and choose a gift that makes every occasion special.",
        "BlossomPot also offers gift delivery options for other US destinations, including Miami, Florida; Seattle, Washington; Boston, Massachusetts; Austin, Texas; and San Diego, California. Enter the recipient’s delivery details to check product availability and estimated delivery times.",
      ],
      items: [
        {
          title: "Send Flowers and Gifts to New York",
          text: "Celebrate birthdays, anniversaries, and special milestones with beautiful flower bouquets, celebration cakes, and thoughtful gifts. Explore gift delivery options for New York, NY, and check availability for your recipient’s ZIP code.",
          href: "/gifts-to-new-york",
        },
        {
          title: "Flower and Cake Delivery in Los Angeles",
          text: "Brighten someone’s day in Los Angeles, California, with elegant roses, colourful bouquets, delicious cakes, and memorable birthday gifts. Find a thoughtful surprise for friends, family, and loved ones.",
          href: "/gifts-to-los-angeles",
        },
        {
          title: "Send Gifts to Chicago, Illinois",
          text: "Make every celebration in Chicago extra special with flowers, anniversary gifts, birthday cakes, and curated gift hampers. Browse the collection and check delivery options for your recipient’s address.",
          href: "/gifts-to-chicago",
        },
        {
          title: "Send Flowers to Houston, Texas",
          text: "Surprise someone in Houston with a beautiful bouquet, a delicious cake, or a gift for a special occasion. Discover flowers and gifts for birthdays, anniversaries, congratulations, and everyday surprises.",
          href: "/gifts-to-houston",
        },
        {
          title: "Cake and Flower Delivery in Dallas",
          text: "Celebrate special moments in Dallas with romantic roses, cheerful bouquets, celebration cakes, and thoughtful gift combinations. Choose a gift that suits the occasion and check the available delivery date.",
          href: "/gifts-to-dallas",
        },
        {
          title: "Send Flowers and Gifts to San Francisco",
          text: "Make someone’s day brighter in San Francisco with elegant flowers, birthday surprises, anniversary gifts, and delicious cakes. Shop online and explore delivery availability for your recipient’s location.",
          href: "/gifts-to-san-francisco",
        },
        {
          title: "Gift Delivery in Atlanta, Georgia",
          text: "Celebrate life’s meaningful moments in Atlanta with flowers, cakes, and gifts for birthdays, anniversaries, holidays, and other occasions. Find something thoughtful for the people who matter most.",
          href: "/gifts-to-atlanta",
        },
      ],
      links: USA_PLACE_LINKS.filter((link) =>
        ["Miami", "Seattle", "Boston", "Austin"].includes(link.label)
      ),
    },
    {
      heading: "Gifts for Every Occasion",
      paragraphs: [
        "Whatever the occasion, BlossomPot makes it easier to choose a meaningful gift and explore delivery options across the USA.",
      ],
      items: [
        {
          title: "Birthday Gifts",
          text: "Send birthday flowers, cakes, and thoughtful surprises to make their day unforgettable.",
        },
        {
          title: "Anniversary Gifts",
          text: "Celebrate love with romantic roses, elegant bouquets, and special anniversary gift combinations.",
        },
        {
          title: "Valentine’s Day Gifts",
          text: "Express your love with beautiful flowers, romantic gifts, and delicious treats.",
        },
        {
          title: "Mother’s Day Gifts",
          text: "Show appreciation with thoughtful flower arrangements, cakes, and gifts for Mom.",
        },
        {
          title: "Wedding and Congratulations Gifts",
          text: "Celebrate new beginnings, achievements, and happy milestones with meaningful surprises.",
        },
        {
          title: "Thank-You Gifts",
          text: "Express gratitude with flowers, curated hampers, and gifts that show you care.",
        },
      ],
    },
    {
      heading: "Why Shop with BlossomPot?",
      paragraphs: [
        "Our goal is to help you turn thoughtful intentions into memorable gifting experiences, wherever your loved ones are in the United States.",
      ],
      items: [
        {
          title: "A Wide Gift Selection",
          text: "Explore bouquets, roses, cakes, plants, gift hampers, and occasion-based collections.",
        },
        {
          title: "Gifts for Every Celebration",
          text: "Find something suitable for birthdays, anniversaries, holidays, and spontaneous surprises.",
        },
        {
          title: "Convenient Online Ordering",
          text: "Browse gifts, select your favourite product, and provide the recipient’s delivery details online.",
        },
        {
          title: "Personal Gift Messages",
          text: "Add a heartfelt message to make your surprise more meaningful where the option is available.",
        },
        {
          title: "Delivery Availability Checks",
          text: "Review delivery estimates and available dates for the recipient’s location before completing your order.",
        },
        {
          title: "Customer Support",
          text: "Contact our team for assistance with product selection, orders, and delivery-related questions.",
        },
      ],
    },
  ],
  stepsHeading: "How to Send Flowers, Cakes & Gifts to the USA",
  steps: [
    {
      title: "Choose Your Gift",
      text: "Explore our collections of fresh flowers, bouquets, cakes, birthday gifts, anniversary gifts, and curated hampers.",
    },
    {
      title: "Select Your Favourite Product",
      text: "Choose a gift that matches the occasion, your recipient’s preferences, and your budget.",
    },
    {
      title: "Enter the Delivery Details",
      text: "Provide the recipient’s US address, including the city, state, and ZIP code, so you can check delivery availability.",
    },
    {
      title: "Add a Personal Message",
      text: "Include a special note with your gift wherever personalization is supported.",
    },
    {
      title: "Complete Your Order Securely",
      text: "Proceed to checkout, review the applicable delivery details, and complete your payment using an available payment method.",
    },
  ],
  faqs: [
    {
      q: "Can I send flowers to someone in the USA through BlossomPot?",
      a: "Yes. You can browse flowers and bouquets on BlossomPot and enter your recipient’s US address to check product and delivery availability.",
    },
    {
      q: "Can I order cake delivery in the USA?",
      a: "You can explore our cake collection and check whether your selected cake is available for delivery to the recipient’s ZIP code and preferred date.",
    },
    {
      q: "Does BlossomPot deliver flowers to New York and Los Angeles?",
      a: "BlossomPot provides US destination options, including major city pages. Enter the recipient’s address to confirm the availability of specific flowers, gifts, and delivery dates.",
    },
    {
      q: "Can I send birthday and anniversary gifts to the USA?",
      a: "Yes. Explore birthday gifts, anniversary flowers, cakes, and gift combinations, then check the delivery options for your recipient’s location.",
    },
    {
      q: "Is same-day flower delivery available in the USA?",
      a: "Same-day delivery may be available for eligible products and addresses in selected locations. Availability depends on the destination, order time, and applicable local cutoff.",
    },
    {
      q: "Can I include a personal message with my gift?",
      a: "Most eligible gifts support a personal message, allowing you to add a birthday wish, anniversary note, or other heartfelt greeting.",
    },
    {
      q: "How can I check delivery charges and dates?",
      a: "Enter the recipient’s delivery address and review the available delivery options and charges displayed during the ordering process.",
    },
    {
      q: "Can I order from outside the United States and send a gift to someone in the USA?",
      a: "You can place an order for an eligible US delivery address from outside the United States. Available products, payment options, and delivery dates depend on the order and destination.",
    },
    {
      q: "What gifts can I buy from BlossomPot?",
      a: "You can explore flowers, bouquets, cakes, plants, gift hampers, and occasion-based gift collections, subject to product availability.",
    },
    {
      q: "How can I contact BlossomPot for order assistance?",
      a: `For assistance with your order, product availability, or delivery questions, contact our team at ${SUPPORT_EMAIL}.`,
    },
  ],
  closing: {
    heading: "Make Someone Smile with BlossomPot",
    paragraphs: [
      "Distance should never stop you from celebrating the people you love. Discover beautiful flowers, delicious cakes, and thoughtful gifts for your friends, family, and loved ones across the USA.",
      "Whether it is a birthday in New York, an anniversary in Los Angeles, or a special surprise in Chicago, find a gift that makes the moment memorable.",
      "Shop Flowers, Cakes & Gifts Online with BlossomPot. Explore our collections today and check delivery availability for your recipient’s address.",
    ],
  },
};

const usaFlowers: CountrySeoContent = {
  countryCode: "US",
  page: "flowers",
  availability: "approved",
  title: "Send Flowers to USA Online | Flower Delivery USA – BlossomPot",
  description:
    "Send flowers to the USA with BlossomPot. Shop roses, mixed bouquets, orchids, and birthday flowers for loved ones. Check delivery availability by ZIP code.",
  heading: "Send Flowers to the USA",
  intro: [
    "Sending flowers across the United States is simple with BlossomPot. Shop online from wherever you are and enter the recipient’s US address to check product availability and delivery options. Delivery timing can vary by ZIP code, flower arrangement, order time, and local availability. Same-day delivery may be available for eligible products in selected areas; check the product page and checkout details before ordering.",
  ],
  callsToAction: [{ label: "Shop Flowers", href: "/flowers-to-usa" }],
  sections: [
    {
      heading: "Shop Flowers for Every Occasion",
      paragraphs: [],
      items: [
        {
          title: "Birthday Flowers",
          text: "Celebrate their special day with bright bouquets, colourful blooms, and elegant floral gifts.",
        },
        {
          title: "Anniversary Flowers",
          text: "Share your love with classic red roses, romantic arrangements, and flowers chosen for a meaningful milestone.",
        },
        {
          title: "Thank-You Flowers",
          text: "Show appreciation with cheerful mixed bouquets and thoughtful floral arrangements.",
        },
        {
          title: "Congratulations Flowers",
          text: "Celebrate a new job, graduation, promotion, or another exciting achievement with a beautiful bouquet.",
        },
        {
          title: "Just-Because Flowers",
          text: "Send an unexpected surprise to brighten an ordinary day and remind someone that they are loved.",
        },
        {
          title: "Sympathy and Thoughtful Flowers",
          text: "Choose a gentle, elegant arrangement to express care and support during a difficult time, where available.",
        },
      ],
    },
    {
      heading: "Flower Delivery Across the USA",
      paragraphs: [
        "Popular destinations include New York, Los Angeles, Chicago, Houston, Dallas, San Francisco, Miami, Seattle, Boston, Atlanta, Austin, and San Diego. Availability should always be confirmed using the recipient’s complete delivery address.",
      ],
      links: USA_PLACE_LINKS.filter((link) => link.label !== "California" && link.label !== "Texas" && link.label !== "Florida" && link.label !== "New Jersey"),
    },
    {
      heading: "Why Choose BlossomPot for Flower Delivery?",
      paragraphs: [],
      items: [
        {
          title: "Flower styles for different moments",
          text: "Browse roses, mixed bouquets, orchids, and other floral arrangements.",
        },
        {
          title: "Occasion-ready choices",
          text: "Find flowers for birthdays, anniversaries, congratulations, thank-you messages, and everyday surprises.",
        },
        {
          title: "Convenient online ordering",
          text: "Choose a design and enter the recipient’s delivery details online.",
        },
        {
          title: "Personal message option",
          text: "Add a gift message to eligible products to make your surprise more personal.",
        },
        {
          title: "Delivery information at checkout",
          text: "Review the available delivery dates and options for the destination before completing your order.",
        },
        {
          title: "Customer assistance",
          text: "Contact BlossomPot support if you need help choosing a product or checking delivery details.",
        },
      ],
    },
  ],
  stepsHeading: "",
  steps: [],
  faqs: [
    {
      q: "Can I send flowers to the USA from another country?",
      a: "You can shop online from outside the United States and enter an eligible US delivery address at checkout. Available products and delivery options depend on the destination.",
    },
    {
      q: "How do I check flower delivery availability?",
      a: "Enter the recipient’s complete address, including the ZIP code, and review the delivery options shown on the product page or at checkout.",
    },
    {
      q: "Can I send flowers to New York, Los Angeles, or Chicago?",
      a: "You can check delivery availability for these and other US destinations by entering the recipient’s address at checkout. Product selection and delivery dates may vary by location.",
    },
    {
      q: "Can I include a personal message with the flowers?",
      a: "A personal message can be added to eligible products. Check the product details and checkout options when placing your order.",
    },
    {
      q: "What types of flowers can I order?",
      a: "The collection may include roses, mixed bouquets, orchids, lilies, pastel arrangements, and seasonal floral designs. Product availability can change.",
    },
    {
      q: "How early should I order flowers?",
      a: "For a specific occasion, order in advance when possible. Available dates depend on the product, destination, and local delivery capacity.",
    },
    {
      q: "How can I get help with my order?",
      a: `For assistance with products or delivery details, contact BlossomPot at ${SUPPORT_EMAIL} or use the contact options shown on the website.`,
    },
  ],
  closing: { heading: "", paragraphs: [] },
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

const approvedSeo: Record<CountrySeoPage, Record<string, CountrySeoContent>> = {
  home: { US: usaHome },
  flowers: { US: usaFlowers },
  "delivery-locations": { US: usaDeliveryLocations },
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
