import { categoryHref } from "./category-urls";
import { editorialCdnUrl } from "./editorial-cdn";

const BLOCKED_SUPPORT_PHONE_DIGITS = new Set(["16692603819", "6692603819"]);

function isBlockedSupportPhone(digits: string): boolean {
  const compact = digits.replace(/\D/g, "");
  if (!compact) return false;
  return BLOCKED_SUPPORT_PHONE_DIGITS.has(compact) || BLOCKED_SUPPORT_PHONE_DIGITS.has(compact.replace(/^1/, ""));
}

const DEFAULT_SUPPORT_PHONE_DISPLAY = "+91 92664 67887";
const DEFAULT_SUPPORT_PHONE_DIGITS = "919266467887";

/**
 * Customer WhatsApp / support phone. Defaults to +91 92664 67887.
 * The former +1 (669) 260-3819 number is never shown or used in wa.me links.
 */
const RAW_SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || DEFAULT_SUPPORT_PHONE_DISPLAY;
const SUPPORT_PHONE_DIGITS_RAW = RAW_SUPPORT_PHONE.replace(/\D/g, "");
const SUPPORT_PHONE_BLOCKED = isBlockedSupportPhone(SUPPORT_PHONE_DIGITS_RAW);
const SUPPORT_PHONE_DISPLAY = SUPPORT_PHONE_BLOCKED
  ? DEFAULT_SUPPORT_PHONE_DISPLAY
  : RAW_SUPPORT_PHONE;
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE_BLOCKED
  ? DEFAULT_SUPPORT_PHONE_DIGITS
  : SUPPORT_PHONE_DIGITS_RAW || DEFAULT_SUPPORT_PHONE_DIGITS;

if (
  process.env.NODE_ENV === "production" &&
  SUPPORT_PHONE_DIGITS &&
  /55501\d{2}$/.test(SUPPORT_PHONE_DIGITS)
) {
  throw new Error(
    "NEXT_PUBLIC_SUPPORT_PHONE must be set to a real phone number (555 placeholders are not allowed)."
  );
}

export const site = {
  name: "BlossomPot",
  domain: "blossompot.com",
  legalName: "Divit Global Ventures",
  foundingDate: "2024",
  tagline: "Flowers ♥ Cakes ♥ Gifts — Delivering Smiles",
  description:
    "BlossomPot.com — premium online gifting for flowers, bouquets, cakes, and curated gifts with worldwide delivery. Elegant designs for birthdays, anniversaries, Valentine's Day, Mother's Day, and more.",
  supportEmail: "support@blossompot.com",
  phone: SUPPORT_PHONE_DISPLAY,
  whatsapp: SUPPORT_PHONE_DIGITS,
  whatsappDisplay: SUPPORT_PHONE_DISPLAY,
  whatsappGroupInviteUrl: "",
  logoSrc: "/logo.png",
  /** Square B+flowerpot mark for favicons / app icons (no wordmark, no taglines). */
  logoMarkSrc: "/icon-512.png",
  /** Full B+Blossompot logo on white — Open Graph / social share (1200×630). */
  logoPngSrc: "/logo-og.png",
  primaryColor: "#C23A6B",
  navBlue: "#E07A9A",
  accentColor: "#1A3D34",
} as const;

/** Featured gift collections in the header mega-menu style. */
export const giftSetsMenu = {
  label: "Gift Collections",
  items: [
    { label: "Flowers", href: categoryHref("flowers"), category: "flowers" },
    { label: "Flower Bouquets", href: categoryHref("flower-bouquets"), category: "flower-bouquets" },
    { label: "Cakes", href: categoryHref("cakes"), category: "cakes" },
    { label: "Gift Hampers", href: categoryHref("gift-hampers"), category: "gift-hampers" },
    { label: "Gift Catalog", href: "/gift-catalog" },
  ],
} as const;

/** @deprecated Use giftSetsMenu — kept for transitional imports. */

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Flowers", href: categoryHref("flowers"), category: "flowers" },
  { label: "Bouquets", href: categoryHref("flower-bouquets"), category: "flower-bouquets" },
  { label: "Cakes", href: categoryHref("cakes"), category: "cakes" },
  { label: "Birthday", href: categoryHref("birthday-gifts"), category: "birthday-gifts" },
  { label: "Anniversary", href: categoryHref("anniversary-gifts"), category: "anniversary-gifts" },
  { label: "Valentine's", href: categoryHref("valentines-day-gifts"), category: "valentines-day-gifts" },
  { label: "Hampers", href: categoryHref("gift-hampers"), category: "gift-hampers" },
  { label: "Gift Catalog", href: "/gift-catalog" },
  { label: "Remember", href: "/remember" },
] as const;

export type CityNavLink = {
  label: string;
  slug: string;
  href?: string;
  menuLabel?: string;
};

