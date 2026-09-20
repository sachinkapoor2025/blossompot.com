export type ReviewSource = {
  id: string;
  name: string;
  href: string;
  blurb: string;
};

const SITE = "blossompot.com";
const GOOGLE_SEARCH = `https://www.google.com/search?q=${encodeURIComponent(`${SITE} reviews`)}`;
const TRUSTPILOT = `https://www.trustpilot.com/review/www.${SITE}`;

function googleMapsOrSearch(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL?.trim() || GOOGLE_SEARCH;
}

/** External review platforms by shopper/delivery country. */
const BY_COUNTRY: Record<string, ReviewSource[]> = {
  US: [
    {
      id: "google",
      name: "Google",
      href: googleMapsOrSearch(),
      blurb: "Read or leave a Google review for BlossomPot gift delivery.",
    },
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "Independent Trustpilot reviews from US and worldwide customers.",
    },
    {
      id: "bbb",
      name: "Better Business Bureau",
      href: "https://www.bbb.org/search?find_text=BlossomPot&find_country=USA",
      blurb: "Check BBB listings and customer ratings in the United States.",
    },
  ],
  GB: [
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "UK shoppers often share Trustpilot reviews after delivery.",
    },
    {
      id: "google",
      name: "Google",
      href: GOOGLE_SEARCH,
      blurb: "Find BlossomPot on Google reviews from the United Kingdom.",
    },
    {
      id: "reviewsio",
      name: "Reviews.io",
      href: `https://www.reviews.io/company-reviews/store/${SITE}`,
      blurb: "Verified UK-friendly review hosting used by online retailers.",
    },
  ],
  CA: [
    {
      id: "google",
      name: "Google",
      href: GOOGLE_SEARCH,
      blurb: "Google reviews from Canadian customers sending gifts worldwide.",
    },
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "Trustpilot feedback from Canada and other origin markets.",
    },
  ],
  AU: [
    {
      id: "productreview",
      name: "ProductReview.com.au",
      href: `https://www.productreview.com.au/search?query=${encodeURIComponent("BlossomPot")}`,
      blurb: "Australian product and retailer reviews on ProductReview.",
    },
    {
      id: "google",
      name: "Google",
      href: GOOGLE_SEARCH,
      blurb: "Google reviews from Australian shoppers.",
    },
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "Independent Trustpilot reviews after delivery.",
    },
  ],
  AE: [
    {
      id: "google",
      name: "Google",
      href: GOOGLE_SEARCH,
      blurb: "Google reviews from UAE customers ordering gifts online.",
    },
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "Trustpilot is widely used by international shoppers in the UAE.",
    },
  ],
  IN: [
    {
      id: "google",
      name: "Google",
      href: GOOGLE_SEARCH,
      blurb: "Google reviews from Indian customers sending gifts abroad.",
    },
    {
      id: "trustpilot",
      name: "Trustpilot",
      href: TRUSTPILOT,
      blurb: "Share a Trustpilot review after your order arrives.",
    },
  ],
};

const DEFAULT_SOURCES: ReviewSource[] = [
  {
    id: "google",
    name: "Google",
    href: GOOGLE_SEARCH,
    blurb: "Read Google reviews of BlossomPot worldwide gift delivery.",
  },
  {
    id: "trustpilot",
    name: "Trustpilot",
    href: TRUSTPILOT,
    blurb: "Independent Trustpilot reviews from customers around the world.",
  },
];

export function reviewSourcesForCountry(countryIso?: string | null): ReviewSource[] {
  const iso = (countryIso ?? "").trim().toUpperCase();
  if (iso && BY_COUNTRY[iso]) return BY_COUNTRY[iso];
  if (iso === "IE" || iso === "DE" || iso === "FR" || iso === "NL" || iso === "BE" || iso === "IT" || iso === "ES") {
    return BY_COUNTRY.GB;
  }
  return DEFAULT_SOURCES;
}
