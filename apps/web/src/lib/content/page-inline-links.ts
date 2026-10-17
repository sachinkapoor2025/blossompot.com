import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";

/** Homepage SEO inline links for BlossomPot gifting copy. */
export const homepageInlineLinks = [
  { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
  { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
  { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "bouquets", href: categoryHref("flower-bouquets") },
] as const;

export const categoryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  flowers: [
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
  ],
  "flower-bouquets": [
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "hamper", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  cakes: [
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "birthday-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
  ],
  "anniversary-gifts": [
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "valentines-day-gifts": [
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
  ],
  "mothers-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "plants", href: categoryHref("plants") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
  ],
  "wedding-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "celebration cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "personalized-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
  ],
  "gift-hampers": [
    { phrase: "corporate-friendly", href: "/corporate-gifting" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  plants: [
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift", href: categoryHref("personalized-gifts") },
  ],
  "same-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "celebration-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
  ],
};

/** Place names in country landing copy. Product phrases are already buttons on those pages. */
export const countryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  usa: [
    { phrase: "California", href: locationPublicPath("california") },
    { phrase: "New York", href: locationPublicPath("new-york") },
    { phrase: "Florida", href: locationPublicPath("florida") },
  ],
  uk: [
    { phrase: "London", href: "/locations/europe/united-kingdom/london" },
    { phrase: "Manchester", href: "/locations/europe/united-kingdom/manchester" },
    { phrase: "United Kingdom", href: "/locations/europe/united-kingdom" },
  ],
  canada: [
    { phrase: "Vancouver", href: "/locations/canada/british-columbia/vancouver" },
    { phrase: "Montreal", href: "/locations/canada/quebec/montreal" },
    { phrase: "Toronto", href: "/locations/canada/ontario/toronto" },
  ],
  australia: [
    { phrase: "Melbourne", href: "/locations/australia/victoria/melbourne" },
    { phrase: "Brisbane", href: "/locations/australia/queensland/brisbane" },
    { phrase: "Sydney", href: "/locations/australia/new-south-wales/sydney" },
  ],
  uae: [
    { phrase: "rose bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "Celebration gifts", href: categoryHref("celebration-gifts") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
  ],
};

export const marketingPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  about: [
    { phrase: "fresh flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "contact page", href: "/contact" },
  ],
  shipping: [
    { phrase: "delivery location page", href: "/delivery-locations" },
    { phrase: "country guides", href: "/locations" },
    { phrase: "United States", href: "/flower-delivery-usa" },
  ],
  faq: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "Shipping", href: "/shipping" },
  ],
  locations: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
  ],
  corporate: [
    { phrase: "celebration moments", href: categoryHref("celebration-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "press kit", href: "/press" },
  ],
  privacy: [
    { phrase: "contact us", href: "/contact" },
    { phrase: "shipping", href: "/shipping" },
    { phrase: "shop", href: "/products" },
  ],
  press: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  editorial: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "gifts", href: "/gifts" },
  ],
  returns: [
    { phrase: "fresh flowers", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  vendor: [
    { phrase: "Flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
  ],
  blog: [
    { phrase: "Flower Knowledge Centre", href: "/flower-guide" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  remember: [
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  occasions: [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  gifts: [
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  reviews: [
    { phrase: "delivery", href: "/shipping" },
    { phrase: "gift", href: "/gifts" },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  contact: [{ phrase: "delivery", href: "/shipping" }],
  "forgot-occasion": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "combos", href: "/combos" },
  ],
};

/** Keyword links inside approved country SEO articles. Existing buttons are blocked separately. */
export const seoArticleInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  home: [
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  ],
  flowers: [
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  ],
  "delivery-locations": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "gifts", href: "/gifts" },
  ],
  bouquets: [
    { phrase: "bouquet", href: categoryHref("flowers") },
    { phrase: "roses", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  cakes: [
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
  ],
  "birthday-gifts": [
    { phrase: "birthday flowers", href: categoryHref("flowers") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "anniversary-gifts": [
    { phrase: "gift hamper", href: categoryHref("gift-hampers") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  "valentines-day-gifts": [
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  hampers: [
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  combos: [
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
};

export const cityPageInlineLinks = [
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "cakes", href: categoryHref("cakes") },
  { phrase: "hampers", href: categoryHref("gift-hampers") },
] as const;

export const statePageInlineLinks = cityPageInlineLinks;

export const blogPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  "how-to-keep-flowers-fresh-longer": [
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "flower care", href: "/flower-guide/flower-care" },
    { phrase: "flower meanings", href: "/flower-guide/flower-meanings" },
  ],
  "rose-color-meanings-for-gifting": [
    { phrase: "rose", href: "/flower-guide/rose" },
    { phrase: "flower meanings", href: "/flower-guide/flower-meanings" },
    { phrase: "red roses", href: categoryHref("flower-bouquets") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
  ],
  "what-to-write-in-a-gift-message": [
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "luxury-flower-bouquet-delivery": [
    { phrase: "flower bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "same-day", href: categoryHref("flowers") },
  ],
  "anniversary-flowers-and-cake-combo": [
    { phrase: "anniversary flowers", href: categoryHref("anniversary-gifts") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "same-day", href: categoryHref("flowers") },
  ],
  "online-cake-delivery-usa": [
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "same-day", href: categoryHref("flowers") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "send-flowers-online-usa": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "USA", href: "/flower-delivery-usa" },
    { phrase: "same-day", href: categoryHref("flowers") },
  ],
  "birthday-flowers-delivery": [
    { phrase: "birthday flowers", href: categoryHref("birthday-gifts") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "gift-hampers-delivery-usa": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "corporate", href: "/corporate-gifting" },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "personalized-gift-boxes-online": [
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
  ],
  "flowers-and-cake-delivery-same-day": [
    { phrase: "same-day", href: categoryHref("flowers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "same-day-flower-delivery-near-me": [
    { phrase: "same-day flower delivery", href: categoryHref("flowers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "city page", href: "/delivery-locations" },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "flower-delivery-usa": [
    { phrase: "USA flower delivery", href: "/flower-delivery-usa" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "same-day", href: categoryHref("flowers") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "anniversary-gift-ideas-for-her-him": [
    { phrase: "anniversary gifts", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "best-cakes-for-birthday-parties": [
    { phrase: "birthday cake", href: categoryHref("cakes") },
    { phrase: "Flowers", href: categoryHref("flowers") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
  ],
  "mothers-day-flower-delivery-online": [
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "plants", href: categoryHref("plants") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  ],
  "how-to-choose-a-gift-hamper-for-someone": [
    { phrase: "gift hamper", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "corporate", href: "/corporate-gifting" },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "anniversary-gifts-for-usa-delivery": [
    { phrase: "anniversary gifts", href: categoryHref("anniversary-gifts") },
    { phrase: "USA delivery", href: "/flower-delivery-usa" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "flower-meanings-by-color-guide": [
    { phrase: "flower meanings", href: "/flower-guide/flower-meanings" },
    { phrase: "flowers by colour", href: "/flower-guide/flowers-by-colour" },
    { phrase: "rose", href: "/flower-guide/rose" },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "last-minute-gift-ideas-usa": [
    { phrase: "same-day", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "nationwide-flower-delivery-usa": [
    { phrase: "nationwide flower delivery", href: "/flower-delivery-usa" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "best-flowers-to-send-for-birthday": [
    { phrase: "birthday flowers", href: categoryHref("birthday-gifts") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "valentines-day-flowers-delivery": [
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "same-day", href: categoryHref("flowers") },
  ],
};
