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
  title: "Send Flowers to USA Online | Flower Delivery – BlossomPot",
  description:
    "Send flowers to USA with BlossomPot. Explore flower bouquets, rose arrangements, and floral gifts for birthdays, anniversaries, Valentine's Day, and other special occasions.",
  heading: "Send Flowers to USA Online",
  intro: [
    "Make your loved ones feel special, no matter how far away they are. With BlossomPot, you can send flowers to USA and surprise your family, friends and loved ones with beautiful floral arrangements. Whether you are celebrating a birthday, anniversary, Valentine's Day or another special occasion, explore our collection of flower bouquets, rose arrangements and thoughtful floral gifts.",
    "From classic roses to colourful mixed flower bouquets, discover beautiful ways to express love, happiness, appreciation and friendship. Whether you are ordering from India or another country, BlossomPot makes it convenient to send flowers to the USA online for the people who matter most.",
  ],
  callsToAction: [{ label: "Shop Flowers", href: "/flowers-to-usa" }],
  sections: [
    {
      heading: "Explore Our Collection of Flowers to USA",
      paragraphs: [
        "Discover a variety of flowers and bouquets to USA for different occasions and personal preferences. Explore available floral arrangements, including elegant rose bouquets, mixed flower arrangements, sunflowers, orchids and other beautiful options.",
        "Whether you prefer a classic bouquet or a colourful arrangement, choose flowers that reflect your feelings. Browse the online flower collection at BlossomPot and find a thoughtful floral gift for your loved ones across the United States.",
      ],
    },
    {
      heading: "Send Flowers to USA for Every Special Occasion",
      paragraphs: [
        "Flowers make meaningful gifts for almost every celebration. Surprise someone on their birthday, express your love on an anniversary or send warm wishes to a friend or family member.",
        "Explore birthday flowers to USA, romantic rose bouquets, anniversary flowers and floral gifts for celebrations such as Valentine's Day, Mother's Day, Father's Day, congratulations and other special moments.",
        "A beautiful flower arrangement can help you communicate your feelings even when you cannot be present in person. Choose a bouquet that makes your recipient feel remembered and appreciated.",
      ],
    },
    {
      heading: "Birthday and Anniversary Flowers in USA",
      paragraphs: [
        "Birthdays and anniversaries are important milestones that deserve thoughtful celebrations. Make these occasions more memorable with beautiful birthday flowers in USA and anniversary flower bouquets from BlossomPot.",
        "Surprise your partner with romantic roses, send a colourful bouquet to a friend or make your parents feel special with an elegant floral arrangement. You can also explore available cakes and gift combinations to make the celebration more meaningful.",
        "Whether you are celebrating a birthday or marking another year of togetherness, send flowers to loved ones in USA and share your warm wishes across the distance.",
      ],
    },
    {
      heading: "Send Roses and Romantic Flowers to USA",
      paragraphs: [
        "Roses are a timeless way to express love and affection. Explore available rose bouquets to USA, including romantic red roses and other floral arrangements suitable for expressing appreciation and care.",
        "Whether you want to surprise your partner, celebrate Valentine's Day or simply remind someone how special they are, choose from the available romantic flowers and bouquets at BlossomPot.",
        "You can also explore other floral gifting options to find an arrangement that suits your relationship and the occasion.",
      ],
    },
    {
      heading: "Send Flowers to USA from Anywhere and Other Countries",
      paragraphs: [
        "Living in India, Canada, the UK, Australia or another country should not stop you from celebrating special moments with your loved ones in the United States.",
        "With BlossomPot, you can explore options to send flowers to USA from anywhere and other international locations. Browse the available flower collection, select a suitable bouquet and enter the recipient's complete delivery address during checkout.",
        "You can order flowers online for delivery in USA without needing to visit a local flower shop in the recipient's city. Review the product and delivery availability for the entered address before completing your order.",
      ],
    },
    {
      heading: "Explore Flowers and Gifts Across the USA",
      paragraphs: [
        "Looking for more than just flowers? Explore different gifting categories available at BlossomPot for your loved ones across the United States.",
        "You can browse:",
        "Product availability and delivery options may vary depending on the recipient's location and the selected item. Enter the complete delivery address during checkout to review the available options.",
      ],
      items: [
        { title: "Flower bouquets", text: "Flower bouquets for birthdays, anniversaries and special occasions." },
        { title: "Rose bouquets", text: "Rose bouquets for romantic celebrations." },
        { title: "Birthday cakes", text: "Birthday cakes for memorable birthday surprises." },
        { title: "Anniversary gifts", text: "Anniversary gifts to celebrate relationships." },
        { title: "Valentine's Day", text: "Valentine's Day flowers and gifts to express love." },
        { title: "Gift hampers", text: "Gift hampers and combinations for thoughtful celebrations." },
      ],
    },
    {
      heading: "Why Choose BlossomPot to Send Flowers to USA?",
      paragraphs: [
        "BlossomPot offers convenient online gifting options for people who want to stay connected with loved ones living in the United States.",
        "Here are some reasons to explore our collection when you want to send flowers to USA:",
      ],
      items: [
        { title: "Flower bouquets and floral arrangements", text: "A variety of flower bouquets and floral arrangements to explore." },
        { title: "Gifting options", text: "Gifting options for birthdays, anniversaries and romantic occasions." },
        { title: "Cakes, gift hampers and combinations", text: "Available cakes, gift hampers and flower combinations." },
        { title: "Online ordering", text: "Convenient online ordering from India and other countries." },
        { title: "Secure online payment", text: "Secure online payment facilities." },
        {
          title: "Availability for the recipient's address",
          text: "Product and delivery availability information based on the recipient's address.",
        },
      ],
    },
    {
      heading: "Flower Delivery Across the USA",
      paragraphs: [
        "Send flowers to loved ones across the United States with BlossomPot. Browse available arrangements and check delivery options for the recipient's location before placing your order.",
      ],
      links: [
        { label: "Flowers to New York", href: "/gifts-to-new-york" },
        { label: "Flowers to Los Angeles", href: "/gifts-to-los-angeles" },
        { label: "Flowers to San Francisco", href: "/gifts-to-san-francisco" },
        { label: "Flowers to Chicago", href: "/gifts-to-chicago" },
        { label: "Flowers to Houston", href: "/gifts-to-houston" },
        { label: "Flowers to Dallas", href: "/gifts-to-dallas" },
        { label: "Flowers to Austin", href: "/gifts-to-austin" },
        { label: "Flowers to Atlanta", href: "/gifts-to-atlanta" },
        { label: "Flowers to Miami", href: "/gifts-to-miami" },
        { label: "Flowers to Seattle", href: "/gifts-to-seattle" },
        { label: "Flowers to Boston", href: "/gifts-to-boston" },
      ],
      paragraphsAfter: [
        "Enter the complete recipient address, including the ZIP code, to confirm which flowers and delivery options are available in the destination area.",
      ],
    },
  ],
  stepsHeading: "How to Order Flowers Online in the USA",
  stepSeparator: ": ",
  steps: [
    {
      title: "Explore flower arrangements",
      text: "Browse the available bouquets and floral gifts on BlossomPot.",
    },
    {
      title: "Choose your favourite flowers",
      text: "Select an arrangement that suits the occasion and your budget.",
    },
    {
      title: "Enter delivery details",
      text: "Provide the recipient's complete US address and ZIP code.",
    },
    {
      title: "Check delivery availability",
      text: "Review the available delivery dates, charges, and options.",
    },
    {
      title: "Complete your order",
      text: "Add a gift message if available and proceed with checkout.",
    },
  ],
  faqHeading: "Frequently Asked Questions",
  faqBeforeClosing: true,
  faqs: [
    {
      q: "Can I send flowers to USA from worldwide?",
      a: "Yes. You can send flowers to USA from worldwide by browsing the BlossomPot collection, selecting a suitable bouquet and entering the recipient's complete delivery address during checkout.",
    },
    {
      q: "Can I order flowers online for delivery in the USA?",
      a: "Yes. You can explore the available flowers online for USA delivery, choose your preferred arrangement and check its availability for the recipient's address.",
    },
    {
      q: "What types of flowers can I send to the USA?",
      a: "You can explore available rose bouquets, mixed flower arrangements, sunflowers, orchids and other floral options in the BlossomPot collection. Product availability may vary.",
    },
    {
      q: "Can I send birthday flowers to someone in the USA?",
      a: "Yes. Explore the available birthday flower bouquets and select an arrangement for your recipient. Check the delivery options for their address during checkout.",
    },
    {
      q: "Can I send anniversary flowers to the USA?",
      a: "Yes. You can explore anniversary flowers and rose bouquets to celebrate your partner, parents, friends or other loved ones in the United States.",
    },
    {
      q: "Can I send flowers to the USA from another country?",
      a: "Yes. You can place an online order from India or another country and provide an eligible delivery address in the USA. Review the selected product's availability and delivery details during checkout.",
    },
    {
      q: "Can I send flowers along with cakes or gifts to the USA?",
      a: "You can explore available flower and cake combinations, gift hampers and other gifting options on BlossomPot. Check the product details to see which combinations are available.",
    },
  ],
  closing: {
    heading: "Make Every Moment Special with BlossomPot",
    paragraphs: [
      "From romantic roses to cheerful mixed bouquets, flowers are a thoughtful way to stay connected with the people who matter most. Explore BlossomPot's available floral arrangements, choose a bouquet for your occasion, and check delivery options to send a meaningful surprise across the USA.",
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

function bullet(title: string): { title: string; text: string } {
  return { title, text: "" };
}

function usaCategoryArticle(
  page: CountrySeoPage,
  content: Pick<
    CountrySeoContent,
    "title" | "description" | "heading" | "intro" | "sections" | "faqHeading" | "faqs"
  >
): CountrySeoContent {
  return {
    countryCode: "US",
    page,
    availability: "approved",
    callsToAction: [],
    stepsHeading: "",
    steps: [],
    faqBeforeClosing: false,
    closing: { heading: "", paragraphs: [] },
    ...content,
  };
}

const usaBouquets = usaCategoryArticle("bouquets", {
  title: "Send Beautiful Flower Bouquets to USA Online | BlossomPot",
  description:
    "Send flower bouquets to USA with BlossomPot. Explore rose bouquets, mixed flowers, and birthday and anniversary arrangements, and check delivery for the recipient's address.",
  heading: "Send Beautiful Flower Bouquets to USA Online",
  intro: [
    "Looking for a thoughtful way to surprise your loved ones in the United States? With BlossomPot, you can send flower bouquets to USA and make birthdays, anniversaries and other special occasions more memorable. Explore beautiful floral arrangements and choose a bouquet that expresses your love, appreciation and warm wishes.",
    "Whether you are living in India or another country, you can buy flower bouquets online for delivery in USA and send a thoughtful surprise to your family, friends or partner. Discover available bouquets at BlossomPot and celebrate special moments across the distance.",
  ],
  sections: [
    {
      heading: "Explore Beautiful Flower Bouquets for USA Delivery",
      paragraphs: [
        "Find a beautiful selection of flower bouquets for USA delivery at BlossomPot. Explore available floral arrangements, including elegant rose bouquets, mixed flower bouquets, sunflower arrangements and other gifting options.",
        "Whether you prefer a classic floral arrangement or a colourful bouquet, choose flowers that match the recipient's personality and the occasion. Browse our collection of bouquets to USA and find a thoughtful gift for someone special.",
      ],
    },
    {
      heading: "Send Flower Bouquets to USA for Every Special Occasion",
      paragraphs: [
        "Flowers make meaningful gifts for many occasions. Celebrate birthdays with beautiful birthday flower bouquets, express affection with romantic roses or mark an anniversary with an elegant floral arrangement.",
        "You can send bouquets to USA for occasions such as:",
        "Choose an arrangement that reflects your feelings and makes the occasion more memorable.",
      ],
      items: [
        { title: "Birthdays", text: "Surprise friends and family with beautiful birthday flower bouquets." },
        { title: "Anniversaries", text: "Celebrate love and togetherness with thoughtful floral arrangements." },
        { title: "Valentine's Day", text: "Express affection with romantic rose bouquets and flowers." },
        { title: "Mother's Day", text: "Show appreciation with a beautiful bouquet for your mother." },
        { title: "Congratulations", text: "Send flowers to celebrate achievements and milestones." },
        { title: "Just Because", text: "Make an ordinary day special with a thoughtful floral surprise." },
      ],
    },
    {
      heading: "Send Rose Bouquets and Mixed Flowers to USA",
      paragraphs: [
        "Roses are a timeless way to express love, admiration and appreciation. Explore available rose bouquets to USA for romantic occasions, birthdays and anniversaries. Choose from the available colours and arrangements to find a bouquet that communicates your message.",
        "If you prefer a variety of colours and floral styles, explore mixed flower bouquets for USA delivery. These arrangements can be a thoughtful choice for friends, family members and colleagues.",
        "Browse the BlossomPot collection to discover available flower arrangements and bouquets online for your loved ones.",
      ],
    },
    {
      heading: "Send Flower Bouquets to USA from Worldwide",
      paragraphs: [
        "Distance should not stop you from being part of your loved ones' celebrations. With BlossomPot, you can send flower bouquets to USA from worldwide and other countries, including the UK, Canada and Australia.",
        "Simply browse the available bouquet collection, select your preferred flowers and enter the recipient's complete delivery address during checkout. Review the selected product's availability and delivery details for that address before placing your order.",
        "Whether you are searching for online flower bouquet delivery in USA or a thoughtful floral gift for a special occasion, BlossomPot helps you celebrate important moments from wherever you live.",
      ],
    },
    {
      heading: "Pair Flower Bouquets with Cakes and Gifts",
      paragraphs: [
        "Want to make your surprise even more special? Along with flower bouquets to USA, explore other gifting categories available at BlossomPot, including cakes, birthday gifts, anniversary gifts and gift hampers.",
        "A bouquet paired with a cake can make a thoughtful birthday surprise, while flowers and a suitable gift combination can add a special touch to an anniversary celebration.",
        "Explore the available products and their details to find a combination that suits your recipient and occasion.",
      ],
    },
    {
      heading: "Why Choose BlossomPot to Send Bouquets to USA?",
      paragraphs: [
        "BlossomPot offers convenient online gifting options for customers who want to surprise loved ones in the United States.",
      ],
      items: [
        { title: "Flower bouquets online", text: "Explore a variety of flower bouquets online." },
        { title: "Rose and mixed arrangements", text: "Find available rose bouquets and mixed floral arrangements." },
        { title: "Occasions", text: "Choose flowers for birthdays, anniversaries and other occasions." },
        { title: "More gifts", text: "Browse additional gifting categories, including cakes and hampers." },
        { title: "Order from other countries", text: "Place orders online from India and other countries." },
        { title: "Secure payment", text: "Use secure online payment facilities." },
        { title: "Address availability", text: "Check product and delivery availability based on the recipient's address." },
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions About Flower Bouquets to USA",
  faqs: [
    {
      q: "Can I buy flower bouquets online for delivery in USA?",
      a: "Yes. You can buy flower bouquets online for USA delivery through BlossomPot. Explore the available collection and check product availability for the recipient's address.",
    },
    {
      q: "What types of flower bouquets can I send to USA?",
      a: "You can explore available rose bouquets, mixed flower bouquets, sunflower arrangements and other floral options. The available selection may vary.",
    },
    {
      q: "Can I send birthday bouquets to someone in USA?",
      a: "Yes. Explore available birthday flower bouquets for USA and choose an arrangement suitable for your recipient.",
    },
    {
      q: "Can I send rose bouquets to USA for an anniversary?",
      a: "Yes. You can explore available rose bouquets to USA and other floral arrangements suitable for anniversaries and romantic celebrations.",
    },
    {
      q: "Can I send bouquets to USA from another country?",
      a: "Yes. You can place an online order from India or another country and provide an eligible delivery address in the United States. Check the selected product's availability and delivery details during checkout.",
    },
    {
      q: "Can I send flowers along with cakes or other gifts to USA?",
      a: "You can explore available flower and cake combinations, gift hampers and other gifting options at BlossomPot. Check the product details for available combinations.",
    },
  ],
});

const usaCakes = usaCategoryArticle("cakes", {
  title: "Send Cakes to USA Online | BlossomPot",
  description:
    "Send cakes to USA with BlossomPot. Explore birthday cakes, chocolate cakes, anniversary cakes, and celebration cakes, and check delivery for the recipient's address.",
  heading: "Send Cakes to USA Online",
  intro: [
    "Make every celebration sweeter with delicious cakes from BlossomPot. Whether you want to surprise your family, friends, partner or loved ones, explore our collection of cakes for birthdays, anniversaries and other special occasions. With BlossomPot, you can send cakes to USA and share happiness with the people who matter most, even when you are miles apart.",
    "Looking to order cakes online in USA from India or another country? Browse our available cake collection, choose a suitable option and send a thoughtful surprise to your loved ones across the United States.",
  ],
  sections: [
    {
      heading: "Explore Our Collection of Cakes for USA Delivery",
      paragraphs: [
        "Discover a variety of cakes for USA delivery at BlossomPot. Explore available chocolate cakes, birthday cakes, celebration cakes and other delicious options for different occasions.",
        "Whether you are looking for a rich chocolate flavour or a cake for a special celebration, browse the available designs and varieties to find something your recipient will enjoy.",
        "Choose from our collection of cakes online for delivery in USA and make birthdays, anniversaries and family celebrations more memorable.",
      ],
    },
    {
      heading: "Send Birthday Cakes to USA for Special Celebrations",
      paragraphs: [
        "Birthdays are incomplete without a delicious cake. Make your loved ones feel special by choosing from available birthday cakes in USA at BlossomPot.",
        "Whether you are planning a surprise for your parents, partner, siblings, friends or colleagues, explore different cake options suitable for birthday celebrations. A thoughtfully selected birthday cake can make the occasion more joyful and create a memorable moment for the recipient.",
        "You can also explore birthday flowers and gift combinations to make your surprise even more meaningful.",
      ],
    },
    {
      heading: "Send Chocolate Cakes and Other Cake Varieties to USA",
      paragraphs: [
        "Chocolate cakes are a popular choice for many celebrations. If your loved ones enjoy chocolate desserts, explore the available chocolate cakes for USA delivery at BlossomPot.",
        "You can also browse other available cake flavours, designs and sizes to find an option that matches the occasion and the recipient's preferences.",
        "From simple celebrations to special milestones, choose a cake that adds sweetness to the moment. Check individual product descriptions for details about ingredients, flavours, sizes and available designs.",
      ],
    },
    {
      heading: "Anniversary Cakes and Celebration Cakes in USA",
      paragraphs: [
        "Celebrate love and togetherness with thoughtful anniversary cakes in USA. Whether you are marking your first anniversary or celebrating many years together, a delicious cake can make the occasion more memorable.",
        "Explore available celebration cakes for anniversaries, romantic occasions, family gatherings and other milestones. You can also pair a cake with available flowers or gifts to create a more thoughtful surprise.",
        "With BlossomPot, you can send anniversary cakes to USA and share your warm wishes even when you cannot celebrate in person.",
      ],
    },
    {
      heading: "Send Cakes to USA from Worldwide",
      paragraphs: [
        "Living in India, Canada, the UK, Australia or another country should not stop you from celebrating with loved ones in the United States.",
        "With BlossomPot, you can send cakes to USA from worldwide and other international locations through convenient online ordering. Browse the available cake collection, select your preferred product and enter the recipient's complete delivery address during checkout.",
        "If you are looking for online cake delivery in USA, review the selected cake's availability and delivery information for the recipient's address before placing your order.",
      ],
    },
    {
      heading: "Make Your Gift Special with Cakes, Flowers and Hampers",
      paragraphs: [
        "A cake can be a wonderful gift on its own, but combining it with another thoughtful present can make a celebration even more special.",
        "Along with cakes to USA, explore other gifting categories available at BlossomPot, including:",
        "Browse the available products and check their details to find a suitable gift or combination for your recipient.",
      ],
      items: [
        { title: "Flower bouquets", text: "Flower bouquets for birthdays, anniversaries and romantic occasions." },
        { title: "Birthday gifts", text: "Birthday gifts for family members and friends." },
        { title: "Anniversary gifts", text: "Anniversary gifts to celebrate meaningful relationships." },
        { title: "Gift hampers", text: "Gift hampers for thoughtful surprises." },
        { title: "Valentine's Day gifts", text: "Valentine's Day gifts to express love and affection." },
      ],
    },
    {
      heading: "Why Choose BlossomPot to Send Cakes to USA?",
      paragraphs: [
        "BlossomPot offers convenient online gifting options for customers who want to celebrate special occasions with loved ones in the United States.",
      ],
      items: [
        { title: "Cakes for USA delivery", text: "Explore a variety of cakes online for USA delivery." },
        { title: "Birthday and celebration cakes", text: "Find available birthday and celebration cakes." },
        { title: "Chocolate and other varieties", text: "Browse chocolate cakes and other available varieties." },
        { title: "Occasions", text: "Discover cakes for birthdays, anniversaries and special occasions." },
        { title: "Order from other countries", text: "Place online orders from India and other countries." },
        { title: "Secure payment", text: "Use secure online payment facilities." },
        { title: "Address availability", text: "Check product and delivery availability based on the recipient's address." },
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions About Cakes to USA",
  faqs: [
    {
      q: "Can I send cakes to USA from worldwide?",
      a: "Yes. You can send cakes to USA from worldwide by browsing the BlossomPot cake collection, selecting an available product and entering the recipient's eligible USA delivery address during checkout.",
    },
    {
      q: "Can I order cakes online for delivery in USA?",
      a: "Yes. You can order cakes online for USA delivery through BlossomPot. Browse the available collection and check the selected cake's availability for the recipient's address.",
    },
    {
      q: "What types of cakes can I send to USA?",
      a: "You can explore available chocolate cakes, birthday cakes, celebration cakes and other cake varieties. The selection may vary depending on the products listed.",
    },
    {
      q: "Can I send birthday cakes to someone in USA?",
      a: "Yes. Explore the available birthday cakes in USA, select a suitable design and check its availability for the recipient's address during checkout.",
    },
    {
      q: "Can I send anniversary cakes to USA?",
      a: "Yes. You can explore available anniversary cakes in USA and other celebration cake options to mark a special occasion with your loved ones.",
    },
    {
      q: "Can I send cakes to USA from another country?",
      a: "Yes. You can place an online order from India or another country and provide an eligible delivery address in the United States. Review product availability and delivery details during checkout.",
    },
    {
      q: "Can I send cakes along with flowers to USA?",
      a: "You can explore available cake and flower combinations and other gifting options at BlossomPot. Check the individual product details to see which combinations are available.",
    },
  ],
});

const usaBirthdayGifts = usaCategoryArticle("birthday-gifts", {
  title: "Send Birthday Gifts to USA | BlossomPot",
  description:
    "Send birthday gifts to USA with BlossomPot. Explore flowers, cakes, chocolates, keepsakes, and gift hampers for friends, family, and someone special.",
  heading: "Send Birthday Gifts to USA to Make Every Celebration Special",
  intro: [
    "Birthdays are the perfect opportunity to remind your loved ones how much they mean to you. Even when miles separate you, a thoughtful present can make their special day feel closer and more memorable. With BlossomPot, you can send birthday gifts to USA from anywhere in the world and surprise your friends, family members, or someone special with a meaningful gesture.",
    "Explore a delightful range of birthday gifts for loved ones in USA, including beautiful flower arrangements, delicious cakes, chocolate treats, personalised keepsakes, and curated gift hampers. Whether you are celebrating your partner, parents, siblings, friends, or children, you can find something that suits their personality and makes them feel appreciated.",
    "Make their celebration even more special by choosing from our collection of birthday gifts online USA. With convenient online ordering, you can plan a thoughtful surprise for someone celebrating in the United States, even when you are far away.",
  ],
  sections: [
    {
      heading: "Explore the Best Birthday Gift Ideas for Your Loved Ones in USA",
      paragraphs: [
        "Finding the right birthday present is all about choosing something that reflects the recipient's interests and your relationship with them. At BlossomPot, you can explore different birthday gift ideas for USA celebrations, from classic favourites to thoughtful surprises.",
        "Here are some gifting options to consider:",
      ],
      items: [
        {
          title: "Birthday Flowers for a Beautiful Surprise",
          text: "Flowers are a timeless way to express love, appreciation, and warm wishes. Surprise someone special with elegant roses, cheerful mixed bouquets, or seasonal floral arrangements. Choose birthday flowers delivery in USA to add colour and happiness to their celebration.",
        },
        {
          title: "Delicious Birthday Cakes",
          text: "Make their birthday sweeter with a delicious cake. Whether they prefer chocolate, vanilla, fruit flavours, or other available varieties, a cake can make the celebration feel complete. Explore our collection of birthday cakes delivery in USA and choose an option that suits their taste.",
        },
        {
          title: "Chocolate Gifts for Sweet Celebrations",
          text: "For someone who loves sweet treats, chocolates make a delightful birthday present. From chocolate assortments to thoughtfully arranged sweet gifts, these options are ideal for friends, partners, and family members. Explore chocolate birthday gifts in USA to add a little sweetness to their special day.",
        },
        {
          title: "Thoughtful Gift Hampers",
          text: "A gift hamper brings together different treats and surprises in one thoughtful package. Depending on availability, you can explore combinations featuring chocolates, snacks, flowers, and other gifting favourites. Choose birthday gift hampers for USA to make your wishes feel extra special.",
        },
      ],
    },
    {
      heading: "Send Birthday Gifts to Everyone Special in Your Life",
      paragraphs: [
        "Every relationship deserves a different kind of birthday surprise. Whether you are choosing something romantic, practical, playful, or sentimental, BlossomPot makes it easier to explore suitable birthday gifts for family and friends in USA.",
      ],
      items: [
        {
          title: "Birthday Gifts for Boyfriend",
          text: "Make your boyfriend feel loved with a birthday surprise that matches his personality. Explore thoughtful gift options such as chocolate arrangements, cakes, flowers, and available personalised keepsakes. A carefully selected birthday gift for boyfriend in USA can make his day more memorable.",
        },
        {
          title: "Birthday Gifts for Girlfriend",
          text: "Celebrate your girlfriend with a gift that expresses your affection. Beautiful roses, elegant flower arrangements, delicious cakes, and sweet treats are lovely ways to make her feel special. Choose a thoughtful birthday gift for girlfriend in USA and add a heartfelt message to make the gesture more personal.",
        },
        {
          title: "Birthday Gifts for Husband",
          text: "Surprise your husband with something that reflects his interests and preferences. From delicious cakes and chocolate gifts to flowers and curated hampers, there are plenty of ways to celebrate him. Explore birthday gifts for husband in USA and make his birthday feel truly special.",
        },
        {
          title: "Birthday Gifts for Wife",
          text: "Make your wife's birthday memorable with a thoughtful present chosen just for her. Romantic flowers, delicious cakes, chocolates, and personalised gift options can help you express your love. Find meaningful birthday gifts for wife in USA and celebrate another beautiful year together.",
        },
        {
          title: "Birthday Gifts for Parents",
          text: "Your parents deserve a birthday surprise filled with love and appreciation. Choose elegant flowers, delicious cakes, thoughtful hampers, or other suitable gifts to make them smile. Explore birthday gifts for parents in USA and send warm wishes even when you cannot celebrate together.",
        },
        {
          title: "Birthday Gifts for Kids",
          text: "Make a little one's birthday more exciting with cheerful cakes, colourful flowers, chocolates, and age-appropriate gift options. Choose something that reflects their interests and adds happiness to their celebration. Explore suitable birthday gifts for kids in USA to make their special day brighter.",
        },
        {
          title: "Birthday Gifts for Friends",
          text: "Celebrate friendship with a present that brings back happy memories. Whether your friend loves flowers, cakes, chocolates, or thoughtful hampers, you can explore different options to find the right gift.",
        },
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "What should I send to someone in the USA for their birthday?",
      a: "You can choose from a variety of thoughtful presents, including flower bouquets, birthday cakes, chocolate boxes, and gift hampers. Consider the recipient's interests and choose a gift that makes their celebration more meaningful.",
    },
    {
      q: "Can I order a birthday gift for someone in the USA while living in another country?",
      a: "Yes, you can browse BlossomPot's online collection and place an order from another country. Simply select your preferred gift, provide the recipient's US address, and check the available delivery options during checkout.",
    },
    {
      q: "Can I send a birthday gift directly to my friend's home in the USA?",
      a: "Yes, you can enter your friend's complete delivery address in the USA while placing your order. Make sure the address and contact details are accurate to help facilitate delivery.",
    },
    {
      q: "What birthday gifts are suitable for someone who lives far away?",
      a: "Flowers, cakes, chocolates, curated hampers, and personalised keepsakes are thoughtful options for celebrating from a distance. You can choose something that reminds your loved one of a special memory or shared moment.",
    },
  ],
});

const usaAnniversaryGifts = usaCategoryArticle("anniversary-gifts", {
  title: "Send Anniversary Gifts to USA | BlossomPot",
  description:
    "Send anniversary gifts to USA with BlossomPot. Explore romantic flowers, cakes, chocolates, keepsakes, and gift hampers for your partner, parents, and couples.",
  heading: "Send Anniversary Gifts to USA to Celebrate Your Love",
  intro: [
    "An anniversary is a beautiful reminder of the love, trust, and memories two people have built together. Whether it is your first anniversary or a special milestone, celebrating the occasion with a thoughtful present makes the day even more meaningful. Even if your partner or loved ones live miles away, you can make them feel special with BlossomPot.",
    "Explore a delightful collection of anniversary gifts to USA, featuring romantic flowers, delicious cakes, chocolates, keepsakes, and thoughtful gift hampers. Whether you want to surprise your spouse, celebrate your parents' wedding anniversary, or send warm wishes to a couple, you can find gifting options for different relationships and preferences.",
    "With BlossomPot, you can send anniversary gifts to USA from another country and make your loved ones feel closer on their special day. Choose a meaningful present, add a heartfelt message where available, and create a celebration they will remember.",
  ],
  sections: [
    {
      heading: "Explore Beautiful Anniversary Gifts for Your Loved Ones in USA",
      paragraphs: [
        "Every relationship has its own story, and the perfect anniversary present should reflect that bond. From romantic surprises to thoughtful keepsakes, BlossomPot offers different anniversary gift ideas for USA celebrations.",
      ],
      items: [
        {
          title: "Anniversary Flowers to Express Your Love",
          text: "Flowers are a timeless way to express affection and appreciation. Surprise your partner with elegant roses, charming mixed bouquets, or other available floral arrangements. Whether you prefer classic red roses or colourful blooms, anniversary flowers delivery in USA can add a romantic touch to the celebration.",
        },
        {
          title: "Delicious Anniversary Cakes",
          text: "No anniversary celebration feels complete without a sweet treat. Make the occasion more memorable with a delicious cake in a flavour your loved one enjoys. Explore available options for anniversary cakes delivery in USA and choose a cake that makes your celebration sweeter.",
        },
        {
          title: "Chocolates for a Sweet Anniversary Surprise",
          text: "Chocolates are a lovely way to add sweetness to a special occasion. From assorted chocolate selections to thoughtfully presented treats, they make wonderful gifts for partners and couples. Explore anniversary chocolates in USA and surprise someone with a delightful treat.",
        },
        {
          title: "Anniversary Gift Hampers",
          text: "Gift hampers bring together different treats and surprises in one thoughtful package. Depending on availability, you can explore combinations featuring chocolates, flowers, and other gifting favourites. Choose anniversary gift hampers for USA to make your wishes feel extra special.",
        },
        {
          title: "Anniversary Gift Combos",
          text: "Make your surprise more special by combining favourite gifts. Flowers with cakes, chocolates with keepsakes, or other available gift combinations can create a memorable anniversary gesture. Explore anniversary gift combos for USA and find a combination that suits the occasion.",
        },
      ],
    },
    {
      heading: "Find the Perfect Anniversary Gift for Your Partner",
      paragraphs: [
        "Choosing a gift becomes easier when you consider your partner's personality, interests, and the memories you share. Whether you are celebrating with your husband or wife, BlossomPot offers gifting inspiration for different relationships.",
      ],
      items: [
        {
          title: "Anniversary Gifts for Husband",
          text: "Make your husband feel appreciated with a present that reflects his interests. Cakes, chocolates, curated hampers, and flowers are thoughtful options to explore. Choose meaningful anniversary gifts for husband in USA and make your special day even more memorable.",
        },
        {
          title: "Anniversary Gifts for Wife",
          text: "Celebrate your wife with a romantic gesture that expresses how much she means to you. Beautiful roses, delicious cakes, and chocolates can make her feel loved. Explore anniversary gifts for wife in USA and choose something that reflects your relationship.",
        },
        {
          title: "Anniversary Gifts for Couples",
          text: "Whether you are congratulating friends, relatives, or a special couple, a thoughtful anniversary present is a lovely way to celebrate their journey together. Flowers, cakes, chocolate hampers, and elegant keepsakes are suitable choices. Explore anniversary gifts for couples in USA to send your warm wishes.",
        },
        {
          title: "Anniversary Gifts for Parents",
          text: "Your parents' anniversary is a wonderful occasion to celebrate their years of love and togetherness. Surprise them with flowers, cakes, gift hampers, or thoughtful keepsakes. Choose meaningful anniversary gifts for parents in USA and remind them how much they are appreciated.",
        },
      ],
    },
    {
      heading: "Celebrate Every Milestone with Thoughtful Anniversary Gifts",
      paragraphs: [
        "Every anniversary marks another chapter in a couple's journey. From the excitement of the first year to the joy of celebrating decades together, each milestone deserves a meaningful gesture.",
        "Explore BlossomPot's collection of wedding anniversary gifts to USA and choose a present that suits the milestone and the couple's preferences.",
      ],
      items: [
        { title: "First Anniversary Gifts", text: "Celebrate the beginning of married life with flowers, cakes, chocolates, or personalised keepsakes." },
        { title: "5th Anniversary Gifts", text: "Choose thoughtful presents that reflect the memories and experiences you have shared." },
        { title: "10th Anniversary Gifts", text: "Mark a decade of togetherness with elegant flowers, gift hampers, or a memorable gift combination." },
        { title: "25th Anniversary Gifts", text: "Celebrate a silver anniversary with beautiful floral arrangements, delicious cakes, and meaningful keepsakes." },
        { title: "50th Anniversary Gifts", text: "Honour a golden milestone with thoughtful presents that express admiration, gratitude, and love." },
      ],
    },
    {
      heading: "How to Order Anniversary Gifts Online for Delivery in USA",
      paragraphs: [
        "Sending an anniversary surprise across borders is convenient with online gifting. Follow these simple steps to place your order with BlossomPot:",
        "Delivery availability and estimated timelines may vary depending on the recipient's address, selected product, and local service coverage. Please check the options displayed during checkout before placing your order.",
      ],
      items: [
        { title: "Browse the Collection", text: "Explore available anniversary flowers, cakes, chocolates, and hampers." },
        { title: "Choose Your Present", text: "Select a gift that suits the recipient and the occasion." },
        { title: "Enter the Delivery Address", text: "Provide the recipient's complete address in the United States along with the required contact details." },
        { title: "Check Delivery Options", text: "Review the available delivery dates and estimated timelines for the selected product and location." },
        { title: "Add a Personal Message", text: "Include a heartfelt anniversary greeting if the option is available." },
        { title: "Review and Place Your Order", text: "Confirm the product, recipient details, and delivery information before completing payment." },
      ],
    },
    {
      heading: "Why Choose BlossomPot to Send Anniversary Gifts to USA?",
      paragraphs: [
        "When you cannot be physically present for an anniversary, a thoughtful gift can help you share the celebration from afar. BlossomPot makes it easier to explore and order presents for your loved ones in the United States.",
        "Make every milestone memorable with online anniversary gifts to USA from BlossomPot. Choose a thoughtful surprise and let your loved ones know they are always in your heart.",
      ],
      items: [
        { title: "Thoughtful Gift Collection", text: "Explore flowers, cakes, chocolates, plants, and hampers." },
        { title: "Convenient Online Ordering", text: "Place an order online from wherever you are." },
        { title: "Gifts for Different Relationships", text: "Find suitable presents for your husband, wife, parents, friends, and couples." },
        { title: "Delivery to Selected USA Locations", text: "Check product and address eligibility during checkout." },
        { title: "Options for Different Budgets", text: "Discover gifting choices across different price ranges." },
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions",
  faqs: [
    {
      q: "Can I send anniversary gifts to the USA from another country?",
      a: "Yes, you can order anniversary gifts online with BlossomPot while living outside the United States. Browse the available collection, select a suitable present, and enter your recipient's US address during checkout. Delivery options depend on the selected product and location.",
    },
    {
      q: "What are some romantic anniversary gifts I can send to the USA?",
      a: "Flowers, cakes, chocolates and gift hampers are popular choices for romantic celebrations. You can choose a present that reflects your partner's preferences and the memories you share.",
    },
    {
      q: "Can I send anniversary gifts to my husband or wife living in the USA?",
      a: "Yes, you can explore separate gifting options for your husband or wife and place an order using their delivery address in the United States. Check the available products and delivery eligibility during checkout.",
    },
    {
      q: "Can I send anniversary gifts to my parents in the USA?",
      a: "Yes, you can choose thoughtful presents such as flowers, cakes, chocolates and gift hampers for your parents. Enter their complete US delivery address and check the available options at checkout.",
    },
    {
      q: "Can I include a personal anniversary message with my gift?",
      a: "Where the option is available, you can add a personal greeting to your order. A heartfelt message can make your anniversary surprise feel more personal and meaningful.",
    },
    {
      q: "How can I check whether anniversary gifts can be delivered to my recipient's address?",
      a: "Enter the recipient's US address or ZIP code wherever requested on the website. Product eligibility and delivery timelines may vary by location, so check the information displayed during checkout before confirming your order.",
    },
  ],
});

const usaValentinesGifts = usaCategoryArticle("valentines-day-gifts", {
  title: "Valentine's Day Gifts to USA | Romantic Flowers & Gift Sets | BlossomPot",
  description:
    "Send Valentine's Day gifts to the USA online. Romantic gift sets, personalised gifts and flowers with a love note.",
  heading: "Send Valentine's Day Gifts to USA",
  intro: [
    "Long-distance Valentine's Day can feel lonely, but it does not have to. A gift that arrives on the right day, with a message only you could write, reminds your partner you are close even when you are not.",
    "BlossomPot has romantic gift sets, personalised keepsakes, treats and mugs that are picked for February delivery in the USA. Pair any of them with roses or a cake for a full romantic surprise.",
  ],
  sections: [
    {
      heading: "Valentine's Day Delivery to the USA",
      paragraphs: [
        "We deliver Valentine's Day gifts across the USA, with clear shipping windows shown before you pay. Same-day delivery is available in select cities when you order before the local cut-off. Because Valentine's week is busy, we recommend ordering early.",
      ],
    },
    {
      heading: "Valentine's Gift Ideas",
      paragraphs: [],
      items: [
        bullet("Romantic gift sets for couples"),
        bullet("Personalised Valentine gifts with a name or message"),
        bullet("Love frames and charm gifts to keep for years"),
        bullet("Funny and sweet mugs for the partner who loves a joke"),
        bullet("Valentine treats and cupcakes to share"),
        bullet("Roses and flowers to go with any gift"),
      ],
    },
    {
      heading: "Choosing the Right Valentine's Gift",
      paragraphs: [
        "Think about your partner's personality first. A romantic will love roses and a love note, a joker will smile at a funny mug, and a sentimental partner will treasure a framed memory or personalised gift. If you are not sure, combine something sweet with something lasting.",
      ],
    },
    {
      heading: "Why Order Valentine's Gifts from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Delivery to the USA with clear shipping windows"),
        bullet("Gifts chosen with USA delivery in mind"),
        bullet("Gift message on most products"),
        bullet("Secure checkout with Razorpay and Stripe"),
        bullet("WhatsApp and email support"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Valentine's Day Gifts to USA",
  faqs: [
    {
      q: "How early should I order Valentine's Day gifts for the USA?",
      a: "We recommend ordering at least a week ahead, as this is a busy gifting period. Early orders give you more delivery date choices.",
    },
    {
      q: "What is a good Valentine's Day gift for a long-distance partner?",
      a: "A personalised gift or a framed keepsake, paired with a bouquet, works very well because it feels personal and lasts beyond the day.",
    },
    {
      q: "Can I add a love note to my gift?",
      a: "Yes. Most products support a gift message, so you can write your own note at checkout.",
    },
    {
      q: "Can I send Valentine's gifts to a workplace?",
      a: "Yes, you can enter an office address. Just add a contact number so the delivery partner can reach the recipient.",
    },
    {
      q: "Are personalised Valentine's gifts available?",
      a: "Yes, we have personalised gift sets. Check the product page to see what can be customised.",
    },
    {
      q: "Can I send Valentine's Day gifts from outside the USA?",
      a: "Yes. Enter the USA address and pay in USD with Stripe or in INR with Razorpay.",
    },
  ],
});

const usaHampers = usaCategoryArticle("hampers", {
  title: "Send Gift Hampers to USA | BlossomPot",
  description:
    "Send gift hampers to USA with BlossomPot. Explore chocolate, dry fruit, snack, premium, birthday, anniversary, and corporate gift baskets.",
  heading: "Send Gift Hampers to USA",
  intro: [
    "Make every celebration more special with beautiful gift hampers from BlossomPot. Whether you want to surprise your family, friends, colleagues or someone special, a thoughtfully arranged gift hamper is a wonderful way to express your feelings.",
    "Explore a variety of gift hampers for delivery in the USA, including gourmet gift baskets, chocolate hampers, dry fruit gifts, snack baskets, and premium celebration gifts. From birthdays and anniversaries to festivals, congratulations and thank-you occasions, find a gift that makes every moment memorable.",
    "With BlossomPot, you can browse gift hampers online, select a suitable option and place an order for delivery to your loved one's address in the United States.",
  ],
  sections: [
    {
      heading: "Send Beautiful Gift Hampers for Every Occasion",
      paragraphs: [
        "A gift hamper brings together different treats and thoughtful items in one memorable package. Whether you are celebrating a special milestone or simply want to make someone smile, BlossomPot offers gifting options for different occasions.",
      ],
      items: [
        { title: "Birthday Gift Hampers", text: "Make birthdays more exciting with a thoughtful gift basket. Choose from available chocolate hampers, snack baskets, gourmet treats and other birthday gift options to surprise someone special in the USA." },
        { title: "Anniversary Gift Hampers", text: "Celebrate love and togetherness with a beautiful anniversary hamper. A combination of chocolates, delicious treats and carefully selected gifts can make the celebration more memorable for your partner or a special couple." },
        { title: "Thank You Gift Hampers", text: "Express your appreciation with a thoughtful gift basket. Send chocolates, snacks, tea or other available treats to friends, family members, colleagues or business associates." },
        { title: "Congratulations Gift Hampers", text: "Celebrate achievements, new beginnings, promotions and special milestones with a carefully selected gift hamper. It is a lovely way to share happiness and make someone feel appreciated." },
        { title: "Christmas Gift Hampers", text: "Make the festive season more joyful with Christmas gift baskets. Explore available festive treats, chocolates, snacks and seasonal gift collections for family and friends." },
        { title: "Corporate Gift Hampers", text: "Show appreciation to employees, clients, business partners and colleagues with thoughtfully selected gift baskets. Gourmet treats and premium gift collections can make professional gifting more meaningful." },
        { title: "Just Because Gift Hampers", text: "You do not need a special occasion to surprise someone. Send a gift hamper simply to show that you care and make an ordinary day more enjoyable." },
      ],
    },
    {
      heading: "Explore Different Types of Gift Hampers in the USA",
      paragraphs: [
        "Find a gift basket that suits your recipient's taste and preferences. Explore different hamper categories available at BlossomPot.",
      ],
      items: [
        { title: "Chocolate Gift Hampers", text: "Chocolate hampers are a delightful choice for birthdays, anniversaries and festive celebrations. Explore available chocolate gift baskets and sweet treats to surprise someone who loves chocolates." },
        { title: "Dry Fruit Gift Hampers", text: "Send a thoughtful assortment of dry fruits and nuts for someone who appreciates wholesome treats. Dry fruit hampers can be a suitable choice for family celebrations, festive gifting and special occasions." },
        { title: "Premium Luxury Gift Hampers", text: "Looking for something elegant? Explore premium gift hampers featuring carefully selected products and attractive packaging. They are suitable for milestone celebrations, corporate gifting and special occasions." },
      ],
    },
    {
      heading: "Send Gift Hampers to the USA from India and Other Countries",
      paragraphs: [
        "Distance should never stop you from making someone feel special. Whether you are living in India, the UK, Canada, Australia or another country, you can browse BlossomPot online and order a gift hamper for someone living in the United States.",
        "Choose a suitable gift basket, enter your recipient's delivery address and complete your order online using the available payment options.",
        "Surprise your parents, friends, relatives, partner or business associates in the USA with a thoughtful gift, even when you cannot celebrate together in person.",
      ],
    },
    {
      heading: "Send Gift Hampers Across Major Cities in the USA",
      paragraphs: [
        "BlossomPot offers gift delivery options for selected destinations across the United States. Explore our location-specific pages to find suitable gifts for your recipient's city.",
        "Enter the recipient's address at checkout to check product availability and estimated delivery options for the destination.",
      ],
      links: [
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
        { label: "Seattle", href: "/gifts-to-seattle" },
        { label: "Miami", href: "/gifts-to-miami" },
        { label: "Boston", href: "/gifts-to-boston" },
      ],
    },
    {
      heading: "Why Choose BlossomPot for Gift Hampers to the USA?",
      paragraphs: [],
      items: [
        { title: "Variety of Gift Hampers", text: "Explore different gifting options, including gourmet baskets, chocolates, snacks, dry fruits, tea and coffee gifts, and premium hampers." },
        { title: "Gifts for Different Occasions", text: "Find suitable gift baskets for birthdays, anniversaries, festivals, corporate celebrations and everyday surprises." },
        { title: "Thoughtful Gift Selection", text: "Choose a hamper based on your recipient's interests, preferences and the occasion you are celebrating." },
        { title: "Convenient Online Ordering", text: "Browse the collection, select your preferred hamper and place your order online from wherever you are." },
        { title: "Delivery to Selected USA Locations", text: "Check product availability and delivery estimates for your recipient's address in the United States." },
        { title: "Secure Online Payments", text: "Complete your purchase through the available payment methods and enjoy a convenient checkout experience." },
        { title: "Customer Support", text: "Our support team can assist with order-related questions, product information and delivery details." },
      ],
    },
    {
      heading: "How to Order Gift Hampers Online for Delivery in the USA",
      paragraphs: ["Ordering a gift hamper with BlossomPot is simple."],
      items: [
        { title: "Explore the Collection", text: "Browse the available gift hampers and gift baskets." },
        { title: "Choose Your Favourite", text: "Select a hamper that suits the occasion and your recipient's preferences." },
        { title: "Enter Delivery Details", text: "Provide the recipient's complete US address, including ZIP code." },
        { title: "Add a Gift Message", text: "Include a personal message wherever the option is available." },
        { title: "Complete Your Order", text: "Review the product and delivery details, then complete your payment using an available payment method." },
      ],
    },
    {
      heading: "Make Every Celebration Memorable with BlossomPot",
      paragraphs: [
        "A thoughtful gift hamper is more than just a collection of products. It is a way to share happiness, express appreciation and create beautiful memories with the people who matter.",
        "Whether you are sending a birthday surprise, an anniversary gift, a festive basket or a corporate thank-you hamper, BlossomPot helps you find thoughtful gifting options for your loved ones in the USA.",
        "Explore our collection of gift hampers and order online to make someone's day extra special.",
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions – Gift Hampers to USA",
  faqs: [
    {
      q: "Can I send gift hampers to the USA from India?",
      a: "Yes. You can browse BlossomPot's online gift hamper collection from India and place an order for supported delivery destinations in the USA.",
    },
    {
      q: "What types of gift hampers are available at BlossomPot?",
      a: "Explore available options such as chocolate hampers, dry fruit gifts, and premium gift collections.",
    },
    {
      q: "Can I send birthday gift hampers to the USA?",
      a: "Yes. You can explore available gift baskets and celebration hampers to surprise friends and family members on their birthdays.",
    },
    {
      q: "Are gift hampers suitable for anniversaries?",
      a: "Yes. Chocolate hampers, baskets and other thoughtful gift collections can make lovely anniversary surprises.",
    },
    {
      q: "Can I send corporate gift hampers to the USA?",
      a: "You can explore suitable gourmet and premium gift basket options for colleagues, clients and business associates. Check product availability and quantities before ordering.",
    },
    {
      q: "Can I send dry fruit gift hampers to the USA?",
      a: "You can explore available dry fruit and nut gift options in our online collection. Product availability may vary.",
    },
    {
      q: "Can I order gift hampers from the UK, Canada or Australia for someone in the USA?",
      a: "Yes. You can browse BlossomPot online from supported countries and place an order for a recipient in the USA, subject to available payment and delivery options.",
    },
    {
      q: "How can I check gift hamper delivery availability?",
      a: "Select your preferred product and enter the recipient's US address during the ordering process to check available delivery options and estimated dates.",
    },
    {
      q: "Can I include a personal message with a gift hamper?",
      a: "Where the gift message option is available, you can add a personal note to make your surprise more meaningful.",
    },
    {
      q: "How do I order a gift hamper online?",
      a: "Visit BlossomPot, explore the gift hamper collection, select your preferred product, enter the recipient's delivery details and complete checkout.",
    },
  ],
});

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