export const cityLinks: readonly CityNavLink[] = [
  { label: "California", slug: "california" },
  { label: "New York", slug: "new-york" },
  { label: "Texas", slug: "texas" },
  { label: "Florida", slug: "florida" },
  { label: "New Jersey", slug: "new-jersey" },
  { label: "Los Angeles", slug: "los-angeles" },
  { label: "San Francisco", slug: "san-francisco" },
  { label: "Chicago", slug: "chicago" },
  { label: "Houston", slug: "houston" },
  { label: "Dallas", slug: "dallas" },
  { label: "Austin", slug: "austin" },
  { label: "Atlanta", slug: "atlanta" },
  { label: "Seattle", slug: "seattle" },
  { label: "Miami", slug: "miami" },
  { label: "Boston", slug: "boston" },
  { label: "Denver", slug: "denver" },
];

export function cityNavHref(link: CityNavLink): string {
  return link.href ?? `/gifts-to-${link.slug}`;
}

export function cityNavMenuLabel(link: CityNavLink): string {
  return link.menuLabel ?? `Gifts to ${link.label}`;
}

export function isUsCityNavLink(link: CityNavLink): boolean {
  return !link.href;
}

export const usCityLinks = cityLinks.filter(isUsCityNavLink);

/** Country flower-delivery landing pages in the header Countries menu. */
export const countriesMenu = {
  label: "Countries",
  items: [
    { label: "Flower Delivery in USA", href: "/flower-delivery-usa", slug: "usa" },
    { label: "Flower Delivery in UK", href: "/flower-delivery-uk", slug: "uk" },
    { label: "Flower Delivery in Canada", href: "/flower-delivery-canada", slug: "canada" },
    { label: "Flower Delivery in Australia", href: "/flower-delivery-australia", slug: "australia" },
    { label: "Flower Delivery in UAE", href: "/flower-delivery-uae", slug: "uae" },
  ],
} as const;

export const homeBanners = [
  {
    src: "/banners/home-banner-birthday.jpg",
    alt: "Birthday gifts from blossompot.com — flowers, cakes, plushies and more",
    href: "/birthday-gifts",
    layout: "full" as const,
    imageFit: "contain" as const,
    eyebrow: "BLOSSOMPOT.COM",
    title: "Make birthdays",
    titleAccent: "extra special",
    description: "Flowers, cakes, gifts, plushies and more to celebrate every smile.",
    cta: "Shop Birthday Gifts",
    pill: "Thoughtful gifts · Fresh flowers · Delicious cakes",
  },
  {
    src: "/banners/home-banner-gourmet.jpg",
    alt: "Gourmet gifts from blossompot.com — chocolates, cookies, and premium baskets",
    href: "/gift-hampers",
    layout: "full" as const,
    imageFit: "contain" as const,
    eyebrow: "BLOSSOMPOT.COM",
    title: "Sweeten every occasion with",
    titleAccent: "gourmet gifts",
    description: "Chocolates, cookies, premium baskets and more for your loved ones.",
    cta: "Shop Gourmet Gifts",
    pill: "Premium selection · Irresistible flavors · Thoughtful delivery",
  },
  {
    src: "/banners/home-banner-flowers.jpg",
    alt: "Fresh flowers from blossompot.com — roses, mixed bouquets, and worldwide delivery",
    href: "/flowers",
    layout: "full" as const,
    imageFit: "contain" as const,
    eyebrow: "BLOSSOMPOT.COM",
    title: "Express your feelings with",
    titleAccent: "fresh flowers",
    description: "Roses, mixed bouquets, sunflowers and more for every occasion.",
    cta: "Shop Flowers",
    pill: "Premium quality · Worldwide delivery · Freshness guaranteed",
  },
] as const;

export const homeCategoryOrder = [
  "flowers",
  "flower-bouquets",
  "cakes",
  "birthday-gifts",
  "anniversary-gifts",
  "gift-hampers",
  "personalized-gifts",
] as const;

export const setSizeCategoryOrder = [] as const;

/** All public storefront category slugs (SEO routes + homepage sections). */
export const categoryOrder = [
  ...homeCategoryOrder,
  "valentines-day-gifts",
  "mothers-day-gifts",
  "wedding-gifts",
  "plants",
  "celebration-gifts",
] as const;

export function orderCategories<T extends { slug: string }>(categories: readonly T[]): T[] {
  const rank = new Map<string, number>(homeCategoryOrder.map((slug, index) => [slug, index]));
  return [...categories].sort((a, b) => (rank.get(a.slug) ?? 99) - (rank.get(b.slug) ?? 99));
}

/** Visible WhatsApp CTA text. Never prints the retired +1 (669) 260-3819 number. */
export function whatsappLinkLabel(fallback = "Chat on WhatsApp"): string {
  const display = site.whatsappDisplay.trim();
  return display || fallback;
}

