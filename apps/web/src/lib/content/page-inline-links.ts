import { categoryHref } from "@/lib/category-urls";

/** Homepage SEO inline links for BlossomPot gifting copy. */
export const homepageInlineLinks = [
  { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
  { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
  { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
  { phrase: "Mother’s Day", href: categoryHref("mothers-day-gifts") },
  { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
  { phrase: "birthdays", href: categoryHref("birthday-gifts") },
  { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  { phrase: "gifts", href: "/gifts" },
] as const;

export const categoryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  flowers: [
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
  ],
  "flower-bouquets": [
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "hamper", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  cakes: [
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
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
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
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
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
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
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "graduation", href: "/occasions/graduation" },
    { phrase: "thank-you", href: "/occasions/thank-you" },
    { phrase: "sympathy", href: "/occasions/sympathy" },
  ],
  uk: [
    { phrase: "Mothering Sunday", href: "/occasions/mothers-day" },
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
    { phrase: "thank-you", href: "/occasions/thank-you" },
  ],
  canada: [
    { phrase: "British Columbia", href: "/locations/canada/british-columbia" },
    { phrase: "thank-you", href: "/occasions/thank-you" },
    { phrase: "Ontario", href: "/locations/canada/ontario" },
    { phrase: "Alberta", href: "/locations/canada/alberta" },
    { phrase: "Quebec", href: "/locations/canada/quebec" },
  ],
  australia: [
    { phrase: "New South Wales", href: "/locations/australia/new-south-wales" },
    { phrase: "Western Australia", href: "/locations/australia/western-australia" },
    { phrase: "Queensland", href: "/locations/australia/queensland" },
    { phrase: "thank-yous", href: "/occasions/thank-you" },
    { phrase: "Victoria", href: "/locations/australia/victoria" },
  ],
  uae: [
    { phrase: "gift message", href: "/blog/what-to-write-in-a-gift-message" },
    { phrase: "housewarmings", href: "/occasions/housewarming" },
    { phrase: "graduations", href: "/occasions/graduation" },
  ],
};

export const marketingPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  about: [
    { phrase: "celebration cakes", href: categoryHref("cakes") },
    { phrase: "fresh flowers", href: categoryHref("flowers") },
    { phrase: "Mother’s Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "contact page", href: "/contact" },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
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
    { phrase: "United States", href: "/flower-delivery-usa" },
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
    { phrase: "hamper", href: categoryHref("gift-hampers") },
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
  contact: [
    { phrase: "select cities", href: "/delivery-locations" },
    { phrase: "Same-day", href: categoryHref("same-day-gifts") },
    { phrase: "delivery", href: "/shipping" },
  ],
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
    { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "Mother’s Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "anniversaries", href: categoryHref("anniversary-gifts") },
    { phrase: "birthdays", href: categoryHref("birthday-gifts") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "gifts", href: "/gifts" },
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
    { phrase: "gift hamper", href: categoryHref("gift-hampers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "bouquet", href: categoryHref("flowers") },
    { phrase: "roses", href: categoryHref("flowers") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "USA", href: "/flower-delivery-usa" },
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
    { phrase: "Same-day", href: categoryHref("same-day-gifts") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
    { phrase: "cake", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "USA", href: "/flower-delivery-usa" },
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
  { phrase: "Mother’s Day", href: categoryHref("mothers-day-gifts") },
  { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
  { phrase: "Valentine’s Day", href: categoryHref("valentines-day-gifts") },
  { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
  { phrase: "same-day", href: categoryHref("same-day-gifts") },
  { phrase: "same day", href: categoryHref("same-day-gifts") },
  { phrase: "bouquets", href: categoryHref("flower-bouquets") },
  { phrase: "birthday", href: categoryHref("birthday-gifts") },
  { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "hampers", href: categoryHref("gift-hampers") },
  { phrase: "cakes", href: categoryHref("cakes") },
  { phrase: "cake", href: categoryHref("cakes") },
] as const;

export const statePageInlineLinks = cityPageInlineLinks;

export const blogPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  "how-to-keep-flowers-fresh-longer": [
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "roses", href: "/flower-guide/rose" },
    { phrase: "plants", href: categoryHref("plants") },
  ],
  "rose-color-meanings-for-gifting": [
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "red roses", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "rose", href: "/flower-guide/rose" },
    { phrase: "gift", href: "/gifts" },
  ],
  "what-to-write-in-a-gift-message": [
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "gift", href: "/gifts" },
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
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "send-flowers-online-usa": [
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "USA", href: "/flower-delivery-usa" },
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
    { phrase: "delivery locations", href: "/delivery-locations" },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "flowers-and-cake-delivery-same-day": [
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "same day", href: categoryHref("same-day-gifts") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "bouquet", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "same-day-flower-delivery-near-me": [
    { phrase: "same-day flower delivery", href: categoryHref("flowers") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "flower-delivery-usa": [
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "anniversary-gift-ideas-for-her-him": [
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "roses", href: categoryHref("flower-bouquets") },
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
    { phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "red roses", href: categoryHref("flower-bouquets") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "last-minute-gift-ideas-usa": [
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
    { phrase: "same-day", href: categoryHref("same-day-gifts") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "anniversary", href: categoryHref("anniversary-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "USA", href: "/flower-delivery-usa" },
  ],
  "nationwide-flower-delivery-usa": [
    { phrase: "nationwide flower delivery", href: "/flower-delivery-usa" },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "delivery locations", href: "/delivery-locations" },
  ],
  "best-flowers-to-send-for-birthday": [
    { phrase: "red roses", href: "/flower-guide/rose" },
    { phrase: "bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "birthday", href: categoryHref("birthday-gifts") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "hamper", href: categoryHref("gift-hampers") },
    { phrase: "cake", href: categoryHref("cakes") },
  ],
  "valentines-day-flowers-delivery": [
    { phrase: "personalized gifts", href: categoryHref("personalized-gifts") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
    { phrase: "red roses", href: categoryHref("flower-bouquets") },
    { phrase: "hampers", href: categoryHref("gift-hampers") },
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
};
