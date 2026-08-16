import { categoryHref } from "./category-urls";
import { editorialCdnUrl } from "./editorial-cdn";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Real support phone — set NEXT_PUBLIC_SUPPORT_PHONE in Amplify / .env.
 * Default is the live DGV US line used by sibling brand HalloweenReady (same operator).
 * Build fails in production if this resolves to a fictional 555 number.
 */
const SUPPORT_PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "+1 (669) 260-3819";
const SUPPORT_PHONE_DIGITS = digitsOnly(SUPPORT_PHONE_DISPLAY);

if (
  process.env.NODE_ENV === "production" &&
  (!SUPPORT_PHONE_DIGITS || /55501\d{2}$/.test(SUPPORT_PHONE_DIGITS))
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
    "BlossomPot.com — premium online gifting for flowers, bouquets, cakes, and curated gifts with fast USA delivery. Same-day options in select cities, elegant designs for birthdays, anniversaries, Valentine's Day, Mother's Day, and more.",
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
  { label: "Same-Day", href: categoryHref("same-day-gifts"), category: "same-day-gifts" },
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

export const homeBanners = [
  {
    src: editorialCdnUrl("home-banner-flowers.jpg"),
    alt: "Premium flower bouquets for USA delivery — BlossomPot",
    href: "/flowers",
    eyebrow: "BLOSSOMPOT · USA GIFTING",
    title: "Send flowers that feel like",
    titleAccent: "a celebration",
    description:
      "Hand-arranged bouquets, cakes, and curated gifts with fast delivery across America.",
    cta: "Shop Flowers",
    pill: "Same-day options · Premium quality · Trusted gifting",
  },
  {
    src: editorialCdnUrl("home-banner-cakes.jpg"),
    alt: "Celebration cakes delivered across the USA — BlossomPot",
    href: "/cakes",
    eyebrow: "CAKES FOR EVERY OCCASION",
    title: "Celebrate with cakes made to",
    titleAccent: "impress",
    description: "Chocolate, red velvet, designer birthday cakes — order online for USA delivery.",
    cta: "Shop Cakes",
    pill: "Birthday · Anniversary · Custom messages",
  },
  {
    src: editorialCdnUrl("home-banner-hampers.jpg"),
    alt: "Luxury gift hampers — BlossomPot",
    href: "/gift-hampers",
    eyebrow: "CURATED GIFT HAMPERS",
    title: "Thoughtful gifts, beautifully",
    titleAccent: "packaged",
    description: "Hampers, personalized boxes, and flower-and-chocolate combos for every bond.",
    cta: "Explore Hampers",
    pill: "Anniversary · Birthday · Thank you",
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
  "same-day-gifts",
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

export function whatsappChatUrl(message = "Hi BlossomPot, I need help with a gift order."): string {
  const groupUrl = site.whatsappGroupInviteUrl?.trim();
  if (groupUrl) return groupUrl;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const testimonials = [
  {
    name: "Emily",
    rating: 5,
    timeAgo: "3 days ago",
    image: editorialCdnUrl("testimonial-emily.jpg"),
    text: "I ordered a rose bouquet for my mom in Texas. It arrived fresh, beautifully wrapped, and she called me in tears — in the best way. BlossomPot made Mother's Day effortless.",
  },
  {
    name: "Sarah",
    rating: 5,
    timeAgo: "1 week ago",
    image: editorialCdnUrl("testimonial-sarah.jpg"),
    text: "The anniversary hamper and cake combo for my husband in New York was perfect. Fast delivery, elegant packaging, and the quality matched the photos.",
  },
  {
    name: "Priya",
    rating: 5,
    timeAgo: "2 weeks ago",
    image: editorialCdnUrl("testimonial-priya.jpg"),
    text: "Ordered same-day flowers for a friend in California. Checkout was smooth, tracking was clear, and the bouquet looked premium. Will order again for birthdays.",
  },
  {
    name: "Jessica",
    rating: 5,
    timeAgo: "3 weeks ago",
    image: editorialCdnUrl("testimonial-jessica.jpg"),
    text: "BlossomPot feels like a real gifting marketplace — great selection of cakes, bouquets, and hampers. Support answered my delivery questions quickly.",
  },
] as const;

export const faqs = [
  {
    q: "What does BlossomPot deliver?",
    a: "Flowers, bouquets, cakes, gift hampers, personalized gifts, plants, and occasion collections for birthdays, anniversaries, Valentine's Day, Mother's Day, weddings, and more — with USA delivery.",
  },
  {
    q: "Do you offer same-day delivery?",
    a: "Same-day gift options are available in select US cities when you order before the local cut-off. Look for the Same-Day collection or filter on product pages.",
  },
  {
    q: "Can I add a gift message?",
    a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
  },
  {
    q: "Where does BlossomPot deliver?",
    a: "We deliver gifts across the United States. Enter the recipient address at checkout to see available delivery windows.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Secure checkout via Stripe (USD cards) and Razorpay (INR — UPI, cards, netbanking) where enabled.",
  },
  {
    q: "Can I track my order?",
    a: "Yes. After purchase you receive order confirmation and can track status from your account or order page.",
  },
] as const;