export function whatsappChatUrl(message = "Hi BlossomPot, I need help with a gift order."): string {
  const digits = (site.whatsapp.replace(/\D/g, "") || DEFAULT_SUPPORT_PHONE_DIGITS).replace(/^0+/, "");
  const text = message.trim() || "Hi BlossomPot, I need help with a gift order.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const testimonials = [
  {
    name: "Emily",
    country: "USA",
    city: "New York",
    rating: 5,
    timeAgo: "3 days ago",
    image: editorialCdnUrl("testimonial-emily.jpg"),
    text: "I sent an anniversary bouquet to my sister in New York. The roses arrived fresh, beautifully arranged, and she said they looked just like the photos. BlossomPot made the gift feel effortless.",
  },
  {
    name: "Sarah",
    country: "UK",
    city: "London",
    rating: 5,
    timeAgo: "1 week ago",
    image: editorialCdnUrl("testimonial-sarah.jpg"),
    text: "I sent a birthday bouquet to my mum in London from abroad. It arrived on the day we chose, looked lovely, and the handwritten card made her morning. Delivery was smooth the whole way.",
  },
  {
    name: "Priya",
    country: "UAE",
    city: "Dubai",
    rating: 5,
    timeAgo: "2 weeks ago",
    image: editorialCdnUrl("testimonial-priya.jpg"),
    text: "I ordered flowers and a small cake for my wife in Dubai. Everything arrived beautifully presented on her birthday, and the gift looked as elegant as the photos. She was thrilled.",
  },
  {
    name: "Jessica",
    country: "Canada",
    city: "Toronto",
    rating: 5,
    timeAgo: "3 weeks ago",
    image: editorialCdnUrl("testimonial-jessica.jpg"),
    text: "I sent a bouquet to my friend in Toronto for her new home. The flowers were fresh and elegant, carefully packed, and looked just like the listing. It made the house feel welcoming.",
  },
  {
    name: "Amanda",
    country: "Australia",
    city: "Sydney",
    rating: 5,
    timeAgo: "1 month ago",
    image: editorialCdnUrl("testimonial-amanda.jpg"),
    text: "I ordered a surprise flower hamper for my sister in Sydney. It arrived beautifully packed on the date we picked, and she loved the mix of blooms. I'll order again for her birthday.",
  },
] as const;

export const faqs = [
  {
    q: "What does BlossomPot deliver?",
    a: "Flowers, bouquets, cakes, gift hampers, personalized gifts, plants, and occasion collections for birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and more — with worldwide delivery.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery windows depend on the product and the recipient address. Estimated timing is shown on the product page and at checkout after you choose the delivery country.",
  },
  {
    q: "Can I add a gift message?",
    a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
  },
  {
    q: "Where does BlossomPot deliver?",
    a: "We deliver gifts worldwide. Enter the recipient address at checkout to see available delivery windows for that country.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Secure checkout via Stripe (USD cards) and Razorpay (INR — UPI, cards, netbanking) where enabled.",
  },
  {
    q: "Can I track my order?",
    a: "Yes. After purchase you receive order confirmation and can track status from your account or order page.",
  },
  {
    q: "What is BlossomPot's delivery charge?",
    a: "Shipping costs depend on the product, the delivery place and the delivery method you choose. Any delivery fees that apply will be shown at checkout before you place your order.",
  },
  {
    q: "Can I choose a delivery date for my gift?",
    a: "Yes. Select your preferred delivery date at checkout where available. Delivery dates and timeslots are subject to change based on product and recipient location.",
  },
  {
    q: "Can I change or cancel my order once it is placed?",
    a: "If your order has not been processed or prepared for delivery, you may be able to modify or cancel it. Please contact our support team right away with your order information.",
  },
  {
    q: "What if the recipient is not there at the time of delivery?",
    a: "If the recipient is not available, the delivery partner may follow the available delivery instructions or attempt delivery again. For assistance with a specific order, please contact our support team.",
  },
  {
    q: "What if my gift is received damaged or with a problem?",
    a: "Please contact BlossomPot support immediately if your order arrives damaged or if there is an issue with the product. Providing your order information and photos of the product and packaging can assist us in investigating and resolving the matter.",
  },
  {
    q: "How fresh are flowers from BlossomPot?",
    a: "Our goal is to provide fresh flowers and arrangements that are carefully prepared. The flowers are seasonal and naturally unique so exact varieties, colours or appearance may differ from time to time based on local availability.",
  },
  {
    q: "Can I send a gift worldwide?",
    a: "Yes. BlossomPot delivers gifts worldwide. Choose the recipient country at checkout — availability and estimated delivery times vary by location.",
  },
  {
    q: "Can I order flowers, cakes and other gifts in same order?",
    a: "Yes. You can browse through flowers, cakes, gift hampers, personalized gifts, plants and other products on BlossomPot. The products available and the delivery options may differ depending on the items you select.",
  },
  {
    q: "How can I contact BlossomPot if I need help with my order?",
    a: "If you need any help with an order, delivery or any other question please contact the BlossomPot support team via the email or WhatsApp support options on our website.",
  },
] as const;
