import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";

/** Homepage SEO inline links for BlossomPot gifting copy. */
export const homepageInlineLinks = [
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "cakes", href: categoryHref("cakes") },
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "same-day", href: categoryHref("same-day-gifts") },
  { phrase: "United States", href: "/flower-delivery-usa" },
] as const;

export const categoryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  flowers: [
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "anniversary gifts", href: categoryHref("anniversary-gifts") },
    { phrase: "flower guide", href: "/flower-guide" },
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
  ],
  "flower-bouquets": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "hamper", href: categoryHref("gift-hampers") },
  ],
  cakes: [
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "birthday-gifts": [
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "anniversary-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "valentines-day-gifts": [
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "romantic", href: categoryHref("anniversary-gifts") },
  ],
  "mothers-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "plants", href: categoryHref("plants") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
  ],
  "wedding-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "florals", href: categoryHref("flowers") },
    { phrase: "celebration cakes", href: categoryHref("cakes") },
  ],
  "personalized-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
  ],
  "gift-hampers": [
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "corporate-friendly", href: "/corporate-gifting" },
  ],
  plants: [
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "thank-yous", href: categoryHref("celebration-gifts") },
    { phrase: "gift", href: categoryHref("personalized-gifts") },
  ],
  "same-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "delivery-locations", href: "/delivery-locations" },
  ],
  "celebration-gifts": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
  ],
};

export const countryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  usa: [
    { phrase: "same-day windows", href: categoryHref("same-day-gifts") },
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "California", href: locationPublicPath("california") },
  ],
  uk: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "London", href: "/locations/europe/united-kingdom/london" },
    { phrase: "New York", href: locationPublicPath("new-york") },
  ],
  canada: [
    { phrase: "mixed flowers", href: categoryHref("flowers") },
    { phrase: "rose bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "Ontario", href: "/locations/canada/ontario" },
    { phrase: "California", href: locationPublicPath("california") },
  ],
  australia: [
    { phrase: "mixed bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "Mother’s Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "New South Wales", href: "/locations/australia/new-south-wales" },
    { phrase: "Hawaii", href: locationPublicPath("hawaii") },
  ],
  uae: [
    { phrase: "rose bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "celebration gifts", href: categoryHref("celebration-gifts") },
    { phrase: "New York", href: locationPublicPath("new-york") },
    { phrase: "Florida", href: locationPublicPath("florida") },
  ],
};

export const marketingPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  about: [
    { phrase: "fresh flowers", href: categoryHref("flowers") },
    { phrase: "stylish bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "United States", href: "/flower-delivery-usa" },
  ],
  shipping: [
    { phrase: "same-day gift options", href: categoryHref("same-day-gifts") },
    { phrase: "delivery location page", href: "/delivery-locations" },
    { phrase: "country guides", href: "/locations" },
    { phrase: "contact us", href: "/contact" },
  ],
  faq: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "shipping", href: "/shipping" },
    { phrase: "blog", href: "/blog" },
    { phrase: "contact", href: "/contact" },
  ],
  locations: [
    { phrase: "United States", href: "/flower-delivery-usa" },
    { phrase: "Canada", href: "/flower-delivery-canada" },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  corporate: [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "celebration moments", href: categoryHref("celebration-gifts") },
    { phrase: "press kit", href: "/press" },
  ],
};

export const cityPageInlineLinks = [
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "cakes", href: categoryHref("cakes") },
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "same-day", href: categoryHref("same-day-gifts") },
] as const;

export const statePageInlineLinks = [
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "cakes", href: categoryHref("cakes") },
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "delivery-locations", href: "/delivery-locations" },
] as const;

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
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "anniversary-flowers-and-cake-combo": [
    { phrase: "anniversary flowers", href: categoryHref("anniversary-gifts") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "online-cake-delivery-usa": [
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "send-flowers-online-usa": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "USA", href: "/flower-delivery-usa" },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
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
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "same-day-flower-delivery-near-me": [
    { phrase: "same-day flower delivery", href: categoryHref("same-day-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "city page", href: "/delivery-locations" },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "flower-delivery-usa": [
    { phrase: "USA flower delivery", href: "/flower-delivery-usa" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "anniversary-gift-ideas-for-her-him": [
    { phrase: "anniversary gifts", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "best-cakes-for-birthday-parties": [
    { phrase: "birthday cakes", href: categoryHref("cakes") },
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "celebration gifts", href: categoryHref("celebration-gifts") },
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
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
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
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "send-flowers-online-uk": [
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "flower-delivery-uk": [
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "New York", href: locationPublicPath("new-york") },
  ],
  "thanksgiving-gift-ideas": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "celebration gifts", href: categoryHref("celebration-gifts") },
    { phrase: "United States", href: "/flower-delivery-usa" },
  ],
  "christmas-gift-hampers-usa": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "delivery", href: "/shipping" },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "cake-delivery-texas": [
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "Texas", href: locationPublicPath("texas") },
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "same-day-flower-delivery-new-york": [
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "New York", href: locationPublicPath("new-york") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "flower-delivery-in-california": [
    { phrase: "California", href: locationPublicPath("california") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  ],
  "cheap-flower-delivery-usa": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "USA delivery", href: "/flower-delivery-usa" },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
  ],
  "best-online-flower-delivery-service-usa": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "delivery locations", href: "/delivery-locations" },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  ],
  "send-mothers-day-flowers-to-mom": [
    { phrase: "Mother's Day flowers", href: categoryHref("mothers-day-gifts") },
    { phrase: "plants", href: categoryHref("plants") },
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
  ],
  "next-day-flower-delivery-uk": [
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "curated hampers", href: categoryHref("gift-hampers") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "same-day-flower-delivery-uk": [
    { phrase: "same-day flowers", href: categoryHref("same-day-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "London", href: "/locations/europe/united-kingdom/london" },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "letterbox-flowers-uk": [
    { phrase: "thank-you gestures", href: categoryHref("celebration-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "Manchester", href: "/locations/europe/united-kingdom/manchester" },
  ],
  "cake-delivery-uk": [
    { phrase: "birthday cake", href: categoryHref("cakes") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "fresh bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  ],
  "birthday-flowers-delivery-uk": [
    { phrase: "birthday bouquet", href: categoryHref("birthday-gifts") },
    { phrase: "Mixed bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "plants", href: categoryHref("plants") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "flower-delivery-etiquette-uk": [
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "best-flowers-to-send-uk": [
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "mothers-day-flowers-uk": [
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "London", href: "/locations/europe/united-kingdom/london" },
  ],
  "anniversary-flowers-uk": [
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
  "gift-hampers-delivery-uk": [
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "United Kingdom", href: "/flower-delivery-uk" },
  ],
};
