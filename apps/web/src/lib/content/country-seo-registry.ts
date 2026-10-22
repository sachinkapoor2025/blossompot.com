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
    "Send flowers to the USA with BlossomPot. Explore roses, lilies, orchids, and bouquets for birthdays, anniversaries, and special occasions. Check delivery options online.",
  heading: "Send Flowers to the USA Online with BlossomPot",
  intro: [
    "Make every occasion special with beautiful flower delivery across the United States. With BlossomPot, you can explore stunning bouquets, fresh roses, elegant lilies, orchids, and mixed floral arrangements for your loved ones. Whether you are celebrating a birthday, anniversary, or special milestone, find flowers that help you express your feelings from anywhere in the world.",
    "Choose your favourite floral arrangement, enter the recipient’s US delivery address, and check the available delivery options at checkout. Delivery availability and timing depend on the destination, selected arrangement, order time, and local florist availability.",
  ],
  callsToAction: [{ label: "Shop Flowers", href: "/flowers-to-usa" }],
  sections: [
    {
      heading: "Shop Flowers by Occasion",
      paragraphs: [],
      items: [
        {
          title: "Birthday Flowers",
          text: "Make birthdays brighter with colourful flower bouquets, elegant roses, lilies, and cheerful mixed arrangements. Surprise friends, family members, or your partner with a thoughtful floral gift delivered to their doorstep in the USA.",
        },
        {
          title: "Anniversary Flowers",
          text: "Celebrate love and togetherness with romantic red roses, premium bouquets, and elegant floral arrangements. Choose a beautiful anniversary flower gift to make your special moments even more memorable.",
        },
        {
          title: "Thank-You Flowers",
          text: "Express gratitude with fresh-looking mixed bouquets, vibrant seasonal blooms, and elegant floral gifts. Send thank-you flowers to friends, family, colleagues, or anyone who deserves a thoughtful surprise.",
        },
        {
          title: "Congratulations Flowers",
          text: "Celebrate achievements and exciting milestones with beautiful flowers. From graduations and new jobs to promotions and personal accomplishments, choose an arrangement that makes every success feel special.",
        },
        {
          title: "Just-Because Flowers",
          text: "You don't need a special occasion to make someone smile. Send a surprise bouquet to brighten an ordinary day and remind your loved ones that you are thinking of them.",
        },
        {
          title: "Sympathy Flowers",
          text: "Express your care, comfort, and support with graceful floral arrangements. Choose appropriate sympathy flowers to share your condolences with friends and family during difficult times, subject to local availability.",
        },
      ],
    },
    {
      heading: "Explore Popular Flowers Online",
      paragraphs: [],
      items: [
        {
          title: "Roses",
          text: "Classic roses are a timeless choice for expressing love, appreciation, and affection. Explore romantic red roses and other colours for birthdays, anniversaries, and meaningful celebrations.",
        },
        {
          title: "Lilies",
          text: "Elegant lilies bring beauty and sophistication to floral gifts. Choose lily arrangements for special occasions, thoughtful gestures, and memorable celebrations.",
        },
        {
          title: "Orchids",
          text: "Send an elegant floral gift with beautiful orchids. Their distinctive appearance makes them a lovely choice for celebrations, appreciation, and special milestones.",
        },
        {
          title: "Mixed Flower Bouquets",
          text: "Brighten someone's day with a colourful combination of flowers. Mixed bouquets offer a cheerful way to celebrate birthdays, send congratulations, or surprise someone just because.",
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
    {
      heading: "Why Choose BlossomPot for Flower Delivery?",
      paragraphs: [],
      items: [
        {
          title: "A Variety of Floral Arrangements",
          text: "Explore roses, lilies, orchids, mixed bouquets, and other floral designs for different occasions and preferences.",
        },
        {
          title: "Flowers for Every Celebration",
          text: "Find thoughtful flower gifts for birthdays, anniversaries, congratulations, thank-you gestures, and everyday surprises.",
        },
        {
          title: "Convenient Online Shopping",
          text: "Browse available designs online, select your preferred arrangement, and provide the recipient's delivery details in a few simple steps.",
        },
        {
          title: "Personalised Gift Messages",
          text: "Add a personal message to eligible flower orders to make your gift more meaningful and memorable.",
        },
        {
          title: "Clear Delivery Options",
          text: "Check the available delivery dates, charges, and other applicable details during checkout before confirming your purchase.",
        },
        {
          title: "Helpful Customer Support",
          text: "Get assistance with product selection, order-related questions, and delivery information through BlossomPot's available customer support channels.",
        },
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
      q: "Can I send flowers to the USA from another country?",
      a: "Yes, you can shop online from your location and enter the recipient's US address. Available products, payment methods, and delivery options will depend on BlossomPot's checkout services.",
    },
    {
      q: "Does BlossomPot offer same-day flower delivery in the USA?",
      a: "Same-day delivery may be available for eligible arrangements in selected locations. Check the product details and checkout options for the recipient's ZIP code before ordering.",
    },
    {
      q: "Which flowers can I send through BlossomPot?",
      a: "Available options may include roses, lilies, orchids, mixed bouquets, and other floral arrangements. The selection depends on the destination and local availability.",
    },
    {
      q: "Can I send flowers for birthdays and anniversaries?",
      a: "Yes, you can explore suitable arrangements for birthdays, anniversaries, congratulations, thank-you gifts, and other special occasions, depending on the products available.",
    },
    {
      q: "How can I check flower delivery availability?",
      a: "Select your preferred arrangement and enter the recipient's complete address, including the ZIP code, wherever requested. Review the delivery information displayed on the product page or at checkout.",
    },
    {
      q: "Can I include a message with my flower delivery?",
      a: "A personal gift message may be available for eligible products. Check the product page and ordering options to confirm availability.",
    },
    {
      q: "How long does flower delivery take in the USA?",
      a: "Delivery timing varies by destination, order time, flower availability, and the selected delivery option. Review the estimated delivery date shown during checkout before placing your order.",
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
  title: "Flower Bouquets Delivery to USA | Order Bouquets Online | BlossomPot",
  description:
    "Order signature flower bouquets for delivery in the USA. Roses, mixed and seasonal bouquets with a gift message.",
  heading: "Flower Bouquets Delivered to the USA — Made to Impress",
  intro: [
    'Some gifts need a proper "wow" moment when the door opens. A hand-tied bouquet does exactly that. BlossomPot bouquets are chosen for full, generous shapes and fresh colour, so the unboxing feels as special as the occasion.',
    "Whether it is a romantic evening, an office celebration or a surprise for your mum, you can order a bouquet online for delivery in the USA in a few minutes.",
  ],
  sections: [
    {
      heading: "Bouquet Delivery Across the USA",
      paragraphs: [
        "We deliver bouquets to homes and offices across the USA. In select cities, same-day delivery is available if you order before the local cut-off. Type the recipient's address at checkout to see the delivery options and dates available to them.",
      ],
    },
    {
      heading: "Bouquet Styles to Choose From",
      paragraphs: [],
      items: [
        bullet("Rose bouquets, from a dozen red roses to grand statement bunches"),
        bullet("Mixed seasonal bouquets for bright, colourful celebrations"),
        bullet("Sunflower and yellow bouquets for happy, sunny moods"),
        bullet("White and blush bouquets for refined, quiet occasions"),
        bullet("Flower and wine or cake combos for bigger milestones"),
      ],
    },
    {
      heading: "Bouquet Gifting Tips",
      paragraphs: [
        "Keep the message short and warm. One honest sentence usually lands better than a long poem. For big milestones, pair the bouquet with a cake or a gift hamper so the surprise feels complete.",
        "Pick the colour to match the mood: red for love, pink for affection, yellow for cheer, white for calm and respect.",
      ],
    },
    {
      heading: "Why Order Bouquets from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Signature bouquets, cakes and hampers on one site"),
        bullet("Delivery windows shown clearly before payment"),
        bullet("Gift message on most products"),
        bullet("Secure checkout with Stripe (USD) and Razorpay (INR)"),
        bullet("Quick help on WhatsApp and email"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Bouquets to USA",
  faqs: [
    {
      q: "Can I send a bouquet to the USA from India or another country?",
      a: "Yes. Add the USA delivery address at checkout and pay in USD (Stripe) or INR (Razorpay).",
    },
    {
      q: "What is the difference between a bouquet and a flower arrangement?",
      a: "A bouquet is a hand-tied bunch of flowers, ready to be placed in a vase. An arrangement is styled in a container such as a basket or box and needs no extra work.",
    },
    {
      q: "Can I get a bouquet delivered on the same day?",
      a: "In select cities, yes, provided you place the order before the local cut-off. The checkout page shows what is available for the address you enter.",
    },
    {
      q: "Can I add a message to my bouquet order?",
      a: "Yes. Most bouquets support a personal gift message and a preferred delivery date.",
    },
    {
      q: "Which bouquet is best for a first anniversary or a first date?",
      a: "A classic red rose bouquet feels romantic without being over the top. For a first date or a new relationship, a smaller dozen-rose bouquet is a safe and sweet choice.",
    },
    {
      q: "Can I combine a bouquet with a cake or a gift?",
      a: "Yes. Browse our flower and wine combos, or add a cake or hamper to the same order for a complete surprise.",
    },
  ],
});

const usaCakes = usaCategoryArticle("cakes", {
  title: "Order Cakes Online USA | Birthday & Anniversary Cake Delivery | BlossomPot",
  description:
    "Send cakes to the USA from BlossomPot. Chocolate, cheesecake, brownie and celebration cakes with a personal message.",
  heading: "Order Cakes Online for Delivery in the USA",
  intro: [
    "A cake turns an ordinary afternoon into a celebration. If you cannot be at the party, you can still be part of it by sending a cake to the USA through BlossomPot.",
    "Choose from chocolate cakes, cheesecakes, brownie cakes, tiramisu, cake pops and celebration cakes for birthdays, anniversaries, Valentine's Day and everything in between.",
  ],
  sections: [
    {
      heading: "Cake Delivery Across the USA",
      paragraphs: [
        "We deliver cakes to addresses across the USA. Same-day delivery is available in select cities when you order before the local cut-off. Type in the recipient's address at checkout to see the delivery options available for their location.",
      ],
    },
    {
      heading: "Cake Favourites",
      paragraphs: [],
      items: [
        bullet("Rich chocolate cakes and brownie cakes for serious chocolate lovers"),
        bullet("Cheesecakes in classic and assorted flavours"),
        bullet("Birthday cakes such as strawberry funfetti and tiramisu"),
        bullet("Cake pops and cupcakes for smaller, easy-to-share treats"),
        bullet("Cake and flower combos for a bigger surprise"),
      ],
    },
    {
      heading: "Sweet Moments, Shared from Far Away",
      paragraphs: [
        "Plan a video call, ask the family to gather around the cake and cut it together. Or send one to a friend's office and watch the whole team gather in the kitchen. A cake does not need a big occasion. It just needs someone to think of the person it is for.",
      ],
    },
    {
      heading: "Why Order Cakes from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Cakes, flowers and gift hampers in one order"),
        bullet("Delivery dates shown before you pay"),
        bullet("Gift message on most products"),
        bullet("Secure Stripe (USD) and Razorpay (INR) checkout"),
        bullet("WhatsApp and email support"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Cakes to USA",
  faqs: [
    {
      q: "Can I order a cake online for someone in the USA?",
      a: "Yes. Choose a cake, enter the recipient's USA address at checkout and pay in USD or INR.",
    },
    {
      q: "Do you deliver cakes the same day?",
      a: "Same-day cake delivery is available in select cities when ordered before the local cut-off. Checkout will show if it is available for your recipient.",
    },
    {
      q: "Can I put a message on the cake?",
      a: "Most cakes support a personal gift message, and some designer and personalised options allow a custom note. Check the product page for details.",
    },
    {
      q: "Are eggless or special-diet cakes available?",
      a: "Availability changes by product, so please check the product description or message us on WhatsApp before ordering for anyone with allergies or dietary needs.",
    },
    {
      q: "Can I send a cake with flowers?",
      a: "Yes. We have cake and rose combos, and you can add a bouquet to the same order.",
    },
    {
      q: "What if the recipient is not at home?",
      a: "Add a contact number and delivery notes at checkout so the delivery partner can reach the recipient. If anything goes wrong, contact our support team and we will help.",
    },
  ],
});

const usaBirthdayGifts = usaCategoryArticle("birthday-gifts", {
  title: "Birthday Gifts to USA | Send Birthday Flowers, Cakes & Combos | BlossomPot",
  description:
    "Send birthday gifts to the USA online. Birthday flowers, cakes, hampers and gift sets with a personal message.",
  heading: "Send Birthday Gifts to the USA — Make Their Day Special",
  intro: [
    "Missing a birthday is the worst part of living far away. A well-chosen gift fixes a lot of that. BlossomPot helps you send birthday gifts to the USA that feel thoughtful, look beautiful and arrive in time for the celebration.",
    "Pick from birthday flowers, cakes, hampers, plant gift sets and sweet boxes, all with space for your own message.",
  ],
  sections: [
    {
      heading: "Birthday Gift Delivery in the USA",
      paragraphs: [
        "We deliver birthday gifts across the USA. In select cities, same-day delivery is available if you order before the local cut-off. At checkout, enter the recipient's address and choose the date you want the gift to arrive.",
      ],
    },
    {
      heading: "Birthday Gift Ideas",
      paragraphs: [],
      items: [
        bullet("Birthday flower bouquets for a bright, colourful surprise"),
        bullet("Celebration cakes with a personal note"),
        bullet("Sweet boxes and hampers filled with treats"),
        bullet("Succulent and plant gift sets for people who prefer something that lasts"),
        bullet("Flower and balloon combos for a party feel"),
      ],
    },
    {
      heading: "Make the Birthday Feel Close",
      paragraphs: [
        'The best birthday gifts say "I know you." Think about what they actually enjoy. A chocolate lover will love a brownie cake, a plant person will enjoy a succulent set, and a classic romantic will smile at roses. Add one line in your own words and the gift becomes personal.',
      ],
    },
    {
      heading: "Why Order Birthday Gifts from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Flowers, cakes and gifts in one checkout"),
        bullet("Pick your delivery date at checkout"),
        bullet("Personal gift message on most products"),
        bullet("Secure Stripe (USD) and Razorpay (INR) payment"),
        bullet("WhatsApp and email help"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Birthday Gifts to USA",
  faqs: [
    {
      q: "How do I send a birthday gift to someone in the USA?",
      a: "Choose a gift, enter the recipient's address and preferred date at checkout, add your message and pay. We take care of the delivery.",
    },
    {
      q: "Can I schedule delivery for the exact birthday?",
      a: "Yes. You can set a preferred delivery date at checkout, and we recommend ordering a few days early for the best chance of a date match.",
    },
    {
      q: "What are the best birthday gifts to send abroad?",
      a: "Flowers, cakes and gift hampers are the most popular because they feel festive and are easy to enjoy straight away. Plants and gift sets are great for longer-lasting gifts.",
    },
    {
      q: "Can I send a surprise gift without the recipient knowing?",
      a: "Yes. Just add the recipient's address and a short note with your name. If you want it to stay secret, avoid contacting them about the delivery date.",
    },
    {
      q: "Is same-day birthday gift delivery available?",
      a: "In select cities, yes, for orders placed before the local cut-off time. The checkout page shows the available options.",
    },
    {
      q: "Can I combine flowers, cake and a gift in one order?",
      a: "Yes. You can add several items to your cart and write one gift message for the whole surprise.",
    },
  ],
});

const usaAnniversaryGifts = usaCategoryArticle("anniversary-gifts", {
  title: "Anniversary Gifts to USA | Send Roses, Cakes & Gift Sets | BlossomPot",
  description:
    "Send anniversary gifts to the USA. Romantic roses, anniversary cakes, hampers and gift sets with a personal message.",
  heading: "Anniversary Gifts Delivered to the USA — Celebrate Every Year Together",
  intro: [
    "An anniversary is a quiet kind of milestone. It is not about big gestures, it is about showing that you remember. BlossomPot makes it easy to send anniversary gifts to the USA, whether you are celebrating your own, your parents' or a close friend's.",
    "Choose roses, a chocolate or brownie cake, a gift hamper or a combo of all three, then add a message that sounds like you.",
  ],
  sections: [
    {
      heading: "Anniversary Gift Delivery in the USA",
      paragraphs: [
        "We deliver anniversary gifts to addresses across the USA. Same-day delivery is available in select cities when you order before the local cut-off. At checkout, enter the recipient's address and pick the date you want the gift to arrive.",
      ],
    },
    {
      heading: "Anniversary Gift Ideas",
      paragraphs: [],
      items: [
        bullet("Red roses and rose bouquets for timeless romance"),
        bullet("Anniversary cakes, such as cookies and cream brownie cake and triple chocolate brownie cake"),
        bullet("Flower and wine combos for a toast across the miles"),
        bullet("Gift hampers with sweets, treats and small extras"),
        bullet("Cake and rose combos for a full surprise"),
      ],
    },
    {
      heading: 'Gifts That Say More Than "Happy Anniversary"',
      paragraphs: [
        "The card matters as much as the gift. Mention a real memory, such as the first trip you took or the small joke only the two of you understand. For parents' anniversaries, a bouquet plus a cake makes the whole family feel included, even from far away.",
      ],
    },
    {
      heading: "Why Order Anniversary Gifts from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Roses, cakes and hampers on one site"),
        bullet("Choose your own delivery date"),
        bullet("Personal gift message on most products"),
        bullet("Secure payment with Stripe (USD) or Razorpay (INR)"),
        bullet("Help from our team on WhatsApp and email"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Anniversary Gifts to USA",
  faqs: [
    {
      q: "What is the best anniversary gift to send to the USA?",
      a: "Roses and a cake are the most popular combination. If you want something different, a flower and wine combo or a hamper makes a thoughtful choice.",
    },
    {
      q: "Can I schedule the gift for the exact anniversary date?",
      a: "Yes. Choose your preferred delivery date at checkout. We suggest ordering a few days ahead to keep the date safe.",
    },
    {
      q: "Can I send anniversary gifts to my parents in the USA?",
      a: "Yes. Enter their address at checkout, add a warm message and choose a bouquet, cake or hamper. Many customers send a flower and cake pair.",
    },
    {
      q: "Do you offer same-day anniversary gift delivery?",
      a: "Same-day delivery is available in select cities for orders placed before the local cut-off. Checkout will show if it is available for the address.",
    },
    {
      q: "Can I add a handwritten-style message?",
      a: "Most products support a personal gift message, so you can add your own words to the card.",
    },
    {
      q: "I need help choosing a gift. Who can I ask?",
      a: "Message us on WhatsApp or email support@blossompot.com. We will help you choose a gift and confirm the delivery details.",
    },
  ],
});

const usaValentinesGifts = usaCategoryArticle("valentines-day-gifts", {
  title: "Valentine's Day Gifts to USA | Romantic Flowers & Gift Sets | BlossomPot",
  description:
    "Send Valentine's Day gifts to the USA online. Romantic gift sets, personalised gifts and flowers with a love note.",
  heading: "Valentine's Day Gifts for the USA — Say It with Something Special",
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
  title: "Gift Hampers to USA | Gift Baskets & Curated Boxes | BlossomPot",
  description:
    "Send gift hampers to the USA. Curated gift baskets with treats, snacks, spa sets and more. Gift message included.",
  heading: "Gift Hampers Delivered to the USA — One Box, Many Reasons to Smile",
  intro: [
    "Can't decide what to send? A hamper solves that. Instead of one gift, it brings a whole collection of treats, snacks and small luxuries in a single box that looks great on arrival.",
    'BlossomPot gift hampers are curated for birthdays, thank-yous, housewarmings, festive seasons and quiet "thinking of you" moments. Add flowers or a cake to make it even bigger.',
  ],
  sections: [
    {
      heading: "Gift Hamper Delivery in the USA",
      paragraphs: [
        "We deliver hampers across the USA. Same-day delivery is available in select cities when you order before the local cut-off. Enter the recipient's address at checkout to see what is available, and add a gift message to make it personal.",
      ],
    },
    {
      heading: "What You Can Find in Our Hampers",
      paragraphs: [],
      items: [
        bullet("Gourmet snack baskets and chocolate treats"),
        bullet("Spa and self-care baskets for a relaxing day off"),
        bullet("Wine, beer and celebration hampers for adults"),
        bullet("Birthday gift baskets and festive hampers"),
        bullet("Fragrance and chocolate sets for men and women"),
      ],
      paragraphsAfter: ["Please check the product page for exact contents before you order."],
    },
    {
      heading: "When a Hamper Is the Perfect Choice",
      paragraphs: [
        "Hampers shine when you want variety in one box. They are great for thanking a colleague, welcoming a new neighbour, celebrating a promotion or sending a warm message to someone who is unwell. For teams and clients, hampers make a polished, corporate-friendly gesture.",
      ],
    },
    {
      heading: "Why Order Hampers from BlossomPot",
      paragraphs: [],
      items: [
        bullet("Hampers, flowers and cakes in one order"),
        bullet("Delivery windows shown clearly at checkout"),
        bullet("Gift message on most products"),
        bullet("Secure Stripe (USD) and Razorpay (INR) payment"),
        bullet("WhatsApp and email support"),
      ],
    },
  ],
  faqHeading: "Frequently Asked Questions — Gift Hampers to USA",
  faqs: [
    {
      q: "Can I send a gift hamper to the USA from another country?",
      a: "Yes. Enter the USA address at checkout and pay in USD with Stripe or in INR with Razorpay.",
    },
    {
      q: "What is the difference between a gift hamper and a gift basket?",
      a: "The two terms are often used for the same thing: a curated collection of gifts in one package. Hampers are usually boxed or crated, while baskets are woven.",
    },
    {
      q: "Are wine and beer hampers available?",
      a: "Yes, we have wine and beer hampers. Please check the product details and make sure the recipient is of legal drinking age.",
    },
    {
      q: "Can I send a hamper to an office or a client?",
      a: "Yes. Enter the business address and a contact number, and add a professional message at checkout.",
    },
    {
      q: "Can I add flowers or a cake to my hamper order?",
      a: "Yes. Add a bouquet or cake to your cart, and write one gift message for the whole surprise.",
    },
    {
      q: "How do I know what is inside a hamper?",
      a: "Each product page lists the contents. If you need help, message us on WhatsApp and we will guide you.",
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
